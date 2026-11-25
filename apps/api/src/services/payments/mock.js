const crypto = require('crypto');

const ref = (prefix) => `${prefix}-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;

/**
 * Pretend payment provider for the MVP. Mirrors the shape a real provider (Paystack) will implement:
 * charge → hold funds, refund → return to client, payout → transfer to the handyman.
 * Nothing here moves real money.
 */
module.exports = {
  name: 'mock',
  async charge({ amount, simulate }) {
    await new Promise((r) => setTimeout(r, process.env.NODE_ENV === 'test' ? 0 : 600)); // feels like a real round-trip
    if (simulate === 'decline') return { ok: false, reference: ref('MOCK'), message: 'Card declined (test)' };
    return { ok: true, reference: ref('MOCK'), amount };
  },
  async refund({ reference, amount }) {
    return { ok: true, reference: ref('MOCK-RFD'), original: reference, amount };
  },
  async payout({ amount }) {
    return { ok: true, transferCode: ref('MOCK-TRF'), amount };
  },
};
