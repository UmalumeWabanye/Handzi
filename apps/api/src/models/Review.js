const mongoose = require('mongoose');
const { REVIEW_DIRECTION } = require('@handyconnect/shared');

const { ObjectId } = mongoose.Schema.Types;

const reviewSchema = new mongoose.Schema(
  {
    booking: { type: ObjectId, ref: 'Booking', required: true },
    reviewer: { type: ObjectId, ref: 'User', required: true },
    reviewee: { type: ObjectId, ref: 'User', required: true, index: true },
    direction: { type: String, enum: Object.values(REVIEW_DIRECTION), required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    text: { type: String, maxlength: 2000 },
    reply: { text: String, at: Date },
    hidden: { type: Boolean, default: false },
  },
  { timestamps: true }
);

reviewSchema.index({ booking: 1, reviewer: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
