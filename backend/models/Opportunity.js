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
        'gig',
        'quest',
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
    // Derived at sync time from each resource's own status/expiry/date
    // fields (see deriveStatus() in ecosystem.js) — never guessed after
    // the fact, always recomputed from the source data on every sync.
    status: {
      type: String,
      enum: ['open', 'closed', 'unknown'],
      default: 'unknown',
    },
    raw: mongoose.Schema.Types.Mixed,
    lastSyncedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Real bug fixed here: the old index was {source, externalId} only.
// Zero Authority DAO's grant/bounty/gig/quest IDs are per-resource,
// not globally unique — so a grant with id "12" and a bounty with id
// "12" collided under the old key, and whichever type synced last
// silently overwrote every earlier record sharing that id, regardless
// of its real type. type is now part of the uniqueness key so records
// from different resource endpoints can never collide.
opportunitySchema.index({ source: 1, type: 1, externalId: 1 }, { unique: true });

module.exports = mongoose.model('Opportunity', opportunitySchema);
