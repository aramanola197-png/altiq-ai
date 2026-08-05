const express = require('express');
const BuilderProfile = require('../models/BuilderProfile');
const User = require('../models/User');
const Project = require('../models/Project');
const ActivityLog = require('../models/ActivityLog');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/me', protect, async (req, res) => {
  try {
    const profile = await BuilderProfile.findOne({ user: req.user._id });
    res.status(200).json({ status: 'success', profile });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Could not load profile.' });
  }
});

/**
 * Builder activity metrics for Settings.
 * Aggregates projects + activity log — no invented stats.
 */
router.get('/metrics', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const projects = await Project.find({ user: userId }).select('name stage updatedAt createdAt').lean();
    const projectIds = projects.map((p) => p._id);

    const logs = projectIds.length
      ? await ActivityLog.find({ user: userId, project: { $in: projectIds } })
          .sort({ createdAt: -1 })
          .limit(200)
          .lean()
      : [];

    const counts = {
      projects: projects.length,
      aiChats: 0,
      research: 0,
      brand: 0,
      documents: 0,
      matches: 0,
      exports: 0,
      other: 0,
    };

    for (const log of logs) {
      const a = String(log.action || '');
      if (a.includes('ai_chat') || a.includes('chat')) counts.aiChats += 1;
      else if (a.includes('research')) counts.research += 1;
      else if (a.includes('brand')) counts.brand += 1;
      else if (a.includes('document')) counts.documents += 1;
      else if (a.includes('match') || a.includes('opportunity')) counts.matches += 1;
      else if (a.includes('export')) counts.exports += 1;
      else counts.other += 1;
    }

    const recent = logs.slice(0, 8).map((l) => ({
      action: l.action,
      details: l.details,
      at: l.createdAt,
    }));

    // Short plain-language summary (no external AI required)
    const parts = [];
    if (counts.projects === 0) {
      parts.push('You have not created a project yet. Start one from Projects to unlock the full workspace.');
    } else {
      parts.push(
        `You are building ${counts.projects} project${counts.projects === 1 ? '' : 's'}` +
          (projects[0] ? `, including “${projects[0].name}”.` : '.')
      );
    }
    if (counts.aiChats) parts.push(`AI conversations: ${counts.aiChats}.`);
    if (counts.research) parts.push(`Research runs: ${counts.research}.`);
    if (counts.brand) parts.push(`Brand sessions: ${counts.brand}.`);
    if (counts.documents) parts.push(`Documents generated or edited: ${counts.documents}.`);
    if (counts.matches) parts.push(`Opportunity matches: ${counts.matches}.`);
    if (
      counts.projects > 0 &&
      counts.aiChats + counts.research + counts.brand + counts.documents === 0
    ) {
      parts.push('Next step: open a project workspace and use AI or Research to deepen the concept.');
    }

    res.status(200).json({
      status: 'success',
      metrics: {
        counts,
        projects: projects.map((p) => ({
          id: p._id,
          name: p.name,
          stage: p.stage,
          updatedAt: p.updatedAt,
        })),
        recent,
        summary: parts.join(' '),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Could not load activity metrics.' });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const data = req.body;

    if (!data.name || !data.username) {
      return res.status(400).json({ status: 'error', message: 'Name and username are required.' });
    }

    const existingUsername = await BuilderProfile.findOne({
      username: data.username.toLowerCase(),
      user: { $ne: req.user._id },
    });
    if (existingUsername) {
      return res.status(400).json({ status: 'error', message: 'Username is already taken.' });
    }

    let profile = await BuilderProfile.findOne({ user: req.user._id });

    if (profile) {
      Object.assign(profile, {
        ...data,
        username: data.username.toLowerCase(),
      });
      await profile.save();
    } else {
      profile = await BuilderProfile.create({
        user: req.user._id,
        ...data,
        username: data.username.toLowerCase(),
      });
    }

    await User.findByIdAndUpdate(req.user._id, { isProfileComplete: true, name: data.name });

    res.status(200).json({ status: 'success', profile });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Could not save profile.' });
  }
});

module.exports = router;
