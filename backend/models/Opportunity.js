const mongoose = require('mongoose');

/**
 * Cached opportunity data from official sources only.
 * Never fabricated.
 */
const opportunitySchema = new mongoose.Schema(
  {
    externalId: { type: String, required: true, index: true },
    source: {
      type: String,
      enum: ['zero_authority_dao', 'stacks'],
      required: true,
    },
    type: {
      type: String,
      enum: [
        'grant',
        'bounty',
        'hackathon',
        'builder_program',
        'campaign',
        'challenge',
        'incentive',
        'funding',
        'other',
      ],
      default: 'other',
    },
    title: { type: String, required: true },
    description: String,
    organizer: String,
    eligibility: String,
    deadline: Date,
    amount: String,
    url: String,
    skills: [String],
    raw: mongoose.Schema.Types.Mixed,
    lastSyncedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

opportunitySchema.index({ source: 1, externalId: 1 }, { unique: true });

module.exports = mongoose.model('Opportunity', opportunitySchema);
