/**
 * Branded ALTIQ AI PDF — generous spacing, real logo when available, no empty pages.
 */
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
    path.join(process.cwd(), '../frontend/public/altiq-logo.png'),
    path.join(__dirname, '../../../frontend/public/altiq-logo.png'),
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
    const margin = 64;
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: margin, bottom: 72, left: margin, right: margin },
      bufferPages: true,
      autoFirstPage: true,
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
    const contentWidth = pageWidth - margin * 2;
    const bottomLimit = () => doc.page.height - 72;

    const ensureRoom = (h) => {
      if (doc.y + h > bottomLimit()) {
        doc.addPage();
        doc.y = margin;
      }
    };

    // —— Header with real logo when present ——
    const logoPath = findLogoPath();
    const logoSize = 28;
    if (logoPath) {
      try {
        doc.image(logoPath, margin, margin - 2, { width: logoSize, height: logoSize, fit: [logoSize, logoSize] });
      } catch {
        doc.circle(margin + 10, margin + 10, 10).lineWidth(1.4).strokeColor(COLORS.black).stroke();
      }
    } else {
      doc.circle(margin + 10, margin + 10, 10).lineWidth(1.4).strokeColor(COLORS.black).stroke();
      doc.ellipse(margin + 10, margin + 10, 15, 5).lineWidth(1).strokeColor(COLORS.charcoal).stroke();
    }

    doc
      .fillColor(COLORS.black)
      .font('Helvetica-Bold')
      .fontSize(13)
      .text('ALTIQ AI', margin + logoSize + 10, margin + 2, { lineBreak: false });
    doc
      .fillColor(COLORS.ash)
      .font('Helvetica')
      .fontSize(8)
      .text('Build. Position. Win.', margin + logoSize + 10, margin + 18, { lineBreak: false });

    const ruleY = margin + 40;
    doc.strokeColor(COLORS.black).lineWidth(1.1).moveTo(margin, ruleY).lineTo(pageWidth - margin, ruleY).stroke();
    doc.strokeColor(COLORS.lightAsh).lineWidth(0.5).moveTo(margin, ruleY + 3).lineTo(pageWidth - margin, ruleY + 3).stroke();

    doc.y = ruleY + 22;

    doc.fillColor(COLORS.ash).font('Helvetica').fontSize(8).text('PROJECT', margin, doc.y);
    doc.moveDown(0.35);
    doc.fillColor(COLORS.black).font('Helvetica-Bold').fontSize(11).text(projectName, margin, doc.y, { width: contentWidth });
    doc.moveDown(0.7);

    doc.fillColor(COLORS.black).font('Helvetica-Bold').fontSize(22).text(documentTitle, margin, doc.y, { width: contentWidth });
    doc.moveDown(0.45);

    const dateStr = new Date(generatedAt).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    doc
      .fillColor(COLORS.ash)
      .font('Helvetica')
      .fontSize(9)
      .text(version != null ? `Version ${version}  ·  ${dateStr}` : dateStr, margin, doc.y);
    doc.moveDown(0.7);

    doc.strokeColor(COLORS.lightAsh).lineWidth(0.7).moveTo(margin, doc.y).lineTo(pageWidth - margin, doc.y).stroke();
    doc.moveDown(1.1);

    // —— Body with generous spacing ——
    const lines = String(content || '').replace(/\r\n/g, '\n').split('\n');
    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i];
      const line = raw;

      if (/^---+$|^\*\*\*+$|^___+$/.test(line.trim())) {
        ensureRoom(20);
        doc.y += 6;
        doc.strokeColor(COLORS.lightAsh).lineWidth(0.7).moveTo(margin, doc.y).lineTo(pageWidth - margin, doc.y).stroke();
        doc.y += 14;
        continue;
      }

      const h1 = line.match(/^#\s+(.+)/);
      const h2 = line.match(/^##\s+(.+)/);
      const h3 = line.match(/^###\s+(.+)/);
      const h4 = line.match(/^####\s+(.+)/);

      if (h1) {
        ensureRoom(36);
        doc.y += 10;
        doc.fillColor(COLORS.black).font('Helvetica-Bold').fontSize(15);
        doc.text(cleanInline(h1[1]), margin, doc.y, { width: contentWidth, lineGap: 3 });
        doc.moveDown(0.55);
        continue;
      }
      if (h2) {
        ensureRoom(30);
        doc.y += 8;
        doc.fillColor(COLORS.black).font('Helvetica-Bold').fontSize(12.5);
        doc.text(cleanInline(h2[1]), margin, doc.y, { width: contentWidth, lineGap: 3 });
        doc.moveDown(0.45);
        continue;
      }
      if (h3 || h4) {
        ensureRoom(26);
        doc.y += 6;
        doc.fillColor(COLORS.charcoal).font('Helvetica-Bold').fontSize(11);
        doc.text(cleanInline((h3 || h4)[1]), margin, doc.y, { width: contentWidth, lineGap: 2 });
        doc.moveDown(0.4);
        continue;
      }

      const bullet = line.match(/^[\-\*•]\s+(.+)/);
      if (bullet) {
        ensureRoom(20);
        doc.fillColor(COLORS.charcoal).font('Helvetica').fontSize(10);
        doc.text(`•   ${cleanInline(bullet[1])}`, margin + 6, doc.y, {
          width: contentWidth - 6,
          lineGap: 3,
        });
        doc.moveDown(0.4);
        continue;
      }

      const num = line.match(/^(\d+)\.\s+(.+)/);
      if (num) {
        ensureRoom(20);
        doc.fillColor(COLORS.charcoal).font('Helvetica').fontSize(10);
        doc.text(`${num[1]}.   ${cleanInline(num[2])}`, margin + 6, doc.y, {
          width: contentWidth - 6,
          lineGap: 3,
        });
        doc.moveDown(0.4);
        continue;
      }

      if (!line.trim()) {
        doc.moveDown(0.45);
        continue;
      }

      ensureRoom(18);
      doc.fillColor(COLORS.charcoal).font('Helvetica').fontSize(10);
      doc.text(cleanInline(line), margin, doc.y, { width: contentWidth, lineGap: 3, align: 'left' });
      doc.moveDown(0.45);
    }

    // Footers — only on pages that actually exist after content
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(range.start + i);
      const footerY = doc.page.height - 42;
      doc
        .strokeColor(COLORS.lightAsh)
        .lineWidth(0.5)
        .moveTo(margin, footerY - 10)
        .lineTo(pageWidth - margin, footerY - 10)
        .stroke();
      doc
        .fillColor(COLORS.ash)
        .font('Helvetica')
        .fontSize(8)
        .text('ALTIQ AI  ·  Generated for builders', margin, footerY, {
          width: contentWidth * 0.65,
          lineBreak: false,
        });
      doc
        .fillColor(COLORS.ash)
        .font('Helvetica')
        .fontSize(8)
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
