const mongoose = require('mongoose');
const { QUOTE_STATUS } = require('@handyconnect/shared');

const { ObjectId } = mongoose.Schema.Types;

const quoteSchema = new mongoose.Schema(
  {
    job: { type: ObjectId, ref: 'Job', required: true, index: true },
    handyman: { type: ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true, min: 1 }, // ZAR
    message: { type: String, maxlength: 2000 },
    estimatedDuration: String, // e.g. "2 days"
    availableFrom: Date,
    status: { type: String, enum: Object.values(QUOTE_STATUS), default: QUOTE_STATUS.PENDING },
  },
  { timestamps: true }
);

quoteSchema.index({ job: 1, handyman: 1 }, { unique: true }); // one quote per handyman per job

module.exports = mongoose.model('Quote', quoteSchema);
