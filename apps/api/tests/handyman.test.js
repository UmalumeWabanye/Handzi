const request = require('supertest');
const createApp = require('../src/app');
const { Category, HandymanProfile } = require('../src/models');
const { seedCategories } = require('../src/seeds');
const { startDb, clearDb, stopDb } = require('./helpers');

const app = createApp();
const api = '/api/v1';
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64'
);

let phoneSeq = 0;
async function signUp(mode = 'handyman', firstName = 'Sipho') {
  phoneSeq += 1;
  const phone = `08200000${String(phoneSeq).padStart(2, '0')}`;
  const reg = await request(app)
    .post(`${api}/auth/register`)
    .send({ firstName, lastName: 'Dlamini', phone, password: 'secret123', mode });
  await request(app).post(`${api}/auth/otp/verify`).send({ phone, code: reg.body.devCode });
  return { token: reg.body.accessToken, userId: reg.body.user.id, auth: { Authorization: `Bearer ${reg.body.accessToken}` } };
}

const uploadImage = (auth, kind) =>
  request(app).post(`${api}/uploads`).set(auth).field('kind', kind).attach('file', PNG, { filename: 'a.png', contentType: 'image/png' });

async function completeProfile(auth) {
  const plumbing = await Category.findOne({ slug: 'plumbing' });
  const avatar = await uploadImage(auth, 'avatar');
  await request(app).patch(`${api}/users/me`).set(auth).send({ avatar: avatar.body.url });
  await request(app)
    .patch(`${api}/handymen/me`)
    .set(auth)
    .send({
      headline: 'PIRB-registered plumber, Soweto',
      bio: 'I have been fixing geysers, burst pipes and blocked drains across Soweto for over ten years.',
      trades: [plumbing._id.toString()],
      skills: ['Geysers', 'Leak detection'],
      yearsExperience: 10,
      hourlyRate: 350,
      callOutFee: 250,
      serviceRadiusKm: 30,
      serviceArea: { type: 'Point', coordinates: [27.8546, -26.2485], suburb: 'Orlando', city: 'Soweto', province: 'Gauteng' },
    });
  await request(app)
    .post(`${api}/handymen/me/work-history`)
    .set(auth)
    .send({ title: 'Plumber', company: 'Self-employed', startDate: '2015-02-01', current: true });
  const photo = await uploadImage(auth, 'portfolio');
  await request(app)
    .post(`${api}/handymen/me/portfolio`)
    .set(auth)
    .send({ title: 'Geyser replacement', photos: [photo.body.url], category: plumbing._id.toString() });
  const id = await uploadImage(auth, 'id_document');
  const selfie = await uploadImage(auth, 'selfie');
  return request(app).post(`${api}/handymen/me/verification`).set(auth).send({ idDocumentUrl: id.body.url, selfieUrl: selfie.body.url });
}

beforeAll(startDb);
beforeEach(seedCategories);
afterEach(clearDb);
afterAll(stopDb);

describe('uploads', () => {
  test('public images are served; private ones only to the owner', async () => {
    const owner = await signUp();
    const other = await signUp('client', 'Lerato');

    const pub = await uploadImage(owner.auth, 'portfolio');
    expect(pub.status).toBe(201);
    expect(pub.body.url).toMatch(/^\/uploads\/portfolio-/);
    expect((await request(app).get(pub.body.url)).status).toBe(200);

    const priv = await uploadImage(owner.auth, 'id_document');
    expect(priv.body.url).toMatch(new RegExp(`^/api/v1/uploads/private/${owner.userId}-`));
    expect((await request(app).get(priv.body.url)).status).toBe(401);
    expect((await request(app).get(priv.body.url).set(other.auth)).status).toBe(404);
    expect((await request(app).get(priv.body.url).set(owner.auth)).status).toBe(200);
  });

  test('rejects non-images and unknown kinds', async () => {
    const { auth } = await signUp();
    const txt = await request(app).post(`${api}/uploads`).set(auth).field('kind', 'avatar').attach('file', Buffer.from('hi'), { filename: 'a.txt', contentType: 'text/plain' });
    expect(txt.status).toBe(400);
    const kind = await request(app).post(`${api}/uploads`).set(auth).field('kind', 'nope').attach('file', PNG, { filename: 'a.png', contentType: 'image/png' });
    expect(kind.status).toBe(400);
  });
});

describe('handyman profile', () => {
  test('checklist tracks progress; publishing is blocked until required sections are done', async () => {
    const { auth } = await signUp();
    const start = await request(app).get(`${api}/handymen/me`).set(auth);
    expect(start.status).toBe(200);
    expect(start.body.checklist.every((i) => !i.done)).toBe(true);

    const early = await request(app).post(`${api}/handymen/me/complete-onboarding`).set(auth);
    expect(early.status).toBe(400);

    const verified = await completeProfile(auth);
    expect(verified.status).toBe(200);
    expect(verified.body.profile.verification.status).toBe('pending');
    const required = verified.body.checklist.filter((i) => i.required);
    expect(required.every((i) => i.done)).toBe(true);

    const done = await request(app).post(`${api}/handymen/me/complete-onboarding`).set(auth);
    expect(done.status).toBe(200);
    expect(done.body.user.onboarded.handyman).toBe(true);
  });

  test('work history validates dates; entries can be edited and removed', async () => {
    const { auth } = await signUp();
    const bad = await request(app)
      .post(`${api}/handymen/me/work-history`)
      .set(auth)
      .send({ title: 'Apprentice', startDate: '2020-01-01', endDate: '2019-01-01' });
    expect(bad.status).toBe(400);

    const added = await request(app)
      .post(`${api}/handymen/me/work-history`)
      .set(auth)
      .send({ title: 'Apprentice', company: 'Joburg Plumbing', startDate: '2012-01-01', endDate: '2014-12-01', employmentType: 'apprenticeship' });
    expect(added.status).toBe(201);
    const itemId = added.body.profile.workHistory[0]._id;

    const edited = await request(app).patch(`${api}/handymen/me/work-history/${itemId}`).set(auth).send({ title: 'Plumbing apprentice' });
    expect(edited.body.profile.workHistory[0].title).toBe('Plumbing apprentice');

    const removed = await request(app).delete(`${api}/handymen/me/work-history/${itemId}`).set(auth);
    expect(removed.body.profile.workHistory).toHaveLength(0);
  });

  test("cannot attach someone else's private document", async () => {
    const a = await signUp();
    const b = await signUp('handyman', 'Bongani');
    const doc = await uploadImage(a.auth, 'id_document');
    const selfie = await uploadImage(a.auth, 'selfie');
    const res = await request(app).post(`${api}/handymen/me/verification`).set(b.auth).send({ idDocumentUrl: doc.body.url, selfieUrl: selfie.body.url });
    expect(res.status).toBe(400);
    const cert = await request(app).post(`${api}/handymen/me/certifications`).set(b.auth).send({ name: 'PIRB', documentUrl: doc.body.url });
    expect(cert.status).toBe(400);
  });

  test('clients only see published profiles, without private data', async () => {
    const handyman = await signUp();
    const client = await signUp('client', 'Lerato');

    const hidden = await request(app).get(`${api}/handymen/${handyman.userId}`).set(client.auth);
    expect(hidden.status).toBe(404);

    await completeProfile(handyman.auth);
    await request(app).post(`${api}/handymen/me/certifications`).set(handyman.auth).send({ name: 'PIRB Licensed Plumber', number: 'L123' });
    await request(app).post(`${api}/handymen/me/complete-onboarding`).set(handyman.auth);

    const res = await request(app).get(`${api}/handymen/${handyman.userId}`).set(client.auth);
    expect(res.status).toBe(200);
    const h = res.body.handyman;
    expect(h.headline).toMatch(/plumber/i);
    expect(h.workHistory).toHaveLength(1);
    expect(h.portfolio[0].photos).toHaveLength(1);
    expect(h.place).toEqual({ suburb: 'Orlando', city: 'Soweto', province: 'Gauteng' });
    const json = JSON.stringify(h);
    expect(json).not.toMatch(/idDocumentUrl|selfieUrl|coordinates|L123|payout/);

    const list = await request(app).get(`${api}/handymen?lat=-26.2041&lng=28.0473`).set(client.auth);
    expect(list.body.handymen).toHaveLength(1);
    expect(list.body.handymen[0].distanceKm).toBeGreaterThan(5);

    // clients can't edit a handyman profile
    expect((await request(app).get(`${api}/handymen/me`).set(client.auth)).status).toBe(403);
  });
});
