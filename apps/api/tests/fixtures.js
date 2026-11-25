const request = require('supertest');
const { Category, HandymanProfile } = require('../src/models');

const api = '/api/v1';
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');

/** Builders for realistic users, jobs and quotes. Bound to an app instance. */
module.exports = (app) => {
  // Johannesburg CBD and nearby / far points ([lng, lat])
  const JHB = [28.0473, -26.2041];
  const SOWETO = [27.8546, -26.2485]; // ~20 km from JHB
  const CAPE_TOWN = [18.4241, -33.9249];

  let seq = 0;
  async function signUp(mode, firstName) {
    seq += 1;
    const phone = `072${String(seq).padStart(7, '0')}`; // valid SA mobile format
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

  return { api, JHB, SOWETO, CAPE_TOWN, signUp, client, handyman, postJob, quote };
};
