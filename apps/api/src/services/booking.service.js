const { BOOKING_STATUS: B, PAYMENT_STATUS: P, JOB_STATUS, NOTIFICATION_TYPES: T } = require('@handyconnect/shared');
const { Booking, Payment, Job, HandymanProfile, Setting } = require('../models');
const payments = require('./payments');
const { notify } = require('./notify');
const { rand } = require('./money');

const safeNotify = (userId, n) => notify(userId, n).catch((e) => console.warn('[notify] failed:', e.message));
const bookingData = (booking, mode) => ({ bookingId: String(booking._id), jobId: booking.job ? String(booking.job._id ?? booking.job) : undefined, mode });

function logPayment(payment, status, note) {
  payment.status = status;
  payment.history.push({ status, note });
}

/** Release held funds to the handyman (client confirmed, or auto-confirm). */
const idOf = (v) => v?._id ?? v; // works whether or not the booking's people are populated

async function confirm(booking, { auto = false } = {}) {
  const handymanId = idOf(booking.handyman);
  const payment = await Payment.findOne({ booking: booking._id });
  if (payment && payment.status === P.HELD) {
    const res = await payments.payout({ amount: payment.payoutAmount, handyman: handymanId });
    payment.paystackTransferCode = res.transferCode;
    payment.releasedAt = new Date();
    logPayment(payment, P.RELEASED, auto ? 'Auto-released after the confirmation window' : 'Released on client confirmation');
    await payment.save();
  }
  booking.status = B.CONFIRMED;
  booking.confirmedAt = new Date();
  await booking.save();
  await Job.updateOne({ _id: idOf(booking.job) }, { status: JOB_STATUS.CLOSED });
  await HandymanProfile.updateOne({ user: handymanId }, { $inc: { 'stats.jobsCompleted': 1 } });

  safeNotify(handymanId, {
    type: T.PAYMENT_RELEASED,
    title: `${rand(booking.handymanPayout)} is on its way`,
    body: auto ? `"${booking.title}" was auto-confirmed and your payment released` : `The client confirmed "${booking.title}". Your payment has been released.`,
    data: bookingData(booking, 'handyman'),
  });
  return booking;
}

/** Confirm bookings whose confirmation window has passed. Runs on a timer in the server. */
async function autoConfirmDue(now = new Date()) {
  const due = await Booking.find({ status: B.COMPLETED, autoConfirmAt: { $lte: now } });
  for (const b of due) await confirm(b, { auto: true });
  return due.length;
}

async function autoConfirmWindowMs() {
  const { autoConfirmHours } = await Setting.get();
  return autoConfirmHours * 60 * 60 * 1000;
}

module.exports = { confirm, autoConfirmDue, autoConfirmWindowMs, logPayment, bookingData, safeNotify };
