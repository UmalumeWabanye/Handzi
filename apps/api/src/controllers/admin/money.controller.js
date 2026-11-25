const mongoose = require('mongoose');
const { BOOKING_STATUS: B, PAYMENT_STATUS: P, JOB_STATUS, DISPUTE_STATUS, DISPUTE_RESOLUTION, NOTIFICATION_TYPES: T } = require('@handyconnect/shared');
const { Booking, Payment, Dispute, Job, Conversation, Message, HandymanProfile } = require('../../models');
const ApiError = require('../../utils/ApiError');
const payments = require('../../services/payments');
const { audit } = require('../../services/audit');
const { notify } = require('../../services/notify');
const { rand } = require('../../services/money');

const PEOPLE = 'firstName lastName phone email avatar';

exports.bookings = async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 25, 100);
  const p = Math.max(Number(req.query.page) || 1, 1);
  const filter = req.query.status && Object.values(B).includes(req.query.status) ? { status: req.query.status } : {};
  const [bookings, total] = await Promise.all([
    Booking.find(filter).sort({ updatedAt: -1 }).skip((p - 1) * limit).limit(limit).populate('client', 'firstName lastName').populate('handyman', 'firstName lastName'),
    Booking.countDocuments(filter),
  ]);
  const pays = await Payment.find({ booking: { $in: bookings.map((b) => b._id) } }).select('booking status');
  const payBy = new Map(pays.map((x) => [x.booking.toString(), x.status]));
  res.json({ success: true, bookings: bookings.map((b) => ({ ...b.toObject(), paymentStatus: payBy.get(b._id.toString()) || 'pending' })), total, page: p, pages: Math.ceil(total / limit) });
};

/** Everything needed to judge a booking: parties, money trail, dispute, and their chat about the job. */
async function bookingDetail(bookingId) {
  const booking = await Booking.findById(bookingId).populate('client', PEOPLE).populate('handyman', PEOPLE).populate('job', 'title description photos');
  if (!booking) throw ApiError.notFound('Booking not found');
  const [payment, dispute, conversation] = await Promise.all([
    Payment.findOne({ booking: booking._id }),
    Dispute.findOne({ booking: booking._id }).populate('adminNotes.by', 'firstName lastName'),
    Conversation.findOne({ job: booking.job?._id, client: booking.client._id, handyman: booking.handyman._id }),
  ]);
  const messages = conversation ? await Message.find({ conversation: conversation._id }).sort({ createdAt: 1 }).limit(500).select('sender text images createdAt hidden containsContact') : [];
  return { booking, payment, dispute, messages };
}

exports.booking = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw ApiError.notFound();
  res.json({ success: true, ...(await bookingDetail(req.params.id)) });
};

exports.disputes = async (req, res) => {
  const filter = req.query.status === 'resolved' ? { status: DISPUTE_STATUS.RESOLVED } : { status: { $ne: DISPUTE_STATUS.RESOLVED } };
  const disputes = await Dispute.find(filter)
    .sort({ createdAt: 1 })
    .limit(100)
    .populate({ path: 'booking', select: 'title amount client handyman status', populate: [{ path: 'client', select: 'firstName lastName' }, { path: 'handyman', select: 'firstName lastName' }] })
    .populate('openedBy', 'firstName lastName');
  res.json({ success: true, disputes });
};

exports.dispute = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw ApiError.notFound();
  const d = await Dispute.findById(req.params.id);
  if (!d) throw ApiError.notFound('Dispute not found');
  res.json({ success: true, ...(await bookingDetail(d.booking)) });
};

exports.addDisputeNote = async (req, res) => {
  const d = await Dispute.findById(req.params.id);
  if (!d) throw ApiError.notFound('Dispute not found');
  d.adminNotes.push({ by: req.user._id, text: req.body.text });
  if (d.status === DISPUTE_STATUS.OPEN) d.status = DISPUTE_STATUS.UNDER_REVIEW;
  await d.save();
  await audit(req, 'dispute.note', 'dispute', d._id, { text: req.body.text });
  await d.populate('adminNotes.by', 'firstName lastName');
  res.json({ success: true, dispute: d });
};

/**
 * Resolve a dispute:
 * - release: handyman is paid as normal
 * - refund: client gets everything back
 * - split: client gets `refundAmount`; the handyman gets the rest, less the platform fee on that rest
 */
exports.resolveDispute = async (req, res) => {
  const d = await Dispute.findById(req.params.id);
  if (!d) throw ApiError.notFound('Dispute not found');
  if (d.status === DISPUTE_STATUS.RESOLVED) throw ApiError.conflict('Already resolved');
  const booking = await Booking.findById(d.booking);
  const payment = await Payment.findOne({ booking: d.booking });
  if (!booking || !payment) throw ApiError.conflict('No payment to resolve');
  if (![P.DISPUTED, P.HELD].includes(payment.status)) throw ApiError.conflict(`Payment is already ${payment.status}`);

  const { outcome, note } = req.body;
  let refund = 0;
  if (outcome === DISPUTE_RESOLUTION.REFUND) refund = payment.amount;
  if (outcome === DISPUTE_RESOLUTION.SPLIT) {
    refund = Number(req.body.refundAmount);
    if (!(refund > 0 && refund < payment.amount)) throw ApiError.badRequest(`Refund must be between R0 and ${rand(payment.amount)}`);
  }
  const keep = payment.amount - refund;
  const commission = Math.round(keep * booking.commissionPercent) / 100;
  const toHandyman = Math.round((keep - commission) * 100) / 100;

  if (refund > 0) {
    await payments.refund({ reference: payment.paystackReference, amount: refund });
    payment.refundAmount = refund;
    payment.refundedAt = new Date();
  }
  if (toHandyman > 0) {
    const r = await payments.payout({ amount: toHandyman, handyman: booking.handyman });
    payment.paystackTransferCode = r.transferCode;
    payment.releasedAt = new Date();
  }
  payment.commissionAmount = commission;
  payment.payoutAmount = toHandyman;
  payment.status = outcome === DISPUTE_RESOLUTION.REFUND ? P.REFUNDED : P.RELEASED;
  payment.history.push({ status: payment.status, note: `Dispute resolved: ${outcome}${refund ? ` (refund ${rand(refund)})` : ''}` });
  await payment.save();

  booking.status = outcome === DISPUTE_RESOLUTION.REFUND ? B.CANCELLED : B.CONFIRMED;
  if (booking.status === B.CONFIRMED) booking.confirmedAt = new Date();
  else booking.cancelledAt = new Date();
  booking.handymanPayout = toHandyman;
  booking.commissionAmount = commission;
  await booking.save();
  await Job.updateOne({ _id: booking.job }, { status: booking.status === B.CONFIRMED ? JOB_STATUS.CLOSED : JOB_STATUS.CANCELLED });
  if (booking.status === B.CONFIRMED) await HandymanProfile.updateOne({ user: booking.handyman }, { $inc: { 'stats.jobsCompleted': 1 } });

  d.status = DISPUTE_STATUS.RESOLVED;
  d.resolution = { outcome, refundAmount: refund, resolvedBy: req.user._id, resolvedAt: new Date(), note };
  await d.save();
  await audit(req, 'dispute.resolve', 'dispute', d._id, { outcome, refund, toHandyman, booking: booking._id.toString() });

  const summary = outcome === 'release' ? 'The payment was released to the handyman.' : outcome === 'refund' ? 'The client was refunded in full.' : `${rand(refund)} was refunded and ${rand(toHandyman)} paid to the handyman.`;
  const data = (mode) => ({ bookingId: String(booking._id), jobId: String(booking.job), mode });
  notify(booking.client, { type: T.DISPUTE_RESOLVED, title: 'Your reported problem was resolved', body: `${summary}${note ? ` ${note}` : ''}`, data: data('client') }).catch(() => {});
  notify(booking.handyman, { type: T.DISPUTE_RESOLVED, title: `Dispute resolved for "${booking.title}"`, body: `${summary}${note ? ` ${note}` : ''}`, data: data('handyman') }).catch(() => {});

  res.json({ success: true, dispute: d, payment, booking });
};
