const d = require('./concept_data_archive/demographics.json');
const b = require('./concept_data_archive/biMetrics.json');
const c = require('./concept_data_archive/competitors.json');
const t = require('./concept_data_archive/traffic.json');

const ks = Object.keys(d);
let tp = 0, ta = 0;
for (const k of ks) {
  const x = d[k];
  tp += x.population;
  ta += x.area;
  const recomputed = x.population / x.area;
  console.log(
    k.padEnd(14),
    'pop=' + String(x.population).padStart(7),
    'area=' + String(x.area).padStart(6),
    'density=' + String(x.density).padStart(6),
    'recalc=' + recomputed.toFixed(0).padStart(6),
    recomputed.toFixed(0) == x.density ? 'OK' : 'MISMATCH',
    '| dayaBeli=' + b[k].dayaBeli,
    'sewa=' + b[k].biayaSewa,
    'growth=' + b[k].trenHistoris,
    'anchor=' + b[k].anchorPoiCount,
    '| fnb=' + String(c.competitors[k].fnb).padStart(3),
    '| acc=' + t[k].accessibilityScore,
    t[k].trafficLevel
  );
}
console.log('\nTOTAL pop=' + tp, 'area=' + ta.toFixed(2), 'density=' + (tp / ta).toFixed(0));
console.log('share Pamulang=' + ((d.pamulang.population / tp) * 100).toFixed(2) + '%');
console.log('share Serpong  =' + ((d.serpong.population / tp) * 100).toFixed(2) + '%');
console.log('share PondokAren=' + ((d.pondok_aren.population / tp) * 100).toFixed(2) + '%');

const g = require('./concept_data_archive/geojson/tangsel_subdistricts.json');
console.log('\ngeojson type=' + g.type, 'features=' + g.features.length);
console.log('keys=' + Object.keys(g).join(','));
console.log(JSON.stringify(g.features.map((f) => f.properties)));
const names = g.features.map((f) => (f.properties.NAME_3 || f.properties.name || '').toLowerCase().replace(/\s+/g, '_'));
console.log('geom names=' + JSON.stringify(names));
