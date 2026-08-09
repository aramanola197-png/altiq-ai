/**
 * Server-side branded PDF generation for ALTIQ AI.
 * Classic monochrome layout: header, horizontal rules, clear hierarchy, page footers.
 */
const PDFDocument = require('pdfkit');

const COLORS = {
  black: '#111111',
  charcoal: '#232323',
  ash: '#A7A7A7',
  lightAsh: '#D9D9D9',
  white: '#FFFFFF',
};

/**
 * Strip simple markdown and emit PDFKit text with basic structure.
 */
function renderMarkdownContent(doc, content, pageWidth, margin) {
  const maxWidth = pageWidth - margin * 2;
  const lines = String(content || '').replace(/\r\n/g, '\n').split('\n');

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Horizontal rule
    if (/^---+$|^\*\*\*+$|^___+$/.test(line.trim())) {
      ensureSpace(doc, 16, margin);
      doc
        .strokeColor(COLORS.lightAsh)
        .lineWidth(0.8)
        .moveTo(margin, doc.y + 4)
        .lineTo(pageWidth - margin, doc.y + 4)
        .stroke();
      doc.moveDown(0.8);
      continue;
    }

    // Headings
    const h1 = line.match(/^#\s+(.+)/);
    const h2 = line.match(/^##\s+(.+)/);
    const h3 = line.match(/^###\s+(.+)/);
    const h4 = line.match(/^####\s+(.+)/);

    if (h1) {
      ensureSpace(doc, 28, margin);
      doc.fillColor(COLORS.black).font('Helvetica-Bold').fontSize(16);
      doc.text(cleanInline(h1[1]), margin, doc.y, { width: maxWidth, align: 'left' });
      doc.moveDown(0.45);
      continue;
    }
    if (h2) {
      ensureSpace(doc, 24, margin);
      doc.fillColor(COLORS.black).font('Helvetica-Bold').fontSize(13);
      doc.text(cleanInline(h2[1]), margin, doc.y, { width: maxWidth });
      doc.moveDown(0.35);
      continue;
    }
    if (h3 || h4) {
      ensureSpace(doc, 20, margin);
      doc.fillColor(COLORS.charcoal).font('Helvetica-Bold').fontSize(11);
      doc.text(cleanInline((h3 || h4)[1]), margin, doc.y, { width: maxWidth });
      doc.moveDown(0.3);
      continue;
    }

    // Bullet
    const bullet = line.match(/^[\-\*•]\s+(.+)/);
    if (bullet) {
      ensureSpace(doc, 16, margin);
      doc.fillColor(COLORS.charcoal).font('Helvetica').fontSize(10);
      doc.text(`•  ${cleanInline(bullet[1])}`, margin + 8, doc.y, { width: maxWidth - 8 });
      doc.moveDown(0.25);
      continue;
    }

    // Numbered
    const num = line.match(/^\d+\.\s+(.+)/);
    if (num) {
      ensureSpace(doc, 16, margin);
      const prefix = line.match(/^(\d+)\./)[1];
      doc.fillColor(COLORS.charcoal).font('Helvetica').fontSize(10);
      doc.text(`${prefix}.  ${cleanInline(num[1])}`, margin + 8, doc.y, { width: maxWidth - 8 });
      doc.moveDown(0.25);
      continue;
    }

    // Empty line
    if (!line.trim()) {
      doc.moveDown(0.35);
      continue;
    }

    // Paragraph
    ensureSpace(doc, 16, margin);
    doc.fillColor(COLORS.charcoal).font('Helvetica').fontSize(10);
    doc.text(cleanInline(line), margin, doc.y, { width: maxWidth, align: 'left', lineGap: 2 });
    doc.moveDown(0.3);
  }
}

function cleanInline(text) {
  return String(text || '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[(.+?)\]\((.+?)\)/g, '$1')
    .trim();
}

function ensureSpace(doc, needed, margin) {
  if (doc.y + needed > doc.page.height - margin - 36) {
    doc.addPage();
  }
}

/**
 * Build a branded ALTIQ AI PDF buffer.
 * @param {object} opts
 * @param {string} opts.projectName
 * @param {string} opts.documentTitle - e.g. "Research Report", "Brand Guidance", "README"
 * @param {string} opts.content - markdown body
 * @param {string|number} [opts.version]
 * @param {Date|string} [opts.generatedAt]
 */
function buildBrandedPdf(opts) {
  const {
    projectName = 'Untitled Project',
    documentTitle = 'Document',
    content = '',
    version,
    generatedAt = new Date(),
  } = opts;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 56, bottom: 56, left: 56, right: 56 },
      bufferPages: true,
      info: {
        Title: `${documentTitle} — ${projectName}`,
        Author: 'ALTIQ AI',
        Creator: 'ALTIQ AI · Builder Operating System',
      },
    });

    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageWidth = doc.page.width;
    const margin = 56;

    // —— Header ——
    // Logo mark (simple orbit-style circle — matches monochrome brand without external image dependency)
    const logoY = margin - 4;
    doc.save();
    doc.circle(margin + 10, logoY + 10, 10).lineWidth(1.4).strokeColor(COLORS.black).stroke();
    doc
      .ellipse(margin + 10, logoY + 10, 16, 5)
      .lineWidth(1)
      .strokeColor(COLORS.charcoal)
      .stroke();
    doc.restore();

    doc
      .fillColor(COLORS.black)
      .font('Helvetica-Bold')
      .fontSize(12)
      .text('ALTIQ AI', margin + 30, logoY + 2, { continued: false });

    doc
      .fillColor(COLORS.ash)
      .font('Helvetica')
      .fontSize(8)
      .text('Build. Position. Win.', margin + 30, logoY + 16);

    // Horizontal rule under header
    const ruleY = logoY + 36;
    doc
      .strokeColor(COLORS.black)
      .lineWidth(1.2)
      .moveTo(margin, ruleY)
      .lineTo(pageWidth - margin, ruleY)
      .stroke();

    doc
      .strokeColor(COLORS.lightAsh)
      .lineWidth(0.6)
      .moveTo(margin, ruleY + 3)
      .lineTo(pageWidth - margin, ruleY + 3)
      .stroke();

    doc.y = ruleY + 18;

    // Project name
    doc.fillColor(COLORS.ash).font('Helvetica').fontSize(9);
    doc.text('PROJECT', margin, doc.y, { width: pageWidth - margin * 2 });
    doc.moveDown(0.2);
    doc.fillColor(COLORS.black).font('Helvetica-Bold').fontSize(11);
    doc.text(projectName, margin, doc.y, { width: pageWidth - margin * 2 });
    doc.moveDown(0.55);

    // Document title (bold, primary focus)
    doc.fillColor(COLORS.black).font('Helvetica-Bold').fontSize(20);
    doc.text(documentTitle, margin, doc.y, { width: pageWidth - margin * 2 });
    doc.moveDown(0.35);

    // Meta
    const dateStr = new Date(generatedAt).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    doc.fillColor(COLORS.ash).font('Helvetica').fontSize(9);
    let meta = dateStr;
    if (version != null) meta = `Version ${version}  ·  ${meta}`;
    doc.text(meta, margin, doc.y);
    doc.moveDown(0.5);

    // Second horizontal rule
    doc
      .strokeColor(COLORS.lightAsh)
      .lineWidth(0.8)
      .moveTo(margin, doc.y)
      .lineTo(pageWidth - margin, doc.y)
      .stroke();
    doc.moveDown(0.9);

    // Body
    renderMarkdownContent(doc, content, pageWidth, margin);

    // Footers on every page
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(i);
      const footerY = doc.page.height - 36;

      doc
        .strokeColor(COLORS.lightAsh)
        .lineWidth(0.6)
        .moveTo(margin, footerY - 8)
        .lineTo(pageWidth - margin, footerY - 8)
        .stroke();

      doc
        .fillColor(COLORS.ash)
        .font('Helvetica')
        .fontSize(8)
        .text('ALTIQ AI  ·  Generated for builders', margin, footerY, {
          width: (pageWidth - margin * 2) * 0.7,
          align: 'left',
          lineBreak: false,
        });

      doc
        .fillColor(COLORS.ash)
        .font('Helvetica')
        .fontSize(8)
        .text(`Page ${i + 1} of ${range.count}`, margin, footerY, {
          width: pageWidth - margin * 2,
          align: 'right',
          lineBreak: false,
        });
    }

    doc.end();
  });
}

module.exports = { buildBrandedPdf };
