const mongoose = require('mongoose');
const { PRICING_TYPE, JOB_STATUS, QUOTE_STATUS, BOOKING_STATUS, USER_STATUS, ROLES, NOTIFICATION_TYPES: T } = require('@handyconnect/shared');
const { ServiceListing, HandymanProfile, User, Category, Job, Quote, Booking, Setting } = require('../models');
const ApiError = require('../utils/ApiError');
const { haversineKm, roundKm, placeOf } = require('../services/geo');
const { notify } = require('../services/notify');
const { rand } = require('../services/money');

const FIELDS = ['category', 'subcategory', 'title', 'description', 'photos', 'pricingType', 'tiers', 'active'];
const pick = (src) => Object.fromEntries(FIELDS.filter((k) => src[k] !== undefined).map((k) => [k, src[k]]));
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const CATEGORY = { path: 'category', select: 'name slug icon' };

/** Price shown on a card: the cheapest package (per hour for hourly services). */
function fromPrice(listing) {
  if (listing.pricingType === PRICING_TYPE.QUOTE || !listing.tiers.length) return null;
  return Math.min(...listing.tiers.map((t) => t.price));
}

/** What a package costs to book. Hourly packages are priced for their estimated hours. */
const tierTotal = (listing, tier) => (listing.pricingType === PRICING_TYPE.HOURLY ? tier.price * (tier.estimatedHours || 1) : tier.price);

function card(listing, handyman, profile, distanceKm) {
  return {
    _id: listing._id,
    title: listing.title,
    category: listing.category,
    subcategory: listing.subcategory,
    photo: listing.photos[0],
    pricingType: listing.pricingType,
    fromPrice: fromPrice(listing),
    tierCount: listing.tiers.length,
    active: listing.active,
    distanceKm,
    handyman: {
      userId: handyman._id,
      firstName: handyman.firstName,
      lastName: handyman.lastName,
      avatar: handyman.avatar,
      verified: profile?.verification?.status === 'verified',
      stats: profile?.stats,
      place: placeOf(profile?.serviceArea),
    },
  };
}

function validateTiers(data, existing) {
  const pricingType = data.pricingType ?? existing?.pricingType;
  const tiers = data.tiers ?? existing?.tiers ?? [];
  if (pricingType !== PRICING_TYPE.QUOTE && !tiers.length) throw ApiError.badRequest('Add at least one package with a price');
  if (pricingType === PRICING_TYPE.HOURLY && tiers.some((t) => !(t.estimatedHours > 0))) {
    throw ApiError.badRequest('Hourly packages need an estimated number of hours');
  }
}

// ---- Handyman: manage my services ----

exports.mine = async (req, res) => {
  const [listings, profile] = await Promise.all([
    ServiceListing.find({ handyman: req.user._id }).sort({ createdAt: -1 }).populate(CATEGORY),
    HandymanProfile.findOne({ user: req.user._id }).select('verification onboardingCompletedAt'),
  ]);
  res.json({
    success: true,
    services: listings,
    // Services only appear in search for published, ID-verified handymen.
    visible: !!profile?.onboardingCompletedAt && profile?.verification?.status === 'verified',
  });
};

exports.create = async (req, res) => {
  if (!(await HandymanProfile.exists({ user: req.user._id }))) throw ApiError.forbidden('Set up your handyman profile first');
  const data = pick(req.body);
  validateTiers(data);
  if (data.pricingType === PRICING_TYPE.QUOTE) data.tiers = [];
  const listing = await ServiceListing.create({ ...data, handyman: req.user._id });
  await listing.populate(CATEGORY);
  res.status(201).json({ success: true, service: listing });
};

async function loadOwn(req) {
  if (!mongoose.isValidObjectId(req.params.id)) throw ApiError.notFound('Service not found');
  const listing = await ServiceListing.findById(req.params.id);
  if (!listing || !listing.handyman.equals(req.user._id)) throw ApiError.notFound('Service not found');
  return listing;
}

exports.update = async (req, res) => {
  const listing = await loadOwn(req);
  const data = pick(req.body);
  validateTiers(data, listing);
  listing.set(data);
  if (listing.pricingType === PRICING_TYPE.QUOTE) listing.tiers = [];
  await listing.save();
  await listing.populate(CATEGORY);
  res.json({ success: true, service: listing });
};

exports.remove = async (req, res) => {
  const listing = await loadOwn(req);
  await listing.deleteOne();
  res.json({ success: true });
};

// ---- Clients: search, view, book ----

/**
 * Services offered by verified handymen within `radiusKm` of a location (the client's home by default).
 * The text matches the service title, sub-category, description and trade name.
 */
exports.search = async (req, res) => {
  const lat = req.query.lat != null ? Number(req.query.lat) : req.user.location?.coordinates?.[1];
  const lng = req.query.lng != null ? Number(req.query.lng) : req.user.location?.coordinates?.[0];
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw ApiError.badRequest('Choose a location to search near');
  const origin = [lng, lat];
  const radiusKm = Math.min(Math.max(Number(req.query.radiusKm) || 25, 1), 200);

  const near = await HandymanProfile.aggregate([
    {
      $geoNear: {
        near: { type: 'Point', coordinates: origin },
        distanceField: 'distance',
        maxDistance: radiusKm * 1000,
        query: { onboardingCompletedAt: { $ne: null }, 'verification.status': 'verified', available: true, user: { $ne: req.user._id } },
        spherical: true,
      },
    },
    { $limit: 500 },
  ]);
  const activeUsers = new Set(
    (await User.find({ _id: { $in: near.map((p) => p.user) }, status: USER_STATUS.ACTIVE }).select('_id')).map((u) => String(u._id))
  );
  const profiles = new Map(near.filter((p) => activeUsers.has(String(p.user))).map((p) => [String(p.user), p]));

  const filter = { handyman: { $in: [...profiles.keys()] }, active: true, removedByAdmin: { $ne: true } };
  if (req.query.category) filter.category = req.query.category;
  const q = String(req.query.q || '').trim();
  if (q) {
    const rx = new RegExp(escape(q), 'i');
    const trades = await Category.find({ name: rx }).select('_id');
    filter.$or = [{ title: rx }, { subcategory: rx }, { description: rx }, { category: { $in: trades.map((t) => t._id) } }];
  }

  const listings = await ServiceListing.find(filter).limit(100).populate(CATEGORY).populate('handyman', 'firstName lastName avatar');
  const services = listings
    .map((l) => {
      const p = profiles.get(String(l.handyman._id));
      return card(l, l.handyman, p, roundKm(p.distance / 1000));
    })
    .sort((a, b) => a.distanceKm - b.distanceKm || (b.handyman.stats?.averageRating || 0) - (a.handyman.stats?.averageRating || 0));

  res.json({ success: true, services, radiusKm, origin: { lat, lng } });
};

/** A handyman's services, for their public profile (the owner also sees paused ones). */
exports.byHandyman = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.userId)) throw ApiError.notFound();
  const [user, profile] = await Promise.all([
    User.findById(req.params.userId).select('firstName lastName avatar status'),
    HandymanProfile.findOne({ user: req.params.userId }),
  ]);
  if (!user || !profile) throw ApiError.notFound('Handyman not found');
  const isOwner = req.user._id.equals(req.params.userId);
  const filter = { handyman: user._id, removedByAdmin: { $ne: true }, ...(isOwner ? {} : { active: true }) };
  const listings = await ServiceListing.find(filter).sort({ createdAt: -1 }).populate(CATEGORY);
  res.json({ success: true, services: listings.map((l) => card(l, user, profile)) });
};

exports.get = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw ApiError.notFound('Service not found');
  const listing = await ServiceListing.findById(req.params.id).populate(CATEGORY).populate('handyman', 'firstName lastName avatar status');
  const isOwner = !!listing && listing.handyman._id.equals(req.user._id);
  if (!listing || listing.removedByAdmin || (!listing.active && !isOwner) || listing.handyman.status !== USER_STATUS.ACTIVE) {
    throw ApiError.notFound('This service is no longer available');
  }
  const profile = await HandymanProfile.findOne({ user: listing.handyman._id });
  const from = req.user.location?.coordinates;
  const distanceKm = from?.length && profile?.serviceArea?.coordinates?.length ? roundKm(haversineKm(from, profile.serviceArea.coordinates)) : undefined;
  res.json({
    success: true,
    service: {
      ...listing.toObject(),
      handyman: card(listing, listing.handyman, profile).handyman,
      distanceKm,
      serviceRadiusKm: profile?.serviceRadiusKm,
      bookable: profile?.verification?.status === 'verified' && !!profile?.onboardingCompletedAt && !isOwner && listing.pricingType !== PRICING_TYPE.QUOTE,
      isOwner,
    },
  });
};

/**
 * Book a package. Creates the same records as an accepted quote (a job, an accepted quote and a booking
 * awaiting payment) so the booking, chat and payment flows work unchanged.
 */
exports.book = async (req, res) => {
  const me = req.user;
  if (!me.roles.includes(ROLES.CLIENT)) throw ApiError.forbidden('Switch to hiring mode to book services');
  if (!mongoose.isValidObjectId(req.params.id)) throw ApiError.notFound('Service not found');
  const listing = await ServiceListing.findById(req.params.id);
  if (!listing || !listing.active || listing.removedByAdmin) throw ApiError.notFound('This service is no longer available');
  if (listing.handyman.equals(me._id)) throw ApiError.forbidden("You can't book your own service");
  if (listing.pricingType === PRICING_TYPE.QUOTE) throw ApiError.badRequest('This service is priced by quote. Post a job instead.');

  const [handyman, profile] = await Promise.all([User.findById(listing.handyman), HandymanProfile.findOne({ user: listing.handyman })]);
  if (handyman?.status !== USER_STATUS.ACTIVE || profile?.verification?.status !== 'verified' || !profile.onboardingCompletedAt) {
    throw ApiError.conflict('This handyman is not taking bookings right now');
  }
  const tier = listing.tiers.id(req.body.tierId);
  if (!tier) throw ApiError.badRequest('Choose a package');
  const location = req.body.location || me.location;
  if (!location?.coordinates?.length) throw ApiError.badRequest('Add the address for the job');

  const amount = tierTotal(listing, tier);
  const title = `${listing.title} · ${tier.name}`;
  const job = await Job.create({
    client: me._id,
    category: listing.category,
    subcategory: listing.subcategory,
    title,
    description: [tier.description, req.body.note].filter(Boolean).join('\n\n') || listing.description,
    location,
    preferredDate: req.body.scheduledFor,
    status: JOB_STATUS.ASSIGNED,
    assignedTo: handyman._id,
    quoteCount: 1,
  });
  const quote = await Quote.create({
    job: job._id,
    handyman: handyman._id,
    amount,
    message: `Booked from the service "${listing.title}" (${tier.name}).`,
    estimatedDuration: tier.estimatedHours ? `${tier.estimatedHours} hours` : undefined,
    availableFrom: req.body.scheduledFor,
    status: QUOTE_STATUS.ACCEPTED,
  });
  const { commissionPercent } = await Setting.get();
  const commissionAmount = Math.round(amount * commissionPercent) / 100;
  const booking = await Booking.create({
    client: me._id,
    handyman: handyman._id,
    job: job._id,
    quote: quote._id,
    listing: listing._id,
    listingTier: tier.name,
    title,
    amount,
    commissionPercent,
    commissionAmount,
    handymanPayout: Math.round((amount - commissionAmount) * 100) / 100,
    location,
    scheduledFor: req.body.scheduledFor,
    status: BOOKING_STATUS.AWAITING_PAYMENT,
  });

  notify(handyman._id, {
    type: T.SERVICE_BOOKED,
    title: `New booking: ${listing.title}`,
    body: `${me.firstName} booked your ${tier.name} package for ${rand(amount)}. We'll let you know when it's paid.`,
    data: { bookingId: String(booking._id), jobId: String(job._id), mode: 'handyman' },
  }).catch(() => {});

  res.status(201).json({ success: true, booking: { _id: booking._id, amount, title } });
};

module.exports.tierTotal = tierTotal;
