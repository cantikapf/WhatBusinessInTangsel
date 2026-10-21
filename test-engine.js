import { calculateScore, labelForScore, SCORE_WEIGHTS, VERIFIED_SECTORS, normalizers } from './src/lib/engine/scoring.ts';
import { generateRecommendation } from './src/lib/engine/recommender.ts';
import verifiedDataset from './src/data/verifiedDataset.ts';
import assert from 'assert';

console.log('Starting Tangsel Business Prospect Analytics Engine Tests (Gate 3 - 6 Indicators, 3 Sectors)...');

// 7 subdistrict test cases across the 3 verified sectors (retail, health, education)
const testCases = [
  { subdistrict: 'serpong', sector: 'retail' },
  { subdistrict: 'setu', sector: 'retail' },
  { subdistrict: 'pamulang', sector: 'health' },
  { subdistrict: 'ciputat', sector: 'health' },
  { subdistrict: 'ciputat_timur', sector: 'education' },
  { subdistrict: 'pondok_aren', sector: 'education' },
  { subdistrict: 'serpong_utara', sector: 'retail' }
];

let passCount = 0;
let failCount = 0;

for (const tc of testCases) {
  try {
    console.log(`\nTesting: subdistrict = ${tc.subdistrict}, sector = ${tc.sector}`);
    
    // Test calculateScore
    const scoreData = calculateScore(tc.subdistrict, tc.sector);
    
    // Assertions for scoreData
    assert.ok(scoreData, 'Score data should be defined');
    assert.ok(scoreData.compositeScore >= 1.0 && scoreData.compositeScore <= 10.0, 'Score should be between 1.0 and 10.0');
    assert.ok(typeof scoreData.label === 'string', 'Label should be a string');
    assert.ok(scoreData.scores, 'Individual scores should be defined');
    
    // Validate individual 6 scores (S1..S6)
    const { S1, S2, S3, S4, S5, S6 } = scoreData.scores;
    assert.ok(S1 >= 0 && S1 <= 1, 'S1 (density) should be between 0 and 1');
    assert.ok(S2 >= 0 && S2 <= 1, 'S2 (population) should be between 0 and 1');
    assert.ok(S3 >= 0 && S3 <= 1, 'S3 (youth_15_34) should be between 0 and 1');
    assert.ok(S4 >= 0 && S4 <= 1, 'S4 (productive_15_64) should be between 0 and 1');
    assert.ok(S5 >= 0 && S5 <= 1, 'S5 (competition gap) should be between 0 and 1');
    assert.ok(S6 >= 0 && S6 <= 1, 'S6 (anchor_poi) should be between 0 and 1');
    
    // Verify Gate 3 weighted math formula (sum of weights = 1.0):
    // compositeScore = (0.20 * S1 + 0.20 * S2 + 0.15 * S3 + 0.15 * S4 + 0.15 * S5 + 0.15 * S6) * 10
    const expectedComposite = (0.20 * S1 + 0.20 * S2 + 0.15 * S3 + 0.15 * S4 + 0.15 * S5 + 0.15 * S6) * 10;
    const roundedExpected = Math.max(1.0, Math.min(10.0, Math.round(expectedComposite * 10) / 10));
    assert.strictEqual(scoreData.compositeScore, roundedExpected, `Math mismatch: expected ${roundedExpected}, got ${scoreData.compositeScore}`);
    
    // Verify metrics in scoreData contain verified dataset fields
    assert.ok(typeof scoreData.metrics.population === 'number', 'Population metric must be number');
    assert.ok(typeof scoreData.metrics.density === 'number', 'Density metric must be number');
    assert.ok(typeof scoreData.metrics.youth_15_34_pct === 'number', 'Youth pct metric must be number');
    assert.ok(typeof scoreData.metrics.productive_15_64_pct === 'number', 'Productive pct metric must be number');
    assert.ok(typeof scoreData.metrics.anchor_poi === 'number', 'Anchor POI metric must be number');
    assert.ok(typeof scoreData.metrics.sector_poi === 'number', 'Sector POI metric must be number');
    assert.ok(typeof scoreData.metrics.sector_poi_per_10k === 'number', 'Sector POI per 10k metric must be number');

    console.log(`  Score: ${scoreData.compositeScore} (${scoreData.label})`);
    console.log(`  Metrics detailed scores: S1=${S1.toFixed(4)}, S2=${S2.toFixed(4)}, S3=${S3.toFixed(4)}, S4=${S4.toFixed(4)}, S5=${S5.toFixed(4)}, S6=${S6.toFixed(4)}`);

    // Test generateRecommendation
    const recData = generateRecommendation(tc.subdistrict, tc.sector, scoreData);
    
    // Assertions for recData
    assert.ok(recData, 'Recommendation data should be defined');
    assert.ok(typeof recData.suitability === 'string', 'Suitability should be a string');
    assert.ok(typeof recData.mainRisk === 'string', 'Main risk should be a string');
    assert.ok(typeof recData.targetSegment === 'string', 'Target segment should be a string');
    assert.ok(Array.isArray(recData.strategies), 'Strategies should be an array');
    assert.ok(recData.strategies.length > 0, 'Strategies should not be empty');
    
    // Single label vocabulary: recommender reuses scoring's label (no second threshold table)
    assert.strictEqual(recData.suitability, scoreData.label,
      `suitability must equal scoring label, got "${recData.suitability}" vs "${scoreData.label}"`);

    console.log(`  Suitability: ${recData.suitability}`);
    console.log(`  Strategies count: ${recData.strategies.length}`);
    
    passCount++;
  } catch (err) {
    console.error(`  FAIL: ${err.message}`);
    failCount++;
  }
}

// Test rejection of removed sectors and missing subdistricts
console.log('\nTesting validation errors for invalid sectors / subdistricts...');
try {
  calculateScore('serpong', 'fnb');
  console.error('  FAIL: calculateScore should throw for removed sector fnb');
  failCount++;
} catch (e) {
  console.log('  PASS: removed sector fnb threw as expected');
  passCount++;
}

try {
  calculateScore('serpong', '');
  console.error('  FAIL: calculateScore should throw for empty sector');
  failCount++;
} catch (e) {
  console.log('  PASS: empty sector threw as expected');
  passCount++;
}

try {
  calculateScore('non_existent', 'retail');
  console.error('  FAIL: calculateScore should throw for non-existent subdistrict');
  failCount++;
} catch (e) {
  console.log('  PASS: non-existent subdistrict threw as expected');
  passCount++;
}

try {
  calculateScore('', 'retail');
  console.error('  FAIL: calculateScore should throw for empty subdistrict');
  failCount++;
} catch (e) {
  console.log('  PASS: empty subdistrict threw as expected');
  passCount++;
}

// ---- Gate 3 contract: single label vocabulary (scoring + recommender must not diverge) ----
console.log('\nTesting label vocabulary contract & full 21/21 matrix...');
try {

  // 1. weights sum to exactly 1.00
  const weightSum = Object.values(SCORE_WEIGHTS).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(weightSum - 1.0) < 1e-9, `Weights must sum to 1.00, got ${weightSum}`);
  console.log(`  PASS: weights sum = ${weightSum}`);

  // 2. every threshold boundary maps to one label only
  const boundaries = [0, 2.9, 3.0, 4.9, 5.0, 6.4, 6.5, 7.9, 8.0, 10.0];
  const labels = boundaries.map((s) => `${s}->${labelForScore(s)}`);
  console.log(`  boundaries: ${labels.join(', ')}`);
  assert.strictEqual(labelForScore(3.0), 'Rendah', 'boundary 3.0 must be Rendah');
  assert.strictEqual(labelForScore(5.0), 'Cukup', 'boundary 5.0 must be Cukup');
  assert.strictEqual(labelForScore(6.5), 'Baik', 'boundary 6.5 must be Baik');
  assert.strictEqual(labelForScore(8.0), 'Sangat Baik', 'boundary 8.0 must be Sangat Baik');
  console.log('  PASS: threshold boundaries consistent');

  // 3. Full matrix: 7 kecamatan x 3 sectors = 21 combinations
  const KEC = ['serpong', 'serpong_utara', 'pondok_aren', 'ciputat', 'ciputat_timur', 'pamulang', 'setu'];
  let checked = 0;
  for (const k of KEC) {
    for (const s of VERIFIED_SECTORS) {
      const sc = calculateScore(k, s);
      const rc = generateRecommendation(k, s, sc);

      assert.ok(Number.isFinite(sc.compositeScore), `compositeScore not finite for ${k}/${s}`);
      assert.ok(sc.compositeScore >= 1.0 && sc.compositeScore <= 10.0, `compositeScore out of bounds for ${k}/${s}`);

      const { S1, S2, S3, S4, S5, S6 } = sc.scores;
      assert.ok(S1 >= 0 && S1 <= 1, `S1 out of [0,1] for ${k}/${s}`);
      assert.ok(S2 >= 0 && S2 <= 1, `S2 out of [0,1] for ${k}/${s}`);
      assert.ok(S3 >= 0 && S3 <= 1, `S3 out of [0,1] for ${k}/${s}`);
      assert.ok(S4 >= 0 && S4 <= 1, `S4 out of [0,1] for ${k}/${s}`);
      assert.ok(S5 >= 0 && S5 <= 1, `S5 out of [0,1] for ${k}/${s}`);
      assert.ok(S6 >= 0 && S6 <= 1, `S6 out of [0,1] for ${k}/${s}`);

      assert.strictEqual(sc.label, labelForScore(sc.compositeScore), `label drift for ${k}/${s}`);
      assert.strictEqual(rc.suitability, sc.label, `suitability != label for ${k}/${s}: "${rc.suitability}" vs "${sc.label}"`);
      checked++;
    }
  }
  assert.strictEqual(checked, 21, `Expected 21 combinations, checked ${checked}`);
  console.log(`  PASS: full matrix verified across ${checked}/21 combinations`);
  passCount++;
} catch (e) {
  console.error(`  FAIL: ${e.message}`);
  failCount++;
}

// ---- Gate 4 contract: missing-data handling (must throw, never return 0) ----
console.log('\nTesting missing-data contract...');
const serpongPoiRetail = verifiedDataset.by_kecamatan.serpong.sector_poi.retail;
const serpongPoiPer10kRetail = verifiedDataset.by_kecamatan.serpong.sector_poi_per_10k.retail;
try {
  delete verifiedDataset.by_kecamatan.serpong.sector_poi.retail;
  delete verifiedDataset.by_kecamatan.serpong.sector_poi_per_10k.retail;
  try {
    calculateScore('serpong', 'retail');
    console.error('  FAIL: calculateScore should throw when sector POI is absent');
    failCount++;
  } catch (err) {
    console.log('  PASS: missing sector POI threw as expected (does NOT return 0)');
    passCount++;
  }
} finally {
  verifiedDataset.by_kecamatan.serpong.sector_poi.retail = serpongPoiRetail;
  verifiedDataset.by_kecamatan.serpong.sector_poi_per_10k.retail = serpongPoiPer10kRetail;
}

const retailMaxPer10k = normalizers.sector_per_10k_max.retail;
try {
  delete normalizers.sector_per_10k_max.retail;
  try {
    calculateScore('serpong', 'retail');
    console.error('  FAIL: calculateScore should throw when sector normalizer is absent');
    failCount++;
  } catch (err) {
    console.log('  PASS: missing sector normalizer threw as expected (does NOT return 0)');
    passCount++;
  }
} finally {
  normalizers.sector_per_10k_max.retail = retailMaxPer10k;
}

// ---- Gate 4 contract: determinism ----
console.log('\nTesting calculation determinism...');
try {
  const KEC = ['serpong', 'serpong_utara', 'pondok_aren', 'ciputat', 'ciputat_timur', 'pamulang', 'setu'];
  for (const k of KEC) {
    for (const s of VERIFIED_SECTORS) {
      const res1 = calculateScore(k, s);
      const res2 = calculateScore(k, s);
      assert.strictEqual(res1.compositeScore, res2.compositeScore, `Determinism mismatch for ${k}/${s}`);
      assert.deepStrictEqual(res1.scores, res2.scores, `Score components mismatch for ${k}/${s}`);
    }
  }
  console.log('  PASS: calculateScore is strictly deterministic across repeated calls');
  passCount++;
} catch (e) {
  console.error(`  FAIL: ${e.message}`);
  failCount++;
}


console.log(`\nTest results: ${passCount} passed, ${failCount} failed.`);
if (failCount > 0) {
  process.exit(1);
} else {
  console.log('All tests passed successfully!');
  process.exit(0);
}
