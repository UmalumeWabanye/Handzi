const mongoose = require('mongoose');
const { USER_STATUS, ROLES, NOTIFICATION_TYPES: T } = require('@handyconnect/shared');
const { User, HandymanProfile, Job, Booking, Report, Review } = require('../../models');
const ApiError = require('../../utils/ApiError');
const { audit } = require('../../services/audit');
const { notify } = require('../../services/notify');

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const page = (req) => {
  const limit = Math.min(Number(req.query.limit) || 25, 100);
  const p = Math.max(Number(req.query.page) || 1, 1);
  return { limit, skip: (p - 1) * limit, page: p };
};

// ---- Verification queue ----

exports.verifications = async (req, res) => {
  const status = req.query.status || 'pending';
  const profiles = await HandymanProfile.find({ 'verification.status': status })
    .sort({ 'verification.submittedAt': 1 }) // oldest first: fair queue
    .limit(100)
    .populate('user', 'firstName lastName phone email avatar createdAt status')
    .populate('trades', 'name');
  res.json({
    success: true,
    items: profiles
      .filter((p) => p.user)
      .map((p) => ({
        userId: p.user._id,
        user: p.user,
        headline: p.headline,
        trades: p.trades,
        yearsExperience: p.yearsExperience,
        place: p.serviceArea ? { suburb: p.serviceArea.suburb, city: p.serviceArea.city } : null,
        verification: p.verification,
        certifications: p.certifications,
        published: !!p.onboardingCompletedAt,
      })),
  });
};

async function decide(req, res, approve) {
  const profile = await HandymanProfile.findOne({ user: req.params.userId });
  if (!profile) throw ApiError.notFound('Handyman not found');
  if (!['pending', 'rejected', 'verified'].includes(profile.verification?.status)) throw ApiError.conflict('Nothing to review');
  profile.verification.status = approve ? 'verified' : 'rejected';
  profile.verification.reviewedAt = new Date();
  profile.verification.reviewedBy = req.user._id;
  profile.verification.rejectionReason = approve ? undefined : req.body.reason;
  await profile.save();
  await audit(req, approve ? 'verification.approve' : 'verification.reject', 'user', profile.user, approve ? {} : { reason: req.body.reason });
  notify(profile.user, approve
    ? { type: T.VERIFICATION_APPROVED, title: "You're verified", body: 'Your ID has been approved. You can now send quotes on jobs.', data: { mode: 'handyman' } }
    : { type: T.VERIFICATION_REJECTED, title: "We couldn't verify your ID", body: req.body.reason, data: { mode: 'handyman' } }
  ).catch(() => {});
  res.json({ success: true, verification: profile.verification });
}
exports.approveVerification = (req, res) => decide(req, res, true);
exports.rejectVerification = (req, res) => decide(req, res, false);

exports.verifyCertification = async (req, res) => {
  const profile = await HandymanProfile.findOne({ user: req.params.userId });
  const cert = profile?.certifications.id(req.params.certId);
  if (!cert) throw ApiError.notFound('Certification not found');
  cert.verified = req.body.verified !== false;
  await profile.save();
  await audit(req, cert.verified ? 'certification.verify' : 'certification.unverify', 'user', profile.user, { certification: cert.name });
  res.json({ success: true, certification: cert });
};

// ---- Users ----

exports.users = async (req, res) => {
  const { limit, skip, page: p } = page(req);
  const filter = {};
  if (req.query.role && Object.values(ROLES).includes(req.query.role)) filter.roles = req.query.role;
  if (req.query.status && Object.values(USER_STATUS).includes(req.query.status)) filter.status = req.query.status;
  if (req.query.q) {
    const rx = new RegExp(escape(String(req.query.q).trim()), 'i');
    filter.$or = [{ firstName: rx }, { lastName: rx }, { email: rx }, { phone: rx }];
  }
  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).select('firstName lastName email phone avatar roles status activeMode createdAt lastLoginAt phoneVerified'),
    User.countDocuments(filter),
  ]);
  res.json({ success: true, users, total, page: p, pages: Math.ceil(total / limit) });
};

exports.user = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw ApiError.notFound();
  const user = await User.findById(req.params.id).select('-password -pushTokens');
  if (!user) throw ApiError.notFound('User not found');
  const [profile, jobs, bookings, reportsAgainst, reviews] = await Promise.all([
    HandymanProfile.findOne({ user: user._id }).populate('trades', 'name'),
    Job.find({ client: user._id }).sort({ createdAt: -1 }).limit(20).select('title status createdAt quoteCount removedByAdmin'),
    Booking.find({ $or: [{ client: user._id }, { handyman: user._id }] }).sort({ createdAt: -1 }).limit(20).select('title status amount client handyman createdAt'),
    Report.find({ targetType: 'user', targetId: user._id }).sort({ createdAt: -1 }).limit(20).populate('reporter', 'firstName lastName'),
    Review.find({ reviewee: user._id }).sort({ createdAt: -1 }).limit(20).populate('reviewer', 'firstName lastName'),
  ]);
  res.json({ success: true, user, profile, jobs, bookings, reportsAgainst, reviews });
};

exports.setUserStatus = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');
  if (user._id.equals(req.user._id)) throw ApiError.badRequest("You can't change your own status");
  if (user.roles.includes(ROLES.ADMIN)) throw ApiError.forbidden('Admins cannot be suspended here');
  const previous = user.status;
  user.status = req.body.status;
  user.statusReason = req.body.reason;
  if (req.body.status !== USER_STATUS.ACTIVE) user.tokenVersion += 1; // sign them out everywhere
  await user.save();
  await audit(req, `user.${req.body.status === USER_STATUS.ACTIVE ? 'reinstate' : req.body.status === USER_STATUS.BANNED ? 'ban' : 'suspend'}`, 'user', user._id, {
    from: previous,
    to: user.status,
    reason: req.body.reason,
  });
  res.json({ success: true, user: { _id: user._id, status: user.status, statusReason: user.statusReason } });
};
