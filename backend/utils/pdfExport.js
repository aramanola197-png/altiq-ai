const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const COLORS = {
  black: '#111111',
  charcoal: '#232323',
  ash: '#A7A7A7',
  lightAsh: '#D9D9D9',
  codeBg: '#F2F2F2',
  highlightBg: '#E9E9E9',
  hairline: '#EAEAEA',
};

const FONT = {
  regular: 'Helvetica',
  bold: 'Helvetica-Bold',
  italic: 'Helvetica-Oblique',
  boldItalic: 'Helvetica-BoldOblique',
  mono: 'Courier',
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

// Clean monochrome "orbit" mark used whenever the real logo file is absent.
// Layered rings at reduced opacity + a tilted orbit path with a small
// travelling node read as a considered brand mark rather than a placeholder
// circle, while staying strictly monochrome.
function drawOrbitMark(doc, x, y, size) {
  const r = size / 2;
  const cx = x + r;
  const cy = y + r;

  doc.save();

  // Soft outer halo ring (very light, purely atmospheric)
  doc.circle(cx, cy, r * 1.04).lineWidth(0.75)
    .strokeColor(COLORS.lightAsh).strokeOpacity(0.9).stroke();

  // Primary ring
  doc.circle(cx, cy, r * 0.86).lineWidth(1.3)
    .strokeColor(COLORS.black).strokeOpacity(1).stroke();

  // Tilted orbit ellipse
  doc.translate(cx, cy);
  doc.rotate(-24, { origin: [0, 0] });
  doc.ellipse(0, 0, r * 1.12, r * 0.4).lineWidth(0.9)
    .strokeColor(COLORS.ash).strokeOpacity(1).stroke();

  // Small node travelling on the orbit path (adds a hand-drawn, considered feel)
  doc.circle(r * 1.12, 0, r * 0.1).fillColor(COLORS.black).fillOpacity(1).fill();

  doc.rotate(24, { origin: [0, 0] });
  doc.translate(-cx, -cy);

  // Core dot
  doc.circle(cx, cy, r * 0.24).fillColor(COLORS.black).fillOpacity(1).fill();

  doc.restore();
}

// ---------------------------------------------------------------------------
// Inline markdown: bold / italic / bold+italic / inline code / strikethrough /
// ==highlight== / [links](url). Returns an ordered list of run tokens instead
// of stripping the markers, so formatting actually renders instead of
// dumping raw ** / == / ` characters into the PDF.
// ---------------------------------------------------------------------------
// Single-underscore italic requires word boundaries either side so ordinary
// snake_case / identifier_names in prose don't get misread as emphasis.
const INLINE_RE =
  /\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|__(.+?)__|\*(.+?)\*|(?<!\w)_(.+?)_(?!\w)|~~(.+?)~~|==(.+?)==|`(.+?)`|\[([^\]]+?)\]\(([^)]+?)\)/g;

function tokenizeInline(text) {
  const tokens = [];
  let lastIndex = 0;
  let m;
  INLINE_RE.lastIndex = 0;
  while ((m = INLINE_RE.exec(text)) !== null) {
    if (m.index > lastIndex) tokens.push({ text: text.slice(lastIndex, m.index) });
    if (m[1] !== undefined) tokens.push({ text: m[1], bold: true, italic: true });
    else if (m[2] !== undefined) tokens.push({ text: m[2], bold: true });
    else if (m[3] !== undefined) tokens.push({ text: m[3], bold: true });
    else if (m[4] !== undefined) tokens.push({ text: m[4], italic: true });
    else if (m[5] !== undefined) tokens.push({ text: m[5], italic: true });
    else if (m[6] !== undefined) tokens.push({ text: m[6], strike: true });
    else if (m[7] !== undefined) tokens.push({ text: m[7], highlight: true });
    else if (m[8] !== undefined) tokens.push({ text: m[8], code: true });
    else if (m[9] !== undefined) tokens.push({ text: m[9], link: m[10] });
    lastIndex = INLINE_RE.lastIndex;
  }
  if (lastIndex < text.length) tokens.push({ text: text.slice(lastIndex) });
  return tokens.filter((t) => t.text.length > 0);
}

function plainOf(tokens) {
  return tokens.map((t) => t.text).join('');
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
    // 0.8in margins top/left/right; extra-generous bottom margin reserves a
    // clean, untouched band for the footer so body content never collides
    // with it (and pdfkit's own overflow check never fires while drawing it).
    const margin = 58;
    const bottomMargin = 76;

    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: margin, bottom: bottomMargin, left: margin, right: margin },
      bufferPages: true,
      autoFirstPage: true,
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
    const rightLimit = pageWidth - margin;

    // Deterministic pagination: every block is measured BEFORE it is drawn,
    // and a new page is only ever added here, explicitly, when the block
    // would not fit. This is what prevents accidental blank pages — pdfkit
    // is never left to trigger its own implicit page breaks mid-flow.
    const bottomBoundary = () => doc.page.height - doc.page.margins.bottom;
    const ensureSpace = (height) => {
      if (doc.y + height > bottomBoundary()) {
        doc.addPage();
      }
    };

    // Plain single-style block (headings, labels, meta line).
    const write = (str, style = {}) => {
      const {
        font = FONT.regular,
        size = 10,
        color = COLORS.charcoal,
        lineGap = 3,
        indent = 0,
        moveBefore = 0,
        moveAfter = 0.3,
        minFollow = 0, // reserve room for a trailing line so headings never orphan at page bottom
      } = style;

      doc.font(font).fontSize(size);
      const width = maxW - indent;
      const textHeight = doc.heightOfString(str, { width, lineGap });
      const beforeGap = moveBefore ? moveBefore * doc.currentLineHeight(true) : 0;

      ensureSpace(beforeGap + textHeight + minFollow);

      if (moveBefore) doc.moveDown(moveBefore);
      doc.fillColor(color).font(font).fontSize(size);
      doc.text(str, margin + indent, doc.y, { width, lineGap, align: 'left' });
      if (moveAfter) doc.moveDown(moveAfter);
    };

    // Mixed-style paragraph: bold / italic / code / highlight / strike / link
    // runs rendered as a single flowing, wrapping line using pdfkit's
    // "continued" text chaining, so formatting survives line wraps instead
    // of being flattened or dumped as raw markdown characters.
    const writeRich = (tokens, style = {}) => {
      const {
        size = 10,
        color = COLORS.charcoal,
        lineGap = 3,
        indent = 0,
        moveBefore = 0,
        moveAfter = 0.28,
        minFollow = 0,
      } = style;

      const width = maxW - indent;
      doc.font(FONT.regular).fontSize(size);
      const plain = plainOf(tokens);
      // Estimated with the regular face; bold/mono runs are only marginally
      // wider at this size, so a small buffer keeps the estimate safe without
      // needing an exact per-run layout pass (pdfkit will still wrap
      // correctly at draw time regardless of this estimate).
      const estHeight = doc.heightOfString(plain || ' ', { width, lineGap }) * 1.1;
      const beforeGap = moveBefore ? moveBefore * doc.currentLineHeight(true) : 0;

      ensureSpace(beforeGap + estHeight + minFollow);
      if (moveBefore) doc.moveDown(moveBefore);

      let cursorX = margin + indent;
      const cursorY = doc.y;

      tokens.forEach((tok, idx) => {
        const isLast = idx === tokens.length - 1;
        let font = FONT.regular;
        let fillColor = color;
        let sz = size;

        if (tok.bold && tok.italic) font = FONT.boldItalic;
        else if (tok.bold) font = FONT.bold;
        else if (tok.italic) font = FONT.italic;
        if (tok.code) {
          font = FONT.mono;
          sz = Math.max(8, size - 0.5);
          fillColor = COLORS.charcoal;
        }
        if (tok.highlight) fillColor = COLORS.black;
        if (tok.link) fillColor = COLORS.black;

        doc.font(font).fontSize(sz);
        const runWidth = doc.widthOfString(tok.text);
        const fitsOnLine = idx === 0 || runWidth <= rightLimit - doc.x;

        // Background chip for code / highlight runs (skipped if the run
        // would wrap mid-token — rare for short inline spans — so we never
        // draw a box that doesn't match the rendered text).
        if ((tok.code || tok.highlight) && fitsOnLine && runWidth > 0) {
          const boxX = idx === 0 ? cursorX : doc.x;
          const boxY = doc.y - 1;
          const boxH = doc.currentLineHeight(true) + 1;
          doc.save();
          doc.rect(boxX - 1.5, boxY, runWidth + 3, boxH)
            .fill(tok.code ? COLORS.codeBg : COLORS.highlightBg);
          doc.restore();
        }

        const runX = idx === 0 ? cursorX : doc.x;
        const runY = doc.y;

        doc.fillColor(fillColor).font(font).fontSize(sz);
        if (idx === 0) {
          doc.text(tok.text, runX, runY, { width, lineGap, continued: !isLast });
        } else {
          doc.text(tok.text, { continued: !isLast, lineGap });
        }

        if (tok.strike && fitsOnLine && runWidth > 0) {
          const lineY = runY + sz * 0.36;
          doc.save().strokeColor(fillColor).lineWidth(0.6)
            .moveTo(runX, lineY).lineTo(runX + runWidth, lineY).stroke().restore();
        }
        if (tok.link && fitsOnLine && runWidth > 0) {
          const lineY = runY + sz * 0.95;
          doc.save().strokeColor(COLORS.ash).lineWidth(0.6)
            .moveTo(runX, lineY).lineTo(runX + runWidth, lineY).stroke().restore();
          try { doc.link(runX, runY, runWidth, sz * 1.15, tok.link); } catch { /* non-fatal */ }
        }
      });

      doc.fillColor(color).font(FONT.regular).fontSize(size);
      if (moveAfter) doc.moveDown(moveAfter);
    };

    const rule = (color, weight, moveBefore = 0, moveAfter = 0) => {
      ensureSpace((moveBefore ? moveBefore * doc.currentLineHeight(true) : 0) + weight + 2);
      if (moveBefore) doc.moveDown(moveBefore);
      doc.strokeColor(color).lineWidth(weight)
        .moveTo(margin, doc.y).lineTo(pageWidth - margin, doc.y).stroke();
      if (moveAfter) doc.moveDown(moveAfter);
    };

    // Fenced code block: monospace on a light card, own measured height,
    // never runs inline parsing inside (code is shown verbatim).
    const codeBlock = (codeLines) => {
      const size = 9;
      const padX = 10;
      const padY = 8;
      const font = FONT.mono;
      doc.font(font).fontSize(size);
      const text = codeLines.join('\n') || ' ';
      const width = maxW - padX * 2;
      const textHeight = doc.heightOfString(text, { width, lineGap: 2 });
      const blockHeight = textHeight + padY * 2;

      ensureSpace(0.2 * doc.currentLineHeight(true) + blockHeight + 0.3 * doc.currentLineHeight(true));
      doc.moveDown(0.2);

      doc.save();
      doc.roundedRect(margin, doc.y, maxW, blockHeight, 3).fill(COLORS.codeBg);
      doc.restore();

      doc.fillColor(COLORS.charcoal).font(font).fontSize(size)
        .text(text, margin + padX, doc.y + padY, { width, lineGap: 2 });

      doc.y = doc.y - padY + blockHeight; // land cursor just under the card
      doc.moveDown(0.3);
    };

    // Blockquote: left accent bar + indented italic text, sized to the
    // full quoted paragraph rather than per source line.
    const blockquote = (quoteLines) => {
      const size = 10;
      const indent = 16;
      const width = maxW - indent - 8;
      const text = quoteLines.join(' ').trim();
      doc.font(FONT.italic).fontSize(size);
      const textHeight = doc.heightOfString(text, { width, lineGap: 3 });
      const blockHeight = textHeight + 12;

      ensureSpace(0.2 * doc.currentLineHeight(true) + blockHeight + 0.3 * doc.currentLineHeight(true));
      doc.moveDown(0.2);

      const barTop = doc.y;
      doc.save();
      doc.rect(margin, barTop, 2.5, blockHeight).fill(COLORS.lightAsh);
      doc.restore();

      doc.fillColor(COLORS.charcoal).font(FONT.italic).fontSize(size)
        .text(text, margin + indent, barTop + 6, { width, lineGap: 3 });

      doc.y = barTop + blockHeight;
      doc.moveDown(0.3);
    };

    // Minimal pipe-table renderer: header row (bold, ruled) + body rows,
    // even column widths. Cell text is stripped of markdown markers (kept
    // simple and reliable rather than nesting rich runs inside cells).
    const table = (rows) => {
      if (!rows.length) return;
      const cols = rows[0].length;
      const colW = maxW / cols;
      const size = 9.5;
      const padY = 6;

      const rowHeight = (cells) => {
        doc.font(FONT.regular).fontSize(size);
        let h = 0;
        cells.forEach((c) => {
          h = Math.max(h, doc.heightOfString(c, { width: colW - 10, lineGap: 2 }));
        });
        return h + padY * 2;
      };

      rows.forEach((cells, rIdx) => {
        const isHeader = rIdx === 0;
        const h = rowHeight(cells);
        ensureSpace(h);
        const rowTop = doc.y;

        if (isHeader) {
          doc.save();
          doc.rect(margin, rowTop, maxW, h).fill(COLORS.hairline);
          doc.restore();
        }

        cells.forEach((c, cIdx) => {
          const x = margin + cIdx * colW;
          doc.fillColor(isHeader ? COLORS.black : COLORS.charcoal)
            .font(isHeader ? FONT.bold : FONT.regular).fontSize(size)
            .text(c, x + 5, rowTop + padY, { width: colW - 10, lineGap: 2 });
        });

        doc.y = rowTop + h;
        doc.strokeColor(COLORS.hairline).lineWidth(0.5)
          .moveTo(margin, doc.y).lineTo(pageWidth - margin, doc.y).stroke();
      });
      doc.moveDown(0.35);
    };

    // Header mark (first page only)
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

    doc.fillColor(COLORS.black).font(FONT.bold).fontSize(12)
      .text('ALTIQ AI', margin + logoSize + 10, margin + 2, { lineBreak: false });
    doc.fillColor(COLORS.ash).font(FONT.regular).fontSize(8)
      .text('Build. Position. Win.', margin + logoSize + 10, margin + 17, { lineBreak: false });

    const ruleY = margin + 38;
    doc.strokeColor(COLORS.black).lineWidth(1)
      .moveTo(margin, ruleY).lineTo(pageWidth - margin, ruleY).stroke();
    doc.strokeColor(COLORS.lightAsh).lineWidth(0.5)
      .moveTo(margin, ruleY + 2.5).lineTo(pageWidth - margin, ruleY + 2.5).stroke();

    doc.y = ruleY + 16;

    // Small accent mark ahead of the PROJECT label — a quiet typographic
    // flourish, not a second logo.
    doc.save();
    doc.rect(margin, doc.y + 3, 3, 3).fill(COLORS.black);
    doc.restore();
    write('PROJECT', { font: FONT.regular, size: 8, color: COLORS.ash, indent: 8, moveAfter: 0.2 });
    write(projectName, { font: FONT.bold, size: 11, color: COLORS.black, moveAfter: 0.5 });
    write(documentTitle, { font: FONT.bold, size: 18, color: COLORS.black, moveAfter: 0.35 });

    const dateStr = new Date(generatedAt).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
    write(version != null ? `Version ${version}  ·  ${dateStr}` : dateStr, {
      font: FONT.regular, size: 9, color: COLORS.ash, moveAfter: 0.5,
    });

    rule(COLORS.lightAsh, 0.6, 0, 0.75);

    // ------------------------------------------------------------------
    // Body: line-based block parser with lookahead so contiguous fenced
    // code, blockquote, and table lines render as one measured block
    // instead of one call per source line.
    // ------------------------------------------------------------------
    const lines = String(content || '').replace(/\r\n/g, '\n').split('\n');
    let pendingBlankGap = 0; // collapses runs of blank source lines into one measured gap
    const isTableSep = (l) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(l);
    const splitRow = (l) => l.trim().replace(/^\|/, '').replace(/\|$/, '')
      .split('|').map((c) => plainOf(tokenizeInline(c.trim())).trim());

    let i = 0;
    while (i < lines.length) {
      const line = lines[i];

      // Fenced code block
      if (/^```/.test(line.trim())) {
        const buf = [];
        i += 1;
        while (i < lines.length && !/^```/.test(lines[i].trim())) {
          buf.push(lines[i]);
          i += 1;
        }
        i += 1; // consume closing fence
        codeBlock(buf);
        pendingBlankGap = 0;
        continue;
      }

      // Horizontal rule
      if (/^---+$|^\*\*\*+$|^___+$/.test(line.trim())) {
        rule(COLORS.lightAsh, 0.6, 0.35, 0.55);
        pendingBlankGap = 0;
        i += 1;
        continue;
      }

      // Table: a row followed by a markdown separator row
      if (line.includes('|') && i + 1 < lines.length && isTableSep(lines[i + 1])) {
        const rows = [splitRow(line)];
        i += 2; // header + separator
        while (i < lines.length && lines[i].trim() && lines[i].includes('|')) {
          rows.push(splitRow(lines[i]));
          i += 1;
        }
        table(rows);
        pendingBlankGap = 0;
        continue;
      }

      // Blockquote (contiguous lines)
      if (/^>\s?/.test(line)) {
        const buf = [];
        while (i < lines.length && /^>\s?/.test(lines[i])) {
          buf.push(lines[i].replace(/^>\s?/, ''));
          i += 1;
        }
        blockquote(buf);
        pendingBlankGap = 0;
        continue;
      }

      const h1 = line.match(/^#\s+(.+)/);
      const h2 = line.match(/^##\s+(.+)/);
      const h3 = line.match(/^###\s+(.+)/);
      const h4 = line.match(/^####\s+(.+)/);
      if (h1) {
        write(plainOf(tokenizeInline(h1[1])), {
          font: FONT.bold, size: 14, color: COLORS.black, lineGap: 4,
          moveBefore: 0.25, moveAfter: 0.35, minFollow: 14,
        });
        pendingBlankGap = 0; i += 1; continue;
      }
      if (h2) {
        write(plainOf(tokenizeInline(h2[1])), {
          font: FONT.bold, size: 12, color: COLORS.black, lineGap: 3,
          moveBefore: 0.2, moveAfter: 0.28, minFollow: 12,
        });
        pendingBlankGap = 0; i += 1; continue;
      }
      if (h3 || h4) {
        write(plainOf(tokenizeInline((h3 || h4)[1])), {
          font: FONT.bold, size: 10.5, color: COLORS.charcoal, lineGap: 3,
          moveBefore: 0.15, moveAfter: 0.22, minFollow: 10,
        });
        pendingBlankGap = 0; i += 1; continue;
      }

      // Nested bullets: indent step of 2 spaces = one nesting level
      const bullet = line.match(/^(\s*)[\-\*•]\s+(.+)/);
      if (bullet) {
        const level = Math.floor(bullet[1].length / 2);
        const indent = 10 + level * 14;
        const marker = level === 0 ? '•' : '–';
        const tokens = [{ text: `${marker}  ` }, ...tokenizeInline(bullet[2])];
        writeRich(tokens, { size: 10, indent, lineGap: 3, moveAfter: 0.2 });
        pendingBlankGap = 0; i += 1; continue;
      }

      const num = line.match(/^(\s*)(\d+)\.\s+(.+)/);
      if (num) {
        const level = Math.floor(num[1].length / 2);
        const indent = 10 + level * 14;
        const tokens = [{ text: `${num[2]}.  ` }, ...tokenizeInline(num[3])];
        writeRich(tokens, { size: 10, indent, lineGap: 3, moveAfter: 0.2 });
        pendingBlankGap = 0; i += 1; continue;
      }

      if (!line.trim()) {
        // Don't move the cursor for a blank line yet (moveDown with nothing
        // after it is exactly what produces a phantom trailing page). Instead
        // fold it into the next real block's spacing.
        pendingBlankGap += 1;
        i += 1;
        continue;
      }

      writeRich(tokenizeInline(line), {
        size: 10, lineGap: 3,
        moveBefore: pendingBlankGap > 0 ? 0.35 : 0, moveAfter: 0.28,
      });
      pendingBlankGap = 0;
      i += 1;
    }

    // Final, authoritative page count — computed only after all real content
    // has been placed, so numbering is always accurate.
    const range = doc.bufferedPageRange();
    const totalPages = range.count;

    for (let p = 0; p < totalPages; p += 1) {
      doc.switchToPage(range.start + p);

      // Draw the footer inside what pdfkit considers the "margin" band.
      // Temporarily relaxing the bottom margin to 0 for this page stops
      // pdfkit's own overflow check from firing on doc.text() here — that
      // check firing was the root cause of stray extra pages appearing
      // after the footer pass. Restored immediately after.
      const realBottomMargin = doc.page.margins.bottom;
      doc.page.margins.bottom = 0;

      const footerRuleY = doc.page.height - 50;
      const footerTextY = doc.page.height - 40;

      doc.strokeColor(COLORS.lightAsh).lineWidth(0.5)
        .moveTo(margin, footerRuleY).lineTo(pageWidth - margin, footerRuleY).stroke();
      doc.fillColor(COLORS.ash).font(FONT.regular).fontSize(8)
        .text('ALTIQ AI  ·  Generated for builders', margin, footerTextY, {
          width: maxW * 0.65,
          lineBreak: false,
        });
      doc.fillColor(COLORS.ash).font(FONT.regular).fontSize(8)
        .text(`Page ${p + 1} of ${totalPages}`, margin, footerTextY, {
          width: maxW,
          align: 'right',
          lineBreak: false,
        });

      doc.page.margins.bottom = realBottomMargin;
    }

    doc.end();
  });
}

module.exports = { buildBrandedPdf };
