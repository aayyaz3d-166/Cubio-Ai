/**
 * 3D Memory Studio — Funnel 61: Test Suite Runner
 */

import {
  testCameraEngineInitializes,
  testCameraLifecycleDeterministic,
  testDefaultCameraStateValid,
  testOrbitControllerWorks,
  testOrbitPitchBoundsEnforced,
  testOrbitDistanceBoundsEnforced,
  testPanControllerWorks,
  testZoomControllerWorks,
  testZeroDistancePrevented,
  testNaNCoordinatesBlocked,
  testInfinityCoordinatesBlocked,
  testCameraTargetManagerWorks,
  testFocusStateWorks,
  testFocusClusterWorks,
  testFocusRelationshipWorks,
  testFrameObjectCalculatesBoundedDistance,
  testGraphNeighborhoodFocusWorks,
  testDepth3TraversalRemainsBounded,
  testCameraPresetsDeterministic,
  testCameraResetWorks,
  testCameraTransitionWorks,
  testTransitionFrameRateIndependent,
  testDimensionSwitchPreservesCameraIdentity,
  testZ4CameraIdentifiesComputationalProjection,
  testSearchResultFocusPermittedState,
  testSelectionFocusWorks,
  testNavigationBoundsEnforced,
  testCameraHistoryBoundedTo20,
  testCameraResourcesDisposeSafely,
  testNoSecondRAFLoop,
} from './tests/camera_navigation_engine.test';
import { F61SuiteReport, F61TestResult } from './types';

export function runFunnel61TestSuite(): F61SuiteReport {
  const startTime = performance.now();

  const testFns: Array<{ fn: () => F61TestResult; id: string }> = [
    { fn: testCameraEngineInitializes, id: 'TC-F61-01' },
    { fn: testCameraLifecycleDeterministic, id: 'TC-F61-02' },
    { fn: testDefaultCameraStateValid, id: 'TC-F61-03' },
    { fn: testOrbitControllerWorks, id: 'TC-F61-04' },
    { fn: testOrbitPitchBoundsEnforced, id: 'TC-F61-05' },
    { fn: testOrbitDistanceBoundsEnforced, id: 'TC-F61-06' },
    { fn: testPanControllerWorks, id: 'TC-F61-07' },
    { fn: testZoomControllerWorks, id: 'TC-F61-08' },
    { fn: testZeroDistancePrevented, id: 'TC-F61-09' },
    { fn: testNaNCoordinatesBlocked, id: 'TC-F61-10' },
    { fn: testInfinityCoordinatesBlocked, id: 'TC-F61-11' },
    { fn: testCameraTargetManagerWorks, id: 'TC-F61-12' },
    { fn: testFocusStateWorks, id: 'TC-F61-13' },
    { fn: testFocusClusterWorks, id: 'TC-F61-14' },
    { fn: testFocusRelationshipWorks, id: 'TC-F61-15' },
    { fn: testFrameObjectCalculatesBoundedDistance, id: 'TC-F61-16' },
    { fn: testGraphNeighborhoodFocusWorks, id: 'TC-F61-17' },
    { fn: testDepth3TraversalRemainsBounded, id: 'TC-F61-18' },
    { fn: testCameraPresetsDeterministic, id: 'TC-F61-19' },
    { fn: testCameraResetWorks, id: 'TC-F61-20' },
    { fn: testCameraTransitionWorks, id: 'TC-F61-21' },
    { fn: testTransitionFrameRateIndependent, id: 'TC-F61-22' },
    { fn: testDimensionSwitchPreservesCameraIdentity, id: 'TC-F61-23' },
    { fn: testZ4CameraIdentifiesComputationalProjection, id: 'TC-F61-24' },
    { fn: testSearchResultFocusPermittedState, id: 'TC-F61-25' },
    { fn: testSelectionFocusWorks, id: 'TC-F61-26' },
    { fn: testNavigationBoundsEnforced, id: 'TC-F61-27' },
    { fn: testCameraHistoryBoundedTo20, id: 'TC-F61-28' },
    { fn: testCameraResourcesDisposeSafely, id: 'TC-F61-29' },
    { fn: testNoSecondRAFLoop, id: 'TC-F61-30' },
  ];

  const results: F61TestResult[] = [];
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
    suiteName: 'Funnel 61 — Actual 3D Camera & Navigation Engine',
    totalTests: testFns.length,
    passedTests: passedCount,
    failedTests: testFns.length - passedCount,
    allPassed: passedCount === testFns.length,
    totalDurationMs: performance.now() - startTime,
    results,
  };
}
