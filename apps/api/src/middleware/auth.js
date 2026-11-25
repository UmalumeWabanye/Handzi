const { USER_STATUS } = require('@handyconnect/shared');
const ApiError = require('../utils/ApiError');
const { verifyAccess } = require('../utils/tokens');
const User = require('../models/User');

// Verifies the bearer token and loads the user (so bans/suspensions take effect immediately).
async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw ApiError.unauthorized();

    let payload;
    try {
      payload = verifyAccess(token);
    } catch {
      throw ApiError.unauthorized('Token is invalid or expired');
    }

    const user = await User.findById(payload.sub);
    if (!user) throw ApiError.unauthorized();
    if (user.status !== USER_STATUS.ACTIVE) throw ApiError.forbidden(`Account ${user.status}`);

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.some((r) => req.user.roles.includes(r))) {
    return next(ApiError.forbidden('Insufficient role'));
  }
  next();
};

module.exports = { protect, requireRole };
