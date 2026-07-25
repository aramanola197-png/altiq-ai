const mongoose = require('mongoose');

const researchReportSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    version: { type: Number, default: 1 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ResearchReport', researchReportSchema);
