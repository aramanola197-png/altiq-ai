const express = require('express');
const bcrypt = require('bcryptjs');
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

/**
 * Create profile (onboarding) — includes compulsory security Q&A (CAPS).
 */
router.post('/', protect, async (req, res) => {
  try {
    const data = req.body;

    if (!data.name || !data.username) {
      return res.status(400).json({ status: 'error', message: 'Name and username are required.' });
    }

    const sq = String(data.securityQuestion || '').trim().toUpperCase();
    const sa = String(data.securityAnswer || '').trim().toUpperCase();
    if (!sq || sq.length < 5) {
      return res.status(400).json({
        status: 'error',
        message: 'Security question is required (at least 5 characters, capital letters).',
      });
    }
    if (!sa || sa.length < 3) {
      return res.status(400).json({
        status: 'error',
        message: 'Security answer is required (at least 3 characters, capital letters).',
      });
    }
    if (sq !== String(data.securityQuestion || '').trim().toUpperCase()) {
      /* already normalized */
    }

    const existingUsername = await BuilderProfile.findOne({
      username: data.username.toLowerCase(),
      user: { $ne: req.user._id },
    });
    if (existingUsername) {
      return res.status(400).json({ status: 'error', message: 'Username is already taken.' });
    }

    const walletType = ['stacks', 'ethereum'].includes(data.walletType) ? data.walletType : '';

    let profile = await BuilderProfile.findOne({ user: req.user._id });

    const payload = {
      name: data.name,
      username: data.username.toLowerCase(),
      country: data.country || '',
      occupation: data.occupation || '',
      stacksExperience: data.stacksExperience || 'none',
      skills: Array.isArray(data.skills) ? data.skills : [],
      projectInterests: Array.isArray(data.projectInterests) ? data.projectInterests : [],
      goals: Array.isArray(data.goals) ? data.goals : [],
      portfolio: {
        github: data.portfolio?.github || '',
        website: data.portfolio?.website || '',
        xProfile: data.portfolio?.xProfile || '',
      },
      walletType,
      walletAddress: data.walletAddress || '',
    };

    if (profile) {
      Object.assign(profile, payload);
      await profile.save();
    } else {
      profile = await BuilderProfile.create({
        user: req.user._id,
        ...payload,
      });
    }

    const answerHash = await bcrypt.hash(sa, 12);
    await User.findByIdAndUpdate(req.user._id, {
      isProfileComplete: true,
      name: data.name,
      securityQuestion: sq,
      securityAnswerHash: answerHash,
    });

    res.status(200).json({ status: 'success', profile });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Could not save profile.' });
  }
});

/**
 * Update editable builder fields only (Settings).
 * Cannot change: username, country, name (identity).
 */
router.patch('/me', protect, async (req, res) => {
  try {
    const profile = await BuilderProfile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(404).json({ status: 'error', message: 'Builder profile not found.' });
    }

    const data = req.body;

    if (data.occupation !== undefined) profile.occupation = String(data.occupation || '').trim();
    if (data.stacksExperience !== undefined) {
      const allowed = ['none', 'beginner', 'intermediate', 'advanced', 'expert'];
      if (allowed.includes(data.stacksExperience)) profile.stacksExperience = data.stacksExperience;
    }
    if (Array.isArray(data.skills)) profile.skills = data.skills.map((s) => String(s).trim()).filter(Boolean);
    if (Array.isArray(data.projectInterests)) profile.projectInterests = data.projectInterests;
    if (Array.isArray(data.goals)) profile.goals = data.goals;
    if (data.portfolio && typeof data.portfolio === 'object') {
      profile.portfolio = {
        github: String(data.portfolio.github || '').trim(),
        website: String(data.portfolio.website || '').trim(),
        xProfile: String(data.portfolio.xProfile || '').trim(),
      };
    }
    if (data.walletType !== undefined) {
      profile.walletType = ['stacks', 'ethereum'].includes(data.walletType) ? data.walletType : '';
    }
    if (data.walletAddress !== undefined) {
      profile.walletAddress = String(data.walletAddress || '').trim();
    }

    await profile.save();

    res.status(200).json({
      status: 'success',
      profile,
      message: 'Builder profile updated. New interests will be used for opportunity matching.',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Could not update profile.' });
  }
});

module.exports = router;
