const express = require('express');
const ActivityLog = require('../models/ActivityLog');
const Project = require('../models/Project');
const { protect, requireProfileComplete } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * Recent activity across all of the user's projects — for the top-bar drawer.
 */
router.get('/me', protect, requireProfileComplete, async (req, res) => {
  try {
    const projects = await Project.find({ user: req.user._id }).select('_id name').lean();
    const map = Object.fromEntries(projects.map((p) => [String(p._id), p.name]));
    const ids = projects.map((p) => p._id);

    if (!ids.length) {
      return res.status(200).json({ status: 'success', activities: [] });
    }

    const logs = await ActivityLog.find({ user: req.user._id, project: { $in: ids } })
      .sort({ createdAt: -1 })
      .limit(40)
      .lean();

    const activities = logs.map((l) => {
      const pid = String(l.project);
      const action = String(l.action || '');
      let href = `/projects/${pid}`;
      if (action.includes('ai_chat') || action.includes('chat')) href = `/projects/${pid}/ai`;
      else if (action.includes('research')) href = `/projects/${pid}/research`;
      else if (action.includes('brand')) href = `/projects/${pid}/brand`;
      else if (action.includes('document')) href = `/projects/${pid}/docs`;
      else if (action.includes('match') || action.includes('submission') || action.includes('opportunity'))
        href = `/projects/${pid}/submission`;
      else if (action.includes('export')) href = `/projects/${pid}`;

      return {
        id: l._id,
        action: l.action,
        details: l.details || l.action,
        projectId: pid,
        projectName: map[pid] || 'Project',
        href,
        at: l.createdAt,
      };
    });

    res.status(200).json({ status: 'success', activities });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Could not load activity.' });
  }
});

module.exports = router;
