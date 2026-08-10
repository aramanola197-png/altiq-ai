const express = require('express');
const ChatMessage = require('../models/ChatMessage');
const { protect, requireProfileComplete } = require('../middleware/auth.middleware');
const { loadProject } = require('../middleware/project.middleware');
const { generateText } = require('../utils/gemini');
const { chatSystemPrompt } = require('../utils/prompts');
const { logActivity } = require('../utils/activity');
const config = require('../utils/config');
const logger = require('../utils/logger');

const router = express.Router({ mergeParams: true });
router.use(protect, requireProfileComplete, loadProject);

router.get('/', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || config.chatHistoryLimit, 200);
    const messages = await ChatMessage.find({ project: req.project._id })
      .sort({ createdAt: -1 })
      .limit(limit);
    res.status(200).json({ status: 'success', messages: messages.reverse() });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Could not load conversation.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { content, mode = 'general' } = req.body;
    if (!content || !String(content).trim()) {
      return res.status(400).json({ status: 'error', message: 'Message content is required.' });
    }

    const trimmed = String(content).trim().slice(0, 12000);

    const userMsg = await ChatMessage.create({
      project: req.project._id,
      user: req.user._id,
      role: 'user',
      content: trimmed,
      mode,
    });

    const systemContext = chatSystemPrompt(req.project, mode);
    const fullPrompt = `${systemContext}\n\nUser message:\n${trimmed}`;

    let assistantText = '';
    try {
      const result = await generateText(fullPrompt);
      assistantText = result.text;
    } catch (aiErr) {
      logger.error('chat_ai_failed', {
        error: aiErr.message,
        cause: aiErr.causeMessage,
        projectId: req.project._id,
      });
      return res.status(aiErr.statusCode || 503).json({
        status: 'error',
        message: aiErr.message || 'AI service is temporarily unavailable.',
        code: aiErr.code || 'AI_UNAVAILABLE',
        savedUserMessage: userMsg,
      });
    }

    const assistantMsg = await ChatMessage.create({
      project: req.project._id,
      user: req.user._id,
      role: 'assistant',
      content: assistantText,
      mode,
    });

    try {
      await logActivity(req.project._id, req.user._id, 'ai_chat', `AI conversation (${mode})`);
    } catch (logErr) {
      logger.warn('chat_activity_log_failed', { error: logErr.message });
    }

    res.status(200).json({
      status: 'success',
      messages: [userMsg, assistantMsg],
    });
  } catch (err) {
    logger.error('chat_failed', { error: err.message, stack: err.stack });
    res.status(500).json({
      status: 'error',
      message: err.message || 'Could not process message.',
    });
  }
});

module.exports = router;
