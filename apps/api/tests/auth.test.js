const request = require('supertest');
require('../src/models');
const createApp = require('../src/app');
const { User, Category } = require('../src/models');
const { seedCategories } = require('../src/seeds');
const { startDb, clearDb, stopDb } = require('./helpers');

const app = createApp();
const api = '/api/v1';

const newUser = {
  firstName: 'Thandi',
  lastName: 'Mokoena',
  phone: '082 123 4567',
  email: 'thandi@example.com',
  password: 'secret123',
};

beforeAll(startDb);
afterEach(clearDb);
afterAll(stopDb);

async function registerAndVerify(data = newUser) {
  const reg = await request(app).post(`${api}/auth/register`).send(data);
  await request(app).post(`${api}/auth/otp/verify`).send({ phone: data.phone, code: reg.body.devCode });
  return reg.body;
}

describe('auth', () => {
  test('register normalises phone, hashes password, returns tokens and dev OTP', async () => {
    const res = await request(app).post(`${api}/auth/register`).send(newUser);
    expect(res.status).toBe(201);
    expect(res.body.user.phone).toBe('+27821234567');
    expect(res.body.user.roles).toEqual(['client']);
    expect(res.body.user.phoneVerified).toBe(false);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.devCode).toMatch(/^\d{6}$/);

    const stored = await User.findOne({ phone: '+27821234567' }).select('+password');
    expect(stored.password).not.toBe(newUser.password);
  });

  test('rejects invalid SA phone and duplicate accounts', async () => {
    const bad = await request(app).post(`${api}/auth/register`).send({ ...newUser, phone: '12345' });
    expect(bad.status).toBe(400);

    await request(app).post(`${api}/auth/register`).send(newUser);
    const dup = await request(app).post(`${api}/auth/register`).send({ ...newUser, phone: '+27821234567', email: 'x@y.com' });
    expect(dup.status).toBe(409);
  });

  test('OTP verifies the phone; wrong code is rejected', async () => {
    const reg = await request(app).post(`${api}/auth/register`).send(newUser);
    const wrong = await request(app).post(`${api}/auth/otp/verify`).send({ phone: newUser.phone, code: '000000' === reg.body.devCode ? '111111' : '000000' });
    expect(wrong.status).toBe(400);

    const ok = await request(app).post(`${api}/auth/otp/verify`).send({ phone: newUser.phone, code: reg.body.devCode });
    expect(ok.status).toBe(200);
    expect(ok.body.user.phoneVerified).toBe(true);
  });

  test('login by phone or email, refresh, logout revokes refresh token', async () => {
    await request(app).post(`${api}/auth/register`).send(newUser);

    const bad = await request(app).post(`${api}/auth/login`).send({ identifier: newUser.email, password: 'nope-nope' });
    expect(bad.status).toBe(401);

    const byEmail = await request(app).post(`${api}/auth/login`).send({ identifier: newUser.email, password: newUser.password });
    expect(byEmail.status).toBe(200);
    const byPhone = await request(app).post(`${api}/auth/login`).send({ identifier: '0821234567', password: newUser.password });
    expect(byPhone.status).toBe(200);

    const refreshed = await request(app).post(`${api}/auth/refresh`).send({ refreshToken: byPhone.body.refreshToken });
    expect(refreshed.status).toBe(200);

    await request(app).post(`${api}/auth/logout`).set('Authorization', `Bearer ${byPhone.body.accessToken}`).send();
    const revoked = await request(app).post(`${api}/auth/refresh`).send({ refreshToken: byPhone.body.refreshToken });
    expect(revoked.status).toBe(401);
  });

  test('suspended users cannot use the API', async () => {
    const { accessToken } = await registerAndVerify();
    await User.updateOne({ phone: '+27821234567' }, { status: 'suspended' });
    const res = await request(app).get(`${api}/auth/me`).set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(403);
  });
});

describe('modes and handyman onboarding', () => {
  test('cannot switch to handyman mode before onboarding; can after', async () => {
    await seedCategories();
    const plumbing = await Category.findOne({ slug: 'plumbing' });
    const { accessToken } = await registerAndVerify();
    const auth = { Authorization: `Bearer ${accessToken}` };

    const denied = await request(app).post(`${api}/users/me/mode`).set(auth).send({ mode: 'handyman' });
    expect(denied.status).toBe(403);

    const onboard = await request(app).post(`${api}/users/me/handyman`).set(auth).send({});
    expect(onboard.status).toBe(201);
    expect(onboard.body.user.roles).toEqual(expect.arrayContaining(['client', 'handyman']));
    expect(onboard.body.user.activeMode).toBe('handyman');
    expect(onboard.body.user.onboarded).toEqual({ client: false, handyman: false });

    const profile = await request(app)
      .patch(`${api}/handymen/me`)
      .set({ Authorization: `Bearer ${onboard.body.accessToken}` })
      .send({ trades: [plumbing._id.toString()] });
    expect(profile.status).toBe(200);
    expect(profile.body.profile.verification.status).toBe('none');

    const back = await request(app).post(`${api}/users/me/mode`).set(auth).send({ mode: 'client' });
    expect(back.status).toBe(200);
    expect(back.body.user.activeMode).toBe('client');
  });

  test('onboarding requires a verified phone', async () => {
    const reg = await request(app).post(`${api}/auth/register`).send(newUser);
    const res = await request(app).post(`${api}/users/me/handyman`).set('Authorization', `Bearer ${reg.body.accessToken}`).send({});
    expect(res.status).toBe(403);
  });
});

describe('choosing a side on the start screen', () => {
  test('registering as a handyman creates the role, mode and an empty profile', async () => {
    const res = await request(app).post(`${api}/auth/register`).send({ ...newUser, mode: 'handyman' });
    expect(res.status).toBe(201);
    expect(res.body.user.roles).toEqual(['client', 'handyman']);
    expect(res.body.user.activeMode).toBe('handyman');
  });

  test('logging in on a side switches to it; handyman side adds the role', async () => {
    await registerAndVerify();
    const asHandyman = await request(app)
      .post(`${api}/auth/login`)
      .send({ identifier: newUser.phone, password: newUser.password, mode: 'handyman' });
    expect(asHandyman.body.user.activeMode).toBe('handyman');
    expect(asHandyman.body.user.roles).toContain('handyman');

    const asClient = await request(app)
      .post(`${api}/auth/login`)
      .send({ identifier: newUser.phone, password: newUser.password, mode: 'client' });
    expect(asClient.body.user.activeMode).toBe('client');
  });

  test('client onboarding requires a location and marks the client side complete', async () => {
    const { accessToken } = await registerAndVerify();
    const auth = { Authorization: `Bearer ${accessToken}` };
    const missing = await request(app).post(`${api}/users/me/onboarding/client`).set(auth).send({});
    expect(missing.status).toBe(400);

    const ok = await request(app)
      .post(`${api}/users/me/onboarding/client`)
      .set(auth)
      .send({ location: { type: 'Point', coordinates: [28.0473, -26.2041], suburb: 'Braamfontein', city: 'Johannesburg' } });
    expect(ok.status).toBe(200);
    expect(ok.body.user.onboarded.client).toBe(true);
  });
});

describe('categories', () => {
  test('lists seeded categories in order', async () => {
    await seedCategories();
    const res = await request(app).get(`${api}/categories`);
    expect(res.status).toBe(200);
    expect(res.body.categories[0].slug).toBe('plumbing');
    expect(res.body.categories.length).toBeGreaterThanOrEqual(10);
  });
});
