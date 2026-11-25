const { handymanChecklist } = require('@handyconnect/shared');

const { haversineKm, placeOf } = require('./geo');

// What clients see. Never includes ID documents, certificate files, exact coordinates or payout details.
function toPublicProfile(profile, user) {
  return {
    userId: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    avatar: user.avatar,
    memberSince: user.createdAt,
    headline: profile.headline,
    bio: profile.bio,
    trades: profile.trades,
    skills: profile.skills,
    languages: profile.languages,
    yearsExperience: profile.yearsExperience,
    hourlyRate: profile.hourlyRate,
    callOutFee: profile.callOutFee,
    serviceRadiusKm: profile.serviceRadiusKm,
    place: placeOf(profile.serviceArea),
    workHistory: [...profile.workHistory].sort((a, b) => (b.current - a.current) || (b.startDate - a.startDate)),
    portfolio: [...profile.portfolio].sort((a, b) => (b.completedOn || b.createdAt) - (a.completedOn || a.createdAt)),
    certifications: profile.certifications.map((c) => ({
      _id: c._id,
      name: c.name,
      issuer: c.issuer,
      issuedAt: c.issuedAt,
      expiresAt: c.expiresAt,
      verified: c.verified,
    })),
    stats: profile.stats,
    verified: profile.verification?.status === 'verified',
    available: profile.available,
    published: !!profile.onboardingCompletedAt,
  };
}

function toCard(profile, user, origin) {
  const coords = profile.serviceArea?.coordinates;
  return {
    userId: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    avatar: user.avatar,
    headline: profile.headline,
    trades: profile.trades,
    hourlyRate: profile.hourlyRate,
    yearsExperience: profile.yearsExperience,
    stats: profile.stats,
    verified: profile.verification?.status === 'verified',
    place: placeOf(profile.serviceArea),
    coverPhoto: profile.portfolio?.[0]?.photos?.[0],
    projectCount: profile.portfolio?.length || 0,
    distanceKm: origin && coords?.length === 2 ? Math.round(haversineKm(origin, coords) * 10) / 10 : undefined,
  };
}

const checklist = (profile, user) => handymanChecklist(profile, user);

module.exports = { toPublicProfile, toCard, checklist };
