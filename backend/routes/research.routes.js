const express = require('express');
const ResearchReport = require('../models/ResearchReport');
const { protect, requireProfileComplete } = require('../middleware/auth.middleware');
const { loadProject } = require('../middleware/project.middleware');
const { generateText } = require('../utils/gemini');
const { researchPrompt } = require('../utils/prompts');
const { logActivity } = require('../utils/activity');
const logger = require('../utils/logger');

const router = express.Router({ mergeParams: true });
router.use(protect, requireProfileComplete, loadProject);

// Get latest research
router.get('/', async (req, res) => {
  try {
    const report = await ResearchReport.findOne({ project: req.project._id }).sort({ version: -1 });
    res.status(200).json({ status: 'success', report });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Could not load research.' });
  }
});

// Generate / regenerate research
router.post('/generate', async (req, res) => {
  try {
    const prompt = researchPrompt(req.project);
    const { text } = await generateText(prompt);

    const latest = await ResearchReport.findOne({ project: req.project._id }).sort({ version: -1 });
    const version = latest ? latest.version + 1 : 1;

    const report = await ResearchReport.create({
      project: req.project._id,
      user: req.user._id,
      content: text,
      version,
    });

    await logActivity(req.project._id, req.user._id, 'research_generated', `Research report v${version}`);
    logger.info('research_generated', { projectId: req.project._id, version });

    res.status(201).json({ status: 'success', report });
  } catch (err) {
    logger.error('research_generate_failed', { error: err.message });
    res.status(err.statusCode || 500).json({
      status: 'error',
      message: err.message || 'Could not generate research.',
      code: err.code,
    });
  }
});


// Update research content (edit)
router.patch('/:id', async (req, res) => {
  try {
    const report = await ResearchReport.findOne({ _id: req.params.id, project: req.project._id });
    if (!report) return res.status(404).json({ status: 'error', message: 'Report not found.' });
    if (req.body.content !== undefined) report.content = req.body.content;
    await report.save();
    await logActivity(req.project._id, req.user._id, 'research_edited', `Research v${report.version} edited`);
    res.status(200).json({ status: 'success', report });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Could not update research.' });
  }
});

module.exports = router;
