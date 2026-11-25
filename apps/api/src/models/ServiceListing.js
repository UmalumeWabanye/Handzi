const mongoose = require('mongoose');
const { PRICING_TYPE } = require('@handyconnect/shared');

const { ObjectId } = mongoose.Schema.Types;

// Fiverr-style "gig": a pre-packaged service a client can book directly.
const listingSchema = new mongoose.Schema(
  {
    handyman: { type: ObjectId, ref: 'User', required: true, index: true },
    category: { type: ObjectId, ref: 'Category', required: true },
    subcategory: String,
    title: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, required: true, maxlength: 3000 },
    photos: { type: [String], default: [] },
    pricingType: { type: String, enum: Object.values(PRICING_TYPE), required: true },
    tiers: [
      {
        name: { type: String, required: true }, // e.g. Basic / Standard / Premium
        price: { type: Number, required: true, min: 0 },
        description: String,
        estimatedHours: Number,
      },
    ],
    active: { type: Boolean, default: true },
    removedByAdmin: { type: Boolean, default: false },
    removalReason: String,
  },
  { timestamps: true }
);

listingSchema.index({ category: 1, active: 1 });
listingSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('ServiceListing', listingSchema);
