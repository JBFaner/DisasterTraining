const fs = require('fs');
const { PDFParse } = require('pdf-parse');

const pdfPath = 'C:/Users/Rem/Downloads/CHAPTER 1 -5 (2).pdf';
const outPath = 'C:/Users/Rem/Documents/New folder/DisasterTraining/Documents/_tmp_ch15_classmate_extract.txt';

async function run() {
  const parser = new PDFParse({ data: fs.readFileSync(pdfPath) });
  const result = await parser.getText();
  const text = result.text || '';
  fs.writeFileSync(outPath, text, 'utf8');
  console.log('CHARS=' + text.length);

  const lines = text.split(/\r?\n/);
  const keys = [
    /scrum artifact/i,
    /product backlog/i,
    /sprint backlog/i,
    /\bincrement\b/i,
    /burndown/i,
    /3\.4/,
    /table no\.?/i,
    /figure no\.?/i,
    /user stor/i,
    /CHAPTER\s*III/i,
    /CHAPTER\s*3/i,
    /Methodology/i,
  ];

  const hits = [];
  lines.forEach((line, i) => {
    const t = line.trim();
    if (!t) return;
    if (keys.some(k => k.test(t))) {
      hits.push((i + 1) + ': ' + t);
    }
  });
  console.log('HITS=' + hits.length);
  console.log(hits.join('\n'));
}

run().catch(e => { console.error(e); process.exit(1); });
