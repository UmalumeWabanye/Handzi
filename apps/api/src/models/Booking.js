const mongoose = require('mongoose');
const { BOOKING_STATUS } = require('@handyconnect/shared');
const pointSchema = require('./_point');

const { ObjectId } = mongoose.Schema.Types;

// The contract between client and handyman, created from an accepted quote or a listing booking.
const bookingSchema = new mongoose.Schema(
  {
    client: { type: ObjectId, ref: 'User', required: true, index: true },
    handyman: { type: ObjectId, ref: 'User', required: true, index: true },
    job: { type: ObjectId, ref: 'Job' },
    quote: { type: ObjectId, ref: 'Quote' },
    listing: { type: ObjectId, ref: 'ServiceListing' },
    listingTier: String,
    title: { type: String, required: true },
    amount: { type: Number, required: true, min: 1 }, // ZAR, what the client pays
    commissionPercent: { type: Number, required: true },
    commissionAmount: { type: Number, required: true },
    handymanPayout: { type: Number, required: true },
    location: pointSchema,
    scheduledFor: Date,
    status: { type: String, enum: Object.values(BOOKING_STATUS), default: BOOKING_STATUS.AWAITING_PAYMENT, index: true },
    startedAt: Date,
    completedAt: Date, // handyman marked done
    confirmedAt: Date, // client confirmed / auto-confirmed
    autoConfirmAt: Date,
    cancelledAt: Date,
    cancelReason: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);
