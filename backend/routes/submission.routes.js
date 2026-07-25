const express = require('express');
const Opportunity = require('../models/Opportunity');
const { protect, requireProfileComplete } = require('../middleware/auth.middleware');
const { loadProject } = require('../middleware/project.middleware');
const { generateText } = require('../utils/gemini');
const { projectContext } = require('../utils/prompts');
const { logActivity } = require('../utils/activity');
const logger = require('../utils/logger');

const router = express.Router({ mergeParams: true });
router.use(protect, requireProfileComplete, loadProject);

/**
 * Draft submission materials for a specific opportunity.
 * Always human-in-the-loop: returns editable drafts only.
 */
router.post('/draft', async (req, res) => {
  try {
    const { opportunityId } = req.body;
    if (!opportunityId) {
      return res.status(400).json({ status: 'error', message: 'opportunityId is required.' });
    }

    const opportunity = await Opportunity.findById(opportunityId);
    if (!opportunity) {
      return res.status(404).json({
        status: 'error',
        message: 'Opportunity not found in official cache. Sync opportunities first.',
      });
    }

    const prompt = `
You are ALTIQ AI Submission Assistant. Draft application materials for the opportunity below.
Human review is required before any real submission. No hype, no emojis.

${projectContext(req.project)}

Opportunity (official):
- Title: ${opportunity.title}
- Type: ${opportunity.type}
- Organizer: ${opportunity.organizer || 'N/A'}
- Description: ${opportunity.description || 'N/A'}
- Eligibility: ${opportunity.eligibility || 'N/A'}
- Deadline: ${opportunity.deadline || 'N/A'}

Produce structured drafts with these exact sections:
## Project Summary
## Value Proposition / Impact
## Technical Description
## Application Draft
## Roadmap / Future Vision
## Submission Checklist
`.trim();

    const { text } = await generateText(prompt);

    await logActivity(
      req.project._id,
      req.user._id,
      'submission_drafted',
      `Draft prepared for: ${opportunity.title}`
    );
    logger.info('submission_drafted', {
      projectId: req.project._id,
      opportunityId: opportunity._id,
    });

    res.status(200).json({
      status: 'success',
      opportunity: {
        id: opportunity._id,
        title: opportunity.title,
        type: opportunity.type,
        url: opportunity.url,
      },
      draft: text,
      note: 'Review and edit before any real submission. ALTIQ AI does not submit on your behalf.',
    });
  } catch (err) {
    logger.error('submission_draft_failed', { error: err.message });
    res.status(err.statusCode || 500).json({
      status: 'error',
      message: err.message || 'Could not prepare submission draft.',
      code: err.code,
    });
  }
});

module.exports = router;
