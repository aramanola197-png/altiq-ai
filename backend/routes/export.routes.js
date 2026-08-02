const express = require('express');
const ResearchReport = require('../models/ResearchReport');
const BrandAsset = require('../models/BrandAsset');
const Document = require('../models/Document');
const ChatMessage = require('../models/ChatMessage');
const { protect, requireProfileComplete } = require('../middleware/auth.middleware');
const { loadProject } = require('../middleware/project.middleware');
const { logActivity } = require('../utils/activity');

const router = express.Router({ mergeParams: true });
router.use(protect, requireProfileComplete, loadProject);

/**
 * Export project artifacts as Markdown or JSON.
 * PDF/DOCX can be produced client-side from the same payload.
 */
router.get('/:kind', async (req, res) => {
  try {
    const { kind } = req.params;
    const format = (req.query.format || 'markdown').toLowerCase();
    const project = req.project;

    let payload = null;
    let filename = `${project.name.replace(/\s+/g, '-').toLowerCase()}`;

    if (kind === 'research') {
      const report = await ResearchReport.findOne({ project: project._id }).sort({ version: -1 });
      if (!report) return res.status(404).json({ status: 'error', message: 'No research to export.' });
      payload = { title: `Research — ${project.name}`, content: report.content, version: report.version };
      filename += '-research';
    } else if (kind === 'brand') {
      const asset = await BrandAsset.findOne({ project: project._id }).sort({ version: -1 });
      if (!asset) return res.status(404).json({ status: 'error', message: 'No brand guidance to export.' });
      payload = { title: `Brand — ${project.name}`, content: asset.content, version: asset.version };
      filename += '-brand';
    } else if (kind === 'document') {
      const type = req.query.type || 'readme';
      const doc = await Document.findOne({ project: project._id, type }).sort({ version: -1 });
      if (!doc) return res.status(404).json({ status: 'error', message: 'No document to export.' });
      payload = { title: doc.title, content: doc.content, type: doc.type, version: doc.version };
      filename += `-${type}`;
    } else if (kind === 'chat') {
      const messages = await ChatMessage.find({ project: project._id }).sort({ createdAt: 1 }).limit(200);
      payload = {
        title: `Conversation — ${project.name}`,
        messages: messages.map((m) => ({ role: m.role, content: m.content, at: m.createdAt })),
      };
      filename += '-chat';
    } else if (kind === 'project') {
      payload = {
        title: project.name,
        project: {
          name: project.name,
          description: project.description,
          problem: project.problem,
          targetAudience: project.targetAudience,
          stage: project.stage,
          mission: project.mission,
          vision: project.vision,
          stacksIntegration: project.stacksIntegration,
          zeroAuthorityIntegration: project.zeroAuthorityIntegration,
        },
      };
      filename += '-project';
    } else {
      return res.status(400).json({ status: 'error', message: 'Unknown export kind.' });
    }

    await logActivity(project._id, req.user._id, 'export', `Exported ${kind} as ${format}`);

    if (format === 'json') {
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
      return res.status(200).json({ status: 'success', ...payload });
    }

    // Markdown default
    let md = `# ${payload.title}\n\n`;
    if (payload.content) md += payload.content;
    if (payload.messages) {
      payload.messages.forEach((m) => {
        md += `\n### ${m.role}\n${m.content}\n`;
      });
    }
    if (payload.project) {
      Object.entries(payload.project).forEach(([k, v]) => {
        md += `\n**${k}:** ${v || '—'}\n`;
      });
    }

    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.md"`);
    res.status(200).send(md);
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Export failed.' });
  }
});

module.exports = router;
