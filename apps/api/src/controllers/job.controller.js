const mongoose = require('mongoose');
const { JOB_STATUS, QUOTE_STATUS, USER_STATUS, ROLES } = require('@handyconnect/shared');
const { Job, Quote, HandymanProfile, Booking } = require('../models');
const ApiError = require('../utils/ApiError');
const { toOwnerJob, toHandymanJob } = require('../services/job.service');
const notify = require('../services/notify');

const CATEGORY = { path: 'category', select: 'name slug icon' };
const CLIENT = { path: 'client', select: 'firstName avatar createdAt status' };

async function loadJob(id) {
  if (!mongoose.isValidObjectId(id)) throw ApiError.notFound('Job not found');
  const job = await Job.findById(id).populate(CATEGORY).populate(CLIENT);
  if (!job || job.removedByAdmin) throw ApiError.notFound('Job not found');
  return job;
}

exports.create = async (req, res) => {
  const user = req.user;
  if (!user.roles.includes(ROLES.CLIENT)) throw ApiError.forbidden('Switch to hiring mode to post jobs');
  if (!user.phoneVerified) throw ApiError.forbidden('Verify your phone number first');

  const location = req.body.location || user.location;
  if (!location?.coordinates?.length) throw ApiError.badRequest('Add the job location');

  const { budget } = req.body;
  if (budget?.min != null && budget?.max != null && Number(budget.max) < Number(budget.min)) {
    throw ApiError.badRequest('Maximum budget must be more than the minimum');
  }

  const job = await Job.create({
    client: user._id,
    category: req.body.category,
    subcategory: req.body.subcategory,
    title: req.body.title,
    description: req.body.description,
    photos: req.body.photos || [],
    location,
    budget,
    urgency: req.body.urgency,
    preferredDate: req.body.preferredDate,
  });
  await job.populate(CATEGORY);
  notify.jobPosted(job);
  res.status(201).json({ success: true, job: toOwnerJob(job) });
};

// Client: jobs I've posted, newest first.
exports.mine = async (req, res) => {
  const jobs = await Job.find({ client: req.user._id, removedByAdmin: { $ne: true } }).sort({ createdAt: -1 }).populate(CATEGORY);
  res.json({ success: true, jobs: jobs.map(toOwnerJob) });
};

// Handyman: open jobs within my service radius, in my trades by default.
exports.feed = async (req, res) => {
  const profile = await HandymanProfile.findOne({ user: req.user._id });
  const origin = profile?.serviceArea?.coordinates;
  if (!origin?.length) throw ApiError.badRequest('Set your service area to see jobs near you');

  const radiusKm = Math.min(Number(req.query.radiusKm) || profile.serviceRadiusKm || 25, 200);
  const limit = Math.min(Number(req.query.limit) || 30, 50);
  const page = Math.max(Number(req.query.page) || 1, 1);

  const query = { status: JOB_STATUS.OPEN, removedByAdmin: { $ne: true }, client: { $ne: req.user._id } };
  if (req.query.category) {
    if (!mongoose.isValidObjectId(req.query.category)) throw ApiError.badRequest('Invalid category');
    query.category = new mongoose.Types.ObjectId(String(req.query.category));
  } else if (req.query.scope !== 'all' && profile.trades.length) {
    query.category = { $in: profile.trades };
  }

  const raw = await Job.aggregate([
    { $geoNear: { near: { type: 'Point', coordinates: origin }, distanceField: 'distance', maxDistance: radiusKm * 1000, query, spherical: true } },
    { $sort: req.query.sort === 'newest' ? { createdAt: -1 } : { distance: 1, createdAt: -1 } },
    { $skip: (page - 1) * limit },
    { $limit: limit },
  ]);
  const jobs = await Job.populate(raw, [CATEGORY, CLIENT]);
  const visible = jobs.filter((j) => j.client?.status === USER_STATUS.ACTIVE);

  const quotes = await Quote.find({ handyman: req.user._id, job: { $in: visible.map((j) => j._id) } }).select('job status amount');
  const byJob = new Map(quotes.map((q) => [q.job.toString(), q]));

  res.json({
    success: true,
    radiusKm,
    jobs: visible.map((j) => toHandymanJob(j, { myQuote: byJob.get(j._id.toString()) })),
  });
};

// The booking for this job, if the viewer is one of its two parties.
async function bookingIdFor(job, me) {
  if (job.status === JOB_STATUS.OPEN) return undefined;
  const b = await Booking.findOne({ job: job._id, $or: [{ client: me }, { handyman: me }] }).sort({ createdAt: -1 }).select('_id');
  return b?._id;
}

exports.get = async (req, res) => {
  const job = await loadJob(req.params.id);
  const bookingId = await bookingIdFor(job, req.user._id);
  if (job.client._id.equals(req.user._id)) return res.json({ success: true, job: { ...toOwnerJob(job), bookingId } });

  const myQuote = await Quote.findOne({ job: job._id, handyman: req.user._id });
  // Other people only see open jobs, unless they've quoted on it.
  if (job.status !== JOB_STATUS.OPEN && !myQuote) throw ApiError.notFound('Job not found');

  const profile = await HandymanProfile.findOne({ user: req.user._id }).select('serviceArea');
  const hired = myQuote?.status === QUOTE_STATUS.ACCEPTED;
  res.json({ success: true, job: { ...toHandymanJob(job, { origin: profile?.serviceArea?.coordinates, myQuote, hired }), bookingId } });
};

exports.cancel = async (req, res) => {
  const job = await loadJob(req.params.id);
  if (!job.client._id.equals(req.user._id)) throw ApiError.forbidden();
  if (job.status !== JOB_STATUS.OPEN) throw ApiError.conflict('Only open jobs can be cancelled');
  job.status = JOB_STATUS.CANCELLED;
  await job.save();
  notify.jobCancelled(job, await notify.pendingQuotes(job._id));
  await Quote.updateMany({ job: job._id, status: QUOTE_STATUS.PENDING }, { status: QUOTE_STATUS.REJECTED });
  res.json({ success: true, job: toOwnerJob(job) });
};
