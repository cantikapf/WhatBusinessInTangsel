#!/usr/bin/env node
/**
 * Gate 2 — uji bahwa QC benar-benar menggigit (bukan cuma lulus saat data sehat).
 *
 * Merusak satu artefak, menjalankan `build.js --qc-only`, mengharapkan exit 1.
 * Setiap file selalu dipulihkan, termasuk bila proses gagal di tengah.
 *
 *   node docs/gate2/qc_selftest.js
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const G1 = path.join(__dirname, '..', 'gate1');
const BUILD = path.join(__dirname, 'build.js');
const cases = [
  {
    file: 'derived_population.json',
    name: 'populasi kecamatan dirusak (jumlah != total kota)',
    mutate: (d) => {
      d.by_kecamatan.setu.population += 1;
      return d;
    },
    expectFail: 'QC-2',
  },
  {
    file: 'source_manifest.json',
    name: 'SHA-256 di manifest tidak cocok dengan PDF asli',
    mutate: (d) => {
      d.sources[0].sha256 = '0'.repeat(64);
      return d;
    },
    expectFail: 'QC-9',
    // PDF mentah di-gitignore; tanpa bytes-nya QC-9 tak punya apa pun untuk
    // di-hash, jadi kasus ini dilaporkan SKIP alih-alih gagal palsu.
    requires: () => {
      const m = JSON.parse(fs.readFileSync(path.join(G1, 'source_manifest.json'), 'utf8'));
      return m.sources.some((s) => fs.existsSync(path.join(G1, '..', '..', s.file)));
    },
  },
  {
    file: 'osm_sector_counts.json',
    name: 'kecamatan hilang dari hitungan sektor',
    mutate: (d) => {
      delete d.setu;
      return d;
    },
    expectFail: 'QC-1',
  },
  {
    file: 'derived_population.json',
    name: 'penyebut populasi jadi nol (risiko bagi nol)',
    mutate: (d) => {
      d.by_kecamatan.pamulang.population = 0;
      return d;
    },
    expectFail: 'QC-8',
  },
];

let failed = 0;
let skipped = 0;
for (const c of cases) {
  if (c.requires && !c.requires()) {
    console.log(`SKIP  ${c.name} → artefak mentah tidak ada di disk (gitignored)`);
    skipped += 1;
    continue;
  }
  const target = path.join(G1, c.file);
  const original = fs.readFileSync(target);
  try {
    const data = JSON.parse(original.toString('utf8'));
    fs.writeFileSync(target, JSON.stringify(c.mutate(data), null, 2) + '\n');

    const r = spawnSync(process.execPath, [BUILD, '--qc-only'], { encoding: 'utf8' });
    const out = (r.stdout || '') + (r.stderr || '');
    const line = out.split('\n').find((l) => new RegExp('FAIL\\s+' + c.expectFail).test(l)) || '';
    const bit = r.status === 1 && line.length > 0;
    console.log(`${bit ? 'PASS' : 'FAIL'}  ${c.name} → exit=${r.status}, ${c.expectFail} ${bit ? 'terdeteksi' : 'TIDAK terdeteksi'}`);
    if (line.trim()) console.log(`       ${line.trim()}`);
    if (!bit) failed += 1;
  } finally {
    fs.writeFileSync(target, original);
  }
}

// kontrol: data sehat harus lulus penuh
const ok = spawnSync(process.execPath, [BUILD, '--qc-only'], { encoding: 'utf8' });
const okPass = ok.status === 0 && (ok.stdout || '').includes('QC LULUS');
console.log(`${okPass ? 'PASS' : 'FAIL'}  kontrol: data sehat → exit=${ok.status}, QC LULUS`);
if (!okPass) failed += 1;

console.log(
  failed === 0
    ? `\nSELFTEST LULUS${skipped ? ` (${skipped} kasus dilewati: artefak mentah gitignored)` : ''}`
    : `\nSELFTEST GAGAL (${failed})`
);
process.exit(failed === 0 ? 0 : 1);
