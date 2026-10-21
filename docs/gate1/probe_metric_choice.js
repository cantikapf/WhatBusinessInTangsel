// Gate 1 rekomendasi: dampak penggantian data konsep -> data terverifikasi terhadap sebaran skor.
// Bukan Gate 3 (belum menyentuh bobot); hanya menunjukkan apa yang berubah kalau input diganti.
const d = require('./derived_population.json');
const osm = require('./osm_fnb_counts.json');
const old = require('./concept_data_archive/competitors.json');
const oldDemo = require('./concept_data_archive/demographics.json');

const KEC = ['serpong', 'serpong_utara', 'pondok_aren', 'ciputat', 'ciputat_timur', 'pamulang', 'setu'];

// S1 = density / 12725 (normalizer lama, belum dikalibrasi)
const s1 = (dens) => Math.min(1, dens / 12725);
// S3 absolut: 1 - comp/maxComp  (maxComp = max nyata di data)
const maxAbs = Math.max(...KEC.map((k) => osm[k].fnb_poi));
// S3 per kapita: laju per 10k dinormalisasi ke max laju
const rate = (k) => (osm[k].fnb_poi / d.by_kecamatan[k].population) * 10000;
const maxRate = Math.max(...KEC.map(rate));

const rows = KEC.map((k) => {
  const pop = d.by_kecamatan[k].population;
  const dens = d.by_kecamatan[k].density;
  const comp = osm[k].fnb_poi;
  return {
    kec: k,
    dens,
    comp,
    fnb_per_10k: +rate(k).toFixed(2),
    'S1_konsep': +s1(oldDemo[k].density).toFixed(3),
    'S1_resmi': +s1(dens).toFixed(3),
    'S3_abs': +(1 - comp / maxAbs).toFixed(3),
    'S3_perkapita': +(1 - rate(k) / maxRate).toFixed(3),
    'urutan_S3_abs': 0,
    'urutan_S3_pk': 0,
  };
});

const rankBy = (key) => [...rows].sort((a, b) => b[key] - a[key]).map((r) => r.kec);
const absRank = rankBy('S3_abs');
const pkRank = rankBy('S3_perkapita');
rows.forEach((r) => {
  r.urutan_S3_abs = absRank.indexOf(r.kec) + 1;
  r.urutan_S3_pk = pkRank.indexOf(r.kec) + 1;
});
console.table(rows);

const s1s = rows.map((r) => r.S1_resmi);
const s1o = rows.map((r) => r.S1_konsep);
console.log('S1 konsep: min', Math.min(...s1o).toFixed(3), 'max', Math.max(...s1o).toFixed(3), 'spread', (Math.max(...s1o) - Math.min(...s1o)).toFixed(3));
console.log('S1 resmi : min', Math.min(...s1s).toFixed(3), 'max', Math.max(...s1s).toFixed(3), 'spread', (Math.max(...s1s) - Math.min(...s1s)).toFixed(3));
console.log('\nurutan S3 absolut   :', absRank.join(' > '));
console.log('urutan S3 per kapita:', pkRank.join(' > '));
const diff = rows.filter((r) => r.urutan_S3_abs !== r.urutan_S3_pk).map((r) => `${r.kec} (${r.urutan_S3_abs}->${r.urutan_S3_pk})`);
console.log('berubah peringkat   :', diff.join(', ') || 'tidak ada');
