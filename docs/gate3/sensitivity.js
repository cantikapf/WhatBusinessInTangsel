/**
 * Gate 3 — weight sensitivity analysis.
 *
 * Question: the 6 weights in SCORE_WEIGHTS are designer judgement, not calibrated.
 * How much does the ranking actually depend on them?
 *
 * Method: reuse calculateScore()'s S1..S6 (indicator scores are weight-independent),
 * then recombine with alternative weight vectors. NO formula is re-implemented here —
 * any drift between this script and the production engine would be a second model,
 * which is exactly the Gate 0 defect we removed.
 *
 * Equivalence is asserted first: at SCORE_WEIGHTS every (kecamatan, sector) must
 * reproduce calculateScore().compositeScore exactly, or the run aborts.
 *
 * Run: npx tsx docs/gate3/sensitivity.js
 *
 * skips: bootstrap over POI measurement error — add when OSM bias per kecamatan
 *        is quantified at POI level (currently only the 1,25x-5,75x aggregate exists).
 */
import { calculateScore, SCORE_WEIGHTS, VERIFIED_SECTORS, labelForScore } from '../../src/lib/engine/scoring.ts';
import { writeFileSync } from 'fs';

const KEC = ['serpong', 'serpong_utara', 'pondok_aren', 'ciputat', 'ciputat_timur', 'pamulang', 'setu'];
const KEYS = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'];
const BASE = KEYS.map((k) => SCORE_WEIGHTS[k]);

// ---------- 1. Pull weight-independent indicator scores once ----------
const cell = {}; // cell[sector][kec] = { S: [s1..s6], base: composite, label }
for (const sector of VERIFIED_SECTORS) {
  cell[sector] = {};
  for (const kec of KEC) {
    const r = calculateScore(kec, sector);
    cell[sector][kec] = {
      S: [r.scores.S1, r.scores.S2, r.scores.S3, r.scores.S4, r.scores.S5, r.scores.S6],
      base: r.compositeScore,
      baseLabel: r.label,
    };
  }
}

// ---------- 2. Recombine + equivalence proof ----------
const composite = (S, W) => {
  const raw = S.reduce((acc, s, i) => acc + W[i] * s, 0) * 10;
  return Math.max(1.0, Math.min(10.0, Math.round(raw * 10) / 10));
};

let equivChecked = 0;
for (const sector of VERIFIED_SECTORS) {
  for (const kec of KEC) {
    const c = cell[sector][kec];
    const got = composite(c.S, BASE);
    if (got !== c.base) {
      throw new Error(`EQUIVALENCE FAIL ${sector}/${kec}: recombined ${got} != calculateScore ${c.base}`);
    }
    equivChecked++;
  }
}
console.log(`Equivalence: ${equivChecked}/${equivChecked} combinations reproduce calculateScore at baseline weights.\n`);

// ---------- 3. Helpers ----------
const rank = (scores) =>
  Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => k);

const spearman = (a, b) => {
  // a, b are arrays of keys already ordered by score; build position maps
  const pa = new Map(a.map((k, i) => [k, i + 1]));
  const pb = new Map(b.map((k, i) => [k, i + 1]));
  const n = a.length;
  const d2 = a.reduce((acc, k) => acc + Math.pow(pa.get(k) - pb.get(k), 2), 0);
  return 1 - (6 * d2) / (n * (n * n - 1));
};

const normalise = (W) => {
  const sum = W.reduce((a, b) => a + b, 0);
  return W.map((w) => w / sum);
};

// Deterministic PRNG (LCG) — a Monte Carlo that cannot be re-run is not evidence.
let seed = 20261020;
const rand = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

// ---------- 4. Named weight scenarios ----------
// All are hypotheses about a business question, not tuned-to-look-nice numbers.
const scenarios = [
  { name: 'Baseline (dipakai aplikasi)', W: BASE, note: '0,20/0,20/0,15/0,15/0,15/0,15' },
  { name: 'Bobot setara', W: normalise([1, 1, 1, 1, 1, 1]), note: 'tidak ada indikator diistimewakan' },
  { name: 'Sisi permintaan (demografi dominan)', W: normalise([0.30, 0.30, 0.20, 0.20, 0, 0]), note: 'pasar = orang, bukan pesaing' },
  { name: 'Sisi hambatan (kompetisi dominan)', W: normalise([0.10, 0.10, 0.05, 0.05, 0.60, 0.10]), note: 'kepadatan POI jadi penentu utama' },
  { name: 'Anchor / aksesibilitas dominan', W: normalise([0.10, 0.10, 0.10, 0.10, 0.10, 0.50]), note: 'tarikan simpul transit' },
  { name: 'Indikator tunggal: kepadatan', W: [1, 0, 0, 0, 0, 0], note: 'batas ekstrem W1' },
  { name: 'Indikator tunggal: populasi', W: [0, 1, 0, 0, 0, 0], note: 'batas ekstrem W2' },
  { name: 'Indikator tunggal: peluang pasar', W: [0, 0, 0, 0, 1, 0], note: 'batas ekstrem W5' },
];

// ---------- 5. Scenario results ----------
const out = { generated_by: 'docs/gate3/sensitivity.js', scenarios: {}, leaveOneOut: {}, monteCarlo: {} };

console.log('='.repeat(78));
console.log('A. SKENARIO BOBOT — korelasi peringkat terhadap baseline (Spearman)');
console.log('='.repeat(78));

for (const sector of VERIFIED_SECTORS) {
  const baseScores = {};
  for (const kec of KEC) baseScores[kec] = cell[sector][kec].base;
  const baseRank = rank(baseScores);

  console.log(`\n--- sektor: ${sector} ---`);
  console.log(`baseline: ${baseRank.map((k, i) => `${i + 1}.${k}`).join('  ')}`);

  out.scenarios[sector] = [];
  for (const sc of scenarios) {
    const scores = {};
    for (const kec of KEC) scores[kec] = composite(cell[sector][kec].S, sc.W);
    const r = rank(scores);
    const rho = spearman(baseRank, r);
    const shifts = KEC.map((k) => Math.abs(baseRank.indexOf(k) - r.indexOf(k)));
    const top1Same = r[0] === baseRank[0];
    const top3Same = JSON.stringify(r.slice(0, 3).sort()) === JSON.stringify(baseRank.slice(0, 3).sort());
    const range = (Math.max(...Object.values(scores)) - Math.min(...Object.values(scores))).toFixed(1);

    out.scenarios[sector].push({
      scenario: sc.name, note: sc.note, order: r, spearman: +rho.toFixed(3),
      top1_same: top1Same, top3_same: top3Same, max_shift: Math.max(...shifts), range: +range,
    });

    console.log(
      `${sc.name.padEnd(36)} rho=${rho.toFixed(2).padStart(5)}  top1=${top1Same ? 'sama' : 'BEDA'}  ` +
        `top3=${top3Same ? 'sama' : 'beda'}  geser_maks=${Math.max(...shifts)}  rentang=${range}`
    );
    console.log(`${''.padEnd(36)} urutan: ${r.join(' > ')}`);
  }
}

// ---------- 6. Leave-one-indicator-out (drop, renormalise the rest) ----------
console.log(`\n${'='.repeat(78)}`);
console.log('B. LEAVE-ONE-INDICATOR-OUT — buang satu indikator, bobot sisanya dinormalisasi ulang');
console.log('='.repeat(78));

const IND_LABEL = [
  'W1 kepadatan penduduk',
  'W2 total populasi',
  'W3 usia 15-34',
  'W4 usia 15-64',
  'W5 peluang pasar (POI rendah)',
  'W6 anchor POI',
];

for (const sector of VERIFIED_SECTORS) {
  const baseScores = {};
  for (const kec of KEC) baseScores[kec] = cell[sector][kec].base;
  const baseRank = rank(baseScores);
  console.log(`\n--- sektor: ${sector} ---`);
  out.leaveOneOut[sector] = [];
  for (let drop = 0; drop < 6; drop++) {
    const W = normalise(BASE.map((w, i) => (i === drop ? 0 : w)));
    const scores = {};
    for (const kec of KEC) scores[kec] = composite(cell[sector][kec].S, W);
    const r = rank(scores);
    const rho = spearman(baseRank, r);
    const shifts = KEC.map((k) => Math.abs(baseRank.indexOf(k) - r.indexOf(k)));
    out.leaveOneOut[sector].push({
      dropped: IND_LABEL[drop], spearman: +rho.toFixed(3),
      top1_same: r[0] === baseRank[0], max_shift: Math.max(...shifts), order: r,
    });
    console.log(
      `tanpa ${IND_LABEL[drop].padEnd(30)} rho=${rho.toFixed(2).padStart(5)}  ` +
        `top1=${r[0] === baseRank[0] ? 'sama' : 'BEDA (' + r[0] + ')'}  geser_maks=${Math.max(...shifts)}`
    );
  }
}

// ---------- 7. Monte Carlo over the weight simplex ----------
console.log(`\n${'='.repeat(78)}`);
console.log('C. MONTE CARLO — 20.000 vektor bobot acak seragam pada simpleks (Dirichlet(1,...,1))');
console.log('='.repeat(78));

const DRAWS = 20000;
const draws = [];
for (let d = 0; d < DRAWS; d++) {
  // Exp(1) via -ln(U) then normalise == uniform Dirichlet(1..1)
  const raw = KEYS.map(() => -Math.log(Math.max(rand(), 1e-12)));
  draws.push(normalise(raw));
}

for (const sector of VERIFIED_SECTORS) {
  const baseScores = {};
  for (const kec of KEC) baseScores[kec] = cell[sector][kec].base;
  const baseRank = rank(baseScores);

  const top1Count = {};
  const top3SameCount = {};
  const rankHist = {}; // kec -> array of ranks
  for (const kec of KEC) {
    top1Count[kec] = 0;
    top3SameCount[kec] = 0;
    rankHist[kec] = [];
  }
  let top1Agree = 0;
  let top3SetAgree = 0;
  const rhos = [];

  for (const W of draws) {
    const scores = {};
    for (const kec of KEC) scores[kec] = composite(cell[sector][kec].S, W);
    const r = rank(scores);
    top1Count[r[0]]++;
    if (r[0] === baseRank[0]) top1Agree++;
    const set = JSON.stringify(r.slice(0, 3).sort());
    if (set === JSON.stringify(baseRank.slice(0, 3).sort())) top3SetAgree++;
    r.forEach((k, i) => rankHist[k].push(i + 1));
    rhos.push(spearman(baseRank, r));
  }

  const summary = KEC.map((kec) => {
    const hist = rankHist[kec];
    const counts = [0, 0, 0, 0, 0, 0, 0];
    hist.forEach((x) => counts[x - 1]++);
    return {
      kecamatan: kec,
      p_top1: +(top1Count[kec] / DRAWS).toFixed(3),
      p_top1_baseline_rank: +(counts[baseRank.indexOf(kec)] / DRAWS).toFixed(3),
      rank_min: Math.min(...hist),
      rank_max: Math.max(...hist),
      rank_median: [...hist].sort((a, b) => a - b)[Math.floor(hist.length / 2)],
    };
  }).sort((a, b) => b.p_top1 - a.p_top1);

  const meanRho = rhos.reduce((a, b) => a + b, 0) / rhos.length;
  const minRho = Math.min(...rhos);

  out.monteCarlo[sector] = {
    draws: DRAWS,
    baseline_top1: baseRank[0],
    p_top1_agrees_with_baseline: +(top1Agree / DRAWS).toFixed(3),
    p_top3_set_agrees_with_baseline: +(top3SetAgree / DRAWS).toFixed(3),
    mean_spearman: +meanRho.toFixed(3),
    min_spearman: +minRho.toFixed(3),
    per_kecamatan: summary,
  };

  console.log(`\n--- sektor: ${sector} (baseline juara: ${baseRank[0]}) ---`);
  console.log(`P(top-1 sama dgn baseline)      = ${(top1Agree / DRAWS * 100).toFixed(1)}%`);
  console.log(`P(top-3 set sama dgn baseline)  = ${(top3SetAgree / DRAWS * 100).toFixed(1)}%`);
  console.log(`Spearman rata-rata              = ${meanRho.toFixed(3)}  (terburuk ${minRho.toFixed(3)})`);
  console.log('  kecamatan        P(juara #1)  rank min-max (median)');
  for (const s of summary) {
    console.log(
      `  ${s.kecamatan.padEnd(15)} ${(s.p_top1 * 100).toFixed(1).padStart(6)}%     ` +
        `${s.rank_min}-${s.rank_max} (${s.rank_median})`
    );
  }
}

// ---------- 8. Label stability (does the interpretation flip?) ----------
console.log(`\n${'='.repeat(78)}`);
console.log('D. STABILITAS LABEL — seberapa sering label 3,0/5,0/6,5/8,0 berubah di bawah bobot acak');
console.log('='.repeat(78));

const labelFlip = {};
for (const sector of VERIFIED_SECTORS) {
  let flips = 0;
  let total = 0;
  for (const kec of KEC) {
    const baseLabel = cell[sector][kec].baseLabel;
    for (const W of draws) {
      const l = labelForScore(composite(cell[sector][kec].S, W));
      total++;
      if (l !== baseLabel) flips++;
    }
  }
  labelFlip[sector] = +((flips / total) * 100).toFixed(1);
  console.log(`  ${sector.padEnd(12)} label berubah pada ${labelFlip[sector]}% dari ${total.toLocaleString('id-ID')} sel-bobot`);
}
out.labelFlipPercent = labelFlip;

// ---------- 8. Local perturbation around the baseline (the question that matters) ----------
// Uniform Dirichlet(1) puts much of its mass near the simplex vertices (one indicator
// dominating), which overstates fragility. Real revisions of designer judgement are small.
// Dirichlet(alpha = w * concentration) keeps draws near the current weights.
console.log(`\n${'='.repeat(78)}`);
console.log('E. PERTURBASI LOKAL — revisi kecil bobot di sekitar baseline (Dirichlet(w x konsentrasi))');
console.log('='.repeat(78));

const dirichletAround = (w, concentration, n) => {
  const out = [];
  // Gamma(shape=w*conc, scale=1) via Marsaglia-Tsang, then normalise.
  const gamma = (shape) => {
    if (shape < 1) return gamma(shape + 1) * Math.pow(rand(), 1 / shape);
    const d = shape - 1 / 3;
    const c = 1 / Math.sqrt(9 * d);
    for (;;) {
      let x, v;
      do {
        x = normal();
        v = 1 + c * x;
      } while (v <= 0);
      v = v * v * v;
      const u = rand();
      if (u < 1 - 0.0331 * x * x * x * x) return d * v;
      if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
    }
  };
  const normal = () => {
    const u1 = Math.max(rand(), 1e-12);
    const u2 = rand();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  };
  for (let i = 0; i < n; i++) {
    const raw = w.map((wi) => gamma(Math.max(wi, 1e-6) * concentration));
    out.push(normalise(raw));
  }
  return out;
};

out.localPerturbation = {};
for (const conc of [200, 50, 20]) {
  const localDraws = dirichletAround(BASE, conc, 5000);
  const spread = localDraws.map((W) => Math.max(...W.map((w, i) => Math.abs(w - BASE[i]))));
  const meanMaxDev = spread.reduce((a, b) => a + b, 0) / spread.length;

  console.log(`\n--- konsentrasi ${conc} (deviasi maks rata-rata dari baseline: ${(meanMaxDev * 100).toFixed(1)} poin persen) ---`);
  out.localPerturbation[conc] = { mean_max_deviation_pct: +(meanMaxDev * 100).toFixed(2) };

  for (const sector of VERIFIED_SECTORS) {
    const baseScores = {};
    for (const kec of KEC) baseScores[kec] = cell[sector][kec].base;
    const baseRank = rank(baseScores);
    let top1 = 0;
    let top3 = 0;
    const rhos = [];
    for (const W of localDraws) {
      const scores = {};
      for (const kec of KEC) scores[kec] = composite(cell[sector][kec].S, W);
      const r = rank(scores);
      if (r[0] === baseRank[0]) top1++;
      if (JSON.stringify(r.slice(0, 3).sort()) === JSON.stringify(baseRank.slice(0, 3).sort())) top3++;
      rhos.push(spearman(baseRank, r));
    }
    const meanRho = rhos.reduce((a, b) => a + b, 0) / rhos.length;
    out.localPerturbation[conc][sector] = {
      p_top1_agrees: +(top1 / localDraws.length).toFixed(3),
      p_top3_agrees: +(top3 / localDraws.length).toFixed(3),
      mean_spearman: +meanRho.toFixed(3),
    };
    console.log(
      `  ${sector.padEnd(10)} top1=${((top1 / localDraws.length) * 100).toFixed(1).padStart(5)}%  ` +
        `top3=${((top3 / localDraws.length) * 100).toFixed(1).padStart(5)}%  rho_rata=${meanRho.toFixed(3)}`
    );
  }
}

// ---------- 9. Baseline label distribution (why labels are brittle) ----------
console.log(`\n${'='.repeat(78)}`);
console.log('F. DISTRIBUSI SKOR BASELINE — jarak ke ambang label');
console.log('='.repeat(78));

const THRESH = [3.0, 5.0, 6.5, 8.0];
out.baselineDistribution = {};
for (const sector of VERIFIED_SECTORS) {
  const vals = KEC.map((k) => cell[sector][k].base);
  const nearThreshold = vals.filter((v) => THRESH.some((t) => Math.abs(v - t) <= 0.3));
  out.baselineDistribution[sector] = {
    values: vals, min: Math.min(...vals), max: Math.max(...vals),
    cells_within_0_3_of_a_threshold: nearThreshold.length,
  };
  console.log(
    `  ${sector.padEnd(10)} skor ${Math.min(...vals).toFixed(1)}-${Math.max(...vals).toFixed(1)}  ` +
      `${nearThreshold.length}/7 kecamatan berjarak <=0,3 dari ambang  [${vals.join(', ')}]`
  );
}

// ---------- 10. Write artifact ----------
out.baseline_weights = BASE;
out.scenarios_note =
  'Skenario adalah hipotesis pertanyaan bisnis, bukan bobot hasil kalibrasi. Semua memakai S1..S6 dari calculateScore().';
writeFileSync(new URL('./sensitivity_results.json', import.meta.url), JSON.stringify(out, null, 2));

console.log(`\nArtefak: docs/gate3/sensitivity_results.json`);
console.log('Selesai.');
