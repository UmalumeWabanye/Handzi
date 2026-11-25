const mongoose = require('mongoose');
const { REPORT_TARGET, REPORT_STATUS } = require('@handyconnect/shared');

const { ObjectId } = mongoose.Schema.Types;

const reportSchema = new mongoose.Schema(
  {
    reporter: { type: ObjectId, ref: 'User', required: true },
    targetType: { type: String, enum: Object.values(REPORT_TARGET), required: true },
    targetId: { type: ObjectId, required: true },
    reason: { type: String, required: true, maxlength: 1000 },
    status: { type: String, enum: Object.values(REPORT_STATUS), default: REPORT_STATUS.OPEN, index: true },
    handledBy: { type: ObjectId, ref: 'User' },
    handledAt: Date,
    note: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Report', reportSchema);
