// Demo data for development and demos: realistic handymen, clients, jobs, quotes, bookings, payments,
// reviews, chats, a dispute and a report.
//
//   npm run seed:demo              wipe previous demo data, then create it fresh
//   npm run seed:demo -- --reset   only wipe demo data
//
// Demo accounts all use @demo.handzi.co.za emails. Reset removes only those accounts and what they created;
// your own accounts and the admin login are never touched. Refuses to run in production.
require('dotenv').config();
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const {
  BOOKING_STATUS: B,
  PAYMENT_STATUS: P,
  JOB_STATUS: J,
  QUOTE_STATUS: Q,
  DISPUTE_STATUS,
  REVIEW_DIRECTION,
  ROLES,
} = require('@handyconnect/shared');
const connectDB = require('../config/database');
const M = require('../models');
const { PUBLIC_DIR, PRIVATE_DIR } = require('../services/storage');
const { seedCategories } = require('./index');
const { PLACES, HANDYMEN, CLIENTS, OPEN_JOBS, BOOKINGS, SERVICES } = require('./demo-data');

const DOMAIN = '@demo.handzi.co.za';
const PASSWORD = 'Demo1234!';
const ASSETS = path.join(__dirname, 'demo-assets');
const DAY = 24 * 60 * 60 * 1000;

const daysAgo = (d, hour = 10) => {
  const t = new Date(Date.now() - d * DAY);
  t.setHours(hour, (d * 37) % 60, 0, 0);
  return t;
};
const monthDate = (ym) => new Date(`${ym}-01T00:00:00.000Z`);
const point = (key, address) => ({ type: 'Point', ...PLACES[key], address });
const email = (first, last) => `${first}.${last}`.toLowerCase().replace(/[^a-z.]/g, '') + DOMAIN;
const ref = (p) => `${p}-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;

/** Set timestamps directly (Mongoose always stamps "now" on create). */
async function backdate(Model, id, createdAt, updatedAt = createdAt) {
  await Model.collection.updateOne({ _id: id }, { $set: { createdAt, updatedAt } });
}

// ---------- reset ----------

async function reset() {
  const users = await M.User.find({ email: { $regex: `${DOMAIN.replace(/\./g, '\\.')}$` } }).select('_id');
  const ids = users.map((u) => u._id);
  if (!ids.length) return 0;
  const jobs = (await M.Job.find({ client: { $in: ids } }).select('_id')).map((j) => j._id);
  const bookings = (await M.Booking.find({ $or: [{ client: { $in: ids } }, { handyman: { $in: ids } }] }).select('_id')).map((b) => b._id);
  const convs = (await M.Conversation.find({ participants: { $in: ids } }).select('_id')).map((c) => c._id);
  const messages = (await M.Message.find({ conversation: { $in: convs } }).select('_id')).map((m) => m._id);

  await Promise.all([
    M.Message.deleteMany({ conversation: { $in: convs } }),
    M.Conversation.deleteMany({ _id: { $in: convs } }),
    M.Payment.deleteMany({ booking: { $in: bookings } }),
    M.Dispute.deleteMany({ booking: { $in: bookings } }),
    M.Review.deleteMany({ $or: [{ booking: { $in: bookings } }, { reviewer: { $in: ids } }, { reviewee: { $in: ids } }] }),
    M.Report.deleteMany({ $or: [{ reporter: { $in: ids } }, { targetId: { $in: [...ids, ...jobs, ...messages] } }] }),
    M.Notification.deleteMany({ user: { $in: ids } }),
    M.Quote.deleteMany({ $or: [{ handyman: { $in: ids } }, { job: { $in: jobs } }] }),
    M.ServiceListing.deleteMany({ handyman: { $in: ids } }),
  ]);
  await M.Booking.deleteMany({ _id: { $in: bookings } });
  await M.Job.deleteMany({ _id: { $in: jobs } });
  await M.HandymanProfile.deleteMany({ user: { $in: ids } });
  await M.User.deleteMany({ _id: { $in: ids } });

  // Demo images: public ones are named demo-*, private ones start with the owner's id.
  const idSet = new Set(ids.map(String));
  for (const [dir, match] of [
    [PUBLIC_DIR, (f) => f.startsWith('demo-')],
    [PRIVATE_DIR, (f) => idSet.has(f.slice(0, 24))],
  ]) {
    const files = await fs.readdir(dir).catch(() => []);
    await Promise.all(files.filter(match).map((f) => fs.unlink(path.join(dir, f)).catch(() => {})));
  }
  return ids.length;
}

// ---------- create ----------

async function publicImage(name) {
  await fs.mkdir(PUBLIC_DIR, { recursive: true });
  const file = `demo-${name}.jpg`;
  await fs.copyFile(path.join(ASSETS, `${name}.jpg`), path.join(PUBLIC_DIR, file));
  return `/uploads/${file}`;
}

async function privateImage(userId, name) {
  await fs.mkdir(PRIVATE_DIR, { recursive: true });
  const file = `${userId}-${crypto.randomBytes(16).toString('hex')}.jpg`;
  await fs.copyFile(path.join(ASSETS, `${name}.jpg`), path.join(PRIVATE_DIR, file));
  return `/api/v1/uploads/private/${file}`;
}

async function seed() {
  await seedCategories();
  const categories = Object.fromEntries((await M.Category.find({})).map((c) => [c.slug, c]));
  const { commissionPercent } = await M.Setting.get();
  const people = {};

  // Clients
  for (const [i, c] of CLIENTS.entries()) {
    const created = daysAgo(58 - i * 6, 9 + (i % 8));
    const u = await M.User.create({
      firstName: c.firstName,
      lastName: c.lastName,
      email: email(c.firstName, c.lastName),
      phone: `+2769900${String(101 + i).padStart(4, '0')}`, // 0699000101…
      phoneVerified: true,
      password: PASSWORD,
      roles: [ROLES.CLIENT],
      activeMode: 'client',
      location: point(c.place),
      interests: c.interests.map((s) => categories[s]._id),
      onboarding: { client: created },
      lastLoginAt: daysAgo(i % 5),
    });
    await backdate(M.User, u._id, created);
    people[c.key] = u;
  }

  // Handymen with full LinkedIn-style profiles
  for (const [i, h] of HANDYMEN.entries()) {
    const created = daysAgo(60 - i * 4, 8 + (i % 9));
    const u = await M.User.create({
      firstName: h.firstName,
      lastName: h.lastName,
      email: email(h.firstName, h.lastName),
      phone: `+2769900${String(1 + i).padStart(4, '0')}`, // 0699000001…
      phoneVerified: true,
      password: PASSWORD,
      roles: [ROLES.CLIENT, ROLES.HANDYMAN],
      activeMode: 'handyman',
      onboarding: { handyman: created },
      lastLoginAt: daysAgo(i % 4),
    });
    await backdate(M.User, u._id, created);

    const portfolio = [];
    for (const p of h.portfolio) {
      portfolio.push({
        title: p.title,
        description: p.description,
        category: categories[p.category]._id,
        photos: await Promise.all(p.photos.map(publicImage)),
        completedOn: daysAgo(p.months * 30),
        location: p.location,
      });
    }
    const verification =
      h.verification === 'pending'
        ? { status: 'pending', idDocumentUrl: await privateImage(u._id, 'id-document'), selfieUrl: await privateImage(u._id, 'selfie'), submittedAt: daysAgo(1 + (i % 3)) }
        : { status: 'verified', idDocumentUrl: await privateImage(u._id, 'id-document'), selfieUrl: await privateImage(u._id, 'selfie'), submittedAt: created, reviewedAt: created };

    await M.HandymanProfile.create({
      user: u._id,
      headline: h.headline,
      bio: h.bio,
      trades: h.trades.map((s) => categories[s]._id),
      skills: h.skills,
      languages: h.languages,
      yearsExperience: h.years,
      hourlyRate: h.rate,
      callOutFee: h.callOut,
      serviceArea: point(h.place),
      serviceRadiusKm: h.radius,
      workHistory: h.work.map((w) => ({
        title: w.title,
        company: w.company,
        employmentType: w.employmentType,
        location: w.location,
        startDate: monthDate(w.start),
        endDate: w.end ? monthDate(w.end) : undefined,
        current: !!w.current,
        description: w.description,
      })),
      portfolio,
      certifications: h.certs.map((c) => ({ name: c.name, issuer: c.issuer, number: c.number, issuedAt: monthDate(c.issued), verified: c.verified })),
      verification,
      onboardingCompletedAt: created,
    });
    people[h.key] = u;
  }

  // Service packages clients can search for and book
  let services = 0;
  for (const [hk, list] of Object.entries(SERVICES)) {
    for (const [title, trade, sub, pricingType, description, photos, tiers] of list) {
      const s = await M.ServiceListing.create({
        handyman: people[hk]._id,
        category: categories[trade]._id,
        subcategory: sub,
        title,
        description,
        photos: await Promise.all(photos.map(publicImage)),
        pricingType,
        tiers: tiers.map(([name, price, desc, hours]) => ({ name, price, description: desc || undefined, estimatedHours: hours })),
      });
      await backdate(M.ServiceListing, s._id, daysAgo(20 + services));
      services += 1;
    }
  }

  // Open jobs with pending quotes
  let quotes = 0;
  for (const j of OPEN_JOBS) {
    const client = people[j.client];
    const created = daysAgo(j.daysAgo, 7 + (j.title.length % 10));
    const job = await M.Job.create({
      client: client._id,
      category: categories[j.category]._id,
      subcategory: j.sub,
      title: j.title,
      description: j.description,
      photos: await Promise.all((j.photos || []).map(publicImage)),
      location: client.location,
      budget: { min: j.budget[0] ?? undefined, max: j.budget[1] ?? undefined },
      urgency: j.urgency,
      status: J.OPEN,
      quoteCount: j.quotes.length,
    });
    await backdate(M.Job, job._id, created);
    for (const [hk, amount, message, duration] of j.quotes) {
      const q = await M.Quote.create({ job: job._id, handyman: people[hk]._id, amount, message, estimatedDuration: duration, status: Q.PENDING });
      await backdate(M.Quote, q._id, new Date(created.getTime() + 3 * 60 * 60 * 1000));
      quotes += 1;
    }
  }

  // Bookings at every stage, each with its job, accepted quote, payment, chat and reviews
  const counts = {};
  for (const b of BOOKINGS) {
    const client = people[b.client];
    const handyman = people[b.handyman];
    const posted = daysAgo(b.daysAgo + 2);
    const accepted = daysAgo(b.daysAgo, 11);
    const paid = new Date(accepted.getTime() + 2 * 60 * 60 * 1000);
    const started = daysAgo(Math.max(b.daysAgo - 1, 0), 8);
    const completed = daysAgo(Math.max(b.daysAgo - 2, 0), 16);
    const confirmed = daysAgo(Math.max(b.daysAgo - 3, 0), 9);

    const jobStatus = { awaiting_payment: J.ASSIGNED, funded: J.ASSIGNED, in_progress: J.IN_PROGRESS, completed: J.COMPLETED, confirmed: J.CLOSED, disputed: J.DISPUTED, cancelled: J.CANCELLED }[b.state];
    const job = await M.Job.create({
      client: client._id,
      category: categories[b.category]._id,
      title: b.title,
      description: `${b.title}. Please quote for labour and materials.`,
      location: client.location,
      urgency: 'this_week',
      status: jobStatus,
      quoteCount: 1,
      assignedTo: handyman._id,
    });
    await backdate(M.Job, job._id, posted, accepted);

    const quote = await M.Quote.create({
      job: job._id,
      handyman: handyman._id,
      amount: b.amount,
      message: `Happy to help with this. Price covers labour and materials for: ${b.title.toLowerCase()}.`,
      estimatedDuration: '1 day',
      status: Q.ACCEPTED,
    });
    await backdate(M.Quote, quote._id, new Date(posted.getTime() + 4 * 60 * 60 * 1000), accepted);

    const commissionAmount = Math.round(b.amount * commissionPercent) / 100;
    const payout = Math.round((b.amount - commissionAmount) * 100) / 100;
    const booking = await M.Booking.create({
      client: client._id,
      handyman: handyman._id,
      job: job._id,
      quote: quote._id,
      title: b.title,
      amount: b.amount,
      commissionPercent,
      commissionAmount,
      handymanPayout: payout,
      location: client.location,
      scheduledFor: b.scheduledInDays ? new Date(Date.now() + b.scheduledInDays * DAY) : started,
      status: { awaiting_payment: B.AWAITING_PAYMENT, funded: B.FUNDED, in_progress: B.IN_PROGRESS, completed: B.COMPLETED, confirmed: B.CONFIRMED, disputed: B.DISPUTED, cancelled: B.CANCELLED }[b.state],
      startedAt: ['in_progress', 'completed', 'confirmed', 'disputed'].includes(b.state) ? started : undefined,
      completedAt: ['completed', 'confirmed', 'disputed'].includes(b.state) ? completed : undefined,
      confirmedAt: b.state === 'confirmed' ? confirmed : undefined,
      autoConfirmAt: b.state === 'completed' ? new Date(Date.now() + 2 * DAY) : undefined,
      cancelledAt: b.state === 'cancelled' ? started : undefined,
      cancelReason: b.cancelReason,
    });
    await backdate(M.Booking, booking._id, accepted, b.state === 'confirmed' ? confirmed : new Date());
    counts[b.state] = (counts[b.state] || 0) + 1;

    if (b.state !== 'awaiting_payment') {
      const status = { funded: P.HELD, in_progress: P.HELD, completed: P.HELD, confirmed: P.RELEASED, disputed: P.DISPUTED, cancelled: P.REFUNDED }[b.state];
      const history = [{ status: P.HELD, at: paid, note: 'Paid via mock' }];
      if (status === P.RELEASED) history.push({ status, at: confirmed, note: 'Released on client confirmation' });
      if (status === P.DISPUTED) history.push({ status, at: completed, note: 'Frozen: client reported a problem' });
      if (status === P.REFUNDED) history.push({ status, at: started, note: 'Refunded after cancellation by handyman' });
      const payment = await M.Payment.create({
        booking: booking._id,
        client: client._id,
        handyman: handyman._id,
        amount: b.amount,
        commissionAmount,
        payoutAmount: payout,
        status,
        paystackReference: ref('MOCK'),
        paystackTransferCode: status === P.RELEASED ? ref('MOCK-TRF') : undefined,
        heldAt: paid,
        releasedAt: status === P.RELEASED ? confirmed : undefined,
        refundedAt: status === P.REFUNDED ? started : undefined,
        refundAmount: status === P.REFUNDED ? b.amount : undefined,
        history,
      });
      await backdate(M.Payment, payment._id, paid); // the dashboard's payments chart is keyed on this date
    }

    if (b.review) {
      const r = await M.Review.create({ booking: booking._id, reviewer: client._id, reviewee: handyman._id, direction: REVIEW_DIRECTION.CLIENT_TO_HANDYMAN, rating: b.review[0], text: b.review[1] });
      await backdate(M.Review, r._id, confirmed);
    }
    if (b.back) {
      const r = await M.Review.create({ booking: booking._id, reviewer: handyman._id, reviewee: client._id, direction: REVIEW_DIRECTION.HANDYMAN_TO_CLIENT, rating: b.back[0], text: b.back[1] });
      await backdate(M.Review, r._id, confirmed);
    }

    let lastMessage;
    if (b.chat) {
      const conv = await M.Conversation.create({
        key: `${job._id}:${client._id}:${handyman._id}`,
        job: job._id,
        booking: booking._id,
        client: client._id,
        handyman: handyman._id,
        participants: [client._id, handyman._id],
      });
      for (const [k, [from, text]] of b.chat.entries()) {
        const sender = from === 'client' ? client : handyman;
        const at = new Date(accepted.getTime() + (k + 1) * 47 * 60 * 1000);
        const isLast = k === b.chat.length - 1;
        const msg = await M.Message.create({
          conversation: conv._id,
          sender: sender._id,
          text,
          containsContact: /whatsapp|\b0\d{2}\s?\d{3}\s?\d{4}\b/i.test(text),
          // The newest message stays unread for the recipient on active bookings.
          readBy: isLast && b.state !== 'confirmed' ? [sender._id] : [client._id, handyman._id],
        });
        await backdate(M.Message, msg._id, at);
        lastMessage = { msg, sender, at, text };
      }
      const recipient = lastMessage.sender._id.equals(client._id) ? handyman : client;
      conv.lastMessage = { text: lastMessage.text, sender: lastMessage.sender._id, at: lastMessage.at, hasImages: false };
      if (b.state !== 'confirmed') conv.unread.set(String(recipient._id), 1);
      await conv.save();
      await backdate(M.Conversation, conv._id, accepted, lastMessage.at);
    }

    if (b.dispute) {
      const d = await M.Dispute.create({ booking: booking._id, openedBy: client._id, reason: b.dispute, status: DISPUTE_STATUS.OPEN });
      await backdate(M.Dispute, d._id, daysAgo(Math.max(b.daysAgo - 3, 0), 12));
    }
    if (b.report && lastMessage) {
      const r = await M.Report.create({ reporter: client._id, targetType: 'message', targetId: lastMessage.msg._id, reason: b.report });
      await backdate(M.Report, r._id, daysAgo(Math.max(b.daysAgo - 3, 0), 13));
    }
  }

  // Ratings and job counts come from the reviews and confirmed bookings above.
  for (const h of HANDYMEN) {
    const u = people[h.key];
    const [agg] = await M.Review.aggregate([
      { $match: { reviewee: u._id, direction: REVIEW_DIRECTION.CLIENT_TO_HANDYMAN, hidden: false } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    const jobsCompleted = await M.Booking.countDocuments({ handyman: u._id, status: B.CONFIRMED });
    await M.HandymanProfile.updateOne(
      { user: u._id },
      { 'stats.averageRating': agg ? Math.round(agg.avg * 10) / 10 : 0, 'stats.reviewCount': agg?.count || 0, 'stats.jobsCompleted': jobsCompleted }
    );
  }

  return { clients: CLIENTS.length, handymen: HANDYMEN.length, services, openJobs: OPEN_JOBS.length, quotes, bookings: BOOKINGS.length, counts, people };
}

async function run() {
  if (process.env.NODE_ENV === 'production') throw new Error('Refusing to seed demo data in production.');
  await connectDB();
  const removed = await reset();
  if (removed) console.log(`Removed previous demo data (${removed} demo accounts).`);
  if (process.argv.includes('--reset')) return mongoose.disconnect();

  const r = await seed();
  console.log(`
Demo data ready: ${r.clients} clients, ${r.handymen} handymen, ${r.services} service packages, ${r.openJobs} open jobs, ${r.quotes} pending quotes, ${r.bookings} bookings
Bookings by stage: ${Object.entries(r.counts).map(([k, v]) => `${k} ${v}`).join(', ')}

Log in to the app with any demo account (password: ${PASSWORD}):
  Client   ${r.people.zanele.email}   (Khayelitsha: open jobs with quotes, a booking to confirm)
  Client   ${r.people.riaan.email}   (Bellville: a dispute and a gate-motor job)
  Handyman ${r.people.sipho.email}   (verified plumber with reviews and bookings)
  Handyman ${r.people.bongani.email}   (pending ID verification, in a dispute)
Phone numbers work too, e.g. 0699000101 (Zanele) and 0699000001 (Sipho).
`);
  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
