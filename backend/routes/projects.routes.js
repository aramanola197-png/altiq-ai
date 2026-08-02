const express = require('express');
const Project = require('../models/Project');
const { protect, requireProfileComplete } = require('../middleware/auth.middleware');
const { loadProject } = require('../middleware/project.middleware');
const { logActivity } = require('../utils/activity');

const router = express.Router();

// All project routes require auth + completed profile
router.use(protect, requireProfileComplete);

// List user's projects
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find({ user: req.user._id }).sort({ updatedAt: -1 });
    res.status(200).json({ status: 'success', projects });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Could not load projects.' });
  }
});

// Create project
router.post('/', async (req, res) => {
  try {
    const { name, description, problem, targetAudience, stacksIntegration, zeroAuthorityIntegration, expectedUsers, monetization, stage, existingBranding } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ status: 'error', message: 'Project name is required.' });
    }

    const project = await Project.create({
      user: req.user._id,
      name: name.trim(),
      description: description || '',
      problem: problem || '',
      targetAudience: targetAudience || '',
      stacksIntegration: stacksIntegration || '',
      zeroAuthorityIntegration: zeroAuthorityIntegration || '',
      expectedUsers: expectedUsers || '',
      monetization: monetization || '',
      stage: stage || 'idea',
      existingBranding: existingBranding || '',
    });

    await logActivity(project._id, req.user._id, 'project_created', `Created project "${project.name}"`);

    res.status(201).json({ status: 'success', project });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Could not create project.' });
  }
});

// Get single project
router.get('/:projectId', loadProject, (req, res) => {
  res.status(200).json({ status: 'success', project: req.project });
});

// Update project
router.patch('/:projectId', loadProject, async (req, res) => {
  try {
    const allowed = [
      'name', 'description', 'problem', 'targetAudience',
      'stacksIntegration', 'zeroAuthorityIntegration', 'expectedUsers',
      'monetization', 'stage', 'existingBranding', 'mission', 'vision', 'productSummary',
    ];
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) req.project[key] = req.body[key];
    });
    await req.project.save();
    await logActivity(req.project._id, req.user._id, 'project_updated', 'Project details updated');
    res.status(200).json({ status: 'success', project: req.project });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Could not update project.' });
  }
});

// Delete project
router.delete('/:projectId', loadProject, async (req, res) => {
  try {
    await req.project.deleteOne();
    res.status(200).json({ status: 'success', message: 'Project deleted.' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Could not delete project.' });
  }
});

module.exports = router;
