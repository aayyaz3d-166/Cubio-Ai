/**
 * 3D Memory Studio — Funnel 63: Test Suite Runner
 */

import {
  testLandingEngineInitializes,
  testLandingLifecycleDeterministic,
  testCubeGeometryCreatedCorrectly,
  testCubeMaterialResourcesReused,
  testCubeInitialOrientationDeterministic,
  testMouseRotationWorks,
  testTouchSwipeRotationWorks,
  testCubeRotationBoundsEnforced,
  testCubeZoomBoundsEnforced,
  testCubeResetWorks,
  testCubeHoverStateWorks,
  testCubeFaceSelectionWorks,
  testStartControlInitializes,
  testStartActivationEntersRequested,
  testDuplicateStartActivationPrevented,
  testEntryTransitionProgressesDeterministically,
  testEntryTransitionFrameRateIndependent,
  testF62StudioShellReceivesEntry,
  testF61CameraIntegrationWorks,
  testF55RendererIntegrationWorks,
  testSecurityBoundaryBlocksRestrictedTargets,
  testResponsiveLandingStateBounded,
  testNoSecondRAFLoopCreated,
  testLandingResourcesDisposeSafely,
} from './tests/landing_cube_engine.test';
import { F63SuiteReport, F63TestResult } from './types';

export async function runFunnel63TestSuite(): Promise<F63SuiteReport> {
  const startTime = performance.now();

  const testFns: Array<{ fn: () => F63TestResult | Promise<F63TestResult>; id: string }> = [
    { fn: testLandingEngineInitializes, id: 'TC-F63-01' },
    { fn: testLandingLifecycleDeterministic, id: 'TC-F63-02' },
    { fn: testCubeGeometryCreatedCorrectly, id: 'TC-F63-03' },
    { fn: testCubeMaterialResourcesReused, id: 'TC-F63-04' },
    { fn: testCubeInitialOrientationDeterministic, id: 'TC-F63-05' },
    { fn: testMouseRotationWorks, id: 'TC-F63-06' },
    { fn: testTouchSwipeRotationWorks, id: 'TC-F63-07' },
    { fn: testCubeRotationBoundsEnforced, id: 'TC-F63-08' },
    { fn: testCubeZoomBoundsEnforced, id: 'TC-F63-09' },
    { fn: testCubeResetWorks, id: 'TC-F63-10' },
    { fn: testCubeHoverStateWorks, id: 'TC-F63-11' },
    { fn: testCubeFaceSelectionWorks, id: 'TC-F63-12' },
    { fn: testStartControlInitializes, id: 'TC-F63-13' },
    { fn: testStartActivationEntersRequested, id: 'TC-F63-14' },
    { fn: testDuplicateStartActivationPrevented, id: 'TC-F63-15' },
    { fn: testEntryTransitionProgressesDeterministically, id: 'TC-F63-16' },
    { fn: testEntryTransitionFrameRateIndependent, id: 'TC-F63-17' },
    { fn: testF62StudioShellReceivesEntry, id: 'TC-F63-18' },
    { fn: testF61CameraIntegrationWorks, id: 'TC-F63-19' },
    { fn: testF55RendererIntegrationWorks, id: 'TC-F63-20' },
    { fn: testSecurityBoundaryBlocksRestrictedTargets, id: 'TC-F63-21' },
    { fn: testResponsiveLandingStateBounded, id: 'TC-F63-22' },
    { fn: testNoSecondRAFLoopCreated, id: 'TC-F63-23' },
    { fn: testLandingResourcesDisposeSafely, id: 'TC-F63-24' },
  ];

  const results: F63TestResult[] = [];
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
    suiteName: 'Funnel 63 — Actual 3D Landing Cube & Studio Entry Engine',
    totalTests: testFns.length,
    passedTests: passedCount,
    failedTests: testFns.length - passedCount,
    allPassed: passedCount === testFns.length,
    totalDurationMs: performance.now() - startTime,
    results,
  };
}
