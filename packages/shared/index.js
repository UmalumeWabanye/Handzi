// Shared constants for API, mobile and admin. Plain CommonJS so every app can consume it.

const ROLES = Object.freeze({ CLIENT: 'client', HANDYMAN: 'handyman', ADMIN: 'admin' });
const MODES = Object.freeze({ CLIENT: 'client', HANDYMAN: 'handyman' });

const USER_STATUS = Object.freeze({ ACTIVE: 'active', SUSPENDED: 'suspended', BANNED: 'banned' });

const VERIFICATION_STATUS = Object.freeze({
  NONE: 'none',
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
});

const JOB_STATUS = Object.freeze({
  OPEN: 'open',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CLOSED: 'closed',
  CANCELLED: 'cancelled',
  DISPUTED: 'disputed',
});

const JOB_URGENCY = Object.freeze({ FLEXIBLE: 'flexible', THIS_WEEK: 'this_week', URGENT: 'urgent' });

const QUOTE_STATUS = Object.freeze({
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn',
});

const BOOKING_STATUS = Object.freeze({
  AWAITING_PAYMENT: 'awaiting_payment',
  FUNDED: 'funded',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed', // handyman marked complete, awaiting client confirmation
  CONFIRMED: 'confirmed', // client confirmed (or auto-confirmed); payout released
  CANCELLED: 'cancelled',
  DISPUTED: 'disputed',
});

const PAYMENT_STATUS = Object.freeze({
  PENDING: 'pending',
  HELD: 'held',
  RELEASED: 'released',
  REFUNDED: 'refunded',
  DISPUTED: 'disputed',
  FAILED: 'failed',
});

const PRICING_TYPE = Object.freeze({ FIXED: 'fixed', HOURLY: 'hourly', QUOTE: 'quote' });

const DISPUTE_STATUS = Object.freeze({ OPEN: 'open', UNDER_REVIEW: 'under_review', RESOLVED: 'resolved' });
const DISPUTE_RESOLUTION = Object.freeze({ RELEASE: 'release', REFUND: 'refund', SPLIT: 'split' });

const REPORT_TARGET = Object.freeze({ USER: 'user', LISTING: 'listing', JOB: 'job', MESSAGE: 'message', REVIEW: 'review' });
const REPORT_STATUS = Object.freeze({ OPEN: 'open', ACTIONED: 'actioned', DISMISSED: 'dismissed' });

// Seed categories. Icons are Ionicons names (used by mobile and admin).
const DEFAULT_CATEGORIES = Object.freeze([
  { slug: 'plumbing', name: 'Plumbing', icon: 'water-outline', subcategories: ['Leaks & burst pipes', 'Geysers', 'Drains & blockages', 'Toilets & taps', 'Bathroom installs'] },
  { slug: 'electrical', name: 'Electrical', icon: 'flash-outline', subcategories: ['Faults & trips', 'Lights & plugs', 'DB boards', 'COC certificates', 'Solar & inverters'] },
  { slug: 'roofing', name: 'Roofing', icon: 'home-outline', subcategories: ['Leak repairs', 'Waterproofing', 'Gutters', 'Tiles & sheeting', 'Ceilings'] },
  { slug: 'painting', name: 'Painting', icon: 'color-palette-outline', subcategories: ['Interior', 'Exterior', 'Roof painting', 'Damp proofing'] },
  { slug: 'carpentry', name: 'Carpentry', icon: 'hammer-outline', subcategories: ['Doors & windows', 'Cupboards', 'Decking', 'Furniture repair'] },
  { slug: 'tiling', name: 'Tiling', icon: 'grid-outline', subcategories: ['Floors', 'Walls & splashbacks', 'Regrouting'] },
  { slug: 'building', name: 'Building & Paving', icon: 'construct-outline', subcategories: ['Brickwork', 'Plastering', 'Paving', 'Boundary walls'] },
  { slug: 'appliances', name: 'Appliance Repair', icon: 'build-outline', subcategories: ['Fridges', 'Washing machines', 'Stoves & ovens', 'Dishwashers'] },
  { slug: 'gates-security', name: 'Gates & Security', icon: 'lock-closed-outline', subcategories: ['Gate motors', 'Burglar bars', 'Electric fencing', 'Locksmith'] },
  { slug: 'general', name: 'General Handyman', icon: 'construct', subcategories: ['Mounting & assembly', 'Small repairs', 'Odd jobs'] },
]);

const EMPLOYMENT_TYPES = Object.freeze({
  SELF_EMPLOYED: 'self_employed',
  EMPLOYED: 'employed',
  CONTRACT: 'contract',
  APPRENTICESHIP: 'apprenticeship',
});

// Uploads: public kinds are visible to other users; private kinds only to the owner and admins.
const UPLOAD_KINDS = Object.freeze({
  AVATAR: 'avatar',
  PORTFOLIO: 'portfolio',
  CERTIFICATE: 'certificate',
  ID_DOCUMENT: 'id_document',
  SELFIE: 'selfie',
  JOB: 'job',
  MESSAGE: 'message',
});
const PRIVATE_UPLOAD_KINDS = Object.freeze(['certificate', 'id_document', 'selfie']);

const PROFILE_BIO_MIN = 50;
const JOB_DESCRIPTION_MIN = 30;
const JOB_MAX_PHOTOS = 8;
const QUOTE_MESSAGE_MIN = 20;

// How long a handyman expects the job to take (shown on quotes).
const QUOTE_DURATIONS = Object.freeze(['A few hours', '1 day', '2–3 days', '4–7 days', '1–2 weeks', 'More than 2 weeks']);
const PORTFOLIO_MAX_PHOTOS = 8;

/**
 * What a handyman must fill in before their profile is published.
 * Used by the API (to gate publishing) and the app (to resume onboarding and show profile strength).
 */
function handymanChecklist(profile, user) {
  const p = profile || {};
  const u = user || {};
  const coords = p.serviceArea && p.serviceArea.coordinates;
  const status = p.verification && p.verification.status;
  return [
    { key: 'basics', label: 'Photo, headline & about', required: true, done: !!(u.avatar && p.headline && (p.bio || '').trim().length >= PROFILE_BIO_MIN) },
    { key: 'trades', label: 'Trades & skills', required: true, done: (p.trades || []).length > 0 },
    { key: 'experience', label: 'Work history', required: true, done: (p.workHistory || []).length > 0 },
    { key: 'portfolio', label: 'Proof of work', required: true, done: (p.portfolio || []).some((x) => (x.photos || []).length > 0) },
    { key: 'certifications', label: 'Certifications', required: false, done: (p.certifications || []).length > 0 },
    { key: 'area', label: 'Service area & rates', required: true, done: !!(coords && coords.length === 2 && p.hourlyRate > 0) },
    { key: 'verification', label: 'ID verification', required: true, done: status === 'pending' || status === 'verified' },
  ];
}

// In-app + push notification types. `mode` tells the app which side to open when tapped.
const NOTIFICATION_TYPES = Object.freeze({
  JOB_NEARBY: 'job_nearby',
  QUOTE_RECEIVED: 'quote_received',
  QUOTE_UPDATED: 'quote_updated',
  QUOTE_ACCEPTED: 'quote_accepted',
  QUOTE_REJECTED: 'quote_rejected',
  JOB_CANCELLED: 'job_cancelled',
  MESSAGE: 'message',
  BOOKING_PAID: 'booking_paid',
  JOB_STARTED: 'job_started',
  JOB_COMPLETED: 'job_completed',
  PAYMENT_RELEASED: 'payment_released',
  BOOKING_CANCELLED: 'booking_cancelled',
  DISPUTE_OPENED: 'dispute_opened',
  REVIEW_RECEIVED: 'review_received',
  VERIFICATION_APPROVED: 'verification_approved',
  VERIFICATION_REJECTED: 'verification_rejected',
  DISPUTE_RESOLVED: 'dispute_resolved',
  SERVICE_BOOKED: 'service_booked',
});

// Service packages (Fiverr-style listings).
const SERVICE_MAX_TIERS = 3;
const SERVICE_SEARCH_RADII = Object.freeze([5, 10, 25, 50, 100]); // km
const SERVICE_DESCRIPTION_MIN = 20;

const MESSAGE_MAX_IMAGES = 4;

const REVIEW_DIRECTION = Object.freeze({ CLIENT_TO_HANDYMAN: 'client_to_handyman', HANDYMAN_TO_CLIENT: 'handyman_to_client' });

const CURRENCY = 'ZAR';
const DEFAULT_COMMISSION_PERCENT = 10;
const DEFAULT_AUTO_CONFIRM_HOURS = 72;

module.exports = {
  ROLES,
  MODES,
  USER_STATUS,
  VERIFICATION_STATUS,
  JOB_STATUS,
  JOB_URGENCY,
  QUOTE_STATUS,
  BOOKING_STATUS,
  PAYMENT_STATUS,
  PRICING_TYPE,
  DISPUTE_STATUS,
  DISPUTE_RESOLUTION,
  REPORT_TARGET,
  REPORT_STATUS,
  DEFAULT_CATEGORIES,
  EMPLOYMENT_TYPES,
  UPLOAD_KINDS,
  PRIVATE_UPLOAD_KINDS,
  PROFILE_BIO_MIN,
  PORTFOLIO_MAX_PHOTOS,
  JOB_DESCRIPTION_MIN,
  JOB_MAX_PHOTOS,
  QUOTE_MESSAGE_MIN,
  QUOTE_DURATIONS,
  NOTIFICATION_TYPES,
  MESSAGE_MAX_IMAGES,
  REVIEW_DIRECTION,
  SERVICE_MAX_TIERS,
  SERVICE_SEARCH_RADII,
  SERVICE_DESCRIPTION_MIN,
  handymanChecklist,
  CURRENCY,
  DEFAULT_COMMISSION_PERCENT,
  DEFAULT_AUTO_CONFIRM_HOURS,
};
