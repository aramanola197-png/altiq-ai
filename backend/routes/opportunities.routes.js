const express = require('express');
const Opportunity = require('../models/Opportunity');
const Project = require('../models/Project');
const BuilderProfile = require('../models/BuilderProfile');
const { protect, requireProfileComplete } = require('../middleware/auth.middleware');
const { loadProject } = require('../middleware/project.middleware');
const { listCachedOpportunities, syncOpportunities } = require('../utils/ecosystem');
const { generateText } = require('../utils/gemini');
const { logActivity } = require('../utils/activity');
const logger = require('../utils/logger');

const router = express.Router();

router.use(protect, requireProfileComplete);

/**
 * List cached opportunities (never fabricated).
 * If cache is empty, return professional empty state.
 */
router.get('/', async (req, res) => {
  try {
    const { type, limit } = req.query;
    const items = await listCachedOpportunities({
      type: type || undefined,
      limit: Math.min(parseInt(limit, 10) || 50, 100),
    });

    const lastSynced = items[0]?.lastSyncedAt || null;

    res.status(200).json({
      status: 'success',
      opportunities: items,
      meta: {
        count: items.length,
        lastSyncedAt: lastSynced,
        sources: ['zero_authority_dao', 'stacks'],
        note:
          items.length === 0
            ? 'No opportunity data is currently cached from official sources. Configure ZADAO and Stacks credentials and trigger a sync, or wait for the next background refresh.'
            : undefined,
      },
    });
  } catch (err) {
    logger.error('opportunities_list_failed', { error: err.message });
    res.status(500).json({ status: 'error', message: 'Could not load opportunities.' });
  }
});

/**
 * Trigger sync from official sources only.
 */
router.post('/sync', async (req, res) => {
  try {
    const result = await syncOpportunities();
    res.status(200).json({
      status: 'success',
      result,
      message:
        result.synced > 0
          ? `Synced ${result.synced} opportunities from official sources.`
          : 'Sync completed. No new official opportunity records were available, or credentials are not configured yet.',
    });
  } catch (err) {
    logger.error('opportunities_sync_failed', { error: err.message });
    res.status(503).json({
      status: 'error',
      message: 'Opportunity sync is temporarily unavailable. Existing cached data is preserved.',
    });
  }
});

/**
 * Single opportunity detail
 */
router.get('/:id', async (req, res) => {
  try {
    const item = await Opportunity.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ status: 'error', message: 'Opportunity not found.' });
    }
    res.status(200).json({ status: 'success', opportunity: item });
  } catch (err) {
    res.status(400).json({ status: 'error', message: 'Invalid opportunity ID.' });
  }
});

/**
 * Intelligent match for a specific project.
 * Uses project + builder profile context. Explainable scoring via Gemini when data exists.
 */
router.get('/match/:projectId', loadProject, async (req, res) => {
  try {
    const opportunities = await listCachedOpportunities({ limit: 30 });
    if (opportunities.length === 0) {
      return res.status(200).json({
        status: 'success',
        matches: [],
        meta: {
          message:
            'No official opportunities are currently available to match. Configure Zero Authority DAO / Stacks credentials and sync, or check back after the next refresh.',
        },
      });
    }

    const profile = await BuilderProfile.findOne({ user: req.user._id });
    const project = req.project;

    // Build a concise context for matching explanation
    const context = {
      project: {
        name: project.name,
        description: project.description,
        stage: project.stage,
        stacksIntegration: project.stacksIntegration,
        interests: profile?.projectInterests || [],
        skills: profile?.skills || [],
        goals: profile?.goals || [],
      },
      opportunities: opportunities.slice(0, 15).map((o) => ({
        id: o._id,
        title: o.title,
        type: o.type,
        description: (o.description || '').slice(0, 280),
        organizer: o.organizer,
        deadline: o.deadline,
      })),
    };

    let matches = [];
    try {
      const prompt = `
You are ALTIQ AI Opportunity Advisor for the Stacks ecosystem and Zero Authority DAO.
Given the builder/project context and the official opportunities list, return a JSON array of matches.
For each match include: opportunityId, score (0-100), whyMatches (array of short reasons), missingRequirements (array), suggestedImprovements (array), estimatedReadiness (0-100).
Only match against the provided opportunities. Never invent opportunities.
Return ONLY valid JSON array, no markdown.

Context:
${JSON.stringify(context, null, 2)}
`.trim();

      const { text } = await generateText(prompt);
      const cleaned = text.replace(/```json|```/g, '').trim();
      matches = JSON.parse(cleaned);
      if (!Array.isArray(matches)) matches = [];
    } catch (aiErr) {
      logger.warn('match_ai_fallback', { error: aiErr.message });
      // Graceful fallback: return opportunities with neutral score and honest note
      matches = opportunities.slice(0, 10).map((o) => ({
        opportunityId: o._id,
        score: null,
        whyMatches: ['Official opportunity available in the Stacks / Zero Authority ecosystem.'],
        missingRequirements: ['Detailed match scoring temporarily unavailable.'],
        suggestedImprovements: ['Complete project documentation and branding to improve readiness.'],
        estimatedReadiness: null,
      }));
    }

    // Attach opportunity documents
    const byId = Object.fromEntries(opportunities.map((o) => [String(o._id), o]));
    const enriched = matches
      .map((m) => ({
        ...m,
        opportunity: byId[String(m.opportunityId)] || null,
      }))
      .filter((m) => m.opportunity);

    await logActivity(project._id, req.user._id, 'opportunity_match', `Matched ${enriched.length} opportunities`);

    res.status(200).json({ status: 'success', matches: enriched });
  } catch (err) {
    logger.error('match_failed', { error: err.message });
    res.status(500).json({ status: 'error', message: 'Could not compute opportunity matches.' });
  }
});

module.exports = router;
