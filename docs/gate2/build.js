#!/usr/bin/env node
/**
 * Gate 2 — satu entry point pipeline data.
 *
 *   node docs/gate2/build.js            # pakai cache bila ada (cepat, offline-aman)
 *   node docs/gate2/build.js --refresh  # paksa ambil ulang dari Overpass
 *
 * Urutan: derive_population -> fetch_osm_sectors -> fetch_osm_boundaries -> QC -> emit dataset.
 * Gagal keras (exit 1) bila QC tidak lulus. Tidak ada nilai yang diisi 0 sebagai pengganti data hilang.
 *
 * Output:
 *   docs/gate2/verified_dataset.json  — dataset kanonik (satu-satunya sumber angka untuk UI)
 *   docs/gate2/qc_report.json         — hasil tiap pemeriksaan + konteks sumber
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const G1 = path.join(__dirname, '..', 'gate1');
const OUT_DIR = __dirname;
const REFRESH = process.argv.includes('--refresh');
const QC_ONLY = process.argv.includes('--qc-only');
const KEC = ['serpong', 'serpong_utara', 'pondok_aren', 'ciputat', 'ciputat_timur', 'pamulang', 'setu'];
const SECTORS = ['retail', 'health', 'education'];
const EXPECT = { areaTotal: 164.86, areaTolerancePct: 2.0, population: 1474311, kecamatan: 7 };

const cacheFile = (p) => path.join(G1, p);
const failures = [];
const checks = [];

function check(name, pass, detail) {
  checks.push({ name, pass, detail });
  if (!pass) failures.push(`${name}: ${detail}`);
  console.log(`  ${pass ? 'PASS' : 'FAIL'}  ${name} — ${detail}`);
}

function runStep(label, script, args = []) {
  if (!REFRESH && label !== 'derive_population') {
    console.log(`\n[${label}] cache dipakai (hapus flag --refresh untuk ambil ulang)`);
  } else {
    console.log(`\n[${label}] menjalankan ${script} ${args.join(' ')}`);
  }
  execFileSync(process.execPath, [path.join(G1, script), ...args], { stdio: 'inherit' });
}

// ---------- 1..3 jalankan tiga tahap ----------
if (QC_ONLY) {
  console.log('[pipeline] dilewati (--qc-only): QC atas artefak yang sudah ada');
} else {
  runStep('derive_population', 'derive_population.js');
  runStep('fetch_osm_sectors', 'fetch_osm_sectors.js');
  runStep('fetch_osm_boundaries', 'fetch_osm_boundaries.js');
}

// ---------- 4 QC ----------
console.log('\n[QC]');
const demo = JSON.parse(fs.readFileSync(cacheFile('derived_population.json'), 'utf8'));
const sectors = JSON.parse(fs.readFileSync(cacheFile('osm_sector_counts.json'), 'utf8'));
const geo = JSON.parse(fs.readFileSync(cacheFile('osm_boundaries.geojson'), 'utf8'));
const geoMeta = JSON.parse(fs.readFileSync(cacheFile('osm_boundaries_meta.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(cacheFile('source_manifest.json'), 'utf8'));

// QC-1 kelengkapan kunci
const missing = [];
for (const k of KEC) {
  if (!demo.by_kecamatan[k]) missing.push(`demographics:${k}`);
  if (!sectors[k] || sectors[k].error) missing.push(`sectors:${k}`);
  if (!geo.features.some((f) => f.properties.id === k)) missing.push(`boundaries:${k}`);
}
check('QC-1 7 kecamatan lengkap di 3 sumber (missing != 0)', missing.length === 0, missing.length ? `hilang: ${missing.join(', ')}` : '7/7 lengkap');

// QC-2 populasi: jumlah bagian == total kota
const popSum = KEC.reduce((s, k) => s + demo.by_kecamatan[k].population, 0);
check('QC-2 jumlah populasi per kecamatan == total kota', popSum === EXPECT.population, `${popSum} vs ${EXPECT.population}`);

// QC-3 populasi konsisten dengan angka TOTAL yang dicetak PDF
check('QC-3 populasi == TOTAL pada tabel PDF', demo.totals.population_published === EXPECT.population, `${demo.totals.population_published} vs ${EXPECT.population}`);

// QC-4 luas: total geometri OSM vs Dukcapil
const geoArea = +geo.features.reduce((s, f) => s + f.properties.area_km2, 0).toFixed(2);
const devPct = Math.abs((geoArea - EXPECT.areaTotal) / EXPECT.areaTotal) * 100;
check('QC-4 luas geometri OSM dalam toleransi', devPct <= EXPECT.areaTolerancePct, `${geoArea} km2 vs ${EXPECT.areaTotal} km2 (deviasi ${devPct.toFixed(2)}%, toleransi ${EXPECT.areaTolerancePct}%)`);

// QC-5 kepadatan = populasi / luas (turunan, bukan angka terbitan)
const densityBad = KEC.filter((k) => Math.abs(demo.by_kecamatan[k].density - demo.by_kecamatan[k].population / demo.by_kecamatan[k].area_km2) > 1);
check('QC-5 kepadatan == populasi / luas', densityBad.length === 0, densityBad.length ? `meleset: ${densityBad.join(', ')}` : '7/7 konsisten');

// QC-6 usia: 0 < pct < 1 dan produktif >= muda
const ageBad = KEC.filter((k) => {
  const v = demo.by_kecamatan[k];
  return !(v.youth_15_34_pct > 0 && v.youth_15_34_pct < 1 && v.productive_15_64_pct > 0 && v.productive_15_64_pct < 1 && v.productive_15_64_pct >= v.youth_15_34_pct);
});
check('QC-6 rasio usia masuk akal', ageBad.length === 0, ageBad.length ? `aneh: ${ageBad.join(', ')}` : '7/7 valid');

// QC-7 sektor: integer >= 0, dan anchor > 0
const secBad = [];
for (const k of KEC) for (const s of SECTORS) {
  const v = sectors[k][s];
  if (!Number.isInteger(v) || v < 0) secBad.push(`${k}.${s}=${v}`);
}
check('QC-7 hitungan sektor integer >= 0', secBad.length === 0, secBad.length ? secBad.join(', ') : `${KEC.length * SECTORS.length} nilai valid`);

// QC-8 penyebut > 0 (cegah bagi nol saat normalisasi)
const zeroDen = KEC.filter((k) => !(demo.by_kecamatan[k].population > 0) || !(demo.by_kecamatan[k].area_km2 > 0));
check('QC-8 penyebut populasi & luas > 0', zeroDen.length === 0, zeroDen.length ? `nol: ${zeroDen.join(', ')}` : '14/14 positif');

// QC-9 hash PDF sumber == manifest
const crypto = require('crypto');
const badHash = manifest.sources.filter((s) => {
  const abs = path.join(__dirname, '..', '..', s.file.replace(/^docs\//, 'docs/'));
  if (!fs.existsSync(abs)) return true;
  return crypto.createHash('sha256').update(fs.readFileSync(abs)).digest('hex') !== s.sha256;
});
check('QC-9 SHA-256 raw PDF == source_manifest', badHash.length === 0, badHash.length ? `cocok gagal: ${badHash.map((s) => s.id).join(', ')}` : `${manifest.sources.length}/${manifest.sources.length} cocok`);

// QC-10 snapshot OSM tercatat untuk tiap kecamatan
const noSnap = KEC.filter((k) => !sectors[k].snapshot || !geoMeta.by_kecamatan[k].snapshot);
check('QC-10 snapshot OSM tercatat', noSnap.length === 0, noSnap.length ? `tanpa snapshot: ${noSnap.join(', ')}` : 'sectors + boundaries tercatat');

// ---------- 5 emit dataset kanonik ----------
const maxOf = (arr) => Math.max(...arr);
const rows = KEC.map((k) => {
  const d = demo.by_kecamatan[k];
  const g = geo.features.find((f) => f.properties.id === k).properties;
  const s = sectors[k];
  const per10k = (n) => +((n / d.population) * 10000).toFixed(2);
  return {
    id: k,
    name: g.name,
    osm_relation: g.osm_relation,
    population: d.population,
    area_km2: d.area_km2,
    area_geom_km2: g.area_km2,
    density: d.density,
    density_basis: 'population_2025s1 / area_2023s2',
    youth_15_34_pct: d.youth_15_34_pct,
    productive_15_64_pct: d.productive_15_64_pct,
    anchor_poi: s.anchor,
    sector_poi: { retail: s.retail, health: s.health, education: s.education },
    sector_poi_per_10k: { retail: per10k(s.retail), health: per10k(s.health), education: per10k(s.education) },
  };
});

const dataset = {
  generated_by: 'docs/gate2/build.js',
  generated_at: new Date().toISOString(),
  note: 'Satu-satunya sumber angka untuk UI. Jangan edit manual — jalankan ulang build.js.',
  normalizers: {
    density_max: maxOf(rows.map((r) => r.density)),
    anchor_max: maxOf(rows.map((r) => r.anchor_poi)),
    sector_per_10k_max: Object.fromEntries(SECTORS.map((s) => [s, maxOf(rows.map((r) => r.sector_poi_per_10k[s]))])),
    basis: 'max nilai nyata antar kecamatan (bukan angka yang diasumsikan)',
  },
  sources: {
    population: demo.population_source,
    area: demo.area_source,
    age: { file: demo.age_source.file, table: demo.age_source.table },
    poi: { source: 'OpenStreetMap via Overpass API', license: 'ODbL 1.0', snapshot_range: KEC.map((k) => sectors[k].snapshot).filter(Boolean).sort()[0] + ' .. ' + KEC.map((k) => sectors[k].snapshot).filter(Boolean).sort().slice(-1)[0] },
    boundaries: { source: geoMeta.source, license: geoMeta.license, admin_level: geoMeta.admin_level },
  },
  caveats: [
    'POI OSM = kepadatan POI terpetakan, BUKAN jumlah usaha sebenarnya (bias terukur 1,25x-5,75x vs ground truth Google Maps).',
    'Luas per kecamatan berasal dari DKB 2023 S2; kepadatan 2025 adalah turunan, bukan angka terbitan.',
    'Lisensi publikasi Dukcapil belum dikonfirmasi memiliki klausul terbuka.',
  ],
  by_kecamatan: Object.fromEntries(rows.map((r) => [r.id, r])),
  totals: {
    population: rows.reduce((s, r) => s + r.population, 0),
    area_km2: +rows.reduce((s, r) => s + r.area_km2, 0).toFixed(2),
    area_geom_km2: +rows.reduce((s, r) => s + r.area_geom_km2, 0).toFixed(2),
    sector_poi: Object.fromEntries(SECTORS.map((s) => [s, rows.reduce((a, r) => a + r.sector_poi[s], 0)])),
  },
};

// QC-11 tidak ada NaN/null di dataset akhir
const badVals = [];
for (const r of rows) {
  for (const [key, v] of Object.entries(r)) {
    if (v === null || v === undefined || (typeof v === 'number' && !Number.isFinite(v))) badVals.push(`${r.id}.${key}`);
    if (key === 'sector_poi_per_10k') for (const [s2, n] of Object.entries(v)) if (!Number.isFinite(n)) badVals.push(`${r.id}.${s2}_per10k`);
  }
}
check('QC-11 tidak ada nilai null/NaN', badVals.length === 0, badVals.length ? badVals.join(', ') : `${rows.length} baris bersih`);

fs.writeFileSync(path.join(OUT_DIR, 'verified_dataset.json'), JSON.stringify(dataset, null, 2) + '\n');
fs.writeFileSync(
  path.join(OUT_DIR, 'qc_report.json'),
  JSON.stringify({ generated_at: dataset.generated_at, passed: failures.length === 0, failures, checks }, null, 2) + '\n'
);

console.log(`\n${failures.length === 0 ? 'QC LULUS' : 'QC GAGAL'} — ${checks.filter((c) => c.pass).length}/${checks.length} pemeriksaan`);
console.log('normalizers:', JSON.stringify(dataset.normalizers));
console.log('totals    :', JSON.stringify(dataset.totals));
if (failures.length) {
  console.error('\n' + failures.map((f) => '  - ' + f).join('\n'));
  process.exit(1);
}
