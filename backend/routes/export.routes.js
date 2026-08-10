const express = require('express');
const ResearchReport = require('../models/ResearchReport');
const BrandAsset = require('../models/BrandAsset');
const Document = require('../models/Document');
const ChatMessage = require('../models/ChatMessage');
const { protect, requireProfileComplete } = require('../middleware/auth.middleware');
const { loadProject } = require('../middleware/project.middleware');
const { logActivity } = require('../utils/activity');
const { buildBrandedPdf } = require('../utils/pdfExport');

const router = express.Router({ mergeParams: true });
router.use(protect, requireProfileComplete, loadProject);

function safeFilePart(name) {
  return String(name || 'project')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 60) || 'project';
}

router.get('/:kind', async (req, res) => {
  try {
    const { kind } = req.params;
    const format = (req.query.format || 'markdown').toLowerCase();
    const project = req.project;

    let documentTitle = '';
    let content = '';
    let version = null;
    let generatedAt = new Date();
    let filenameBase = `ALTIQ-AI_${safeFilePart(project.name)}`;

    if (kind === 'research') {
      const report = await ResearchReport.findOne({ project: project._id }).sort({ version: -1 });
      if (!report) return res.status(404).json({ status: 'error', message: 'No research to export.' });
      documentTitle = 'Research Report';
      content = report.content;
      version = report.version;
      generatedAt = report.updatedAt || report.createdAt;
      filenameBase += '_Research';
    } else if (kind === 'brand') {
      const asset = await BrandAsset.findOne({ project: project._id }).sort({ version: -1 });
      if (!asset) return res.status(404).json({ status: 'error', message: 'No brand guidance to export.' });
      documentTitle = 'Brand Guidance';
      content = asset.content;
      version = asset.version;
      generatedAt = asset.updatedAt || asset.createdAt;
      filenameBase += '_Brand';
    } else if (kind === 'document') {
      const type = req.query.type || 'readme';
      const doc = await Document.findOne({ project: project._id, type }).sort({ version: -1 });
      if (!doc) return res.status(404).json({ status: 'error', message: 'No document to export.' });
      const labels = {
        readme: 'README',
        whitepaper: 'Whitepaper Outline',
        roadmap: 'Product Roadmap',
        pitch: 'Pitch Outline',
      };
      documentTitle = labels[type] || doc.title || type;
      content = doc.content;
      version = doc.version;
      generatedAt = doc.updatedAt || doc.createdAt;
      filenameBase += `_${safeFilePart(documentTitle)}`;
    } else if (kind === 'chat') {
      const messages = await ChatMessage.find({ project: project._id }).sort({ createdAt: 1 }).limit(200);
      documentTitle = 'AI Conversation';
      content = messages
        .map((m) => `### ${m.role === 'user' ? 'You' : 'ALTIQ AI'}\n\n${m.content}`)
        .join('\n\n---\n\n');
      filenameBase += '_Chat';
    } else if (kind === 'project') {
      documentTitle = 'Project Summary';
      content = [
        `# ${project.name}`,
        '',
        project.description || '',
        '',
        `**Stage:** ${project.stage || 'idea'}`,
        '',
        project.problem ? `## Problem\n\n${project.problem}` : '',
        project.targetAudience ? `## Target audience\n\n${project.targetAudience}` : '',
        project.stacksIntegration ? `## Stacks integration\n\n${project.stacksIntegration}` : '',
        project.mission ? `## Mission\n\n${project.mission}` : '',
      ]
        .filter(Boolean)
        .join('\n');
      filenameBase += '_Summary';
    } else {
      return res.status(400).json({ status: 'error', message: 'Unknown export kind.' });
    }

    await logActivity(project._id, req.user._id, 'export', `Exported ${kind} as ${format}`);

    if (format === 'pdf') {
      const buffer = await buildBrandedPdf({
        projectName: project.name,
        documentTitle,
        content,
        version,
        generatedAt,
      });
      const filename = `${filenameBase}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', buffer.length);
      return res.send(buffer);
    }

    if (format === 'json') {
      const payload = {
        title: documentTitle,
        project: project.name,
        version,
        generatedAt,
        content,
      };
      res.setHeader('Content-Type', 'application/json');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filenameBase}.json"`
      );
      return res.send(JSON.stringify(payload, null, 2));
    }

    // Markdown default
    const md = `# ${documentTitle}\n\n**Project:** ${project.name}\n\n---\n\n${content}\n`;
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filenameBase}.md"`
    );
    return res.send(md);
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Export failed.' });
  }
});

module.exports = router;
