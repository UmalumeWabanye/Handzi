const mongoose = require('mongoose');
const { PAYMENT_STATUS, CURRENCY } = require('@handyconnect/shared');

const { ObjectId } = mongoose.Schema.Types;

const paymentSchema = new mongoose.Schema(
  {
    booking: { type: ObjectId, ref: 'Booking', required: true, index: true },
    client: { type: ObjectId, ref: 'User', required: true },
    handyman: { type: ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    commissionAmount: { type: Number, required: true },
    payoutAmount: { type: Number, required: true },
    currency: { type: String, default: CURRENCY },
    status: { type: String, enum: Object.values(PAYMENT_STATUS), default: PAYMENT_STATUS.PENDING, index: true },
    paystackReference: { type: String, unique: true, sparse: true },
    paystackTransferCode: String,
    refundAmount: Number,
    heldAt: Date,
    releasedAt: Date,
    refundedAt: Date,
    history: [{ status: String, at: { type: Date, default: Date.now }, note: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
