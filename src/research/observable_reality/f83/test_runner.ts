/**
 * 3D Memory Studio — Funnel 83
 * Test Suite Runner
 */

import { runF83TestSuite } from './tests/f83_observer_navigation.test';

export async function runAllF83Tests() {
  const result = await runF83TestSuite();
  return result;
}

if (typeof process !== 'undefined' && process.argv[1]?.includes('test_runner')) {
  runAllF83Tests().then((r) => {
    console.log('[F83 Observer Navigation] Total: ' + r.totalTests + ', Passed: ' + r.passedTests + ', Failed: ' + r.failedTests + ', AllPassed: ' + r.allPassed);
    if (!r.allPassed) {
      r.results.filter((t) => !t.passed).forEach((t) => console.error('FAILED: ' + t.testId + ' - ' + t.name + ': ' + t.details));
      process.exit(1);
    }
    process.exit(0);
  });
}
