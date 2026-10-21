// Gate 1: delta dataset vs sumber primer per kecamatan.
const demo = require('./concept_data_archive/demographics.json');
const comp = require('./concept_data_archive/competitors.json');
const fnb = require('./osm_fnb_counts.json');

const OFFICIAL = {
  serpong: { pop: 172931, area: 28.27 },
  serpong_utara: { pop: 145190, area: 22.36 },
  pondok_aren: { pop: 310955, area: 29.80 },
  ciputat: { pop: 233528, area: 21.11 },
  ciputat_timur: { pop: 175673, area: 17.82 },
  pamulang: { pop: 339054, area: 28.74 },
  setu: { pop: 96980, area: 16.76 },
};

const rows = [];
let dp = 0, da = 0, op = 0, oa = 0;
for (const [k, o] of Object.entries(OFFICIAL)) {
  const d = demo[k];
  const dsArea = d.area || d.area_km2;
  dp += d.population; da += dsArea; op += o.pop; oa += o.area;
  rows.push({
    kec: k,
    pop_dataset: d.population,
    pop_off: o.pop,
    pop_delta_pct: +(((d.population - o.pop) / o.pop) * 100).toFixed(2),
    area_dataset: dsArea,
    area_off: o.area,
    area_delta_pct: +(((dsArea - o.area) / o.area) * 100).toFixed(2),
    dens_dataset: d.density || Math.round(d.population / dsArea),
    dens_off: Math.round(o.pop / o.area),
    dens_delta_pct: +((((d.density || d.population / dsArea) - o.pop / o.area) / (o.pop / o.area)) * 100).toFixed(1),
    fnb_dataset: comp.competitors[k].fnb,
    fnb_osm: fnb[k].fnb_poi,
    osm_fnb_per_km2: +(fnb[k].fnb_poi / o.area).toFixed(2),
  });
}
console.table(rows);
console.log('\nTOTAL pop dataset', dp, 'vs resmi', op, '->', (((dp - op) / op) * 100).toFixed(2) + '%');
console.log('TOTAL luas dataset', da.toFixed(2), 'vs resmi', oa.toFixed(2), '->', (((da - oa) / oa) * 100).toFixed(2) + '%');
