const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      select: false,
    },
    name: {
      type: String,
      trim: true,
    },
    authProvider: {
      type: String,
      enum: ['local', 'google', 'both'],
      default: 'local',
    },
    googleId: {
      type: String,
      sparse: true,
    },
    isProfileComplete: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    /** Account recovery — always stored UPPERCASE */
    securityQuestion: {
      type: String,
      trim: true,
    },
    securityAnswerHash: {
      type: String,
      select: false,
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.compareSecurityAnswer = async function (candidate) {
  if (!this.securityAnswerHash) return false;
  const normalized = String(candidate || '')
    .trim()
    .toUpperCase();
  return bcrypt.compare(normalized, this.securityAnswerHash);
};

module.exports = mongoose.model('User', userSchema);
