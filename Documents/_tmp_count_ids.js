const fs = require('fs');
const slice = fs.readFileSync('C:/Users/Rem/Documents/New folder/DisasterTraining/Documents/_tmp_ch15_artifacts_body.txt', 'utf8').split(/\r?\n/);
const joined = slice.join('\n');

function uniqueIds(re) {
  const set = new Set();
  let m;
  const r = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  while ((m = r.exec(joined)) !== null) {
    set.add(m[0].toUpperCase().replace(/\s+/g, ''));
  }
  return [...set].sort((a, b) => {
    const na = parseInt(a.replace(/\D/g, ''), 10);
    const nb = parseInt(b.replace(/\D/g, ''), 10);
    return na - nb;
  });
}

const groups = {
  F: uniqueIds(/\bF\s*-?\s*\d{1,3}\b/gi).filter(x => {
    const n = parseInt(x.replace(/\D/g,''),10); return n >= 1 && n <= 80;
  }),
  IS: uniqueIds(/\bIS\s*-?\s*\d{1,3}\b/gi),
  STD: uniqueIds(/\bSTD\s*-?\s*\d{1,3}\b/gi),
  UI: uniqueIds(/\bUI\s*-?\s*\d{1,3}\b/gi),
  INT: uniqueIds(/\bINT\s*-?\s*\d{1,3}\b/gi),
  ASA: uniqueIds(/\bASA\s*-?\s*\d{1,3}\b/gi),
  EA: uniqueIds(/\bEA\s*-?\s*\d{1,3}\b/gi),
};

for (const [k, v] of Object.entries(groups)) {
  console.log(k + ': count=' + v.length + ' => ' + v.join(', '));
}

// Sprint backlog task numbers - look in 3.4.6 section only
const sbStart = slice.findIndex(l => /^3\.4\.6 Sprint Backlog/.test(l.trim()));
const sbEnd = slice.findIndex((l, i) => i > sbStart && /^3\.4\.6\.1/.test(l.trim()));
const sb = slice.slice(sbStart, sbEnd > 0 ? sbEnd : sbStart + 600).join('\n');
const taskNos = new Set();
let m;
const tre = /\bT\s*-?\s*\d{1,3}\b/gi;
while ((m = tre.exec(sb)) !== null) {
  const n = parseInt(m[0].replace(/\D/g,''),10);
  if (n >= 1 && n <= 200) taskNos.add('T' + n);
}
console.log('Sprint tasks T*: ' + taskNos.size, [...taskNos].sort((a,b)=>parseInt(a.slice(1))-parseInt(b.slice(1))).join(', '));

// Also look for Sprint 1/2/3/4 headers and row-like patterns
const sprintHeaders = (sb.match(/Sprint\s*[1-8]/gi) || []);
console.log('Sprint headers mentions:', sprintHeaders.length, [...new Set(sprintHeaders.map(s=>s.toLowerCase()))]);

// Increment IDs
const incStart = slice.findIndex(l => /^3\.4\.7/.test(l.trim()));
const inc = slice.slice(incStart).join('\n');
const incIds = new Set();
const ire = /\bINC\s*-?\s*\d{1,3}\b/gi;
while ((m = ire.exec(inc)) !== null) incIds.add(m[0].toUpperCase().replace(/\s+/g,''));
// Or just count "Done" in increment section
const incDone = (inc.match(/\bDone\b/g) || []).length;
console.log('Increment INC*:', [...incIds].sort());
console.log('Increment Done count:', incDone);

// Print increment sample
console.log('\nINCREMENT SAMPLE:');
slice.slice(incStart, incStart + 80).map(l=>l.trim()).filter(Boolean).forEach(l => console.log('| ' + l.slice(0,120)));

console.log('\nSPRINT BACKLOG SAMPLE (first 60 nonempty):');
slice.slice(sbStart, sbStart + 100).map(l=>l.trim()).filter(Boolean).slice(0,60).forEach(l => console.log('| ' + l.slice(0,120)));
