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

function drawOrbitMark(doc, x, y, size) {
  const r = size / 2;
  const cx = x + r;
  const cy = y + r;
  doc.save();
  doc.circle(cx, cy, r * 0.72).lineWidth(1.6).strokeColor(COLORS.black).stroke();
  doc
    .ellipse(cx, cy, r * 1.05, r * 0.38)
    .lineWidth(1.2)
    .strokeColor(COLORS.black)
    .stroke();
  // small tip
  doc
    .moveTo(cx + r * 0.55, cy + r * 0.35)
    .lineTo(cx + r * 0.95, cy + r * 0.75)
    .lineWidth(1.4)
    .strokeColor(COLORS.black)
    .stroke();
  doc.restore();
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
    const margin = 54;
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: margin, bottom: 60, left: margin, right: margin },
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
    const maxW = pageWidth - margin * 2;

    const write = (str, style = {}) => {
      const {
        font = 'Helvetica',
        size = 10,
        color = COLORS.charcoal,
        lineGap = 3,
        indent = 0,
        moveAfter = 0.3,
      } = style;
      doc.fillColor(color).font(font).fontSize(size);
      doc.text(str, margin + indent, doc.y, {
        width: maxW - indent,
        lineGap,
        align: 'left',
      });
      if (moveAfter) doc.moveDown(moveAfter);
    };

    // Header mark
    const logoPath = findLogoPath();
    const logoSize = 28;
    let usedImage = false;
    if (logoPath) {
      try {
        doc.image(logoPath, margin, margin - 2, {
          width: logoSize,
          height: logoSize,
          fit: [logoSize, logoSize],
        });
        usedImage = true;
      } catch {
        usedImage = false;
      }
    }
    if (!usedImage) {
      drawOrbitMark(doc, margin, margin - 2, logoSize);
    }

    doc.fillColor(COLORS.black).font('Helvetica-Bold').fontSize(12)
      .text('ALTIQ AI', margin + logoSize + 10, margin + 2, { lineBreak: false });
    doc.fillColor(COLORS.ash).font('Helvetica').fontSize(8)
      .text('Build. Position. Win.', margin + logoSize + 10, margin + 17, { lineBreak: false });

    const ruleY = margin + 38;
    doc.strokeColor(COLORS.black).lineWidth(1)
      .moveTo(margin, ruleY).lineTo(pageWidth - margin, ruleY).stroke();
    doc.strokeColor(COLORS.lightAsh).lineWidth(0.5)
      .moveTo(margin, ruleY + 2.5).lineTo(pageWidth - margin, ruleY + 2.5).stroke();

    doc.y = ruleY + 16;

    write('PROJECT', { font: 'Helvetica', size: 8, color: COLORS.ash, moveAfter: 0.2 });
    write(projectName, { font: 'Helvetica-Bold', size: 11, color: COLORS.black, moveAfter: 0.5 });
    write(documentTitle, { font: 'Helvetica-Bold', size: 18, color: COLORS.black, moveAfter: 0.35 });

    const dateStr = new Date(generatedAt).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
    write(version != null ? `Version ${version}  ·  ${dateStr}` : dateStr, {
      font: 'Helvetica', size: 9, color: COLORS.ash, moveAfter: 0.5,
    });

    doc.strokeColor(COLORS.lightAsh).lineWidth(0.6)
      .moveTo(margin, doc.y).lineTo(pageWidth - margin, doc.y).stroke();
    doc.moveDown(0.75);

    const lines = String(content || '').replace(/\r\n/g, '\n').split('\n');
    for (const line of lines) {
      if (/^---+$|^\*\*\*+$|^___+$/.test(line.trim())) {
        doc.moveDown(0.35);
        doc.strokeColor(COLORS.lightAsh).lineWidth(0.6)
          .moveTo(margin, doc.y).lineTo(pageWidth - margin, doc.y).stroke();
        doc.moveDown(0.55);
        continue;
      }
      const h1 = line.match(/^#\s+(.+)/);
      const h2 = line.match(/^##\s+(.+)/);
      const h3 = line.match(/^###\s+(.+)/);
      const h4 = line.match(/^####\s+(.+)/);
      if (h1) {
        doc.moveDown(0.25);
        write(cleanInline(h1[1]), { font: 'Helvetica-Bold', size: 14, color: COLORS.black, lineGap: 4, moveAfter: 0.35 });
        continue;
      }
      if (h2) {
        doc.moveDown(0.2);
        write(cleanInline(h2[1]), { font: 'Helvetica-Bold', size: 12, color: COLORS.black, lineGap: 3, moveAfter: 0.28 });
        continue;
      }
      if (h3 || h4) {
        doc.moveDown(0.15);
        write(cleanInline((h3 || h4)[1]), { font: 'Helvetica-Bold', size: 10.5, color: COLORS.charcoal, lineGap: 3, moveAfter: 0.22 });
        continue;
      }
      const bullet = line.match(/^[\-\*•]\s+(.+)/);
      if (bullet) {
        write(`•  ${cleanInline(bullet[1])}`, { font: 'Helvetica', size: 10, indent: 10, lineGap: 3, moveAfter: 0.2 });
        continue;
      }
      const num = line.match(/^(\d+)\.\s+(.+)/);
      if (num) {
        write(`${num[1]}.  ${cleanInline(num[2])}`, { font: 'Helvetica', size: 10, indent: 10, lineGap: 3, moveAfter: 0.2 });
        continue;
      }
      if (!line.trim()) {
        doc.moveDown(0.35);
        continue;
      }
      write(cleanInline(line), { font: 'Helvetica', size: 10, lineGap: 3, moveAfter: 0.28 });
    }

    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(range.start + i);
      const footerY = doc.page.height - 38;
      doc.strokeColor(COLORS.lightAsh).lineWidth(0.5)
        .moveTo(margin, footerY - 8).lineTo(pageWidth - margin, footerY - 8).stroke();
      doc.fillColor(COLORS.ash).font('Helvetica').fontSize(8)
        .text('ALTIQ AI  ·  Generated for builders', margin, footerY, {
          width: maxW * 0.65,
          lineBreak: false,
        });
      doc.fillColor(COLORS.ash).font('Helvetica').fontSize(8)
        .text(`Page ${i + 1} of ${range.count}`, margin, footerY, {
          width: maxW,
          align: 'right',
          lineBreak: false,
        });
    }

    doc.end();
  });
}

module.exports = { buildBrandedPdf };
