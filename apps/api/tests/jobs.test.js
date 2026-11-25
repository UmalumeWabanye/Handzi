const request = require('supertest');
const createApp = require('../src/app');
const { Category, HandymanProfile, Booking } = require('../src/models');
const { seedCategories } = require('../src/seeds');
const { startDb, clearDb, stopDb } = require('./helpers');

const app = createApp();
const api = '/api/v1';
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');

// Johannesburg CBD and nearby / far points ([lng, lat])
const JHB = [28.0473, -26.2041];
const SOWETO = [27.8546, -26.2485]; // ~20 km from JHB
const CAPE_TOWN = [18.4241, -33.9249];

let seq = 0;
async function signUp(mode, firstName) {
  seq += 1;
  const phone = `07200000${String(seq).padStart(2, '0')}`;
  const reg = await request(app).post(`${api}/auth/register`).send({ firstName, lastName: 'Test', phone, password: 'secret123', mode });
  await request(app).post(`${api}/auth/otp/verify`).send({ phone, code: reg.body.devCode });
  return { userId: reg.body.user.id, auth: { Authorization: `Bearer ${reg.body.accessToken}` } };
}

async function client(name = 'Lerato', at = JHB) {
  const c = await signUp('client', name);
  await request(app).post(`${api}/users/me/onboarding/client`).set(c.auth).send({ location: { type: 'Point', coordinates: at, suburb: 'Braamfontein', city: 'Johannesburg', address: '12 Secret Street' } });
  return c;
}

/** A published handyman based at `at`, optionally verified. */
async function handyman({ name = 'Sipho', at = SOWETO, slug = 'plumbing', radius = 30, verified = true } = {}) {
  const h = await signUp('handyman', name);
  const trade = await Category.findOne({ slug });
  const up = (kind) => request(app).post(`${api}/uploads`).set(h.auth).field('kind', kind).attach('file', PNG, { filename: 'a.png', contentType: 'image/png' });
  await request(app).patch(`${api}/users/me`).set(h.auth).send({ avatar: (await up('avatar')).body.url });
  await request(app).patch(`${api}/handymen/me`).set(h.auth).send({
    headline: `${slug} specialist`,
    bio: 'I have been doing this kind of work for many years across the whole of Gauteng.',
    trades: [trade._id.toString()],
    hourlyRate: 300,
    serviceRadiusKm: radius,
    serviceArea: { type: 'Point', coordinates: at, suburb: 'Orlando', city: 'Soweto' },
  });
  await request(app).post(`${api}/handymen/me/work-history`).set(h.auth).send({ title: 'Tradesman', startDate: '2015-01-01', current: true });
  await request(app).post(`${api}/handymen/me/portfolio`).set(h.auth).send({ title: 'A job', photos: [(await up('portfolio')).body.url] });
  await request(app).post(`${api}/handymen/me/verification`).set(h.auth).send({ idDocumentUrl: (await up('id_document')).body.url, selfieUrl: (await up('selfie')).body.url });
  const done = await request(app).post(`${api}/handymen/me/complete-onboarding`).set(h.auth);
  expect(done.status).toBe(200);
  if (verified) await HandymanProfile.updateOne({ user: h.userId }, { 'verification.status': 'verified' });
  return h;
}

async function postJob(c, overrides = {}) {
  const plumbing = await Category.findOne({ slug: 'plumbing' });
  return request(app)
    .post(`${api}/jobs`)
    .set(c.auth)
    .send({
      category: plumbing._id.toString(),
      subcategory: 'Geysers',
      title: 'Geyser is leaking through the ceiling',
      description: 'Water is dripping from the ceiling below the geyser since last night. Need it fixed asap.',
      urgency: 'urgent',
      budget: { min: 1500, max: 4000 },
      ...overrides,
    });
}

const quote = (h, jobId, body = {}) =>
  request(app)
    .post(`${api}/jobs/${jobId}/quotes`)
    .set(h.auth)
    .send({ amount: 2800, message: 'I can replace the valve and fix the drip tray today.', estimatedDuration: '1 day', ...body });

beforeAll(startDb);
beforeEach(seedCategories);
afterEach(clearDb);
afterAll(stopDb);

describe('posting jobs', () => {
  test('validates input and defaults the location to the client home', async () => {
    const c = await client();
    const bad = await postJob(c, { description: 'too short' });
    expect(bad.status).toBe(400);
    const badBudget = await postJob(c, { budget: { min: 5000, max: 100 } });
    expect(badBudget.status).toBe(400);
    const past = await postJob(c, { preferredDate: '2020-01-01' });
    expect(past.status).toBe(400);

    const ok = await postJob(c);
    expect(ok.status).toBe(201);
    expect(ok.body.job.location.coordinates).toEqual(JHB);
    expect(ok.body.job.status).toBe('open');

    const mine = await request(app).get(`${api}/jobs/mine`).set(c.auth);
    expect(mine.body.jobs).toHaveLength(1);
  });
});

describe('job feed for handymen', () => {
  test('shows open jobs in my trades within my radius, without the exact address', async () => {
    const c = await client();
    const near = await handyman({ name: 'Near' });
    const far = await handyman({ name: 'Far', at: CAPE_TOWN });
    const sparky = await handyman({ name: 'Sparky', slug: 'electrical' });
    const job = (await postJob(c)).body.job;

    const feed = await request(app).get(`${api}/jobs/feed`).set(near.auth);
    expect(feed.status).toBe(200);
    expect(feed.body.jobs).toHaveLength(1);
    const j = feed.body.jobs[0];
    expect(j.distanceKm).toBeGreaterThan(10);
    expect(j.place.city).toBe('Johannesburg');
    expect(JSON.stringify(j)).not.toMatch(/Secret Street|coordinates/);
    expect(j.client.firstName).toBe('Lerato');
    expect(j.client.lastName).toBeUndefined();

    expect((await request(app).get(`${api}/jobs/feed`).set(far.auth)).body.jobs).toHaveLength(0);
    expect((await request(app).get(`${api}/jobs/feed`).set(sparky.auth)).body.jobs).toHaveLength(0);
    expect((await request(app).get(`${api}/jobs/feed?scope=all`).set(sparky.auth)).body.jobs).toHaveLength(1);

    const detail = await request(app).get(`${api}/jobs/${job._id}`).set(near.auth);
    expect(detail.status).toBe(200);
    expect(detail.body.job.isOwner).toBe(false);
    expect(JSON.stringify(detail.body.job)).not.toMatch(/Secret Street/);
  });

  test('clients cannot use the handyman feed', async () => {
    const c = await client();
    expect((await request(app).get(`${api}/jobs/feed`).set(c.auth)).status).toBe(403);
  });
});

describe('quotes', () => {
  test('only verified, published handymen can quote; one quote per job; not on own job', async () => {
    const c = await client();
    const job = (await postJob(c)).body.job;
    const unverified = await handyman({ name: 'Pending', verified: false });
    expect((await quote(unverified, job._id)).status).toBe(403);

    const h = await handyman();
    expect((await quote(h, job._id, { amount: 10 })).status).toBe(400);
    expect((await quote(h, job._id, { message: 'hi' })).status).toBe(400);
    const first = await quote(h, job._id);
    expect(first.status).toBe(201);
    expect((await quote(h, job._id)).status).toBe(409);

    // a handyman who is also a client can't quote their own job
    await request(app).post(`${api}/users/me/mode`).set(h.auth).send({ mode: 'client' });
    await request(app).post(`${api}/users/me/onboarding/client`).set(h.auth).send({ location: { type: 'Point', coordinates: SOWETO } });
    const own = (await postJob(h)).body.job;
    expect((await quote(h, own._id)).status).toBe(403);
  });

  test('handyman can edit and withdraw a pending quote, then quote again', async () => {
    const c = await client();
    const job = (await postJob(c)).body.job;
    const h = await handyman();
    const q = (await quote(h, job._id)).body.quote;

    const edited = await request(app).patch(`${api}/quotes/${q._id}`).set(h.auth).send({ amount: 2500 });
    expect(edited.body.quote.amount).toBe(2500);

    await request(app).post(`${api}/quotes/${q._id}/withdraw`).set(h.auth);
    let detail = await request(app).get(`${api}/jobs/${job._id}`).set(c.auth);
    expect(detail.body.job.quoteCount).toBe(0);

    expect((await quote(h, job._id, { amount: 2600 })).status).toBe(201);
    detail = await request(app).get(`${api}/jobs/${job._id}`).set(c.auth);
    expect(detail.body.job.quoteCount).toBe(1);

    const mine = await request(app).get(`${api}/quotes/mine`).set(h.auth);
    expect(mine.body.quotes[0].job.title).toMatch(/Geyser/);
  });

  test('client compares quotes and accepts one: job assigned, others declined, booking created', async () => {
    const c = await client();
    const job = (await postJob(c)).body.job;
    const a = await handyman({ name: 'Anele' });
    const b = await handyman({ name: 'Bongani' });
    const qa = (await quote(a, job._id, { amount: 3200 })).body.quote;
    const qb = (await quote(b, job._id, { amount: 2700 })).body.quote;

    const other = await client('Nosy');
    expect((await request(app).get(`${api}/jobs/${job._id}/quotes`).set(other.auth)).status).toBe(403);

    const list = await request(app).get(`${api}/jobs/${job._id}/quotes`).set(c.auth);
    expect(list.body.quotes.map((q) => q.amount)).toEqual([2700, 3200]); // cheapest first
    expect(list.body.quotes[0].handyman.firstName).toBe('Bongani');
    expect(list.body.quotes[0].handyman.verified).toBe(true);

    expect((await request(app).post(`${api}/quotes/${qb._id}/accept`).set(a.auth)).status).toBe(403);
    const accepted = await request(app).post(`${api}/quotes/${qb._id}/accept`).set(c.auth);
    expect(accepted.status).toBe(200);
    expect(accepted.body.job.status).toBe('assigned');
    expect(accepted.body.booking.amount).toBe(2700);
    expect(accepted.body.booking.commissionAmount).toBe(270);
    expect(accepted.body.booking.handymanPayout).toBe(2430);
    expect(await Booking.countDocuments()).toBe(1);

    expect((await request(app).post(`${api}/quotes/${qa._id}/accept`).set(c.auth)).status).toBe(409);
    const after = await request(app).get(`${api}/jobs/${job._id}/quotes`).set(c.auth);
    expect(after.body.quotes.map((q) => q.status)).toEqual(['accepted', 'rejected']);

    // Hired handyman now sees the exact address; the job is gone from feeds.
    const hired = await request(app).get(`${api}/jobs/${job._id}`).set(b.auth);
    expect(hired.body.job.address).toBe('12 Secret Street');
    expect((await request(app).get(`${api}/jobs/feed`).set(a.auth)).body.jobs).toHaveLength(0);
    expect((await quote(await handyman({ name: 'Late' }), job._id)).status).toBe(409);
  });

  test('client can decline a quote and cancel a job', async () => {
    const c = await client();
    const job = (await postJob(c)).body.job;
    const h = await handyman();
    const q = (await quote(h, job._id)).body.quote;
    expect((await request(app).post(`${api}/quotes/${q._id}/decline`).set(c.auth)).body.quote.status).toBe('rejected');

    const cancelled = await request(app).post(`${api}/jobs/${job._id}/cancel`).set(c.auth);
    expect(cancelled.body.job.status).toBe('cancelled');
    expect((await request(app).get(`${api}/jobs/feed`).set(h.auth)).body.jobs).toHaveLength(0);
  });

  test('public settings expose the service fee', async () => {
    const c = await client();
    const res = await request(app).get(`${api}/settings/public`).set(c.auth);
    expect(res.body.settings.commissionPercent).toBe(10);
  });
});
