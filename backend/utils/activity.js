const ActivityLog = require('../models/ActivityLog');

async function logActivity(projectId, userId, action, details = '', meta = {}) {
  try {
    await ActivityLog.create({
      project: projectId,
      user: userId,
      action,
      details,
      meta,
    });
  } catch (err) {
    console.error('Failed to log activity:', err.message);
  }
}

module.exports = { logActivity };
