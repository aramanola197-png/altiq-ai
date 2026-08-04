const Project = require('../models/Project');

/**
 * Loads the project and verifies the requesting user owns it.
 * Attaches req.project.
 */
const loadProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ status: 'error', message: 'Project not found.' });
    }
    if (project.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ status: 'error', message: 'You do not have access to this project.' });
    }
    req.project = project;
    next();
  } catch (err) {
    return res.status(400).json({ status: 'error', message: 'Invalid project ID.' });
  }
};

module.exports = { loadProject };
