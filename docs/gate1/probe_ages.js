// Gate 1: turunkan youth_15_34_pct dan productive_pct per kecamatan dari tabel usia DKB.
// Input: docs/gate1/raw/KESELURUHAN1723170306278.txt (DKB Sem I 2024, punya tabel USIA bersih)
const fs = require('fs');
const path = require('path');

const txt = fs.readFileSync(path.join(__dirname, 'raw/KESELURUHAN1723170306278.txt'), 'utf8');
const lines = txt.split(/\r?\n/);

// baris contoh: "12   USIA 30  3.282  2.875  7.134  ...  48.732"
const re = /^\s*(\d{1,2})\s+USIA\s+(\d{1,3})\s+(.+)$/;
const byAge = new Map();
for (const ln of lines) {
  const m = ln.match(re);
  if (!m) continue;
  const nums = m[3].match(/[\d.]+/g);
  if (!nums || nums.length < 8) continue;
  const vals = nums.map((s) => Number(s.replace(/\./g, '')));
  byAge.set(Number(m[2]), vals); // [serpong, serpong_utara, pondok_aren, ciputat, ciputat_timur, pamulang, setu, kota]
}
const ages = [...byAge.keys()].sort((a, b) => a - b);
console.log('usia terbaca:', ages.length, 'dari', ages[0], 'sampai', ages[ages.length - 1]);

const kec = ['serpong', 'serpong_utara', 'pondok_aren', 'ciputat', 'ciputat_timur', 'pamulang', 'setu'];
const total = kec.map((_, i) => ages.reduce((s, a) => s + byAge.get(a)[i], 0));
const kotaTotal = ages.reduce((s, a) => s + byAge.get(a)[7], 0);
console.log('total per kec (dari tabel usia):', total.join(' '), '| kota:', kotaTotal);

const band = (lo, hi) =>
  kec.map((_, i) => ages.filter((a) => a >= lo && a <= hi).reduce((s, a) => s + byAge.get(a)[i], 0));

const youth = band(15, 34);
const prod = band(15, 64);
const rows = kec.map((k, i) => ({
  kec: k,
  youth_15_34_pct: +((youth[i] / total[i]) * 100).toFixed(2),
  productive_15_64_pct: +((prod[i] / total[i]) * 100).toFixed(2),
}));
console.table(rows);
const kotaYouth = (band(15, 34).reduce((a, b) => a + b, 0) / kotaTotal) * 100;
const kotaProd = (band(15, 64).reduce((a, b) => a + b, 0) / kotaTotal) * 100;
console.log('kota youth_15_34 =', kotaYouth.toFixed(2), '% | productive_15_64 =', kotaProd.toFixed(2), '%');

const demo = require('./concept_data_archive/demographics.json');
console.log('\ndataset biMetrics demografiUmur:');
for (const k of kec) console.log(' ', k, JSON.stringify(demo[k].demografiUmur || '(tidak ada di demographics)'));
