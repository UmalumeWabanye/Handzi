const { ROLES, JOB_STATUS, BOOKING_STATUS, PAYMENT_STATUS, DISPUTE_STATUS, REPORT_STATUS } = require('@handyconnect/shared');
const { User, HandymanProfile, Job, Booking, Payment, Dispute, Report, Quote } = require('../../models');

const DAY = 24 * 60 * 60 * 1000;

/** Daily counts for the last `days` days, with zero-filled gaps. */
async function daily(Model, match, days, valueExpr = { $sum: 1 }, dateField = '$createdAt') {
  const since = new Date(Date.now() - (days - 1) * DAY);
  since.setHours(0, 0, 0, 0);
  const rows = await Model.aggregate([
    { $match: { ...match, createdAt: { $gte: since } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: dateField, timezone: 'Africa/Johannesburg' } }, v: valueExpr } },
  ]);
  const byDay = new Map(rows.map((r) => [r._id, r.v]));
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(since.getTime() + i * DAY);
    const key = d.toLocaleDateString('en-CA', { timeZone: 'Africa/Johannesburg' });
    return { date: key, value: byDay.get(key) || 0 };
  });
}

exports.stats = async (req, res) => {
  const days = Math.min(Number(req.query.days) || 30, 90);
  const [
    clients,
    handymen,
    publishedHandymen,
    pendingVerifications,
    openJobs,
    totalJobs,
    quotes,
    activeBookings,
    completedBookings,
    openDisputes,
    openReports,
    money,
    signups,
    jobsDaily,
    gmvDaily,
  ] = await Promise.all([
    User.countDocuments({ roles: ROLES.CLIENT }),
    User.countDocuments({ roles: ROLES.HANDYMAN }),
    HandymanProfile.countDocuments({ onboardingCompletedAt: { $ne: null } }),
    HandymanProfile.countDocuments({ 'verification.status': 'pending' }),
    Job.countDocuments({ status: JOB_STATUS.OPEN, removedByAdmin: { $ne: true } }),
    Job.countDocuments({}),
    Quote.countDocuments({}),
    Booking.countDocuments({ status: { $in: [BOOKING_STATUS.FUNDED, BOOKING_STATUS.IN_PROGRESS, BOOKING_STATUS.COMPLETED] } }),
    Booking.countDocuments({ status: BOOKING_STATUS.CONFIRMED }),
    Dispute.countDocuments({ status: { $ne: DISPUTE_STATUS.RESOLVED } }),
    Report.countDocuments({ status: REPORT_STATUS.OPEN }),
    Payment.aggregate([
      { $match: { status: { $in: [PAYMENT_STATUS.HELD, PAYMENT_STATUS.RELEASED, PAYMENT_STATUS.DISPUTED] } } },
      {
        $group: {
          _id: null,
          gmv: { $sum: '$amount' },
          held: { $sum: { $cond: [{ $in: ['$status', [PAYMENT_STATUS.HELD, PAYMENT_STATUS.DISPUTED]] }, '$amount', 0] } },
          commission: { $sum: { $cond: [{ $eq: ['$status', PAYMENT_STATUS.RELEASED] }, '$commissionAmount', 0] } },
        },
      },
    ]),
    daily(User, {}, days),
    daily(Job, {}, days),
    daily(Payment, { heldAt: { $ne: null } }, days, { $sum: '$amount' }),
  ]);

  const m = money[0] || { gmv: 0, held: 0, commission: 0 };
  res.json({
    success: true,
    totals: {
      clients,
      handymen,
      publishedHandymen,
      pendingVerifications,
      openJobs,
      totalJobs,
      quotes,
      activeBookings,
      completedBookings,
      openDisputes,
      openReports,
      gmv: m.gmv,
      held: m.held,
      commission: m.commission,
    },
    series: { signups, jobs: jobsDaily, gmv: gmvDaily },
  });
};

// Counts for the sidebar badges.
exports.queues = async (req, res) => {
  const [verifications, disputes, reports] = await Promise.all([
    HandymanProfile.countDocuments({ 'verification.status': 'pending' }),
    Dispute.countDocuments({ status: { $ne: DISPUTE_STATUS.RESOLVED } }),
    Report.countDocuments({ status: REPORT_STATUS.OPEN }),
  ]);
  res.json({ success: true, verifications, disputes, reports });
};
