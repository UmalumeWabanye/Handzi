const { isProd } = require('../config/env');

// SMS provider adapter. TODO: wire a South African provider (e.g. Clickatell / BulkSMS / Twilio) before production.
async function sendSms(to, body) {
  if (!isProd()) {
    if (process.env.NODE_ENV !== 'test') console.log(`[sms:dev] to=${to} :: ${body}`);
    return { delivered: false, dev: true };
  }
  throw new Error('SMS provider not configured');
}

module.exports = { sendSms };
