import { calculateScore, SCORE_WEIGHTS, normalizers } from '../../src/lib/engine/scoring.ts';

const KEC = ['serpong', 'serpong_utara', 'pondok_aren', 'ciputat', 'ciputat_timur', 'pamulang', 'setu'];
const SEC = ['retail', 'health', 'education'];

const rows = [];
for (const k of KEC) {
  for (const s of SEC) {
    const r = calculateScore(k, s);
    rows.push({ k, s, score: r.compositeScore, label: r.label, ...r.scores });
  }
}

const scores = rows.map((r) => r.score);
console.log('n=', rows.length, 'min', Math.min(...scores), 'max', Math.max(...scores));
console.log('spread', (Math.max(...scores) - Math.min(...scores)).toFixed(2), 'distinct', new Set(scores).size);
console.log('weights sum', Object.values(SCORE_WEIGHTS).reduce((a, b) => a + b, 0));
console.log('normalizers', JSON.stringify(normalizers));

for (const s of SEC) {
  const g = rows.filter((r) => r.s === s).sort((a, b) => b.score - a.score);
  console.log('\n' + s.toUpperCase());
  g.forEach((r, i) => console.log(`  ${i + 1}. ${r.k.padEnd(14)} ${r.score}  ${r.label}`));
}

console.log('\nPER-INDIKATOR SPREAD');
for (const key of ['S1', 'S2', 'S3', 'S4', 'S5', 'S6']) {
  const v = rows.map((r) => r[key]);
  const distinct = new Set(v.map((x) => x.toFixed(4))).size;
  console.log(`  ${key}  min ${Math.min(...v).toFixed(4)}  max ${Math.max(...v).toFixed(4)}  distinct ${distinct}/21`);
}
