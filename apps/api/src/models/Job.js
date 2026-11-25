const mongoose = require('mongoose');
const { JOB_STATUS, JOB_URGENCY } = require('@handyconnect/shared');
const pointSchema = require('./_point');

const { ObjectId } = mongoose.Schema.Types;

// Upwork-style job post that handymen send quotes on.
const jobSchema = new mongoose.Schema(
  {
    client: { type: ObjectId, ref: 'User', required: true, index: true },
    category: { type: ObjectId, ref: 'Category', required: true },
    subcategory: String,
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, maxlength: 4000 },
    photos: { type: [String], default: [] },
    location: { type: pointSchema, required: true },
    budget: { min: Number, max: Number },
    urgency: { type: String, enum: Object.values(JOB_URGENCY), default: JOB_URGENCY.FLEXIBLE },
    preferredDate: Date,
    status: { type: String, enum: Object.values(JOB_STATUS), default: JOB_STATUS.OPEN, index: true },
    quoteCount: { type: Number, default: 0 },
    assignedTo: { type: ObjectId, ref: 'User' },
    removedByAdmin: { type: Boolean, default: false },
    removalReason: String,
  },
  { timestamps: true }
);

jobSchema.index({ location: '2dsphere' });
jobSchema.index({ status: 1, category: 1, createdAt: -1 });

module.exports = mongoose.model('Job', jobSchema);
