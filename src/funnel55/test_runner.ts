/**
 * 3D Memory Studio — Funnel 55: Test Suite Runner
 */

import {
  testRendererInitializesSuccessfully,
  testRendererLifecycleDeterministic,
  testWebGLCapabilityDetectionWorks,
  testFallbackActivatesWhenWebGLUnavailable,
  testCanvasAttachesCorrectly,
  testCanvasResizeWorks,
  testDevicePixelRatioBounded,
  testRenderLoopStartsCorrectly,
  testRenderLoopPausesCorrectly,
  testRenderLoopResumesCorrectly,
  testRenderLoopCleanupReleasesRAF,
  testDoubleDisposeIsSafe,
  testSceneLayersInitializeCorrectly,
  testRenderableObjectLifecycleWorks,
  testResourceRegistryReleasesResources,
  testRendererTelemetryRemainsBounded,
  testGreenAdapterPermitsAuthorizedState,
  testRedDataCannotBecomeRenderPayload,
} from './tests/renderer_foundation.test';
import { F55SuiteReport, F55TestResult } from './types';

export function runFunnel55TestSuite(): F55SuiteReport {
  const startTime = performance.now();

  const testFns: Array<{ fn: () => F55TestResult; id: string }> = [
    { fn: testRendererInitializesSuccessfully, id: 'TC-F55-01' },
    { fn: testRendererLifecycleDeterministic, id: 'TC-F55-02' },
    { fn: testWebGLCapabilityDetectionWorks, id: 'TC-F55-03' },
    { fn: testFallbackActivatesWhenWebGLUnavailable, id: 'TC-F55-04' },
    { fn: testCanvasAttachesCorrectly, id: 'TC-F55-05' },
    { fn: testCanvasResizeWorks, id: 'TC-F55-06' },
    { fn: testDevicePixelRatioBounded, id: 'TC-F55-07' },
    { fn: testRenderLoopStartsCorrectly, id: 'TC-F55-08' },
    { fn: testRenderLoopPausesCorrectly, id: 'TC-F55-09' },
    { fn: testRenderLoopResumesCorrectly, id: 'TC-F55-10' },
    { fn: testRenderLoopCleanupReleasesRAF, id: 'TC-F55-11' },
    { fn: testDoubleDisposeIsSafe, id: 'TC-F55-12' },
    { fn: testSceneLayersInitializeCorrectly, id: 'TC-F55-13' },
    { fn: testRenderableObjectLifecycleWorks, id: 'TC-F55-14' },
    { fn: testResourceRegistryReleasesResources, id: 'TC-F55-15' },
    { fn: testRendererTelemetryRemainsBounded, id: 'TC-F55-16' },
    { fn: testGreenAdapterPermitsAuthorizedState, id: 'TC-F55-17' },
    { fn: testRedDataCannotBecomeRenderPayload, id: 'TC-F55-18' },
  ];

  const results: F55TestResult[] = [];
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
    suiteName: 'Funnel 55 — Actual 3D Renderer Foundation',
    totalTests: testFns.length,
    passedTests: passedCount,
    failedTests: testFns.length - passedCount,
    allPassed: passedCount === testFns.length,
    totalDurationMs: performance.now() - startTime,
    results,
  };
}
