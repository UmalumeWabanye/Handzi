const mongoose = require('mongoose');
const { JOB_STATUS, QUOTE_STATUS, BOOKING_STATUS } = require('@handyconnect/shared');
const { Job, Quote, HandymanProfile, Booking, Setting } = require('../models');
const ApiError = require('../utils/ApiError');
const { toCard } = require('../services/handyman.service');
const notify = require('../services/notify');

const QUOTE_FIELDS = ['amount', 'message', 'estimatedDuration', 'availableFrom'];
const pick = (src) => Object.fromEntries(QUOTE_FIELDS.filter((k) => src[k] !== undefined).map((k) => [k, src[k]]));
const ACTIVE = [QUOTE_STATUS.PENDING, QUOTE_STATUS.ACCEPTED];

async function refreshQuoteCount(jobId) {
  const count = await Quote.countDocuments({ job: jobId, status: { $in: ACTIVE } });
  await Job.updateOne({ _id: jobId }, { quoteCount: count });
}

async function loadQuote(id) {
  if (!mongoose.isValidObjectId(id)) throw ApiError.notFound('Quote not found');
  const quote = await Quote.findById(id);
  if (!quote) throw ApiError.notFound('Quote not found');
  return quote;
}

// Handyman sends a quote on an open job.
exports.create = async (req, res) => {
  const profile = await HandymanProfile.findOne({ user: req.user._id });
  if (!profile?.onboardingCompletedAt) throw ApiError.forbidden('Publish your profile before sending quotes');
  if (profile.verification?.status !== 'verified') throw ApiError.forbidden('You need to be ID-verified before you can send quotes');

  if (!mongoose.isValidObjectId(req.params.jobId)) throw ApiError.notFound('Job not found');
  const job = await Job.findById(req.params.jobId);
  if (!job || job.removedByAdmin) throw ApiError.notFound('Job not found');
  if (job.client.equals(req.user._id)) throw ApiError.forbidden("You can't quote on your own job");
  if (job.status !== JOB_STATUS.OPEN) throw ApiError.conflict('This job is no longer taking quotes');

  const existing = await Quote.findOne({ job: job._id, handyman: req.user._id });
  let quote;
  if (existing) {
    if (existing.status !== QUOTE_STATUS.WITHDRAWN) throw ApiError.conflict('You have already quoted on this job');
    existing.set({ ...pick(req.body), status: QUOTE_STATUS.PENDING });
    quote = await existing.save();
  } else {
    quote = await Quote.create({ ...pick(req.body), job: job._id, handyman: req.user._id });
  }
  await refreshQuoteCount(job._id);
  notify.quoteReceived(quote, job, req.user.firstName);
  res.status(201).json({ success: true, quote });
};

// Handyman: edit a pending quote.
exports.update = async (req, res) => {
  const quote = await loadQuote(req.params.id);
  if (!quote.handyman.equals(req.user._id)) throw ApiError.forbidden();
  if (quote.status !== QUOTE_STATUS.PENDING) throw ApiError.conflict('Only pending quotes can be changed');
  const job = await Job.findById(quote.job);
  if (job?.status !== JOB_STATUS.OPEN) throw ApiError.conflict('This job is no longer taking quotes');
  const before = quote.amount;
  quote.set(pick(req.body));
  await quote.save();
  if (quote.amount !== before) notify.quoteReceived(quote, job, req.user.firstName, true);
  res.json({ success: true, quote });
};

exports.withdraw = async (req, res) => {
  const quote = await loadQuote(req.params.id);
  if (!quote.handyman.equals(req.user._id)) throw ApiError.forbidden();
  if (quote.status !== QUOTE_STATUS.PENDING) throw ApiError.conflict('Only pending quotes can be withdrawn');
  quote.status = QUOTE_STATUS.WITHDRAWN;
  await quote.save();
  await refreshQuoteCount(quote.job);
  res.json({ success: true, quote });
};

// Handyman: every quote I've sent, with a summary of the job.
exports.mine = async (req, res) => {
  const quotes = await Quote.find({ handyman: req.user._id })
    .sort({ updatedAt: -1 })
    .populate({ path: 'job', select: 'title category status location.suburb location.city createdAt photos', populate: { path: 'category', select: 'name icon' } });
  res.json({ success: true, quotes: quotes.filter((q) => q.job) });
};

// Client: quotes on my job, each with the handyman's profile card.
exports.forJob = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.jobId)) throw ApiError.notFound('Job not found');
  const job = await Job.findById(req.params.jobId);
  if (!job) throw ApiError.notFound('Job not found');
  if (!job.client.equals(req.user._id)) throw ApiError.forbidden();

  const quotes = await Quote.find({ job: job._id, status: { $ne: QUOTE_STATUS.WITHDRAWN } }).populate({
    path: 'handyman',
    select: 'firstName lastName avatar status',
  });
  const profiles = await HandymanProfile.find({ user: { $in: quotes.map((q) => q.handyman?._id) } }).populate({ path: 'trades', select: 'name icon' });
  const byUser = new Map(profiles.map((p) => [p.user.toString(), p]));

  const order = { accepted: 0, pending: 1, rejected: 2 };
  const result = quotes
    .filter((q) => q.handyman && byUser.has(q.handyman._id.toString()))
    .map((q) => ({
      _id: q._id,
      amount: q.amount,
      message: q.message,
      estimatedDuration: q.estimatedDuration,
      availableFrom: q.availableFrom,
      status: q.status,
      createdAt: q.createdAt,
      updatedAt: q.updatedAt,
      handyman: toCard(byUser.get(q.handyman._id.toString()), q.handyman, job.location?.coordinates),
    }))
    .sort((a, b) => order[a.status] - order[b.status] || a.amount - b.amount);

  res.json({ success: true, quotes: result });
};

// Client accepts a quote: job is assigned, other quotes are declined, a booking awaits payment.
exports.accept = async (req, res) => {
  const quote = await loadQuote(req.params.id);
  const job = await Job.findById(quote.job);
  if (!job) throw ApiError.notFound('Job not found');
  if (!job.client.equals(req.user._id)) throw ApiError.forbidden();
  if (quote.status !== QUOTE_STATUS.PENDING) throw ApiError.conflict('This quote is no longer available');

  // Atomic claim so two taps (or two devices) can't accept two quotes.
  const claimed = await Job.findOneAndUpdate(
    { _id: job._id, status: JOB_STATUS.OPEN },
    { status: JOB_STATUS.ASSIGNED, assignedTo: quote.handyman },
    { new: true }
  );
  if (!claimed) throw ApiError.conflict('This job already has an accepted quote');

  quote.status = QUOTE_STATUS.ACCEPTED;
  await quote.save();
  const others = await notify.pendingQuotes(job._id, quote._id);
  await Quote.updateMany({ job: job._id, _id: { $ne: quote._id }, status: QUOTE_STATUS.PENDING }, { status: QUOTE_STATUS.REJECTED });

  const { commissionPercent } = await Setting.get();
  const commissionAmount = Math.round(quote.amount * commissionPercent) / 100;
  const booking = await Booking.create({
    client: job.client,
    handyman: quote.handyman,
    job: job._id,
    quote: quote._id,
    title: job.title,
    amount: quote.amount,
    commissionPercent,
    commissionAmount,
    handymanPayout: Math.round((quote.amount - commissionAmount) * 100) / 100,
    location: job.location,
    scheduledFor: quote.availableFrom || job.preferredDate,
    status: BOOKING_STATUS.AWAITING_PAYMENT,
  });
  await refreshQuoteCount(job._id);
  notify.quoteAccepted(quote, job, req.user.firstName);
  notify.quotesRejected(others, job);

  res.json({ success: true, quote, job: claimed, booking });
};

exports.decline = async (req, res) => {
  const quote = await loadQuote(req.params.id);
  const job = await Job.findById(quote.job);
  if (!job?.client.equals(req.user._id)) throw ApiError.forbidden();
  if (quote.status !== QUOTE_STATUS.PENDING) throw ApiError.conflict('Only pending quotes can be declined');
  quote.status = QUOTE_STATUS.REJECTED;
  await quote.save();
  await refreshQuoteCount(job._id);
  notify.quotesRejected([quote], job);
  res.json({ success: true, quote });
};
