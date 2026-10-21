// Gate 1 comparison: dataset POI counts vs reproducible OSM counts.
const comp = require('./concept_data_archive/competitors.json');
const cafe = require('./osm_cafe_counts.json');
const fnb = require('./osm_fnb_counts.json');
const demo = require('./concept_data_archive/demographics.json');

const keys = ['ciputat', 'ciputat_timur', 'pamulang', 'pondok_aren', 'serpong', 'serpong_utara', 'setu'];
const rows = [];
for (const k of keys) {
  const ds = comp.competitors[k].fnb;
  const osm = fnb[k].fnb_poi;
  const c = cafe[k].amenity_cafe;
  const pop = demo[k].population;
  rows.push({
    kec: k,
    dataset_fnb: ds,
    osm_cafe: c,
    osm_fnb: osm,
    ds_over_osm: +(ds / osm).toFixed(2),
    'osm_fnb_per_10k': +((osm / pop) * 10000).toFixed(2),
    'ds_fnb_per_10k': +((ds / pop) * 10000).toFixed(2),
  });
}
console.table(rows);

const rank = (arr, key) =>
  [...arr].sort((a, b) => b[key] - a[key]).map((r) => r.kec);
console.log('\nRanking by dataset_fnb :', rank(rows, 'dataset_fnb').join(' > '));
console.log('Ranking by osm_fnb     :', rank(rows, 'osm_fnb').join(' > '));
console.log('Ranking by osm_cafe    :', rank(rows, 'osm_cafe').join(' > '));
console.log('Ranking by osm per10k  :', rank(rows, 'osm_fnb_per_10k').join(' > '));
console.log('Ranking by dataset p10k:', rank(rows, 'ds_fnb_per_10k').join(' > '));

const dsTot = rows.reduce((s, r) => s + r.dataset_fnb, 0);
const osmTot = rows.reduce((s, r) => s + r.osm_fnb, 0);
console.log('\ndataset fnb total =', dsTot, '| osm fnb total =', osmTot, '| ratio =', (dsTot / osmTot).toFixed(2));
