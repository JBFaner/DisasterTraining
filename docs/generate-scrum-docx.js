const fs = require('fs');
const path = require('path');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ShadingType,
  AlignmentType,
  PageBreak,
} = require('docx');

const mdPath = path.join(__dirname, 'chapter-3-scrum-artifacts-alertara.md');
const outPath = path.join(
  __dirname,
  process.env.SCRUM_DOCX_OUT || 'Chapter-3-Scrum-Artifacts-AlertaraQC.docx',
);
const md = fs.readFileSync(mdPath, 'utf8');

const border = { style: BorderStyle.SINGLE, size: 4, color: '94A3B8' };
const borders = { top: border, bottom: border, left: border, right: border };
const headerShading = { type: ShadingType.CLEAR, fill: 'E2E8F0' };

function cell(text, opts = {}) {
  return new TableCell({
    borders,
    width: { size: opts.width || 2000, type: WidthType.DXA },
    shading: opts.header ? headerShading : undefined,
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: String(text ?? '').replace(/\|/g, '/'),
            bold: !!opts.header,
            size: opts.header ? 16 : 14,
            font: 'Calibri',
          }),
        ],
      }),
    ],
  });
}

function makeTable(headers, rows) {
  const colWidth = Math.floor(9000 / Math.max(headers.length, 1));
  const headerRow = new TableRow({
    children: headers.map((h) => cell(h, { header: true, width: colWidth })),
  });
  const bodyRows = rows.map(
    (r) =>
      new TableRow({
        children: headers.map((_, i) => cell(r[i] ?? '', { width: colWidth })),
      }),
  );
  return new Table({
    width: { size: 9000, type: WidthType.DXA },
    rows: [headerRow, ...bodyRows],
  });
}

function parseMarkdownTables(text) {
  const lines = text.split(/\r?\n/);
  const blocks = [];
  let i = 0;
  let bufferParas = [];

  const flushParas = () => {
    if (bufferParas.length) {
      blocks.push({ type: 'paras', lines: bufferParas.slice() });
      bufferParas = [];
    }
  };

  while (i < lines.length) {
    const line = lines[i];
    if (line.trim().startsWith('|') && i + 1 < lines.length && /^\|?\s*:-/.test(lines[i + 1].replace(/\|/g, '|')) || (line.trim().startsWith('|') && i + 1 < lines.length && lines[i + 1].includes('---'))) {
      flushParas();
      const tableLines = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      // remove separator
      const header = tableLines[0]
        .split('|')
        .slice(1, -1)
        .map((c) => c.trim());
      const rows = tableLines.slice(2).map((row) =>
        row
          .split('|')
          .slice(1, -1)
          .map((c) => c.trim().replace(/\*\*/g, '')),
      ).filter((r) => r.some((c) => c.length));
      blocks.push({ type: 'table', headers: header, rows });
      continue;
    }
    bufferParas.push(line);
    i++;
  }
  flushParas();
  return blocks;
}

function paraFromLine(line) {
  const t = line.trim();
  if (!t) return new Paragraph({ children: [] });
  if (t.startsWith('# ')) {
    return new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: t.slice(2), bold: true, font: 'Calibri' })],
    });
  }
  if (t.startsWith('## ')) {
    return new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [new TextRun({ text: t.slice(3), bold: true, font: 'Calibri' })],
    });
  }
  if (t.startsWith('### ')) {
    return new Paragraph({
      heading: HeadingLevel.HEADING_3,
      children: [new TextRun({ text: t.slice(4), bold: true, font: 'Calibri' })],
    });
  }
  if (t.startsWith('- ')) {
    return new Paragraph({
      bullet: { level: 0 },
      children: [new TextRun({ text: t.slice(2).replace(/\*\*/g, ''), size: 20, font: 'Calibri' })],
    });
  }
  // bold **x**
  const clean = t.replace(/\*\*/g, '');
  return new Paragraph({
    spacing: { after: 80 },
    children: [new TextRun({ text: clean, size: 20, font: 'Calibri' })],
  });
}

const blocks = parseMarkdownTables(md);
const children = [
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({
        text: 'LGU Disaster Preparedness Training & Simulation System (AlertaraQC)',
        bold: true,
        size: 28,
        font: 'Calibri',
      }),
    ],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 300 },
    children: [
      new TextRun({
        text: 'Chapter 3.3–3.4 Scrum Cycles & Artifacts — Barangay San Agustin Pilot',
        size: 22,
        font: 'Calibri',
        italics: true,
      }),
    ],
  }),
];

for (const block of blocks) {
  if (block.type === 'paras') {
    for (const line of block.lines) {
      children.push(paraFromLine(line));
    }
  } else if (block.type === 'table') {
    children.push(new Paragraph({ children: [] }));
    children.push(makeTable(block.headers, block.rows));
    children.push(new Paragraph({ children: [] }));
  }
}

const doc = new Document({
  sections: [
    {
      properties: {
        page: {
          margin: { top: 720, bottom: 720, left: 720, right: 720 },
        },
      },
      children,
    },
  ],
});

const tableStats = blocks
  .filter((b) => b.type === 'table')
  .map((b, idx) => ({ idx: idx + 1, cols: b.headers.length, rows: b.rows.length, header0: b.headers[0] }));
console.log('Table stats:', JSON.stringify(tableStats, null, 2));

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(outPath, buffer);
  console.log('Wrote', outPath);
  console.log('Size MB', (buffer.length / 1024 / 1024).toFixed(2));
  console.log('Tables', tableStats.length);
  console.log('Total data rows', tableStats.reduce((n, t) => n + t.rows, 0));
});
