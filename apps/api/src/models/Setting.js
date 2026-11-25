const mongoose = require('mongoose');
const { DEFAULT_COMMISSION_PERCENT, DEFAULT_AUTO_CONFIRM_HOURS } = require('@handyconnect/shared');

// Singleton platform settings, editable from the admin dashboard.
const settingSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'platform', unique: true },
    commissionPercent: { type: Number, default: DEFAULT_COMMISSION_PERCENT, min: 0, max: 50 },
    autoConfirmHours: { type: Number, default: DEFAULT_AUTO_CONFIRM_HOURS, min: 1 },
  },
  { timestamps: true }
);

settingSchema.statics.get = async function get() {
  return this.findOneAndUpdate({ key: 'platform' }, {}, { upsert: true, new: true, setDefaultsOnInsert: true });
};

module.exports = mongoose.model('Setting', settingSchema);
