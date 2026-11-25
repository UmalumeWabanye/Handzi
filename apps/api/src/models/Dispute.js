const mongoose = require('mongoose');
const { DISPUTE_STATUS, DISPUTE_RESOLUTION } = require('@handyconnect/shared');

const { ObjectId } = mongoose.Schema.Types;

const disputeSchema = new mongoose.Schema(
  {
    booking: { type: ObjectId, ref: 'Booking', required: true, unique: true },
    openedBy: { type: ObjectId, ref: 'User', required: true },
    reason: { type: String, required: true, maxlength: 3000 },
    evidence: { type: [String], default: [] },
    status: { type: String, enum: Object.values(DISPUTE_STATUS), default: DISPUTE_STATUS.OPEN, index: true },
    adminNotes: [{ by: { type: ObjectId, ref: 'User' }, text: String, at: { type: Date, default: Date.now } }],
    resolution: {
      outcome: { type: String, enum: Object.values(DISPUTE_RESOLUTION) },
      refundAmount: Number,
      resolvedBy: { type: ObjectId, ref: 'User' },
      resolvedAt: Date,
      note: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Dispute', disputeSchema);
