const mongoose = require('mongoose');
const { USER_STATUS } = require('@handyconnect/shared');
const { HandymanProfile, User, Review } = require('../models');
const ApiError = require('../utils/ApiError');
const { ownsPrivateUrl } = require('../services/storage');
const { toPublicProfile, toCard, checklist } = require('../services/handyman.service');

const TRADES = { path: 'trades', select: 'name slug icon' };

// Editable list sections of a profile, with the fields a handyman may set on each entry.
const LISTS = {
  'work-history': {
    field: 'workHistory',
    fields: ['title', 'company', 'employmentType', 'location', 'startDate', 'endDate', 'current', 'description'],
  },
  portfolio: { field: 'portfolio', fields: ['title', 'description', 'category', 'photos', 'completedOn', 'location'] },
  certifications: { field: 'certifications', fields: ['name', 'issuer', 'number', 'documentUrl', 'issuedAt', 'expiresAt'] },
};

const PROFILE_FIELDS = [
  'headline', 'bio', 'trades', 'skills', 'languages', 'yearsExperience',
  'hourlyRate', 'callOutFee', 'serviceArea', 'serviceRadiusKm', 'available',
];

const pick = (src, keys) => Object.fromEntries(keys.filter((k) => src[k] !== undefined).map((k) => [k, src[k]]));

async function loadOwnProfile(user) {
  const profile = await HandymanProfile.findOne({ user: user._id }).populate(TRADES);
  if (!profile) throw ApiError.notFound('No handyman profile. Switch to handyman mode first.');
  return profile;
}

function ownResponse(profile, user) {
  return {
    success: true,
    profile,
    checklist: checklist(profile, user),
    published: !!profile.onboardingCompletedAt,
  };
}

exports.getMine = async (req, res) => {
  const profile = await loadOwnProfile(req.user);
  res.json(ownResponse(profile, req.user));
};

exports.updateMine = async (req, res) => {
  const profile = await loadOwnProfile(req.user);
  profile.set(pick(req.body, PROFILE_FIELDS));
  await profile.save();
  await profile.populate(TRADES);
  res.json(ownResponse(profile, req.user));
};

function listConfig(name) {
  const cfg = LISTS[name];
  if (!cfg) throw ApiError.notFound();
  return cfg;
}

function assertOwnDocument(item, user) {
  if (item.documentUrl && !ownsPrivateUrl(item.documentUrl, user._id.toString())) {
    throw ApiError.badRequest('Invalid document');
  }
}

exports.addItem = async (req, res) => {
  const cfg = listConfig(req.params.list);
  const profile = await loadOwnProfile(req.user);
  const data = pick(req.body, cfg.fields);
  assertOwnDocument(data, req.user);
  profile[cfg.field].push(data);
  await profile.save();
  res.status(201).json(ownResponse(profile, req.user));
};

exports.updateItem = async (req, res) => {
  const cfg = listConfig(req.params.list);
  const profile = await loadOwnProfile(req.user);
  const item = profile[cfg.field].id(req.params.itemId);
  if (!item) throw ApiError.notFound('Entry not found');
  const data = pick(req.body, cfg.fields);
  assertOwnDocument(data, req.user);
  item.set(data);
  if (cfg.field === 'certifications') item.verified = false; // edits need re-checking
  await profile.save();
  res.json(ownResponse(profile, req.user));
};

exports.removeItem = async (req, res) => {
  const cfg = listConfig(req.params.list);
  const profile = await loadOwnProfile(req.user);
  const item = profile[cfg.field].id(req.params.itemId);
  if (!item) throw ApiError.notFound('Entry not found');
  item.deleteOne();
  await profile.save();
  res.json(ownResponse(profile, req.user));
};

exports.submitVerification = async (req, res) => {
  const { idDocumentUrl, selfieUrl } = req.body;
  const uid = req.user._id.toString();
  if (!ownsPrivateUrl(idDocumentUrl, uid) || !ownsPrivateUrl(selfieUrl, uid)) {
    throw ApiError.badRequest('Upload your ID and selfie first');
  }
  const profile = await loadOwnProfile(req.user);
  if (profile.verification?.status === 'verified') throw ApiError.conflict('You are already verified');
  profile.verification = { status: 'pending', idDocumentUrl, selfieUrl, submittedAt: new Date() };
  await profile.save();
  res.json(ownResponse(profile, req.user));
};

// Publish the profile once every required section is complete.
exports.completeOnboarding = async (req, res) => {
  const profile = await loadOwnProfile(req.user);
  const missing = checklist(profile, req.user).filter((i) => i.required && !i.done);
  if (missing.length) {
    throw ApiError.badRequest('Your profile is not complete yet', missing.map((i) => ({ field: i.key, message: `${i.label} is incomplete` })));
  }
  if (!profile.onboardingCompletedAt) profile.onboardingCompletedAt = new Date();
  await profile.save();
  req.user.set('onboarding.handyman', req.user.onboarding?.handyman || new Date());
  await req.user.save();
  res.json({ ...ownResponse(profile, req.user), user: req.user.toPublic() });
};

// Browse published handymen. Optional: category, verified=true, lat/lng (sorted by distance).
exports.list = async (req, res) => {
  const { category, verified, lat, lng } = req.query;
  const limit = Math.min(Number(req.query.limit) || 20, 50);
  const page = Math.max(Number(req.query.page) || 1, 1);

  const filter = { onboardingCompletedAt: { $ne: null }, user: { $ne: req.user._id } };
  if (category) {
    if (!mongoose.isValidObjectId(category)) throw ApiError.badRequest('Invalid category');
    filter.trades = category;
  }
  if (verified === 'true') filter['verification.status'] = 'verified';

  const origin = lat && lng ? [Number(lng), Number(lat)] : null;
  let query;
  if (origin && origin.every(Number.isFinite)) {
    filter.serviceArea = { $near: { $geometry: { type: 'Point', coordinates: origin }, $maxDistance: 150_000 } };
    query = HandymanProfile.find(filter);
  } else {
    query = HandymanProfile.find(filter).sort({ 'verification.status': -1, 'stats.averageRating': -1, onboardingCompletedAt: -1 });
  }

  const profiles = await query
    .skip((page - 1) * limit)
    .limit(limit)
    .populate(TRADES)
    .populate({ path: 'user', select: 'firstName lastName avatar status' });

  const handymen = profiles
    .filter((p) => p.user?.status === USER_STATUS.ACTIVE)
    .map((p) => toCard(p, p.user, origin));
  res.json({ success: true, handymen, page });
};

exports.getPublic = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.userId)) throw ApiError.notFound('Handyman not found');
  const [user, profile] = await Promise.all([
    User.findById(req.params.userId),
    HandymanProfile.findOne({ user: req.params.userId }).populate(TRADES).populate({ path: 'portfolio.category', select: 'name icon' }),
  ]);
  const isOwner = req.user._id.equals(req.params.userId);
  const visible = user && profile && (isOwner || (profile.onboardingCompletedAt && user.status === USER_STATUS.ACTIVE));
  if (!visible) throw ApiError.notFound('Handyman not found');
  res.json({ success: true, handyman: toPublicProfile(profile, user) });
};

exports.reviews = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.userId)) throw ApiError.notFound();
  const reviews = await Review.find({ reviewee: req.params.userId, direction: 'client_to_handyman', hidden: false })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('reviewer', 'firstName avatar')
    .populate({ path: 'booking', select: 'title' });
  res.json({
    success: true,
    reviews: reviews.map((r) => ({
      _id: r._id,
      rating: r.rating,
      text: r.text,
      createdAt: r.createdAt,
      reviewer: r.reviewer ? { firstName: r.reviewer.firstName, avatar: r.reviewer.avatar } : null,
      jobTitle: r.booking?.title,
    })),
  });
};
