const mongoose = require('mongoose');

const builderProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    name: { type: String, required: true, trim: true },
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    country: { type: String, trim: true },
    timezone: { type: String },
    occupation: { type: String, trim: true },
    stacksExperience: {
      type: String,
      enum: ['none', 'beginner', 'intermediate', 'advanced', 'expert'],
      default: 'none',
    },
    skills: [{ type: String }],
    programmingLanguages: [{ type: String }],
    designSkills: [{ type: String }],
    writing: { type: Boolean, default: false },
    research: { type: Boolean, default: false },
    marketing: { type: Boolean, default: false },
    promptEngineering: { type: Boolean, default: false },
    portfolio: {
      github: String,
      website: String,
      xProfile: String,
    },
    walletType: {
      type: String,
      enum: ['', 'stacks', 'ethereum'],
      default: '',
    },
    walletAddress: { type: String, trim: true },
    projectInterests: [{ type: String }],
    goals: [{ type: String }],
    builderSummary: String,
    strengths: [String],
    weaknesses: [String],
    suggestedLearningPath: [String],
    recommendedProjectCategories: [String],
    bestGrantTypes: [String],
    bestBountyTypes: [String],
  },
  { timestamps: true }
);

module.exports = mongoose.model('BuilderProfile', builderProfileSchema);
