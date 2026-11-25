const { Otp } = require('../models');
const ApiError = require('../utils/ApiError');
const { sha256, randomOtp } = require('../utils/tokens');
const { sendSms } = require('./sms');
const { isProd } = require('../config/env');

const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 30 * 1000;

async function issueOtp(phone, purpose = 'verify_phone') {
  const recent = await Otp.findOne({ phone, purpose }).sort({ createdAt: -1 });
  if (recent && Date.now() - recent.createdAt.getTime() < RESEND_COOLDOWN_MS) {
    throw new ApiError(429, 'Please wait before requesting another code');
  }

  const code = randomOtp();
  const ttl = Number(process.env.OTP_TTL_MINUTES || 10);
  await Otp.deleteMany({ phone, purpose });
  await Otp.create({ phone, purpose, codeHash: sha256(code), expiresAt: new Date(Date.now() + ttl * 60 * 1000) });
  await sendSms(phone, `Your Handzi code is ${code}. It expires in ${ttl} minutes.`);

  // Expose the code outside production so the app can be tested without an SMS provider.
  return isProd() ? {} : { devCode: code };
}

async function consumeOtp(phone, code, purpose = 'verify_phone') {
  const otp = await Otp.findOne({ phone, purpose }).sort({ createdAt: -1 });
  if (!otp || otp.expiresAt < new Date()) throw ApiError.badRequest('Code expired. Request a new one.');
  if (otp.attempts >= MAX_ATTEMPTS) throw new ApiError(429, 'Too many attempts. Request a new code.');

  if (otp.codeHash !== sha256(String(code))) {
    otp.attempts += 1;
    await otp.save();
    throw ApiError.badRequest('Incorrect code');
  }
  await otp.deleteOne();
}

module.exports = { issueOtp, consumeOtp };
