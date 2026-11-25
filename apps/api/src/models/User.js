const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES, MODES, USER_STATUS } = require('@handyconnect/shared');
const pointSchema = require('./_point');

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true, maxlength: 60 },
    lastName: { type: String, required: true, trim: true, maxlength: 60 },
    email: { type: String, trim: true, lowercase: true, unique: true, sparse: true },
    phone: { type: String, required: true, unique: true }, // E.164
    phoneVerified: { type: Boolean, default: false },
    password: { type: String, required: true, minlength: 8, select: false },
    roles: { type: [{ type: String, enum: Object.values(ROLES) }], default: [ROLES.CLIENT] },
    activeMode: { type: String, enum: Object.values(MODES), default: MODES.CLIENT },
    avatar: String,
    location: pointSchema,
    status: { type: String, enum: Object.values(USER_STATUS), default: USER_STATUS.ACTIVE },
    statusReason: String,
    pushTokens: { type: [String], default: [] },
    interests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    // When each side's onboarding was completed. Users can be onboarded as client, handyman or both.
    onboarding: { client: Date, handyman: Date },
    savedHandymen: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    tokenVersion: { type: Number, default: 0 },
    lastLoginAt: Date,
  },
  { timestamps: true }
);

userSchema.index({ location: '2dsphere' });
userSchema.index({ roles: 1, status: 1 });

userSchema.virtual('fullName').get(function fullName() {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toPublic = function toPublic() {
  return {
    id: this._id,
    firstName: this.firstName,
    lastName: this.lastName,
    email: this.email,
    phone: this.phone,
    phoneVerified: this.phoneVerified,
    roles: this.roles,
    activeMode: this.activeMode,
    avatar: this.avatar,
    location: this.location,
    interests: this.interests,
    onboarded: { client: !!this.onboarding?.client, handyman: !!this.onboarding?.handyman },
    status: this.status,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
