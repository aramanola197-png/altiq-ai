const express = require('express');
const BrandAsset = require('../models/BrandAsset');
const Project = require('../models/Project');
const { protect, requireProfileComplete } = require('../middleware/auth.middleware');
const { loadProject } = require('../middleware/project.middleware');
const { generateText } = require('../utils/gemini');
const { brandPrompt } = require('../utils/prompts');
const { logActivity } = require('../utils/activity');
const logger = require('../utils/logger');

const router = express.Router({ mergeParams: true });
router.use(protect, requireProfileComplete, loadProject);

router.get('/', async (req, res) => {
  try {
    const asset = await BrandAsset.findOne({ project: req.project._id }).sort({ version: -1 });
    res.status(200).json({ status: 'success', asset });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Could not load brand assets.' });
  }
});

router.post('/generate', async (req, res) => {
  try {
    const prompt = brandPrompt(req.project);
    const { text } = await generateText(prompt);

    // Lightweight extraction of mission/vision if present
    const missionMatch = text.match(/## Mission\s*\n+([\s\S]*?)(?=\n## |$)/i);
    const visionMatch = text.match(/## Vision\s*\n+([\s\S]*?)(?=\n## |$)/i);
    const mission = missionMatch ? missionMatch[1].trim().slice(0, 500) : undefined;
    const vision = visionMatch ? visionMatch[1].trim().slice(0, 500) : undefined;

    const latest = await BrandAsset.findOne({ project: req.project._id }).sort({ version: -1 });
    const version = latest ? latest.version + 1 : 1;

    const asset = await BrandAsset.create({
      project: req.project._id,
      user: req.user._id,
      content: text,
      mission,
      vision,
      version,
    });

    // Cross-module sync: update project mission/vision when generated
    if (mission || vision) {
      if (mission) req.project.mission = mission;
      if (vision) req.project.vision = vision;
      await req.project.save();
    }

    await logActivity(req.project._id, req.user._id, 'brand_generated', `Brand guidance v${version}`);
    logger.info('brand_generated', { projectId: req.project._id, version });

    res.status(201).json({ status: 'success', asset });
  } catch (err) {
    logger.error('brand_generate_failed', { error: err.message });
    res.status(err.statusCode || 500).json({
      status: 'error',
      message: err.message || 'Could not generate brand guidance.',
      code: err.code,
    });
  }
});


router.patch('/:id', async (req, res) => {
  try {
    const asset = await BrandAsset.findOne({ _id: req.params.id, project: req.project._id });
    if (!asset) return res.status(404).json({ status: 'error', message: 'Brand asset not found.' });
    if (req.body.content !== undefined) asset.content = req.body.content;
    await asset.save();
    await logActivity(req.project._id, req.user._id, 'brand_edited', `Brand v${asset.version} edited`);
    res.status(200).json({ status: 'success', asset });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Could not update brand asset.' });
  }
});

module.exports = router;
