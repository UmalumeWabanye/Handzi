const { placeOf, roundKm, haversineKm } = require('./geo');

const clientSummary = (u) =>
  u && u.firstName ? { id: u._id, firstName: u.firstName, avatar: u.avatar, memberSince: u.createdAt } : undefined;

/** Full job for its owner (includes exact address and coordinates). */
function toOwnerJob(job) {
  const j = job.toObject ? job.toObject() : job;
  return { ...j, client: clientSummary(job.client) ?? j.client, isOwner: true };
}

/**
 * Job as a handyman sees it: suburb/city only until they're hired, plus distance from their base
 * and the status of their own quote.
 */
function toHandymanJob(job, { origin, myQuote, hired } = {}) {
  const j = job.toObject ? job.toObject() : job;
  const coords = j.location?.coordinates;
  const distanceKm = j.distance != null ? roundKm(j.distance / 1000) : origin && coords ? roundKm(haversineKm(origin, coords)) : undefined;
  return {
    _id: j._id,
    title: j.title,
    description: j.description,
    category: j.category,
    subcategory: j.subcategory,
    photos: j.photos,
    budget: j.budget,
    urgency: j.urgency,
    preferredDate: j.preferredDate,
    status: j.status,
    quoteCount: j.quoteCount,
    createdAt: j.createdAt,
    place: placeOf(j.location),
    address: hired ? j.location?.address : undefined,
    distanceKm,
    client: clientSummary(job.client),
    myQuote: myQuote || null,
    isOwner: false,
  };
}

module.exports = { toOwnerJob, toHandymanJob };
