const { NOTIFICATION_TYPES: T, USER_STATUS } = require('@handyconnect/shared');
const { Notification, HandymanProfile, Quote, User } = require('../models');
const realtime = require('./realtime');
const { pushToUser } = require('./push');
const { haversineKm } = require('./geo');
const { rand } = require('./money');

/** Store an in-app notification, emit it live, and push it to the user's devices. */
async function notify(userId, { type, title, body, data = {} }) {
  const doc = await Notification.create({ user: userId, type, title, body, data });
  realtime.toUser(String(userId), 'notification:new', doc.toObject());
  pushToUser(userId, { title, body, data: { ...data, type, notificationId: String(doc._id) } });
  return doc;
}

// Never let a notification failure break the request that triggered it.
const safe = (fn) => (...args) =>
  fn(...args).catch((err) => console.warn('[notify] failed:', err.message));

/** A new job: tell published handymen in that trade whose service radius covers it. */
const jobPosted = safe(async (job) => {
  const coords = job.location?.coordinates;
  if (!coords?.length) return;
  const profiles = await HandymanProfile.find({
    trades: job.category,
    onboardingCompletedAt: { $ne: null },
    available: true,
    user: { $ne: job.client },
    serviceArea: { $near: { $geometry: { type: 'Point', coordinates: coords }, $maxDistance: 200_000 } },
  })
    .select('user serviceArea serviceRadiusKm')
    .limit(300);

  const reachable = profiles.filter((p) => haversineKm(p.serviceArea.coordinates, coords) <= (p.serviceRadiusKm || 25));
  const active = await User.find({ _id: { $in: reachable.map((p) => p.user) }, status: USER_STATUS.ACTIVE }).select('_id');
  const where = job.location.suburb || job.location.city || 'your area';
  await Promise.all(
    active.map((u) =>
      notify(u._id, {
        type: T.JOB_NEARBY,
        title: `New job near ${where}`,
        body: job.title,
        data: { jobId: String(job._id), mode: 'handyman' },
      })
    )
  );
});

const quoteReceived = safe(async (quote, job, handymanName, updated = false) =>
  notify(job.client, {
    type: updated ? T.QUOTE_UPDATED : T.QUOTE_RECEIVED,
    title: updated ? `${handymanName} updated their quote` : `New quote: ${rand(quote.amount)}`,
    body: updated ? `Now ${rand(quote.amount)} for "${job.title}"` : `${handymanName} quoted on "${job.title}"`,
    data: { jobId: String(job._id), quoteId: String(quote._id), mode: 'client' },
  })
);

const quoteAccepted = safe(async (quote, job, clientName) =>
  notify(quote.handyman, {
    type: T.QUOTE_ACCEPTED,
    title: 'Sharp! You got the job',
    body: `${clientName} accepted your ${rand(quote.amount)} quote for "${job.title}"`,
    data: { jobId: String(job._id), quoteId: String(quote._id), mode: 'handyman' },
  })
);

const quotesRejected = safe(async (quotes, job) =>
  Promise.all(
    quotes.map((q) =>
      notify(q.handyman, {
        type: T.QUOTE_REJECTED,
        title: 'Quote not selected',
        body: `The client went with another handyman for "${job.title}"`,
        data: { jobId: String(job._id), quoteId: String(q._id), mode: 'handyman' },
      })
    )
  )
);

const jobCancelled = safe(async (job, quotes) =>
  Promise.all(
    quotes.map((q) =>
      notify(q.handyman, {
        type: T.JOB_CANCELLED,
        title: 'Job cancelled',
        body: `"${job.title}" was cancelled by the client`,
        data: { jobId: String(job._id), mode: 'handyman' },
      })
    )
  )
);

/** Chat messages are pushed (not stored as notifications); skipped if the recipient has the chat open. */
const message = safe(async ({ to, from, conversation, text }) => {
  if (realtime.isViewing(to, conversation._id)) return;
  const mode = String(conversation.client) === String(to) ? 'client' : 'handyman';
  await pushToUser(to, {
    title: from,
    body: text,
    data: { type: T.MESSAGE, conversationId: String(conversation._id), mode },
  });
});

/** Quotes that are still pending (used before bulk-rejecting them). */
const pendingQuotes = (jobId, exceptId) => Quote.find({ job: jobId, status: 'pending', ...(exceptId && { _id: { $ne: exceptId } }) }).select('handyman');

module.exports = { notify, jobPosted, quoteReceived, quoteAccepted, quotesRejected, jobCancelled, message, pendingQuotes };
