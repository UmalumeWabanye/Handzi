const { AuditLog } = require('../models');

/** Record an admin action. Never throws: auditing must not break the action itself. */
async function audit(req, action, targetType, targetId, meta = {}) {
  try {
    await AuditLog.create({ actor: req.user._id, action, targetType, targetId, meta, ip: req.ip });
  } catch (err) {
    console.warn('[audit] failed:', err.message);
  }
}

module.exports = { audit };
