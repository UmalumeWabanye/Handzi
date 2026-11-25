const request = require('supertest');
const createApp = require('../src/app');
const { Booking, Payment, Notification, HandymanProfile, Job } = require('../src/models');
const { seedCategories } = require('../src/seeds');
const { autoConfirmDue } = require('../src/services/booking.service');
const { startDb, clearDb, stopDb } = require('./helpers');

const app = createApp();
const { api, client, handyman, postJob, quote } = require('./fixtures')(app);

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

/** Client posts, handyman quotes R2 000, client accepts → booking awaiting payment. */
async function hired() {
  const c = await client();
  const h = await handyman();
  const job = (await postJob(c)).body.job;
  const q = (await quote(h, job._id, { amount: 2000 })).body.quote;
  const accepted = await request(app).post(`${api}/quotes/${q._id}/accept`).set(c.auth);
  return { c, h, job, bookingId: accepted.body.booking._id };
}

const act = (who, bookingId, action, body = {}) => request(app).post(`${api}/bookings/${bookingId}/${action}`).set(who.auth).send(body);

beforeAll(startDb);
beforeEach(seedCategories);
afterEach(clearDb);
afterAll(stopDb);

describe('bookings with mock payments', () => {
  test('full happy path: pay → start → complete → confirm → payout released → reviews', async () => {
    const { c, h, job, bookingId } = await hired();

    expect((await request(app).get(`${api}/jobs/${job._id}`).set(c.auth)).body.job.bookingId).toBe(bookingId);
    expect((await request(app).get(`${api}/jobs/${job._id}`).set(h.auth)).body.job.bookingId).toBe(bookingId);

    // Before payment the handyman can't see the exact address.
    const before = await request(app).get(`${api}/bookings/${bookingId}`).set(h.auth);
    expect(before.body.booking.status).toBe('awaiting_payment');
    expect(before.body.booking.address).toBeUndefined();
    expect(before.body.booking.handymanPayout).toBe(1800);

    expect((await act(h, bookingId, 'pay')).status).toBe(403); // only the client pays
    expect((await act(h, bookingId, 'start')).status).toBe(409); // not paid yet

    const declined = await act(c, bookingId, 'pay', { simulate: 'decline' });
    expect(declined.status).toBe(402);
    const paid = await act(c, bookingId, 'pay');
    expect(paid.status).toBe(200);
    expect(paid.body.booking.status).toBe('funded');
    expect(paid.body.booking.payment.status).toBe('held');
    expect(paid.body.booking.payment.reference).toMatch(/^MOCK-/);
    expect((await act(c, bookingId, 'pay')).status).toBe(409); // no double charge

    const hView = await request(app).get(`${api}/bookings/${bookingId}`).set(h.auth);
    expect(hView.body.booking.address).toBe('12 Secret Street');

    expect((await act(c, bookingId, 'start')).status).toBe(403);
    expect((await act(h, bookingId, 'start')).body.booking.status).toBe('in_progress');
    expect((await Job.findById(job._id)).status).toBe('in_progress');
    const done = await act(h, bookingId, 'complete');
    expect(done.body.booking.status).toBe('completed');
    expect(new Date(done.body.booking.timeline.autoConfirmAt) > new Date()).toBe(true);

    expect((await act(c, bookingId, 'review', { rating: 5 })).status).toBe(409); // not confirmed yet
    const confirmed = await act(c, bookingId, 'confirm');
    expect(confirmed.body.booking.status).toBe('confirmed');
    expect(confirmed.body.booking.payment.status).toBe('released');
    expect(confirmed.body.booking.canReview).toBe(true);
    expect((await Job.findById(job._id)).status).toBe('closed');

    const earnings = await request(app).get(`${api}/bookings/earnings`).set(h.auth);
    expect(earnings.body.totals).toMatchObject({ held: 0, released: 1800, jobs: 1 });

    expect((await act(c, bookingId, 'review', { rating: 6 })).status).toBe(400);
    expect((await act(c, bookingId, 'review', { rating: 5, text: 'Fixed it fast, very tidy.' })).status).toBe(200);
    expect((await act(c, bookingId, 'review', { rating: 4 })).status).toBe(409);
    await act(h, bookingId, 'review', { rating: 4, text: 'Friendly client' });

    const profile = await HandymanProfile.findOne({ user: h.userId });
    expect(profile.stats).toMatchObject({ averageRating: 5, reviewCount: 1, jobsCompleted: 1 });
    const reviews = await request(app).get(`${api}/handymen/${h.userId}/reviews`).set(c.auth);
    expect(reviews.body.reviews).toHaveLength(1); // only client → handyman reviews are public
    expect(reviews.body.reviews[0].reviewer.firstName).toBe('Lerato');

    await eventually(async () => {
      const types = (await Notification.find({ user: h.userId })).map((n) => n.type);
      expect(types).toEqual(expect.arrayContaining(['booking_paid', 'payment_released', 'review_received']));
    });
    await eventually(async () => {
      const types = (await Notification.find({ user: c.userId })).map((n) => n.type);
      expect(types).toEqual(expect.arrayContaining(['job_started', 'job_completed', 'review_received']));
    });
  });

  test('cancelling a paid booking refunds the client', async () => {
    const { c, h, bookingId } = await hired();
    await act(c, bookingId, 'pay');
    const cancelled = await act(h, bookingId, 'cancel', { reason: 'Family emergency' });
    expect(cancelled.body.booking.status).toBe('cancelled');
    expect(cancelled.body.booking.payment.status).toBe('refunded');
    expect((await act(c, bookingId, 'pay')).status).toBe(409);
  });

  test('a dispute freezes the payout; auto-confirm skips it', async () => {
    const { c, h, bookingId } = await hired();
    await act(c, bookingId, 'pay');
    await act(h, bookingId, 'start');
    await act(h, bookingId, 'complete');
    expect((await act(c, bookingId, 'dispute', { reason: 'short' })).status).toBe(400);
    const disputed = await act(c, bookingId, 'dispute', { reason: 'The geyser is still leaking after the repair.' });
    expect(disputed.body.booking.status).toBe('disputed');
    expect(disputed.body.booking.payment.status).toBe('disputed');
    expect(disputed.body.booking.dispute.status).toBe('open');

    await Booking.updateOne({ _id: bookingId }, { autoConfirmAt: new Date(Date.now() - 1000) });
    expect(await autoConfirmDue()).toBe(0);
    expect((await act(c, bookingId, 'confirm')).status).toBe(409);
  });

  test('completed jobs are auto-confirmed after the window', async () => {
    const { c, h, bookingId } = await hired();
    await act(c, bookingId, 'pay');
    await act(h, bookingId, 'start');
    await act(h, bookingId, 'complete');
    expect(await autoConfirmDue()).toBe(0); // window not passed
    await Booking.updateOne({ _id: bookingId }, { autoConfirmAt: new Date(Date.now() - 1000) });
    expect(await autoConfirmDue()).toBe(1);
    expect((await Payment.findOne({ booking: bookingId })).status).toBe('released');
  });

  test('lists by role and hides bookings from outsiders', async () => {
    const { c, h, bookingId } = await hired();
    const outsider = await client('Nosy');
    expect((await request(app).get(`${api}/bookings?role=client`).set(c.auth)).body.bookings).toHaveLength(1);
    expect((await request(app).get(`${api}/bookings?role=handyman`).set(c.auth)).body.bookings).toHaveLength(0);
    const hl = await request(app).get(`${api}/bookings?role=handyman`).set(h.auth);
    expect(hl.body.bookings[0].other.firstName).toBe('Lerato');
    expect((await request(app).get(`${api}/bookings/${bookingId}`).set(outsider.auth)).status).toBe(404);
    expect((await act(outsider, bookingId, 'pay')).status).toBe(404);
  });
});
