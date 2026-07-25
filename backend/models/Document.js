const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['readme', 'whitepaper', 'roadmap', 'pitch'],
      required: true,
    },
    title: String,
    content: { type: String, required: true },
    version: { type: Number, default: 1 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Document', documentSchema);
