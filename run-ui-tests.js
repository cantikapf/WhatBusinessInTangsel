// tangsel_bisnis_v2/run-ui-tests.js
const { spawnSync } = require('child_process');
const path = require('path');

console.log('Starting Tangsel Business Prospect Analytics UI Test Runner...');
console.log('Executing tests/ui.test.js in Node\'s native test runner using tsx loader...\n');

const testFile = path.join(__dirname, 'tests', 'ui.test.js');

// Run node --import tsx --test tests/ui.test.js or npx tsx --test tests/ui.test.js
const result = spawnSync('npx', ['tsx', '--test', testFile], {
  stdio: 'inherit',
  shell: true,
  cwd: __dirname
});

if (result.status !== 0) {
  console.error('\n❌ UI Test Suite Failed!');
  process.exit(result.status || 1);
} else {
  console.log('\n✅ UI Test Suite Passed successfully!');
  process.exit(0);
}
