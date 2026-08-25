const fs = require('fs');
const text = fs.readFileSync('C:/Users/Rem/Documents/New folder/DisasterTraining/Documents/_tmp_ch15_classmate_extract.txt', 'utf8');
const lines = text.split(/\r?\n/);

// Extract section around 3.4 through end of increment (before architecture figures)
const start = lines.findIndex(l => /3\.4 Scrum Artifacts/i.test(l));
const end = lines.findIndex((l, i) => i > start && /Figure no\.\s*8/i.test(l));
const slice = lines.slice(start, end > 0 ? end : start + 2000);

fs.writeFileSync(
  'C:/Users/Rem/Documents/New folder/DisasterTraining/Documents/_tmp_ch15_artifacts_section.txt',
  slice.join('\n'),
  'utf8'
);
console.log('START_LINE', start + 1, 'END', (end > 0 ? end : start + 2000) + 1, 'LEN', slice.length);

// Find subsection headers and table markers with nearby content
const markers = [];
slice.forEach((l, i) => {
  if (/^3\.4|^Table no\.|^Figure no\./i.test(l.trim()) || /Product Backlog|Sprint Backlog|Increment|Burndown|Velocity|Cumulative/i.test(l.trim()) && l.trim().length < 80) {
    markers.push({ i, line: l.trim() });
  }
});
console.log('MARKERS');
markers.forEach(m => console.log(m.i + ': ' + m.line));
