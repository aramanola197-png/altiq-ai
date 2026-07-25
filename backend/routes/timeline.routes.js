const express = require('express');
const ActivityLog = require('../models/ActivityLog');
const { protect, requireProfileComplete } = require('../middleware/auth.middleware');
const { loadProject } = require('../middleware/project.middleware');

const router = express.Router({ mergeParams: true });
router.use(protect, requireProfileComplete, loadProject);

router.get('/', async (req, res) => {
  try {
    const events = await ActivityLog.find({ project: req.project._id })
      .sort({ createdAt: -1 })
      .limit(100);
    res.status(200).json({ status: 'success', events });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Could not load timeline.' });
  }
});

module.exports = router;
