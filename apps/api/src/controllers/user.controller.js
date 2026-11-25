const { ROLES, MODES } = require('@handyconnect/shared');
const { HandymanProfile, User } = require('../models');
const ApiError = require('../utils/ApiError');
const { issueTokens } = require('../utils/tokens');

const EDITABLE = ['firstName', 'lastName', 'email', 'avatar', 'location', 'interests'];

exports.updateMe = async (req, res) => {
  for (const key of EDITABLE) {
    if (req.body[key] !== undefined) req.user[key] = req.body[key];
  }
  await req.user.save();
  res.json({ success: true, user: req.user.toPublic() });
};

exports.completeClientOnboarding = async (req, res) => {
  const { location, interests, avatar } = req.body;
  req.user.location = location;
  if (interests) req.user.interests = interests;
  if (avatar) req.user.avatar = avatar;
  req.user.set('onboarding.client', req.user.onboarding?.client || new Date());
  await req.user.save();
  res.json({ success: true, user: req.user.toPublic() });
};

exports.switchMode = async (req, res) => {
  const { mode } = req.body;
  if (mode === MODES.HANDYMAN && !req.user.roles.includes(ROLES.HANDYMAN)) {
    throw ApiError.forbidden('Set up your handyman profile first');
  }
  if (mode === MODES.CLIENT && !req.user.roles.includes(ROLES.CLIENT)) req.user.roles.push(ROLES.CLIENT);
  req.user.activeMode = mode;
  await req.user.save();
  // New tokens because the access token carries the active mode.
  res.json({ success: true, user: req.user.toPublic(), ...issueTokens(req.user) });
};

// Adds the handyman role and an empty profile; the app then runs handyman onboarding.
exports.becomeHandyman = async (req, res) => {
  const user = req.user;
  if (!user.phoneVerified) throw ApiError.forbidden('Verify your phone number first');

  await HandymanProfile.updateOne({ user: user._id }, { $setOnInsert: { user: user._id } }, { upsert: true });
  if (!user.roles.includes(ROLES.HANDYMAN)) user.roles.push(ROLES.HANDYMAN);
  user.activeMode = MODES.HANDYMAN;
  await user.save();

  res.status(201).json({ success: true, user: user.toPublic(), ...issueTokens(user) });
};

exports.registerPushToken = async (req, res) => {
  await User.updateOne({ _id: req.user._id }, { $addToSet: { pushTokens: req.body.token } });
  res.json({ success: true });
};
