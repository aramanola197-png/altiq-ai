const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    problem: { type: String, trim: true, default: '' },
    targetAudience: { type: String, trim: true, default: '' },
    stacksIntegration: { type: String, trim: true, default: '' },
    zeroAuthorityIntegration: { type: String, trim: true, default: '' },
    expectedUsers: { type: String, trim: true, default: '' },
    monetization: { type: String, trim: true, default: '' },
    stage: {
      type: String,
      enum: ['idea', 'validation', 'building', 'launched', 'other'],
      default: 'idea',
    },
    existingBranding: { type: String, trim: true, default: '' },
    // AI-generated fields
    mission: String,
    vision: String,
    productSummary: String,
    suggestedLogoPrompt: String,
    suggestedBannerPrompt: String,
    // Health scores (filled by AI later)
    readiness: {
      ideaValidation: { type: Number, default: 0 },
      branding: { type: Number, default: 0 },
      documentation: { type: Number, default: 0 },
      marketResearch: { type: Number, default: 0 },
      fundingReadiness: { type: Number, default: 0 },
      overall: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', projectSchema);
