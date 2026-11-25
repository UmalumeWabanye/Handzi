const request = require('supertest');
const createApp = require('../src/app');
const { User, HandymanProfile, AuditLog, Notification, Payment, Booking } = require('../src/models');
const { seedCategories } = require('../src/seeds');
const { startDb, clearDb, stopDb } = require('./helpers');

const app = createApp();
const { api, client, handyman, postJob, quote } = require('./fixtures')(app);

async function admin() {
  await User.create({ firstName: 'Ada', lastName: 'Admin', email: 'ada@hc.test', phone: '+27600000001', phoneVerified: true, password: 'AdminPass1!', roles: ['admin'] });
  const res = await request(app).post(`${api}/auth/login`).send({ identifier: 'ada@hc.test', password: 'AdminPass1!' });
  return { auth: { Authorization: `Bearer ${res.body.accessToken}` }, userId: res.body.user.id };
}

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

/** A booking that has been paid, worked on and disputed by the client. */
async function disputed() {
  const c = await client();
  const h = await handyman();
  const job = (await postJob(c)).body.job;
  const q = (await quote(h, job._id, { amount: 2000 })).body.quote;
  const bookingId = (await request(app).post(`${api}/quotes/${q._id}/accept`).set(c.auth)).body.booking._id;
  const act = (who, a, body = {}) => request(app).post(`${api}/bookings/${bookingId}/${a}`).set(who.auth).send(body);
  await act(c, 'pay');
  await act(h, 'start');
  await act(h, 'complete');
  await act(c, 'dispute', { reason: 'The leak came back the same evening.' });
  return { c, h, bookingId };
}

beforeAll(startDb);
beforeEach(seedCategories);
afterEach(clearDb);
afterAll(stopDb);

describe('admin access', () => {
  test('non-admins are refused everywhere', async () => {
    const c = await client();
    const h = await handyman();
    for (const path of ['/admin/stats', '/admin/users', '/admin/verifications', '/admin/disputes', '/admin/audit']) {
      expect((await request(app).get(`${api}${path}`).set(c.auth)).status).toBe(403);
      expect((await request(app).get(`${api}${path}`).set(h.auth)).status).toBe(403);
      expect((await request(app).get(`${api}${path}`)).status).toBe(401);
    }
  });

  test('admins can read private ID documents', async () => {
    const a = await admin();
    const h = await handyman({ verified: false });
    const p = await HandymanProfile.findOne({ user: h.userId });
    expect((await request(app).get(p.verification.idDocumentUrl).set(a.auth)).status).toBe(200);
  });
});

describe('admin actions', () => {
  test('overview stats and queues', async () => {
    const a = await admin();
    await handyman({ verified: false });
    const c = await client();
    await postJob(c);
    const stats = await request(app).get(`${api}/admin/stats?days=7`).set(a.auth);
    expect(stats.status).toBe(200);
    expect(stats.body.totals).toMatchObject({ pendingVerifications: 1, openJobs: 1 });
    expect(stats.body.series.signups).toHaveLength(7);
    expect(stats.body.series.signups.reduce((n, d) => n + d.value, 0)).toBeGreaterThanOrEqual(3);
    const queues = await request(app).get(`${api}/admin/queues`).set(a.auth);
    expect(queues.body.verifications).toBe(1);
  });

  test('verification queue: approve and reject notify the handyman and are audited', async () => {
    const a = await admin();
    const h1 = await handyman({ name: 'Approve', verified: false });
    const h2 = await handyman({ name: 'Reject', verified: false });

    const queue = await request(app).get(`${api}/admin/verifications`).set(a.auth);
    expect(queue.body.items.map((i) => i.user.firstName).sort()).toEqual(['Approve', 'Reject']);
    expect(queue.body.items[0].verification.idDocumentUrl).toMatch(/private/);

    await request(app).post(`${api}/admin/verifications/${h1.userId}/approve`).set(a.auth);
    expect((await request(app).post(`${api}/admin/verifications/${h2.userId}/reject`).set(a.auth).send({ reason: 'x' })).status).toBe(400);
    await request(app).post(`${api}/admin/verifications/${h2.userId}/reject`).set(a.auth).send({ reason: 'ID photo is blurry' });

    expect((await HandymanProfile.findOne({ user: h1.userId })).verification.status).toBe('verified');
    const rejected = await HandymanProfile.findOne({ user: h2.userId });
    expect(rejected.verification).toMatchObject({ status: 'rejected', rejectionReason: 'ID photo is blurry' });
    await eventually(async () => expect(await Notification.exists({ user: h1.userId, type: 'verification_approved' })).toBeTruthy());

    // The approved handyman can now quote.
    const c = await client();
    const job = (await postJob(c)).body.job;
    expect((await quote(h1, job._id)).status).toBe(201);

    const log = await request(app).get(`${api}/admin/audit`).set(a.auth);
    expect(log.body.entries.map((e) => e.action)).toEqual(expect.arrayContaining(['verification.approve', 'verification.reject']));
    expect(log.body.entries[0].actor.firstName).toBe('Ada');
  });

  test('suspending a user signs them out and blocks the API; reinstating restores access', async () => {
    const a = await admin();
    const c = await client();
    const found = await request(app).get(`${api}/admin/users?q=lerato&role=client`).set(a.auth);
    expect(found.body.users).toHaveLength(1);
    const detail = await request(app).get(`${api}/admin/users/${c.userId}`).set(a.auth);
    expect(detail.body.user.password).toBeUndefined();

    await request(app).post(`${api}/admin/users/${c.userId}/status`).set(a.auth).send({ status: 'suspended', reason: 'Spam' });
    expect((await request(app).get(`${api}/auth/me`).set(c.auth)).status).toBe(403);
    await request(app).post(`${api}/admin/users/${c.userId}/status`).set(a.auth).send({ status: 'active' });
    expect((await request(app).get(`${api}/auth/me`).set(c.auth)).status).toBe(200);

    expect((await request(app).post(`${api}/admin/users/${a.userId}/status`).set(a.auth).send({ status: 'banned' })).status).toBe(400);
  });

  test('removing a job hides it from handymen', async () => {
    const a = await admin();
    const c = await client();
    const h = await handyman();
    const job = (await postJob(c)).body.job;
    await request(app).post(`${api}/admin/jobs/${job._id}/removal`).set(a.auth).send({ removed: true, reason: 'Not a home repair' });
    expect((await request(app).get(`${api}/jobs/feed`).set(h.auth)).body.jobs).toHaveLength(0);
    expect((await request(app).get(`${api}/jobs/${job._id}`).set(h.auth)).status).toBe(404);
    const removed = await request(app).get(`${api}/admin/jobs?status=removed`).set(a.auth);
    expect(removed.body.jobs).toHaveLength(1);
  });

  test('reports: list with target details, hide the message, close the report', async () => {
    const a = await admin();
    const c = await client();
    const h = await handyman();
    const job = (await postJob(c)).body.job;
    const conv = (await request(app).post(`${api}/conversations`).set(h.auth).send({ jobId: job._id })).body.conversation;
    const msg = (await request(app).post(`${api}/conversations/${conv._id}/messages`).set(h.auth).send({ text: 'Pay me cash on 0825551234' })).body.message;
    await request(app).post(`${api}/reports`).set(c.auth).send({ targetType: 'message', targetId: msg._id, reason: 'Asking for cash' });

    const list = await request(app).get(`${api}/admin/reports`).set(a.auth);
    expect(list.body.reports[0].target).toMatchObject({ label: 'Pay me cash on 0825551234', status: 'visible' });

    await request(app).post(`${api}/admin/messages/${msg._id}/hidden`).set(a.auth).send({ hidden: true });
    const thread = await request(app).get(`${api}/conversations/${conv._id}/messages`).set(c.auth);
    expect(thread.body.messages).toHaveLength(0);
    await request(app).post(`${api}/admin/reports/${list.body.reports[0]._id}`).set(a.auth).send({ status: 'actioned', note: 'Message hidden, warned user' });
    expect((await request(app).get(`${api}/admin/reports`).set(a.auth)).body.reports).toHaveLength(0);
  });

  test('categories and settings', async () => {
    const a = await admin();
    const created = await request(app).post(`${api}/admin/categories`).set(a.auth).send({ name: 'Pool Repairs', icon: 'water', subcategories: ['Pumps'] });
    expect(created.body.category.slug).toBe('pool-repairs');
    await request(app).patch(`${api}/admin/categories/${created.body.category._id}`).set(a.auth).send({ active: false });
    const pub = await request(app).get(`${api}/categories`);
    expect(pub.body.categories.find((c) => c.slug === 'pool-repairs')).toBeUndefined();

    expect((await request(app).patch(`${api}/admin/settings`).set(a.auth).send({ commissionPercent: 80 })).status).toBe(400);
    await request(app).patch(`${api}/admin/settings`).set(a.auth).send({ commissionPercent: 12.5, autoConfirmHours: 48 });
    const s = await request(app).get(`${api}/settings/public`);
    expect(s.body.settings).toMatchObject({ commissionPercent: 12.5, autoConfirmHours: 48 });
  });
});

describe('disputes', () => {
  test('admin sees the booking, payment and chat, then splits the money', async () => {
    const a = await admin();
    const { c, h, bookingId } = await disputed();
    const list = await request(app).get(`${api}/admin/disputes`).set(a.auth);
    expect(list.body.disputes).toHaveLength(1);
    const id = list.body.disputes[0]._id;

    const detail = await request(app).get(`${api}/admin/disputes/${id}`).set(a.auth);
    expect(detail.body.payment.status).toBe('disputed');
    expect(detail.body.booking.client.firstName).toBe('Lerato');

    await request(app).post(`${api}/admin/disputes/${id}/notes`).set(a.auth).send({ text: 'Called both parties' });
    expect((await request(app).post(`${api}/admin/disputes/${id}/resolve`).set(a.auth).send({ outcome: 'split', refundAmount: 5000 })).status).toBe(400);
    const resolved = await request(app).post(`${api}/admin/disputes/${id}/resolve`).set(a.auth).send({ outcome: 'split', refundAmount: 500, note: 'Partial fix' });
    expect(resolved.status).toBe(200);
    // R2000 paid: R500 back to client; R1500 kept, less 10% fee → R1350 to handyman.
    expect(resolved.body.payment).toMatchObject({ status: 'released', refundAmount: 500, payoutAmount: 1350, commissionAmount: 150 });
    expect(resolved.body.booking.status).toBe('confirmed');
    expect((await request(app).post(`${api}/admin/disputes/${id}/resolve`).set(a.auth).send({ outcome: 'refund' })).status).toBe(409);

    const earnings = await request(app).get(`${api}/bookings/earnings`).set(h.auth);
    expect(earnings.body.totals.released).toBe(1350);
    await eventually(async () => expect(await Notification.exists({ user: c.userId, type: 'dispute_resolved' })).toBeTruthy());
    expect(await AuditLog.exists({ action: 'dispute.resolve' })).toBeTruthy();
    expect((await Booking.findById(bookingId)).status).toBe('confirmed');
  });

  test('full refund cancels the booking', async () => {
    const a = await admin();
    const { bookingId } = await disputed();
    const id = (await request(app).get(`${api}/admin/disputes`).set(a.auth)).body.disputes[0]._id;
    await request(app).post(`${api}/admin/disputes/${id}/resolve`).set(a.auth).send({ outcome: 'refund' });
    expect((await Payment.findOne({ booking: bookingId })).status).toBe('refunded');
    expect((await Booking.findById(bookingId)).status).toBe('cancelled');
  });
});
