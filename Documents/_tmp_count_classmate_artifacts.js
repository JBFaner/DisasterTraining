const fs = require('fs');
const text = fs.readFileSync('C:/Users/Rem/Documents/New folder/DisasterTraining/Documents/_tmp_ch15_classmate_extract.txt', 'utf8');
const lines = text.split(/\r?\n/);

let start = -1;
for (let i = 0; i < lines.length; i++) {
  if (/^3\.4 Scrum Artifacts\s*$/i.test(lines[i].trim()) || /^3\.4 Scrum Artifacts$/i.test(lines[i].trim().replace(/\s+/g,' '))) {
    // skip TOC-like lines with dots
    if (/\.{5,}/.test(lines[i])) continue;
    start = i;
    break;
  }
}
// fallback: first "3.4 Scrum Artifacts" without long dots after page 1000-ish
if (start < 0) {
  for (let i = 1000; i < lines.length; i++) {
    if (/3\.4 Scrum Artifacts/i.test(lines[i]) && !/\.{5,}/.test(lines[i])) { start = i; break; }
  }
}

let end = lines.length;
for (let i = start + 1; i < lines.length; i++) {
  if (/Figure no\.\s*8/i.test(lines[i]) || /^3\.5\b/.test(lines[i].trim()) || /^3\.6\b/.test(lines[i].trim())) {
    end = i;
    break;
  }
}

const slice = lines.slice(start, end);
fs.writeFileSync('C:/Users/Rem/Documents/New folder/DisasterTraining/Documents/_tmp_ch15_artifacts_body.txt', slice.join('\n'));
console.log('body start', start+1, 'end', end+1, 'lines', slice.length);

// Split by table captions
const sections = [
  { name: 'Table 3 Product Backlog', startRe: /Table no\.\s*3 Product Backlog/i, endRe: /3\.4\.2|Table no\.\s*4/i },
  { name: 'Table 4 EIS InfoSec', startRe: /Table no\.\s*4 Product Backlog for EIS Information/i, endRe: /3\.4\.3|Table no\.\s*5/i },
  { name: 'Table 5 EIS Standards', startRe: /Table no\.\s*5 Product Backlog for EIS Standards/i, endRe: /3\.4\.3\.1|Table no\.\s*6/i },
  { name: 'Table 6 UI/UX', startRe: /Table no\.\s*6 UI\/UX/i, endRe: /3\.4\.4|Table no\.\s*7/i },
  { name: 'Table 7 EIS Integration', startRe: /Table no\.\s*7 Product Backlog for EIS Integration/i, endRe: /3\.4\.5|Table no\.\s*8/i },
  { name: 'Table 8 App Analytics', startRe: /Table no\.\s*8 Application System Analytics/i, endRe: /3\.4\.5\.2|Table no\.\s*9/i },
  { name: 'Table 9 EIS Analytics', startRe: /Table no\.\s*9 EIS Analytics/i, endRe: /3\.4\.6|Table no\.\s*10/i },
  { name: 'Table 10 Sprint Backlog', startRe: /Table no\.\s*10 Sprint Backlog/i, endRe: /3\.4\.6\.1|Figure no\.\s*5/i },
  { name: 'Table 11 Increment', startRe: /Table no\.\s*11 Increment/i, endRe: /Figure no\.\s*8|3\.5|3\.6/i },
];

// Actually table captions appear AFTER the table content in some theses.
// Better approach: count between subsection headers.

const blocks = [
  { name: '3.4.1 Product Backlog', startRe: /^3\.4\.1 Product Backlog/, endRe: /^3\.4\.2 / },
  { name: '3.4.2 EIS Information Security', startRe: /^3\.4\.2 /, endRe: /^3\.4\.3 / },
  { name: '3.4.3 EIS Standards', startRe: /^3\.4\.3 Product Backlog for EIS Standards/, endRe: /^3\.4\.3\.1/ },
  { name: '3.4.3.1 UI/UX', startRe: /^3\.4\.3\.1/, endRe: /^3\.4\.4 / },
  { name: '3.4.4 EIS Integration', startRe: /^3\.4\.4 /, endRe: /^3\.4\.5 / },
  { name: '3.4.5.1 App Analytics', startRe: /^3\.4\.5\.1/, endRe: /^3\.4\.5\.2/ },
  { name: '3.4.5.2 EIS Analytics', startRe: /^3\.4\.5\.2/, endRe: /^3\.4\.6 / },
  { name: '3.4.6 Sprint Backlog', startRe: /^3\.4\.6 Sprint Backlog/, endRe: /^3\.4\.6\.1/ },
  { name: '3.4.7 Increment', startRe: /^3\.4\.7/, endRe: /^Table no\.\s*11|^Figure no\.\s*8|^3\.5/ },
];

function getBlock(startRe, endRe) {
  let s = -1, e = slice.length;
  for (let i = 0; i < slice.length; i++) {
    if (s < 0 && startRe.test(slice[i].trim())) s = i;
    else if (s >= 0 && endRe.test(slice[i].trim())) { e = i; break; }
  }
  return s >= 0 ? slice.slice(s, e) : [];
}

for (const b of blocks) {
  const block = getBlock(b.startRe, b.endRe);
  const joined = block.join('\n');
  // Count Done/To Do/In Progress status-like tokens in isolation? 
  // Count lines that look like story IDs or "As a"
  const asA = (joined.match(/\bAs an?\b/gi) || []).length;
  const done = (joined.match(/\bDone\b/g) || []).length;
  const high = (joined.match(/\bHigh\b/g) || []).length;
  const medium = (joined.match(/\bMedium\b/g) || []).length;
  const low = (joined.match(/\bLow\b/g) || []).length;
  // Numbered feature lines like F1, US-1, etc at start
  const idish = block.filter(l => /^(F|US|IS|UI|INT|ASA|EA|SB)?-?\d+\b/i.test(l.trim()) || /^\d+\s+/.test(l.trim())).length;
  console.log('\n' + b.name);
  console.log('  lines=', block.length, 'As a=', asA, 'Done=', done, 'H/M/L=', high, medium, low, 'idish=', idish);
  // print first 40 non-empty lines
  const nonempty = block.map(l => l.trim()).filter(Boolean);
  console.log('  sample:');
  nonempty.slice(0, 25).forEach(l => console.log('   | ' + l.slice(0, 120)));
  console.log('  ... last:');
  nonempty.slice(-8).forEach(l => console.log('   | ' + l.slice(0, 120)));
}

// Also list artifact FIGURES specifically
console.log('\n=== ARTIFACT FIGURES ===');
slice.forEach((l,i) => {
  if (/Figure no\.\s*[5-7]/i.test(l) || /Burndown|Velocity|Cumulative Flow/i.test(l)) {
    console.log(i + ': ' + l.trim());
  }
});

console.log('\n=== ARTIFACT TABLES LIST ===');
slice.forEach((l,i) => {
  if (/Table no\.\s*\d+/i.test(l)) console.log(i + ': ' + l.trim());
});
