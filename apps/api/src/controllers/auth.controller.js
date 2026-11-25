const { USER_STATUS, ROLES, MODES } = require('@handyconnect/shared');
const { User, HandymanProfile } = require('../models');
const ApiError = require('../utils/ApiError');
const { issueTokens, verifyRefresh } = require('../utils/tokens');
const { normalizeZaPhone } = require('../utils/phone');
const { issueOtp, consumeOtp } = require('../services/otp.service');

function requirePhone(raw) {
  const phone = normalizeZaPhone(raw);
  if (!phone) throw ApiError.badRequest('Enter a valid South African mobile number');
  return phone;
}

function assertActive(user) {
  if (user.status !== USER_STATUS.ACTIVE) throw ApiError.forbidden(`Account ${user.status}`);
}

// Put the user on the side of the platform they chose on the start screen.
// Every account can hire; choosing "handyman" adds the handyman role and an empty profile to fill in.
async function enterMode(user, mode) {
  if (!mode || user.roles.includes(ROLES.ADMIN)) return;
  if (mode === MODES.HANDYMAN) {
    if (!user.roles.includes(ROLES.HANDYMAN)) user.roles.push(ROLES.HANDYMAN);
    await HandymanProfile.updateOne({ user: user._id }, { $setOnInsert: { user: user._id } }, { upsert: true });
  } else if (!user.roles.includes(ROLES.CLIENT)) {
    user.roles.push(ROLES.CLIENT);
  }
  user.activeMode = mode;
}

exports.register = async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  const phone = requirePhone(req.body.phone);

  if (await User.exists({ phone })) throw ApiError.conflict('An account with this phone number already exists');
  if (email && (await User.exists({ email: email.toLowerCase() }))) {
    throw ApiError.conflict('An account with this email already exists');
  }

  const user = new User({ firstName, lastName, email: email || undefined, phone, password });
  await enterMode(user, req.body.mode || MODES.CLIENT);
  await user.save();
  const otp = await issueOtp(phone);

  res.status(201).json({ success: true, user: user.toPublic(), ...issueTokens(user), ...otp });
};

exports.login = async (req, res) => {
  const { identifier, password } = req.body;
  const phone = normalizeZaPhone(identifier);
  const query = phone ? { phone } : { email: String(identifier).toLowerCase() };

  const user = await User.findOne(query).select('+password');
  if (!user || !(await user.comparePassword(password))) throw ApiError.unauthorized('Incorrect login details');
  assertActive(user);

  await enterMode(user, req.body.mode);
  user.lastLoginAt = new Date();
  await user.save();
  res.json({ success: true, user: user.toPublic(), ...issueTokens(user) });
};

exports.sendOtp = async (req, res) => {
  const phone = requirePhone(req.body.phone);
  const purpose = req.body.purpose || 'verify_phone';
  // Don't reveal whether an account exists; only send if it does.
  const exists = await User.exists({ phone });
  const otp = exists ? await issueOtp(phone, purpose) : {};
  res.json({ success: true, message: 'If the number is registered, a code has been sent', ...otp });
};

exports.verifyOtp = async (req, res) => {
  const phone = requirePhone(req.body.phone);
  await consumeOtp(phone, req.body.code, 'verify_phone');
  const user = await User.findOneAndUpdate({ phone }, { phoneVerified: true }, { new: true });
  if (!user) throw ApiError.notFound('Account not found');
  res.json({ success: true, user: user.toPublic() });
};

exports.resetPassword = async (req, res) => {
  const phone = requirePhone(req.body.phone);
  await consumeOtp(phone, req.body.code, 'reset_password');
  const user = await User.findOne({ phone });
  if (!user) throw ApiError.notFound('Account not found');
  user.password = req.body.password;
  user.phoneVerified = true;
  user.tokenVersion += 1; // log out other sessions
  await user.save();
  res.json({ success: true, message: 'Password updated' });
};

exports.refresh = async (req, res) => {
  let payload;
  try {
    payload = verifyRefresh(req.body.refreshToken);
  } catch {
    throw ApiError.unauthorized('Refresh token invalid or expired');
  }
  const user = await User.findById(payload.sub);
  if (!user || user.tokenVersion !== payload.v) throw ApiError.unauthorized('Session expired');
  assertActive(user);
  res.json({ success: true, ...issueTokens(user) });
};

exports.logout = async (req, res) => {
  const { pushToken } = req.body || {};
  const update = { $inc: { tokenVersion: 1 } };
  if (pushToken) update.$pull = { pushTokens: pushToken };
  await User.updateOne({ _id: req.user._id }, update);
  res.json({ success: true });
};

exports.me = async (req, res) => {
  res.json({ success: true, user: req.user.toPublic() });
};
