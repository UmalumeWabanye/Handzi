const mongoose = require('mongoose');
const { VERIFICATION_STATUS, EMPLOYMENT_TYPES, PORTFOLIO_MAX_PHOTOS } = require('@handyconnect/shared');
const pointSchema = require('./_point');

const { ObjectId } = mongoose.Schema.Types;

// LinkedIn-style experience entry.
const workHistorySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 100 }, // e.g. "Plumber", "Site foreman"
    company: { type: String, trim: true, maxlength: 100 }, // empty / "Self-employed"
    employmentType: { type: String, enum: Object.values(EMPLOYMENT_TYPES), default: EMPLOYMENT_TYPES.SELF_EMPLOYED },
    location: { type: String, trim: true, maxlength: 100 },
    startDate: { type: Date, required: true },
    endDate: Date,
    current: { type: Boolean, default: false },
    description: { type: String, maxlength: 1500 },
  },
  { timestamps: true }
);

workHistorySchema.pre('validate', function checkDates(next) {
  if (this.current) this.endDate = undefined;
  else if (!this.endDate) this.invalidate('endDate', 'End date is required unless this is your current role');
  else if (this.endDate < this.startDate) this.invalidate('endDate', 'End date must be after the start date');
  next();
});

// Proof of work: a completed project with photos.
const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, maxlength: 1500 },
    category: { type: ObjectId, ref: 'Category' },
    photos: {
      type: [String],
      validate: {
        validator: (v) => v.length >= 1 && v.length <= PORTFOLIO_MAX_PHOTOS,
        message: `Add between 1 and ${PORTFOLIO_MAX_PHOTOS} photos`,
      },
    },
    completedOn: Date,
    location: { type: String, trim: true, maxlength: 100 },
  },
  { timestamps: true }
);

const certificationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 }, // e.g. PIRB registration, Wireman's licence
    issuer: { type: String, trim: true, maxlength: 120 },
    number: { type: String, trim: true, maxlength: 60 },
    documentUrl: String, // private upload
    issuedAt: Date,
    expiresAt: Date,
    verified: { type: Boolean, default: false }, // set by admin only
  },
  { timestamps: true }
);

const handymanProfileSchema = new mongoose.Schema(
  {
    user: { type: ObjectId, ref: 'User', required: true, unique: true },
    headline: { type: String, trim: true, maxlength: 120 },
    bio: { type: String, maxlength: 2000 },
    trades: [{ type: ObjectId, ref: 'Category' }],
    skills: { type: [{ type: String, trim: true, maxlength: 40 }], validate: [(v) => v.length <= 30, 'Up to 30 skills'] },
    languages: { type: [{ type: String, trim: true, maxlength: 30 }], default: [] },
    yearsExperience: { type: Number, min: 0, max: 70, default: 0 },
    hourlyRate: { type: Number, min: 0 }, // ZAR
    callOutFee: { type: Number, min: 0 }, // ZAR
    serviceArea: pointSchema,
    serviceRadiusKm: { type: Number, min: 1, max: 200, default: 25 },
    workHistory: [workHistorySchema],
    portfolio: [projectSchema],
    certifications: [certificationSchema],
    endorsements: [
      {
        by: { type: ObjectId, ref: 'User', required: true },
        skill: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    verification: {
      status: { type: String, enum: Object.values(VERIFICATION_STATUS), default: VERIFICATION_STATUS.NONE },
      idDocumentUrl: String,
      selfieUrl: String,
      submittedAt: Date,
      reviewedAt: Date,
      reviewedBy: { type: ObjectId, ref: 'User' },
      rejectionReason: String,
    },
    stats: {
      averageRating: { type: Number, default: 0 },
      reviewCount: { type: Number, default: 0 },
      jobsCompleted: { type: Number, default: 0 },
      responseTimeMins: Number,
    },
    payout: {
      bankName: String,
      bankCode: String,
      accountNumberLast4: String,
      accountName: String,
      paystackRecipientCode: String,
    },
    available: { type: Boolean, default: true },
    onboardingCompletedAt: Date, // profile is published (visible to clients) once set
  },
  { timestamps: true }
);

handymanProfileSchema.index({ serviceArea: '2dsphere' });
handymanProfileSchema.index({ trades: 1, onboardingCompletedAt: 1, 'stats.averageRating': -1 });

module.exports = mongoose.model('HandymanProfile', handymanProfileSchema);
