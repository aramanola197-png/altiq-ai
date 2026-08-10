const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const COLORS = {
  black: '#111111',
  charcoal: '#232323',
  ash: '#A7A7A7',
  lightAsh: '#D9D9D9',
};

function findLogoPath() {
  const candidates = [
    path.join(__dirname, '../assets/altiq-logo.png'),
    path.join(process.cwd(), 'assets/altiq-logo.png'),
    path.join(process.cwd(), 'backend/assets/altiq-logo.png'),
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return p;
    } catch {
      /* continue */
    }
  }
  return null;
}

function cleanInline(text) {
  return String(text || '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[(.+?)\]\((.+?)\)/g, '$1')
    .trim();
}

function buildBrandedPdf(opts) {
  const {
    projectName = 'Untitled Project',
    documentTitle = 'Document',
    content = '',
    version,
    generatedAt = new Date(),
  } = opts;

  return new Promise((resolve, reject) => {
    const margin = 56;
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: margin, bottom: 64, left: margin, right: margin },
      bufferPages: true,
      info: {
        Title: `${documentTitle} — ${projectName}`,
        Author: 'ALTIQ AI',
        Creator: 'ALTIQ AI',
      },
    });

    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageWidth = doc.page.width;
    const contentWidth = pageWidth - margin * 2;

    // Header
    const logoPath = findLogoPath();
    const logoSize = 26;
    if (logoPath) {
      try {
        doc.image(logoPath, margin, margin - 2, {
          width: logoSize,
          height: logoSize,
          fit: [logoSize, logoSize],
        });
      } catch {
        doc.circle(margin + 9, margin + 9, 9).lineWidth(1.3).strokeColor(COLORS.black).stroke();
      }
    } else {
      doc.circle(margin + 9, margin + 9, 9).lineWidth(1.3).strokeColor(COLORS.black).stroke();
    }

    doc.fillColor(COLORS.black).font('Helvetica-Bold').fontSize(12)
      .text('ALTIQ AI', margin + logoSize + 10, margin + 1, { lineBreak: false });
    doc.fillColor(COLORS.ash).font('Helvetica').fontSize(8)
      .text('Build. Position. Win.', margin + logoSize + 10, margin + 16, { lineBreak: false });

    const ruleY = margin + 36;
    doc.strokeColor(COLORS.black).lineWidth(1).moveTo(margin, ruleY).lineTo(pageWidth - margin, ruleY).stroke();
    doc.strokeColor(COLORS.lightAsh).lineWidth(0.5).moveTo(margin, ruleY + 2.5).lineTo(pageWidth - margin, ruleY + 2.5).stroke();

    doc.y = ruleY + 18;

    doc.fillColor(COLORS.ash).font('Helvetica').fontSize(8).text('PROJECT', { width: contentWidth });
    doc.moveDown(0.25);
    doc.fillColor(COLORS.black).font('Helvetica-Bold').fontSize(11).text(projectName, { width: contentWidth });
    doc.moveDown(0.55);

    doc.fillColor(COLORS.black).font('Helvetica-Bold').fontSize(18).text(documentTitle, { width: contentWidth });
    doc.moveDown(0.35);

    const dateStr = new Date(generatedAt).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
    doc.fillColor(COLORS.ash).font('Helvetica').fontSize(9)
      .text(version != null ? `Version ${version}  ·  ${dateStr}` : dateStr, { width: contentWidth });
    doc.moveDown(0.55);

    doc.strokeColor(COLORS.lightAsh).lineWidth(0.6).moveTo(margin, doc.y).lineTo(pageWidth - margin, doc.y).stroke();
    doc.moveDown(0.85);

    // Body — let PDFKit handle page breaks via continued text flow
    const lines = String(content || '').replace(/\r\n/g, '\n').split('\n');

    for (const line of lines) {
      if (/^---+$|^\*\*\*+$|^___+$/.test(line.trim())) {
        doc.moveDown(0.4);
        const y = doc.y;
        doc.strokeColor(COLORS.lightAsh).lineWidth(0.6).moveTo(margin, y).lineTo(pageWidth - margin, y).stroke();
        doc.moveDown(0.6);
        continue;
      }

      const h1 = line.match(/^#\s+(.+)/);
      const h2 = line.match(/^##\s+(.+)/);
      const h3 = line.match(/^###\s+(.+)/);
      const h4 = line.match(/^####\s+(.+)/);

      if (h1) {
        doc.moveDown(0.35);
        doc.fillColor(COLORS.black).font('Helvetica-Bold').fontSize(14)
          .text(cleanInline(h1[1]), { width: contentWidth, lineGap: 4 });
        doc.moveDown(0.35);
        continue;
      }
      if (h2) {
        doc.moveDown(0.3);
        doc.fillColor(COLORS.black).font('Helvetica-Bold').fontSize(12)
          .text(cleanInline(h2[1]), { width: contentWidth, lineGap: 3 });
        doc.moveDown(0.28);
        continue;
      }
      if (h3 || h4) {
        doc.moveDown(0.25);
        doc.fillColor(COLORS.charcoal).font('Helvetica-Bold').fontSize(10.5)
          .text(cleanInline((h3 || h4)[1]), { width: contentWidth, lineGap: 3 });
        doc.moveDown(0.22);
        continue;
      }

      const bullet = line.match(/^[\-\*•]\s+(.+)/);
      if (bullet) {
        doc.fillColor(COLORS.charcoal).font('Helvetica').fontSize(10)
          .text(`•  ${cleanInline(bullet[1])}`, { width: contentWidth, indent: 8, lineGap: 3 });
        doc.moveDown(0.2);
        continue;
      }

      const num = line.match(/^(\d+)\.\s+(.+)/);
      if (num) {
        doc.fillColor(COLORS.charcoal).font('Helvetica').fontSize(10)
          .text(`${num[1]}.  ${cleanInline(num[2])}`, { width: contentWidth, indent: 8, lineGap: 3 });
        doc.moveDown(0.2);
        continue;
      }

      if (!line.trim()) {
        doc.moveDown(0.35);
        continue;
      }

      doc.fillColor(COLORS.charcoal).font('Helvetica').fontSize(10)
        .text(cleanInline(line), { width: contentWidth, lineGap: 3, align: 'left' });
      doc.moveDown(0.28);
    }

    // Number every real page after content is written
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(range.start + i);
      const footerY = doc.page.height - 40;
      doc.strokeColor(COLORS.lightAsh).lineWidth(0.5)
        .moveTo(margin, footerY - 8).lineTo(pageWidth - margin, footerY - 8).stroke();
      doc.fillColor(COLORS.ash).font('Helvetica').fontSize(8)
        .text('ALTIQ AI  ·  Generated for builders', margin, footerY, {
          width: contentWidth * 0.65,
          lineBreak: false,
        });
      doc.fillColor(COLORS.ash).font('Helvetica').fontSize(8)
        .text(`Page ${i + 1} of ${range.count}`, margin, footerY, {
          width: contentWidth,
          align: 'right',
          lineBreak: false,
        });
    }

    doc.end();
  });
}

module.exports = { buildBrandedPdf };
