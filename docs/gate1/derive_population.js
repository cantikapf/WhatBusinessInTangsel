// Gate 1/Gate 2 seed: turunkan tabel per kecamatan dari PDF DKB Dukcapil Tangsel.
// Jalankan: node docs/gate1/derive_population.js
// Input : docs/gate1/raw/*.txt (hasil `pdftotext -raw` dari PDF di docs/gate1/raw/)
// Output: docs/gate1/derived_population.json + validasi terhadap total resmi di PDF.
const fs = require('fs');
const path = require('path');

const RAW = path.join(__dirname, 'raw');
const KEC = ['serpong', 'serpong_utara', 'pondok_aren', 'ciputat', 'ciputat_timur', 'pamulang', 'setu'];
const KODE = { 367401: 'serpong', 367402: 'serpong_utara', 367403: 'pondok_aren', 367404: 'ciputat', 367405: 'ciputat_timur', 367406: 'pamulang', 367407: 'setu' };

const num = (s) => Number(String(s).replace(/\./g, ''));
const pick = (re, text) => { const m = text.match(re); return m ? m : null; };

function header(txt) {
  const m = pick(/DKB SEMESTER (I{1,3}|IV) TAHUN (\d{4})/, txt);
  return m ? { semester: m[1], tahun: Number(m[2]) } : null;
}

// Tabel "JUMLAH PENDUDUK KECAMATAN": NO KEC NAMA SEMESTER_X SEMESTER_Y PERUBAHAN %
function parsePopulation(txt) {
  const out = {};
  const re = /^(\d{6})\s+([A-Z ]+?)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d,]+)\s*$/gm;
  let m;
  while ((m = re.exec(txt))) {
    const k = KODE[Number(m[1])];
    if (!k) continue;
    out[k] = { prev: num(m[3]), current: num(m[4]) }; // prev = semester sebelumnya, current = semester header
  }
  const t = pick(/^\s*TOTAL\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d,]+)\s*$/m, txt);
  return { byKec: out, total: t ? { prev: num(t[1]), current: num(t[2]) } : null };
}

// Tabel "KEPADATAN PENDUDUK": NO KEC NAMA JUMLAH LUAS(KM2) KEPADATAN
function parseDensity(txt) {
  const start = txt.indexOf('KEPADATAN PENDUDUK');
  if (start < 0) return null;
  const end = txt.indexOf('TOTAL', start);
  const block = txt.slice(start, end > start ? end + 80 : start + 2500);
  const out = {};
  // baris: "367401 SERPONG 165.000 28,27 5.837" -> pop, luas(km2, koma desimal), kepadatan
  const re = /(\d{6})\s+([A-Z ]+?)\s+([\d.]+)\s+([\d,.]+)\s+([\d,.]+)/g;
  let m;
  while ((m = re.exec(block))) {
    const k = KODE[Number(m[1])];
    if (!k) continue;
    out[k] = { population: num(m[3]), area_km2: Number(m[4].replace(/\./g, '').replace(',', '.')), density: num(m[5]) };
  }
  return Object.keys(out).length ? out : null;
}

// Tabel "BERDASARKAN USIA": "31 USIA 30  2.814  2.327 ... 24.085"  (8 kolom: 7 kec + kota)
function parseAges(txt) {
  const start = txt.indexOf('BERDASARKAN USIA');
  if (start < 0) return null;
  const block = txt.slice(start);
  const byAge = new Map();
  // bari terakhir berupa "77 USIA 76 LEBIH 2.285 ..." -> sufiks LEBIH wajib ditangani
  const re = /^\s*\d{1,2}\s+USIA\s+(\d{1,3})(\s+LEBIH)?\s+((?:[\d.]+\s+){7}[\d.]+)\s*$/gm;
  let m;
  while ((m = re.exec(block))) {
    const vals = m[3].trim().split(/\s+/).map(num);
    byAge.set(Number(m[1]), vals);
  }
  const ages = [...byAge.keys()].sort((a, b) => a - b);
  if (ages.length < 70) return null;
  const band = (lo, hi) => KEC.map((_, i) => ages.filter((a) => a >= lo && a <= hi).reduce((s, a) => s + byAge.get(a)[i], 0));
  const total = KEC.map((_, i) => ages.reduce((s, a) => s + byAge.get(a)[i], 0));
  return {
    ages_read: ages.length,
    age_min: ages[0],
    age_max: ages[ages.length - 1],
    total_per_kec: total,
    kota_total: ages.reduce((s, a) => s + byAge.get(a)[7], 0),
    youth_15_34: band(15, 34),
    productive_15_64: band(15, 64),
  };
}

function sha256(p) {
  const { createHash } = require('crypto');
  return createHash('sha256').update(fs.readFileSync(p)).digest('hex');
}

// pilih PDF terbaru dari yang ada di raw/. PDF sengaja di-gitignore (besar, bisa
// diunduh ulang dari URL di source_manifest.json), jadi turunkan daftar dari .txt
// lalu cari PDF-nya kalau ada — hash hanya dihitung saat bytes-nya tersedia.
const txts = fs.readdirSync(RAW).filter((f) => f.endsWith('.txt'));
const meta = txts.map((f) => {
  const base = f.replace(/\.txt$/, '');
  const txtPath = path.join(RAW, base + '.txt');
  if (!fs.existsSync(txtPath)) return null;
  const pdfName = base + '.pdf';
  const hasPdf = fs.existsSync(path.join(RAW, pdfName));
  return {
    file: hasPdf ? pdfName : base + '.txt',
    base,
    hasPdf,
    txt: fs.readFileSync(txtPath, 'utf8'),
    ...header(fs.readFileSync(txtPath, 'utf8')),
  };
}).filter(Boolean);

const newest = meta.sort((a, b) => (b.tahun - a.tahun) || (b.semester === 'I' ? -1 : 1) - (a.semester === 'I' ? -1 : 1))[0];
if (!newest) throw new Error('tidak ada TXT di docs/gate1/raw');

const pop = parsePopulation(newest.txt);
const ages = parseAges(newest.txt);
// luas hanya dipublikasikan Dukcapil pada DKB Sem II 2023
const densSrc = meta.find((m) => parseDensity(m.txt));
const dens = densSrc ? parseDensity(densSrc.txt) : null;
if (!pop || !ages || !dens) throw new Error('tabel wajib gagal di-parse');

const out = {
  generated_by: 'docs/gate1/derive_population.js',
  population_source: {
    agency: 'Dinas Kependudukan dan Pencatatan Sipil Kota Tangerang Selatan',
    dataset: `Data Konsolidasi Bersih (DKB) Semester ${newest.semester} Tahun ${newest.tahun}`,
    file: 'docs/gate1/raw/' + newest.file,
    sha256: newest.hasPdf ? sha256(path.join(RAW, newest.file)) : null,
    table: 'JUMLAH PENDUDUK KECAMATAN, halaman 1',
    retrieved: '2026-10-19',
  },
  area_source: densSrc ? {
    agency: 'Dinas Kependudukan dan Pencatatan Sipil Kota Tangerang Selatan',
    dataset: `Data Konsolidasi Bersih (DKB) Semester ${densSrc.semester} Tahun ${densSrc.tahun}`,
    file: 'docs/gate1/raw/' + densSrc.file,
    sha256: densSrc.hasPdf ? sha256(path.join(RAW, densSrc.file)) : null,
    table: 'KEPADATAN PENDUDUK (memuat LUAS WILAYAH KM2), halaman 2',
    note: 'Dukcapil hanya mempublikasikan tabel luas pada DKB Sem II 2023 (164,86 km²); angka luas untuk DKB Sem I 2025 tidak dipublikasikan dalam rilis tersebut sehingga dipinjam lintas periode dengan batasan belum terverifikasi untuk periode terbaru.',
    retrieved: '2026-10-19',
  } : null,
  age_source: {
    file: 'docs/gate1/raw/' + newest.file,
    table: 'JUMLAH PENDUDUK PER KECAMATAN BERDASARKAN USIA (usia 0-76)',
    definition: {
      youth_15_34_pct: 'penduduk usia 15-34 / total penduduk kecamatan',
      productive_15_64_pct: 'penduduk usia 15-64 / total penduduk kecamatan',
    },
  },
  by_kecamatan: {},
  totals: {},
};

for (let i = 0; i < KEC.length; i++) {
  const k = KEC[i];
  out.by_kecamatan[k] = {
    population: pop.byKec[k].current,
    population_prev_semester: pop.byKec[k].prev,
    area_km2: dens[k].area_km2,
    density: Math.round(pop.byKec[k].current / dens[k].area_km2),
    density_published: dens[k].density,
    youth_15_34_pct: +(ages.youth_15_34[i] / ages.total_per_kec[i]).toFixed(4),
    productive_15_64_pct: +(ages.productive_15_64[i] / ages.total_per_kec[i]).toFixed(4),
  };
}
const sumPop = KEC.reduce((s, k) => s + out.by_kecamatan[k].population, 0);
const sumArea = KEC.reduce((s, k) => s + out.by_kecamatan[k].area_km2, 0);
out.totals = {
  population: sumPop,
  population_published: pop.total.current,
  area_km2: +sumArea.toFixed(2),
  density: Math.round(sumPop / sumArea),
  kota_youth_15_34_pct: +((ages.youth_15_34.reduce((a, b) => a + b, 0) / ages.kota_total) * 100 / 100).toFixed(4),
  kota_productive_15_64_pct: +((ages.productive_15_64.reduce((a, b) => a + b, 0) / ages.kota_total) * 100 / 100).toFixed(4),
};

// ---- validasi ----
const errs = [];
if (sumPop !== pop.total.current) errs.push(`total populasi ${sumPop} != tabel TOTAL ${pop.total.current}`);
for (let i = 0; i < KEC.length; i++) {
  if (ages.total_per_kec[i] !== pop.byKec[KEC[i]].current) {
    errs.push(`${KEC[i]}: total tabel usia ${ages.total_per_kec[i]} != tabel populasi ${pop.byKec[KEC[i]].current}`);
  }
}
if (ages.kota_total !== pop.total.current) errs.push(`total kota tabel usia ${ages.kota_total} != ${pop.total.current}`);
if (Math.abs(sumArea - 164.86) > 0.01) errs.push(`total luas ${sumArea.toFixed(2)} != 164,86 (tabel Dukcapil)`);

if (errs.length) {
  console.error('VALIDASI GAGAL:\n  - ' + errs.join('\n  - '));
  process.exit(1);
}

fs.writeFileSync(path.join(__dirname, 'derived_population.json'), JSON.stringify(out, null, 2) + '\n');
console.log(`OK — ${out.population_source.dataset} + luas dari ${out.area_source.dataset}`);
console.log(`populasi total ${out.totals.population} | luas ${out.totals.area_km2} km2 | usia terbaca ${ages.ages_read} (${ages.age_min}-${ages.age_max})`);
console.log('kota: youth_15_34', out.totals.kota_youth_15_34_pct, '| productive_15_64', out.totals.kota_productive_15_64_pct);
console.table(Object.entries(out.by_kecamatan).map(([k, v]) => ({ kec: k, ...v })));
