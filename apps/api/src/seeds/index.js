// Seeds categories, platform settings and an admin user. Safe to re-run (upserts).
require('dotenv').config();
const mongoose = require('mongoose');
const { DEFAULT_CATEGORIES, ROLES } = require('@handyconnect/shared');
const connectDB = require('../config/database');
const { Category, Setting, User } = require('../models');

async function seedCategories() {
  await Promise.all(
    DEFAULT_CATEGORIES.map((c, i) =>
      Category.updateOne({ slug: c.slug }, { $set: { ...c, sortOrder: i, active: true } }, { upsert: true })
    )
  );
  if (process.env.NODE_ENV !== 'test') console.log(`Categories: ${DEFAULT_CATEGORIES.length}`);
}

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return console.log('Admin: skipped (ADMIN_EMAIL/ADMIN_PASSWORD not set)');
  if (await User.exists({ email })) return console.log(`Admin: exists (${email})`);
  await User.create({
    firstName: 'Platform',
    lastName: 'Admin',
    email,
    phone: '+27600000000',
    phoneVerified: true,
    password,
    roles: [ROLES.ADMIN],
  });
  console.log(`Admin: created (${email})`);
}

async function run() {
  await connectDB();
  await seedCategories();
  await Setting.get();
  await seedAdmin();
  await mongoose.disconnect();
}

if (require.main === module) {
  run().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { seedCategories, seedAdmin };
