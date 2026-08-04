const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true,
    },
    content: { type: String, required: true },
    mode: {
      type: String,
      enum: [
        'general',
        'product_strategist',
        'market_researcher',
        'brand_strategist',
        'technical_architect',
        'documentation_writer',
        'grant_advisor',
        'bounty_advisor',
        'growth_advisor',
      ],
      default: 'general',
    },
    confidence: Number,
    reasoning: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
