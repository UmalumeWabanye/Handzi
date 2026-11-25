const crypto = require('crypto');
const jwt = require('jsonwebtoken');

function signAccessToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), roles: user.roles, mode: user.activeMode },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '15m' }
  );
}

// Refresh tokens carry a version so they can be revoked (logout / password change / ban).
function signRefreshToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), v: user.tokenVersion },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
  );
}

function issueTokens(user) {
  return { accessToken: signAccessToken(user), refreshToken: signRefreshToken(user) };
}

const verifyAccess = (t) => jwt.verify(t, process.env.JWT_SECRET);
const verifyRefresh = (t) => jwt.verify(t, process.env.JWT_REFRESH_SECRET);

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const randomOtp = () => String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');

module.exports = { issueTokens, verifyAccess, verifyRefresh, sha256, randomOtp };
