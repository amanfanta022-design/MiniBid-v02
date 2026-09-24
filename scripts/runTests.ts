import { runFinancialIntegrityTests } from '../server/integrityTests.js';

async function main() {
  console.log('Starting Financial Integrity & Concurrency Test Suite (10 Scenarios)...');
  const report = await runFinancialIntegrityTests();

  console.log('\n======================================================');
  console.log(`TEST SUITE RESULTS: ${report.passedTests}/${report.totalTests} PASSED`);
  console.log(`Total Duration: ${report.totalDurationMs} ms`);
  console.log(`All Passed: ${report.allPassed}`);
  console.log('======================================================\n');

  for (const step of report.steps) {
    const statusMark = step.passed ? '✅ [PASS]' : '❌ [FAIL]';
    console.log(`${statusMark} ${step.testId}: ${step.name} (${step.durationMs}ms)`);
    console.log(`   Details: ${step.details}`);
  }

  if (!report.allPassed) {
    console.error('\n❌ FAILURE: One or more financial integrity tests failed!');
    process.exit(1);
  } else {
    console.log('\n🎉 SUCCESS: All 10 financial integrity tests PASSED! Zero double deposits verified.');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Unhandled error in test runner:', err);
  process.exit(1);
});
