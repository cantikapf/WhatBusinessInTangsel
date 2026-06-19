import { calculateScore } from './src/lib/engine/scoring.ts';
import { generateRecommendation } from './src/lib/engine/recommender.ts';
import assert from 'assert';

console.log('Starting Tangsel Business Prospect Analytics Engine Tests...');

const testCases = [
  { subdistrict: 'serpong', sector: 'fnb' },
  { subdistrict: 'setu', sector: 'retail' },
  { subdistrict: 'pamulang', sector: 'fashion' },
  { subdistrict: 'ciputat', sector: 'beauty' },
  { subdistrict: 'ciputat_timur', sector: 'education' },
  { subdistrict: 'pondok_aren', sector: 'health' },
  { subdistrict: 'serpong_utara', sector: 'automotive' }
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
    
    // Validate individual scores
    const { S1, S2, S3, S4, S5, S6, S7, S8 } = scoreData.scores;
    assert.ok(S1 >= 0 && S1 <= 1, 'S1 should be between 0 and 1');
    assert.ok(S2 >= 0 && S2 <= 1, 'S2 should be between 0 and 1');
    assert.ok(S3 >= 0 && S3 <= 1, 'S3 should be between 0 and 1');
    assert.ok(S4 >= 0 && S4 <= 1, 'S4 should be between 0 and 1');
    assert.ok(S5 >= 0 && S5 <= 1, 'S5 should be between 0 and 1');
    assert.ok(S6 >= 0 && S6 <= 1, 'S6 should be capped at 1.0');
    assert.ok(S7 >= 0 && S7 <= 1, 'S7 should be between 0 and 1');
    assert.ok(S8 >= 0 && S8 <= 1, 'S8 should be between 0 and 1');
    
    // Verify math formula:
    // compositeScore = (0.15 * S1 + 0.15 * S2 + 0.15 * S3 + 0.15 * S4 + 0.10 * S5 + 0.10 * S6 + 0.10 * S7 + 0.10 * S8) * 10
    const expectedComposite = (0.15 * S1 + 0.15 * S2 + 0.15 * S3 + 0.15 * S4 + 0.10 * S5 + 0.10 * S6 + 0.10 * S7 + 0.10 * S8) * 10;
    const roundedExpected = Math.max(1.0, Math.min(10.0, Math.round(expectedComposite * 10) / 10));
    assert.strictEqual(scoreData.compositeScore, roundedExpected, `Math mismatch: expected ${roundedExpected}, got ${scoreData.compositeScore}`);
    
    console.log(`  Score: ${scoreData.compositeScore} (${scoreData.label})`);
    console.log(`  Metrics detailed scores: S1=${S1.toFixed(4)}, S2=${S2.toFixed(4)}, S3=${S3.toFixed(4)}, S4=${S4.toFixed(4)}, S5=${S5.toFixed(4)}, S6=${S6.toFixed(4)}, S7=${S7.toFixed(4)}, S8=${S8.toFixed(4)}`);

    // Test generateRecommendation
    const recData = generateRecommendation(tc.subdistrict, tc.sector, scoreData);
    
    // Assertions for recData
    assert.ok(recData, 'Recommendation data should be defined');
    assert.ok(typeof recData.suitability === 'string', 'Suitability should be a string');
    assert.ok(typeof recData.mainRisk === 'string', 'Main risk should be a string');
    assert.ok(typeof recData.targetSegment === 'string', 'Target segment should be a string');
    assert.ok(Array.isArray(recData.strategies), 'Strategies should be an array');
    assert.ok(recData.strategies.length > 0, 'Strategies should not be empty');
    
    console.log(`  Suitability: ${recData.suitability}`);
    console.log(`  Strategies count: ${recData.strategies.length}`);
    console.log(`  Strategies:`);
    recData.strategies.forEach((s, idx) => console.log(`    ${idx + 1}. ${s}`));
    
    passCount++;
  } catch (err) {
    console.error(`  FAIL: ${err.message}`);
    failCount++;
  }
}

console.log(`\nTest results: ${passCount} passed, ${failCount} failed.`);
if (failCount > 0) {
  process.exit(1);
} else {
  console.log('All tests passed successfully!');
  process.exit(0);
}
