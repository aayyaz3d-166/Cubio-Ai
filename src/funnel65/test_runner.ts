/**
 * 3D Memory Studio — Funnel 65: Test Suite Runner
 */

import {
  testRuntimeInitializes,
  testRuntimeLifecycleDeterministic,
  testRootApplicationDetected,
  testLandingMounts,
  testLandingIsVisible,
  testStartButtonExists,
  testStartButtonIsEnabled,
  testStartActivationWorks,
  testDuplicateStartPrevented,
  testStudioStateReached,
  testRendererConnects,
  testCanvasExists,
  testCanvasDimensionsValid,
  testCameraConnects,
  testSceneConnects,
  testRendererNotDuplicated,
  testNoSecondRAFLoop,
  testResizeSynchronizationWorks,
  testWorkspaceMounts,
  testWorkspaceIsVisible,
  testNavigationMounts,
  testPanelOpens,
  testPanelCloses,
  testPanelDoesNotDestroyViewport,
  testGreenRuntimeTargetAllowed,
  testRedRuntimeTargetBlocked,
  testRuntimeErrorBoundaryWorks,
  testRuntimeDisposalWorks,
  testReloadLifecycleClean,
  testFullRuntimeIntegrationWorks,
} from './tests/studio_runtime_activation.test';
import { F65SuiteReport, F65TestResult } from './types';

export async function runFunnel65TestSuite(): Promise<F65SuiteReport> {
  const startTime = performance.now();

  const testFns: Array<{ fn: () => F65TestResult | Promise<F65TestResult>; id: string }> = [
    { fn: testRuntimeInitializes, id: 'TC-F65-01' },
    { fn: testRuntimeLifecycleDeterministic, id: 'TC-F65-02' },
    { fn: testRootApplicationDetected, id: 'TC-F65-03' },
    { fn: testLandingMounts, id: 'TC-F65-04' },
    { fn: testLandingIsVisible, id: 'TC-F65-05' },
    { fn: testStartButtonExists, id: 'TC-F65-06' },
    { fn: testStartButtonIsEnabled, id: 'TC-F65-07' },
    { fn: testStartActivationWorks, id: 'TC-F65-08' },
    { fn: testDuplicateStartPrevented, id: 'TC-F65-09' },
    { fn: testStudioStateReached, id: 'TC-F65-10' },
    { fn: testRendererConnects, id: 'TC-F65-11' },
    { fn: testCanvasExists, id: 'TC-F65-12' },
    { fn: testCanvasDimensionsValid, id: 'TC-F65-13' },
    { fn: testCameraConnects, id: 'TC-F65-14' },
    { fn: testSceneConnects, id: 'TC-F65-15' },
    { fn: testRendererNotDuplicated, id: 'TC-F65-16' },
    { fn: testNoSecondRAFLoop, id: 'TC-F65-17' },
    { fn: testResizeSynchronizationWorks, id: 'TC-F65-18' },
    { fn: testWorkspaceMounts, id: 'TC-F65-19' },
    { fn: testWorkspaceIsVisible, id: 'TC-F65-20' },
    { fn: testNavigationMounts, id: 'TC-F65-21' },
    { fn: testPanelOpens, id: 'TC-F65-22' },
    { fn: testPanelCloses, id: 'TC-F65-23' },
    { fn: testPanelDoesNotDestroyViewport, id: 'TC-F65-24' },
    { fn: testGreenRuntimeTargetAllowed, id: 'TC-F65-25' },
    { fn: testRedRuntimeTargetBlocked, id: 'TC-F65-26' },
    { fn: testRuntimeErrorBoundaryWorks, id: 'TC-F65-27' },
    { fn: testRuntimeDisposalWorks, id: 'TC-F65-28' },
    { fn: testReloadLifecycleClean, id: 'TC-F65-29' },
    { fn: testFullRuntimeIntegrationWorks, id: 'TC-F65-30' },
  ];

  const results: F65TestResult[] = [];
  let passedCount = 0;

  for (const { fn, id } of testFns) {
    try {
      const res = await fn();
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
    suiteName: 'Funnel 65 — Actual Studio Runtime Activation & UI Integration',
    totalTests: testFns.length,
    passedTests: passedCount,
    failedTests: testFns.length - passedCount,
    allPassed: passedCount === testFns.length,
    totalDurationMs: performance.now() - startTime,
    results,
  };
}
