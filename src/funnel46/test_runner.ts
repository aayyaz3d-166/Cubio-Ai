/**
 * 3D Memory Studio — Funnel 46: Test Suite Runner
 */

import {
  testStudioRouteMountsSuccessfully,
  testDataAdaptersRemainReadOnly,
  testDataExplorerBoundedRendering,
  testStateSelectionSynchronizesAllPanels,
  test369AndDimensionalVisualizationsDeterministic,
  testGraphAndProvenanceNavigationReadOnly,
  testScaleBenchmarkRemainsWithinRenderBudget,
} from './tests/information_universe_studio_frontend.test';
import { F46SuiteReport, F46TestResult } from './types';

export function runFunnel46TestSuite(): F46SuiteReport {
  const startTime = performance.now();

  const testFns: Array<{ fn: () => F46TestResult; id: string }> = [
    { fn: testStudioRouteMountsSuccessfully, id: 'TC-F46-01' },
    { fn: testDataAdaptersRemainReadOnly, id: 'TC-F46-02' },
    { fn: testDataExplorerBoundedRendering, id: 'TC-F46-03' },
    { fn: testStateSelectionSynchronizesAllPanels, id: 'TC-F46-04' },
    { fn: test369AndDimensionalVisualizationsDeterministic, id: 'TC-F46-05' },
    { fn: testGraphAndProvenanceNavigationReadOnly, id: 'TC-F46-06' },
    { fn: testScaleBenchmarkRemainsWithinRenderBudget, id: 'TC-F46-07' },
  ];

  const results: F46TestResult[] = [];
  let passedCount = 0;

  for (const { fn, id } of testFns) {
    try {
      const res = fn();
      results.push(res);
      if (res.passed) passedCount++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const stack = err instanceof Error ? (err.stack ?? '') : '';
      results.push({
        testId: id,
        name: `Exception in ${id}`,
        passed: false,
        details: `Exception: ${msg}\n${stack.split('\n').slice(0, 3).join(' | ')}`,
        durationMs: 0,
      });
    }
  }

  return {
    suiteName: 'Funnel 46 — Information Universe Studio Frontend Integration',
    totalTests: testFns.length,
    passedTests: passedCount,
    failedTests: testFns.length - passedCount,
    allPassed: passedCount === testFns.length,
    totalDurationMs: performance.now() - startTime,
    results,
  };
}
