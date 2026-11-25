// DEV ONLY: mark a handyman's ID as verified until the admin dashboard exists.
// Usage: npm run dev:verify -w apps/api -- 0821234567
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const { User, HandymanProfile } = require('../models');
const { normalizeZaPhone } = require('../utils/phone');

async function run() {
  if (process.env.NODE_ENV === 'production') throw new Error('Refusing to run in production');
  const phone = normalizeZaPhone(process.argv[2]);
  if (!phone) throw new Error('Pass the handyman\'s mobile number, e.g. 0821234567');
  await connectDB();
  const user = await User.findOne({ phone });
  if (!user) throw new Error(`No user with phone ${phone}`);
  const res = await HandymanProfile.updateOne(
    { user: user._id },
    { $set: { 'verification.status': 'verified', 'verification.reviewedAt': new Date(), 'verification.rejectionReason': null } }
  );
  console.log(res.matchedCount ? `Verified ${user.firstName} ${user.lastName} (${phone})` : 'That user has no handyman profile');
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
