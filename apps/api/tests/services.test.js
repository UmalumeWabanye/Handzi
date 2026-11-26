const request = require('supertest');
const createApp = require('../src/app');
const { Category, HandymanProfile, Notification } = require('../src/models');
const { seedCategories } = require('../src/seeds');
const { startDb, clearDb, stopDb } = require('./helpers');

const app = createApp();
const { api, client, handyman, JHB, SOWETO, CAPE_TOWN } = require('./fixtures')(app);

const SANDTON = [28.0567, -26.1076]; // ~15 km from JHB CBD

async function eventually(check, timeoutMs = 4000) {
  const start = Date.now();
  for (;;) {
    try {
      return await check();
    } catch (err) {
      if (Date.now() - start > timeoutMs) throw err;
      await new Promise((r) => setTimeout(r, 50));
    }
  }
}

async function service(h, overrides = {}) {
  const plumbing = await Category.findOne({ slug: 'plumbing' });
  return request(app)
    .post(`${api}/services`)
    .set(h.auth)
    .send({
      category: plumbing._id.toString(),
      subcategory: 'Geysers',
      title: 'Geyser replacement',
      description: 'Remove the old geyser and fit a new one with drip tray, valves and a COC.',
      pricingType: 'fixed',
      tiers: [
        { name: 'Basic', price: 4500, description: '100 L geyser, labour included' },
        { name: 'Standard', price: 6200, description: '150 L geyser with new valves' },
      ],
      ...overrides,
    });
}

const search = (who, params = {}) => request(app).get(`${api}/services/search`).query(params).set(who.auth);

beforeAll(startDb);
beforeEach(seedCategories);
afterEach(clearDb);
afterAll(stopDb);

describe('handyman service packages', () => {
  test('create, list, edit, pause and delete my services', async () => {
    const h = await handyman();
    expect((await service(h, { tiers: [] })).status).toBe(400); // fixed price needs a package
    expect((await service(h, { title: 'Hi' })).status).toBe(400);
    expect((await service(h, { pricingType: 'hourly', tiers: [{ name: 'Per hour', price: 350 }] })).status).toBe(400); // hourly needs hours

    const created = await service(h);
    expect(created.status).toBe(201);
    const id = created.body.service._id;
    expect(created.body.service.tiers).toHaveLength(2);

    const quoteOnly = await service(h, { title: 'Full bathroom renovation', pricingType: 'quote', tiers: [{ name: 'x', price: 100 }] });
    expect(quoteOnly.body.service.tiers).toHaveLength(0); // quote-priced services have no packages

    const mine = await request(app).get(`${api}/services/mine`).set(h.auth);
    expect(mine.body.services).toHaveLength(2);
    expect(mine.body.visible).toBe(true);

    const edited = await request(app).patch(`${api}/services/${id}`).set(h.auth).send({ title: 'Geyser replacement (any size)', active: false });
    expect(edited.body.service).toMatchObject({ title: 'Geyser replacement (any size)', active: false });

    const other = await handyman({ name: 'Other' });
    expect((await request(app).patch(`${api}/services/${id}`).set(other.auth).send({ title: 'Mine now' })).status).toBe(404);
    expect((await request(app).delete(`${api}/services/${id}`).set(h.auth)).status).toBe(200);
    expect((await request(app).get(`${api}/services/mine`).set(h.auth)).body.services).toHaveLength(1);
  });

  test('clients cannot create services', async () => {
    const c = await client();
    expect((await service(c)).status).toBe(403);
  });
});

describe('client service search', () => {
  test('finds services near the client home within the chosen range, nearest first', async () => {
    const c = await client(); // home: Johannesburg CBD
    const sandton = await handyman({ name: 'Sandton', at: SANDTON });
    const soweto = await handyman({ name: 'Soweto', at: SOWETO });
    const capeTown = await handyman({ name: 'Cape', at: CAPE_TOWN });
    for (const h of [sandton, soweto, capeTown]) await service(h);

    const r25 = await search(c, { radiusKm: 25 });
    expect(r25.status).toBe(200);
    expect(r25.body.services.map((s) => s.handyman.firstName)).toEqual(['Sandton', 'Soweto']); // nearest first, Cape Town excluded
    expect(r25.body.services[0].distanceKm).toBeGreaterThan(10);
    expect(r25.body.services[0].fromPrice).toBe(4500);

    const r10 = await search(c, { radiusKm: 10 });
    expect(r10.body.services).toHaveLength(0);

    // Searching around a different location
    const there = await search(c, { lat: CAPE_TOWN[1], lng: CAPE_TOWN[0], radiusKm: 10 });
    expect(there.body.services.map((s) => s.handyman.firstName)).toEqual(['Cape']);
  });

  test('matches service type text and trade, hides paused and unverified handymen', async () => {
    const c = await client();
    const plumber = await handyman({ name: 'Plumber', at: SANDTON });
    const sparky = await handyman({ name: 'Sparky', at: SANDTON, slug: 'electrical' });
    const pending = await handyman({ name: 'Pending', at: SANDTON, verified: false });
    const electrical = await Category.findOne({ slug: 'electrical' });
    await service(plumber);
    await service(sparky, { category: electrical._id.toString(), subcategory: 'COC certificates', title: 'Electrical COC for house sales', description: 'Full inspection and compliance certificate for your transfer.' });
    await service(pending, { title: 'Geyser service and check' });

    expect((await search(c, { q: 'geyser' })).body.services.map((s) => s.handyman.firstName)).toEqual(['Plumber']); // unverified hidden
    expect((await search(c, { q: 'house sale' })).body.services.map((s) => s.title)).toEqual(['Electrical COC for house sales']);
    expect((await search(c, { q: 'COC' })).body.services).toHaveLength(2); // also in the plumber's description
    expect((await search(c, { q: 'electrical' })).body.services).toHaveLength(1); // trade name matches
    expect((await search(c, { category: electrical._id.toString() })).body.services).toHaveLength(1);
    expect((await search(c, {})).body.services).toHaveLength(2);

    const id = (await search(c, { q: 'geyser' })).body.services[0]._id;
    await request(app).patch(`${api}/services/${id}`).set(plumber.auth).send({ active: false });
    expect((await search(c, { q: 'geyser' })).body.services).toHaveLength(0);
    expect((await request(app).get(`${api}/services/${id}`).set(c.auth)).status).toBe(404);
  });

  test('asks for a location when the client has none', async () => {
    const h = await handyman({ at: SANDTON });
    expect((await search(h, {})).status).toBe(400); // handyman account with no home location
    expect((await search(h, { lat: JHB[1], lng: JHB[0] })).status).toBe(200);
  });
});

describe('booking a service package', () => {
  test('creates a booking awaiting payment that runs through the normal flow', async () => {
    const c = await client();
    const h = await handyman({ at: SANDTON });
    const id = (await service(h)).body.service._id;

    const detail = await request(app).get(`${api}/services/${id}`).set(c.auth);
    expect(detail.body.service.bookable).toBe(true);
    expect(detail.body.service.distanceKm).toBeGreaterThan(10);
    const standard = detail.body.service.tiers.find((t) => t.name === 'Standard');

    expect((await request(app).post(`${api}/services/${id}/book`).set(c.auth).send({})).status).toBe(400);
    const booked = await request(app).post(`${api}/services/${id}/book`).set(c.auth).send({ tierId: standard._id, note: 'Gate code 1234' });
    expect(booked.status).toBe(201);
    expect(booked.body.booking).toMatchObject({ amount: 6200, title: 'Geyser replacement · Standard' });

    const bookingId = booked.body.booking._id;
    const view = await request(app).get(`${api}/bookings/${bookingId}`).set(c.auth);
    expect(view.body.booking).toMatchObject({ status: 'awaiting_payment', amount: 6200, handymanPayout: 5580 });
    expect((await request(app).post(`${api}/bookings/${bookingId}/pay`).set(c.auth)).body.booking.status).toBe('funded');

    // The client can message the handyman about it, like any hired job.
    const jobId = view.body.booking.job._id;
    expect((await request(app).post(`${api}/conversations`).set(c.auth).send({ jobId, userId: h.userId })).status).toBe(201);
    await eventually(async () => expect(await Notification.exists({ user: h.userId, type: 'service_booked' })).toBeTruthy());
  });

  test('cannot book quote-only services, own services, or handymen who lost verification', async () => {
    const c = await client();
    const h = await handyman({ at: SANDTON });
    const quoteOnly = (await service(h, { pricingType: 'quote', tiers: [] })).body.service._id;
    expect((await request(app).get(`${api}/services/${quoteOnly}`).set(c.auth)).body.service.bookable).toBe(false);
    expect((await request(app).post(`${api}/services/${quoteOnly}/book`).set(c.auth).send({ tierId: quoteOnly })).status).toBe(400);

    const svc = (await service(h)).body.service;
    expect((await request(app).post(`${api}/services/${svc._id}/book`).set(h.auth).send({ tierId: svc.tiers[0]._id })).status).toBe(403);

    await HandymanProfile.updateOne({ user: h.userId }, { 'verification.status': 'rejected' });
    expect((await request(app).post(`${api}/services/${svc._id}/book`).set(c.auth).send({ tierId: svc.tiers[0]._id })).status).toBe(409);
  });

  test('public profile lists a handyman’s active services', async () => {
    const c = await client();
    const h = await handyman({ at: SANDTON });
    await service(h);
    const paused = (await service(h, { title: 'Drain unblocking' })).body.service._id;
    await request(app).patch(`${api}/services/${paused}`).set(h.auth).send({ active: false });
    expect((await request(app).get(`${api}/services/by/${h.userId}`).set(c.auth)).body.services).toHaveLength(1);
    expect((await request(app).get(`${api}/services/by/${h.userId}`).set(h.auth)).body.services).toHaveLength(2); // owner sees paused too
  });
});
