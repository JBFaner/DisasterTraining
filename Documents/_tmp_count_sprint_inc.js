const fs = require('fs');
const slice = fs.readFileSync('C:/Users/Rem/Documents/New folder/DisasterTraining/Documents/_tmp_ch15_artifacts_body.txt', 'utf8').split(/\r?\n/);
const joined = slice.join('\n');

// Sprint task IDs like S1_1, S1_2, S2_1
const tasks = new Set();
let m;
const re = /\bS(\d)\s*_\s*(\d{1,2})\b/gi;
while ((m = re.exec(joined)) !== null) {
  tasks.add('S' + m[1] + '_' + m[2]);
}
const sorted = [...tasks].sort((a, b) => {
  const [sa, ta] = a.slice(1).split('_').map(Number);
  const [sb, tb] = b.slice(1).split('_').map(Number);
  return sa - sb || ta - tb;
});
console.log('Sprint tasks count=', sorted.length);
console.log(sorted.join(', '));

// Per sprint
for (let s = 1; s <= 10; s++) {
  const c = sorted.filter(t => t.startsWith('S' + s + '_')).length;
  if (c) console.log('Sprint', s, 'tasks=', c);
}

// Increment feature rows: look for "Spr int" blocks with Done
const incStart = slice.findIndex(l => /^3\.4\.7/.test(l.trim()));
const incEnd = slice.findIndex((l, i) => i > incStart && /Table no\.\s*11 Increment/i.test(l));
const incLines = slice.slice(incStart, incEnd > 0 ? incEnd + 1 : undefined);
const incText = incLines.join('\n');
const done = (incText.match(/\bDone\b/g) || []).length;
console.log('\nIncrement section lines', incLines.length, 'Done=', done);

// Try to find feature titles after Sprint markers
const features = [];
for (let i = 0; i < incLines.length; i++) {
  const t = incLines[i].trim();
  // lines that look like feature names (short-ish, after Sprint)
  if (/^Secure |^Password|^Facility|^Reservation|^QR |^AI |^Admin |^Payment|^Notification|^Report|^CIMM|^Staff |^Resident /i.test(t)) {
    features.push(t);
  }
}
console.log('feature-like lines', features.length);
features.forEach(f => console.log(' -', f));

// Dump more of increment for manual count - nonempty lines only
console.log('\n=== FULL INCREMENT NONEMPTY (truncated page nums) ===');
incLines.map(l => l.trim()).filter(l => l && !/^-- \d+ of \d+ --$/.test(l) && !/^\d{1,3}$/.test(l)).forEach(l => console.log(l.slice(0, 100)));
