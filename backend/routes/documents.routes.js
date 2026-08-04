const express = require('express');
const Document = require('../models/Document');
const { protect, requireProfileComplete } = require('../middleware/auth.middleware');
const { loadProject } = require('../middleware/project.middleware');
const { generateText } = require('../utils/gemini');
const { documentationPrompt } = require('../utils/prompts');
const { logActivity } = require('../utils/activity');
const logger = require('../utils/logger');

const router = express.Router({ mergeParams: true });
router.use(protect, requireProfileComplete, loadProject);

const ALLOWED_TYPES = ['readme', 'whitepaper', 'roadmap', 'pitch'];

router.get('/', async (req, res) => {
  try {
    const docs = await Document.find({ project: req.project._id }).sort({ type: 1, version: -1 });
    res.status(200).json({ status: 'success', documents: docs });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Could not load documents.' });
  }
});

router.post('/generate', async (req, res) => {
  try {
    const { type = 'readme' } = req.body;
    if (!ALLOWED_TYPES.includes(type)) {
      return res.status(400).json({ status: 'error', message: 'Invalid document type.' });
    }

    const prompt = documentationPrompt(req.project, type);
    const { text } = await generateText(prompt);

    const latest = await Document.findOne({ project: req.project._id, type }).sort({ version: -1 });
    const version = latest ? latest.version + 1 : 1;

    const doc = await Document.create({
      project: req.project._id,
      user: req.user._id,
      type,
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} — ${req.project.name}`,
      content: text,
      version,
    });

    await logActivity(req.project._id, req.user._id, 'document_generated', `${type} v${version}`);
    logger.info('document_generated', { projectId: req.project._id, type, version });

    res.status(201).json({ status: 'success', document: doc });
  } catch (err) {
    logger.error('document_generate_failed', { error: err.message });
    res.status(err.statusCode || 500).json({
      status: 'error',
      message: err.message || 'Could not generate document.',
      code: err.code,
    });
  }
});


router.patch('/:id', async (req, res) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, project: req.project._id });
    if (!doc) return res.status(404).json({ status: 'error', message: 'Document not found.' });
    if (req.body.content !== undefined) doc.content = req.body.content;
    if (req.body.title !== undefined) doc.title = req.body.title;
    await doc.save();
    await logActivity(req.project._id, req.user._id, 'document_edited', `${doc.type} v${doc.version} edited`);
    res.status(200).json({ status: 'success', document: doc });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Could not update document.' });
  }
});

module.exports = router;
