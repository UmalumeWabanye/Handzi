const mongoose = require('mongoose');
const {
  BOOKING_STATUS: B,
  PAYMENT_STATUS: P,
  JOB_STATUS,
  NOTIFICATION_TYPES: T,
  REVIEW_DIRECTION: R,
  DISPUTE_STATUS,
} = require('@handyconnect/shared');
const { Booking, Payment, Job, Review, Dispute, HandymanProfile } = require('../models');
const ApiError = require('../utils/ApiError');
const payments = require('../services/payments');
const { confirm, autoConfirmWindowMs, logPayment, bookingData, safeNotify } = require('../services/booking.service');
const { rand } = require('../services/money');

const PEOPLE = 'firstName lastName avatar createdAt';

async function load(id, me) {
  if (!mongoose.isValidObjectId(id)) throw ApiError.notFound('Booking not found');
  const booking = await Booking.findById(id).populate('client', PEOPLE).populate('handyman', PEOPLE).populate({ path: 'job', select: 'title category photos', populate: { path: 'category', select: 'name icon' } });
  if (!booking) throw ApiError.notFound('Booking not found');
  const role = booking.client._id.equals(me) ? 'client' : booking.handyman._id.equals(me) ? 'handyman' : null;
  if (!role) throw ApiError.notFound('Booking not found');
  return { booking, role };
}

const requireRole = (role, wanted) => {
  if (role !== wanted) throw ApiError.forbidden(`Only the ${wanted} can do that`);
};
const requireStatus = (booking, ...allowed) => {
  if (!allowed.includes(booking.status)) throw ApiError.conflict('This booking has moved on. Refresh and try again.');
};

const id = (v) => (v?._id ?? v)?.toString();

/** Booking as seen by one side. The address is only shared with the handyman once the client has paid. */
async function present(booking, role, me) {
  const [payment, reviews, dispute] = await Promise.all([
    Payment.findOne({ booking: booking._id }).select('status reference paystackReference heldAt releasedAt refundedAt refundAmount'),
    Review.find({ booking: booking._id }).select('reviewer rating text direction createdAt'),
    Dispute.findOne({ booking: booking._id }).select('status reason createdAt resolution'),
  ]);
  const other = role === 'client' ? booking.handyman : booking.client;
  const paid = [B.FUNDED, B.IN_PROGRESS, B.COMPLETED, B.CONFIRMED, B.DISPUTED].includes(booking.status);
  const myReview = reviews.find((r) => r.reviewer.equals(me));
  const theirReview = reviews.find((r) => !r.reviewer.equals(me));
  return {
    _id: booking._id,
    role,
    status: booking.status,
    title: booking.title,
    job: booking.job ? { _id: booking.job._id, title: booking.job.title, category: booking.job.category, photos: booking.job.photos } : null,
    other: { id: other._id, firstName: other.firstName, lastName: other.lastName, avatar: other.avatar, memberSince: other.createdAt },
    amount: booking.amount,
    commissionPercent: booking.commissionPercent,
    commissionAmount: booking.commissionAmount,
    handymanPayout: booking.handymanPayout,
    scheduledFor: booking.scheduledFor,
    address: role === 'client' || paid ? booking.location?.address : undefined,
    place: booking.location ? { suburb: booking.location.suburb, city: booking.location.city } : null,
    timeline: {
      createdAt: booking.createdAt,
      paidAt: payment?.heldAt,
      startedAt: booking.startedAt,
      completedAt: booking.completedAt,
      confirmedAt: booking.confirmedAt,
      cancelledAt: booking.cancelledAt,
      autoConfirmAt: booking.autoConfirmAt,
    },
    cancelReason: booking.cancelReason,
    payment: payment ? { status: payment.status, reference: payment.paystackReference, refundAmount: payment.refundAmount } : null,
    dispute: dispute ? { status: dispute.status, reason: dispute.reason, createdAt: dispute.createdAt } : null,
    myReview: myReview ? { rating: myReview.rating, text: myReview.text } : null,
    theirReview: theirReview ? { rating: theirReview.rating, text: theirReview.text } : null,
    canReview: booking.status === B.CONFIRMED && !myReview,
    provider: payments.name,
  };
}

exports.list = async (req, res) => {
  const me = req.user._id;
  const filter = req.query.role === 'handyman' ? { handyman: me } : req.query.role === 'client' ? { client: me } : { $or: [{ client: me }, { handyman: me }] };
  const bookings = await Booking.find(filter)
    .sort({ updatedAt: -1 })
    .limit(100)
    .populate('client', PEOPLE)
    .populate('handyman', PEOPLE)
    .populate({ path: 'job', select: 'title category', populate: { path: 'category', select: 'name icon' } });
  res.json({
    success: true,
    bookings: bookings.map((b) => {
      const role = b.client._id.equals(me) ? 'client' : 'handyman';
      const other = role === 'client' ? b.handyman : b.client;
      return {
        _id: b._id,
        role,
        status: b.status,
        title: b.title,
        category: b.job?.category,
        amount: b.amount,
        handymanPayout: b.handymanPayout,
        scheduledFor: b.scheduledFor,
        place: b.location ? { suburb: b.location.suburb, city: b.location.city } : null,
        other: { id: other._id, firstName: other.firstName, lastName: other.lastName, avatar: other.avatar },
        updatedAt: b.updatedAt,
      };
    }),
  });
};

exports.get = async (req, res) => {
  const { booking, role } = await load(req.params.id, req.user._id);
  res.json({ success: true, booking: await present(booking, role, req.user._id) });
};

const respond = async (res, booking, role, me) => {
  const fresh = await load(booking._id, me);
  res.json({ success: true, booking: await present(fresh.booking, role, me) });
};

// Client pays: funds are held by the platform until the job is confirmed.
exports.pay = async (req, res) => {
  const me = req.user._id;
  const { booking, role } = await load(req.params.id, me);
  requireRole(role, 'client');
  requireStatus(booking, B.AWAITING_PAYMENT);

  const result = await payments.charge({ amount: booking.amount, booking, simulate: req.body.simulate });
  if (!result.ok) throw new ApiError(402, result.message || 'Payment failed');

  const payment = await Payment.findOneAndUpdate(
    { booking: booking._id },
    {
      $setOnInsert: {
        booking: booking._id,
        client: booking.client._id,
        handyman: booking.handyman._id,
        amount: booking.amount,
        commissionAmount: booking.commissionAmount,
        payoutAmount: booking.handymanPayout,
      },
    },
    { upsert: true, new: true }
  );
  payment.paystackReference = result.reference;
  payment.heldAt = new Date();
  logPayment(payment, P.HELD, `Paid via ${payments.name}`);
  await payment.save();

  booking.status = B.FUNDED;
  await booking.save();

  safeNotify(booking.handyman._id, {
    type: T.BOOKING_PAID,
    title: "You're booked and paid",
    body: `${booking.client.firstName} paid ${rand(booking.amount)} for "${booking.title}". You can see the address now.`,
    data: bookingData(booking, 'handyman'),
  });
  await respond(res, booking, role, me);
};

exports.start = async (req, res) => {
  const me = req.user._id;
  const { booking, role } = await load(req.params.id, me);
  requireRole(role, 'handyman');
  requireStatus(booking, B.FUNDED);
  booking.status = B.IN_PROGRESS;
  booking.startedAt = new Date();
  await booking.save();
  await Job.updateOne({ _id: booking.job._id ?? booking.job }, { status: JOB_STATUS.IN_PROGRESS });
  safeNotify(booking.client._id, {
    type: T.JOB_STARTED,
    title: `${booking.handyman.firstName} has started the job`,
    body: `"${booking.title}" is now in progress.`,
    data: bookingData(booking, 'client'),
  });
  await respond(res, booking, role, me);
};

exports.complete = async (req, res) => {
  const me = req.user._id;
  const { booking, role } = await load(req.params.id, me);
  requireRole(role, 'handyman');
  requireStatus(booking, B.IN_PROGRESS);
  booking.status = B.COMPLETED;
  booking.completedAt = new Date();
  booking.autoConfirmAt = new Date(Date.now() + (await autoConfirmWindowMs()));
  await booking.save();
  await Job.updateOne({ _id: booking.job._id ?? booking.job }, { status: JOB_STATUS.COMPLETED });
  safeNotify(booking.client._id, {
    type: T.JOB_COMPLETED,
    title: `${booking.handyman.firstName} marked the job as done`,
    body: `Please check "${booking.title}" and confirm, or report a problem.`,
    data: bookingData(booking, 'client'),
  });
  await respond(res, booking, role, me);
};

exports.confirm = async (req, res) => {
  const me = req.user._id;
  const { booking, role } = await load(req.params.id, me);
  requireRole(role, 'client');
  requireStatus(booking, B.COMPLETED);
  await confirm(booking);
  await respond(res, booking, role, me);
};

// Either side can cancel before work starts; anything paid is refunded in full.
exports.cancel = async (req, res) => {
  const me = req.user._id;
  const { booking, role } = await load(req.params.id, me);
  requireStatus(booking, B.AWAITING_PAYMENT, B.FUNDED);

  const payment = await Payment.findOne({ booking: booking._id });
  if (payment?.status === P.HELD) {
    const r = await payments.refund({ reference: payment.paystackReference, amount: payment.amount });
    payment.refundAmount = payment.amount;
    payment.refundedAt = new Date();
    logPayment(payment, P.REFUNDED, `Refunded (${r.reference}) after cancellation by ${role}`);
    await payment.save();
  }
  booking.status = B.CANCELLED;
  booking.cancelledAt = new Date();
  booking.cancelReason = req.body.reason;
  await booking.save();
  await Job.updateOne({ _id: booking.job._id ?? booking.job }, { status: JOB_STATUS.CANCELLED });

  const other = role === 'client' ? booking.handyman : booking.client;
  safeNotify(other._id, {
    type: T.BOOKING_CANCELLED,
    title: 'Booking cancelled',
    body: `${req.user.firstName} cancelled "${booking.title}".${payment?.status === P.REFUNDED ? ' The payment was refunded in full.' : ''}`,
    data: bookingData(booking, role === 'client' ? 'handyman' : 'client'),
  });
  await respond(res, booking, role, me);
};

// Client reports a problem: the payout is frozen until the Handzi team resolves it.
exports.dispute = async (req, res) => {
  const me = req.user._id;
  const { booking, role } = await load(req.params.id, me);
  requireRole(role, 'client');
  requireStatus(booking, B.IN_PROGRESS, B.COMPLETED);

  await Dispute.create({ booking: booking._id, openedBy: me, reason: req.body.reason, evidence: req.body.evidence || [], status: DISPUTE_STATUS.OPEN });
  const payment = await Payment.findOne({ booking: booking._id });
  if (payment?.status === P.HELD) {
    logPayment(payment, P.DISPUTED, 'Frozen: client reported a problem');
    await payment.save();
  }
  booking.status = B.DISPUTED;
  booking.autoConfirmAt = undefined;
  await booking.save();
  await Job.updateOne({ _id: booking.job._id ?? booking.job }, { status: JOB_STATUS.DISPUTED });

  safeNotify(booking.handyman._id, {
    type: T.DISPUTE_OPENED,
    title: 'The client reported a problem',
    body: `Payment for "${booking.title}" is on hold while our team looks into it.`,
    data: bookingData(booking, 'handyman'),
  });
  await respond(res, booking, role, me);
};

exports.review = async (req, res) => {
  const me = req.user._id;
  const { booking, role } = await load(req.params.id, me);
  requireStatus(booking, B.CONFIRMED);
  if (await Review.exists({ booking: booking._id, reviewer: me })) throw ApiError.conflict('You have already reviewed this job');

  const reviewee = role === 'client' ? booking.handyman._id : booking.client._id;
  const direction = role === 'client' ? R.CLIENT_TO_HANDYMAN : R.HANDYMAN_TO_CLIENT;
  await Review.create({ booking: booking._id, reviewer: me, reviewee, direction, rating: req.body.rating, text: req.body.text });

  if (direction === R.CLIENT_TO_HANDYMAN) {
    const [agg] = await Review.aggregate([
      { $match: { reviewee, direction, hidden: false } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    await HandymanProfile.updateOne({ user: reviewee }, { 'stats.averageRating': Math.round(agg.avg * 10) / 10, 'stats.reviewCount': agg.count });
  }
  safeNotify(reviewee, {
    type: T.REVIEW_RECEIVED,
    title: `${req.user.firstName} left you a ${req.body.rating}-star review`,
    body: req.body.text ? `“${req.body.text.slice(0, 120)}”` : `For "${booking.title}"`,
    data: bookingData(booking, role === 'client' ? 'handyman' : 'client'),
  });
  await respond(res, booking, role, me);
};

// Handyman earnings: what's held, released, frozen, plus the history.
exports.earnings = async (req, res) => {
  const list = await Payment.find({ handyman: req.user._id }).sort({ updatedAt: -1 }).limit(200).populate('booking', 'title status');
  const sum = (status) => list.filter((p) => p.status === status).reduce((n, p) => n + p.payoutAmount, 0);
  res.json({
    success: true,
    totals: { held: sum(P.HELD), released: sum(P.RELEASED), disputed: sum(P.DISPUTED), jobs: list.filter((p) => p.status === P.RELEASED).length },
    payments: list.map((p) => ({
      _id: p._id,
      bookingId: id(p.booking),
      title: p.booking?.title,
      amount: p.amount,
      commissionAmount: p.commissionAmount,
      payoutAmount: p.payoutAmount,
      status: p.status,
      heldAt: p.heldAt,
      releasedAt: p.releasedAt,
      refundedAt: p.refundedAt,
    })),
    provider: payments.name,
  });
};
