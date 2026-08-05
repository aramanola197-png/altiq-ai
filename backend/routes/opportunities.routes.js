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
    // No artificial low cap here — listCachedOpportunities already
    // returns every genuinely open opportunity plus a small recently-
    // closed set. `limit`, if passed, is just a safety ceiling.
    const items = await listCachedOpportunities({
      type: type || undefined,
      limit: limit ? Math.min(parseInt(limit, 10) || 500, 1000) : undefined,
    });

    const lastSynced = items[0]?.lastSyncedAt || null;
    const openCount = items.filter((o) => o.status === 'open').length;

    res.status(200).json({
      status: 'success',
      opportunities: items,
      meta: {
        count: items.length,
        openCount,
        lastSyncedAt: lastSynced,
        sources: ['zero_authority_dao', 'stacks'],
        note:
          items.length === 0
            ? 'No open opportunities were found from official sources right now — this can mean the cache is empty (configure ZADAO/Stacks credentials and sync) or everything currently on record has closed. Check back later.'
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
    // Only open, public opportunity types — never closed gigs or private jobs.
    const all = await listCachedOpportunities({ limit: 80 });
    const openPool = all.filter(
      (o) =>
        o.status === 'open' &&
        ['bounty', 'quest', 'grant', 'hackathon', 'builder_program', 'campaign', 'challenge', 'incentive', 'funding'].includes(
          o.type
        )
    );

    const profile = await BuilderProfile.findOne({ user: req.user._id });
    const project = req.project;

    const funding = {
      title: 'Zero Authority DeGrants',
      description:
        'DeGrants is Zero Authority DAO’s funding program for builders in the Stacks ecosystem. Review eligibility, past awards, and application guidance on the official funding page. ALTIQ AI does not submit applications for you.',
      url: `${(process.env.ZADAO_API_BASE_URL || 'https://zeroauthoritydao.com').replace(/\/$/, '')}/funding/degrants`,
      type: 'funding',
    };

    if (openPool.length === 0) {
      return res.status(200).json({
        status: 'success',
        matches: [],
        funding,
        meta: {
          openCount: 0,
          message:
            'No open matched opportunities right now. Sync official sources from the Opportunities page (open bounties from Zero Authority DAO). Closed or private gigs are never listed here. You can still review DeGrants funding below.',
        },
      });
    }

    const context = {
      project: {
        name: project.name,
        description: project.description,
        stage: project.stage,
        stacksIntegration: project.stacksIntegration,
        problem: project.problem,
        interests: profile?.projectInterests || [],
        skills: profile?.skills || [],
        goals: profile?.goals || [],
      },
      opportunities: openPool.slice(0, 20).map((o) => ({
        id: String(o._id),
        title: o.title,
        type: o.type,
        status: o.status,
        description: (o.description || '').slice(0, 280),
        organizer: o.organizer,
        deadline: o.deadline,
        url: o.url,
      })),
    };

    let matches = [];
    try {
      const prompt = `
You are ALTIQ AI Opportunity Advisor for Stacks and Zero Authority DAO.
Match the builder/project only against the OPEN opportunities provided.
Return a JSON array. Each item:
  opportunityId (must be one of the provided ids),
  score (0-100),
  whyMatches (string array),
  missingRequirements (string array),
  suggestedImprovements (string array),
  estimatedReadiness (0-100).
Never invent opportunities. Prefer stronger relevance. Return ONLY a JSON array.

Context:
${JSON.stringify(context, null, 2)}
`.trim();

      const { text } = await generateText(prompt);
      const cleaned = text.replace(/```json|```/g, '').trim();
      matches = JSON.parse(cleaned);
      if (!Array.isArray(matches)) matches = [];
    } catch (aiErr) {
      logger.warn('match_ai_fallback', { error: aiErr.message });
      matches = openPool.slice(0, 8).map((o) => ({
        opportunityId: o._id,
        score: 40,
        whyMatches: [
          `Open ${o.type} from ${o.organizer || 'Zero Authority DAO'} in the Stacks ecosystem.`,
        ],
        missingRequirements: [],
        suggestedImprovements: [
          'Complete project documentation and branding to strengthen readiness.',
          'Clarify Stacks / Clarity integration in the project description.',
        ],
        estimatedReadiness: 25,
      }));
    }

    const byId = {};
    openPool.forEach((o) => {
      byId[String(o._id)] = o;
    });

    const enriched = matches
      .map((m) => ({
        ...m,
        opportunity: byId[String(m.opportunityId)] || null,
      }))
      .filter((m) => m.opportunity && m.opportunity.status === 'open')
      .sort((a, b) => (b.score || 0) - (a.score || 0));

    await logActivity(
      project._id,
      req.user._id,
      'opportunity_match',
      `Matched ${enriched.length} open opportunities`
    );

    res.status(200).json({
      status: 'success',
      matches: enriched,
      funding,
      meta: {
        openCount: openPool.length,
        matchCount: enriched.length,
        message:
          enriched.length === 0
            ? 'Open opportunities exist in the cache, but none scored as a fit for this project yet. Refine the project description, skills, and Stacks integration, then try again.'
            : undefined,
      },
    });
  } catch (err) {
    logger.error('match_failed', { error: err.message });
    res.status(500).json({ status: 'error', message: 'Could not compute opportunity matches.' });
  }
});

module.exports = router;
