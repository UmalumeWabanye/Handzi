const request = require('supertest');
const createApp = require('../src/app');
const { Notification } = require('../src/models');
const { seedCategories } = require('../src/seeds');
const { startDb, clearDb, stopDb } = require('./helpers');
const { containsContact } = require('../src/services/contact');

const app = createApp();
const { api, client, handyman, postJob, quote, CAPE_TOWN } = require('./fixtures')(app);

// Notifications are fire-and-forget: poll until the expected state lands (no fixed sleeps).
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

beforeAll(startDb);
beforeEach(seedCategories);
afterEach(clearDb);
afterAll(stopDb);

describe('notifications', () => {
  test('job posted → nearby handymen in that trade; quote → client; accept → hired + others not selected', async () => {
    const c = await client();
    const near = await handyman({ name: 'Near' });
    const other = await handyman({ name: 'Other' });
    const far = await handyman({ name: 'Far', at: CAPE_TOWN });
    const sparky = await handyman({ name: 'Sparky', slug: 'electrical' });

    const job = (await postJob(c)).body.job;
    const types = async (h) => (await Notification.find({ user: h.userId })).map((n) => n.type);
    await eventually(async () => expect(await types(near)).toEqual(['job_nearby']));
    expect(await types(far)).toEqual([]);
    expect(await types(sparky)).toEqual([]);

    const q1 = (await quote(near, job._id, { amount: 2000 })).body.quote;
    await quote(other, job._id, { amount: 2500 });
    const clientNotes = await eventually(async () => {
      const res = await request(app).get(`${api}/notifications`).set(c.auth);
      expect(res.body.unread).toBe(2);
      return res;
    });
    expect(clientNotes.body.notifications[0].type).toBe('quote_received');
    expect(clientNotes.body.notifications[0].data.jobId).toBe(job._id);
    expect(clientNotes.body.notifications[0].data.mode).toBe('client');

    await request(app).post(`${api}/quotes/${q1._id}/accept`).set(c.auth);
    await eventually(async () => {
      expect(await types(near)).toContain('quote_accepted');
      expect(await types(other)).toContain('quote_rejected');
    });

    const read = await request(app).post(`${api}/notifications/read`).set(c.auth).send({});
    expect(read.body.unread).toBe(0);
    // Users only ever see their own notifications.
    const nearList = await request(app).get(`${api}/notifications`).set(near.auth);
    expect(nearList.body.notifications.every((n) => n.user === near.userId)).toBe(true);
  });

  test('cancelling a job tells handymen with pending quotes', async () => {
    const c = await client();
    const h = await handyman();
    const job = (await postJob(c)).body.job;
    await quote(h, job._id);
    await request(app).post(`${api}/jobs/${job._id}/cancel`).set(c.auth);
    await eventually(async () => expect((await Notification.find({ user: h.userId, type: 'job_cancelled' })).length).toBe(1));
  });
});

describe('chat', () => {
  test('handyman can message a client about an open job; client can only message handymen who quoted', async () => {
    const c = await client();
    const h = await handyman();
    const stranger = await handyman({ name: 'Stranger' });
    const job = (await postJob(c)).body.job;

    // Handyman asks a question before quoting.
    const started = await request(app).post(`${api}/conversations`).set(h.auth).send({ jobId: job._id });
    expect(started.status).toBe(201);
    expect(started.body.conversation.other.firstName).toBe('Lerato');
    expect(started.body.conversation.role).toBe('handyman');
    const again = await request(app).post(`${api}/conversations`).set(h.auth).send({ jobId: job._id });
    expect(again.body.conversation._id).toBe(started.body.conversation._id); // same thread

    // Client can't open a chat with someone who hasn't quoted.
    expect((await request(app).post(`${api}/conversations`).set(c.auth).send({ jobId: job._id, userId: stranger.userId })).status).toBe(403);
    await quote(stranger, job._id);
    expect((await request(app).post(`${api}/conversations`).set(c.auth).send({ jobId: job._id, userId: stranger.userId })).status).toBe(201);
  });

  test('messages, unread counts, read receipts, paging and privacy', async () => {
    const c = await client();
    const h = await handyman();
    const outsider = await client('Outsider');
    const job = (await postJob(c)).body.job;
    const conv = (await request(app).post(`${api}/conversations`).set(h.auth).send({ jobId: job._id })).body.conversation;
    const url = `${api}/conversations/${conv._id}`;

    // Empty conversations don't show in the inbox.
    expect((await request(app).get(`${api}/conversations`).set(c.auth)).body.conversations).toHaveLength(0);

    expect((await request(app).post(`${url}/messages`).set(h.auth).send({})).status).toBe(400);
    const sent = await request(app).post(`${url}/messages`).set(h.auth).send({ text: 'Hi! Is the geyser on the roof or in the ceiling?', clientId: 'tmp-1' });
    expect(sent.status).toBe(201);
    expect(sent.body.message.clientId).toBe('tmp-1');
    await request(app).post(`${url}/messages`).set(h.auth).send({ text: 'Also, is there parking?' });

    const inbox = await request(app).get(`${api}/conversations?role=client`).set(c.auth);
    expect(inbox.body.conversations).toHaveLength(1);
    expect(inbox.body.conversations[0].unread).toBe(2);
    expect(inbox.body.conversations[0].lastMessage.text).toBe('Also, is there parking?');
    expect((await request(app).get(`${api}/conversations?role=handyman`).set(c.auth)).body.conversations).toHaveLength(0);
    expect((await request(app).get(`${api}/conversations/unread-count`).set(c.auth)).body.count).toBe(2);

    const page1 = await request(app).get(`${url}/messages?limit=1`).set(c.auth);
    expect(page1.body.messages[0].text).toBe('Also, is there parking?');
    expect(page1.body.hasMore).toBe(true);
    const page2 = await request(app).get(`${url}/messages?limit=1&before=${page1.body.messages[0].createdAt}`).set(c.auth);
    expect(page2.body.messages[0].text).toMatch(/geyser/);

    await request(app).post(`${url}/read`).set(c.auth);
    expect((await request(app).get(`${api}/conversations/unread-count`).set(c.auth)).body.count).toBe(0);
    const msgs = await request(app).get(`${url}/messages`).set(h.auth);
    expect(msgs.body.messages.every((m) => m.readBy.includes(c.userId))).toBe(true);

    expect((await request(app).get(`${url}/messages`).set(outsider.auth)).status).toBe(404);
    expect((await request(app).post(`${url}/messages`).set(outsider.auth).send({ text: 'hi' })).status).toBe(404);
  });

  test('sharing contact details is flagged; blocking stops messages', async () => {
    const c = await client();
    const h = await handyman();
    const job = (await postJob(c)).body.job;
    const conv = (await request(app).post(`${api}/conversations`).set(h.auth).send({ jobId: job._id })).body.conversation;
    const url = `${api}/conversations/${conv._id}`;

    const flagged = await request(app).post(`${url}/messages`).set(h.auth).send({ text: 'WhatsApp me on 082 555 1234, cheaper cash price' });
    expect(flagged.body.message.containsContact).toBe(true);

    const blocked = await request(app).post(`${url}/block`).set(c.auth);
    expect(blocked.body.conversation.blockedByMe).toBe(true);
    expect((await request(app).post(`${url}/messages`).set(h.auth).send({ text: 'hello?' })).status).toBe(403);
    await request(app).post(`${url}/unblock`).set(c.auth);
    expect((await request(app).post(`${url}/messages`).set(h.auth).send({ text: 'hello?' })).status).toBe(201);

    const report = await request(app).post(`${api}/reports`).set(c.auth).send({ targetType: 'message', targetId: flagged.body.message._id, reason: 'Asking for cash off-platform' });
    expect(report.status).toBe(201);
  });

  test('contact detection', () => {
    expect(containsContact('call me on 0825551234')).toBe(true);
    expect(containsContact('+27 82 555 1234')).toBe(true);
    expect(containsContact('mail me: sipho@gmail.com')).toBe(true);
    expect(containsContact('add me on whatsapp')).toBe(true);
    expect(containsContact('The geyser is 150 litres, about 8 years old')).toBe(false);
    expect(containsContact('I can come at 10:30 on the 12th')).toBe(false);
  });
});
