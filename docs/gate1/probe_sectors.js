// Gate 1: ringkasan 3 sektor terpilih + anchor, dengan normalizer DITURUNKAN dari data.
const fs = require('fs');
const path = require('path');
const g = JSON.parse(fs.readFileSync(path.join(__dirname, 'osm_boundaries.geojson'), 'utf8'));
const s = require('./osm_sector_counts.json');
const d = require('./derived_population.json').by_kecamatan;

const KEC = ['serpong', 'serpong_utara', 'pondok_aren', 'ciputat', 'ciputat_timur', 'pamulang', 'setu'];
const SECTORS = ['retail', 'health', 'education'];

console.log('boundaries:', g.features.length, 'features |', g.features.map((f) => `${f.properties.id}=${f.properties.area_km2}`).join(' '));

const maxAbs = Object.fromEntries(SECTORS.map((s2) => [s2, Math.max(...KEC.map((k) => s[k][s2]))]));
const rate = (k, s2) => (s[k][s2] / d[k].population) * 10000;
const maxRate = Object.fromEntries(SECTORS.map((s2) => [s2, Math.max(...KEC.map((k) => rate(k, s2)))]));
const maxAnchor = Math.max(...KEC.map((k) => s[k].anchor));

const rows = KEC.map((k) => {
  const r = { kec: k, pop: d[k].population, area: d[k].area_km2, dens: d[k].density, anchor: s[k].anchor };
  for (const sec of SECTORS) {
    r[`${sec}_n`] = s[k][sec];
    r[`${sec}_10k`] = +rate(k, sec).toFixed(2);
    r[`S3_${sec}_pk`] = +(1 - rate(k, sec) / maxRate[sec]).toFixed(3);
  }
  return r;
});
console.table(rows);

console.log('\nnormalizer diturunkan dari data (bukan diasumsikan):');
console.log('  max absolut  :', JSON.stringify(maxAbs));
console.log('  max per 10k  :', JSON.stringify(Object.fromEntries(Object.entries(maxRate).map(([k, v]) => [k, +v.toFixed(2)]))));
console.log('  max anchor   :', maxAnchor);

for (const sec of SECTORS) {
  const byPk = [...rows].sort((a, b) => b[`S3_${sec}_pk`] - a[`S3_${sec}_pk`]).map((r) => r.kec);
  const byAbs = [...rows].sort((a, b) => b[`${sec}_n`] - a[`${sec}_n`]).map((r) => r.kec);
  const moved = rows.filter((r) => byAbs.indexOf(r.kec) !== byPk.indexOf(r.kec)).length;
  console.log(`\n${sec}: absolut ${byAbs.join(' > ')}`);
  console.log(`${' '.repeat(sec.length)}  per kapita ${byPk.join(' > ')}  (${moved}/7 posisi berbeda)`);
}
