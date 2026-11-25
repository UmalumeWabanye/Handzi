const mongoose = require('mongoose');

const { ObjectId } = mongoose.Schema.Types;

const auditLogSchema = new mongoose.Schema(
  {
    actor: { type: ObjectId, ref: 'User', required: true },
    action: { type: String, required: true }, // e.g. user.suspend, verification.approve
    targetType: String,
    targetId: ObjectId,
    meta: { type: Object, default: {} },
    ip: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
