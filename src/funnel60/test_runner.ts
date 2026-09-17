/**
 * 3D Memory Studio — Funnel 60: Test Suite Runner
 */

import {
  testDimensionEngineInitializes,
  testDimensionLifecycleDeterministic,
  testRegistryPreventsDuplicates,
  testAllSupportedDimensionsRegister,
  testZ3IsActualSpatialMode,
  testZ4IsComputationalProjection,
  testZ8IsComputationalProjection,
  testZ12IsComputationalProjection,
  testZ16IsComputationalProjection,
  testDimensionCoordinatesPreserveIdentity,
  testZ3CoordinateMapsToWorldSpace,
  testZ4ProjectionDeterministic,
  testZ8ProjectionDeterministic,
  testZ16ProjectionDeterministic,
  testProjectionPreservesSourceCoordinates,
  testDimensionSwitchingPreservesStateIdentity,
  testDimensionSwitchingPreservesRelationshipIdentity,
  testDimensionSwitchingPreservesClusterIdentity,
  testWorldBoundsEnforced,
  testInvalidCoordinatesRejected,
  testNaNInfinityBlocked,
  testDimensionVisibilityWorks,
  testDimensionSelectionWorks,
  testSearchHighlightSurvivesSwitching,
  testGraphSyncSurvivesSwitching,
  testClusterSyncSurvivesSwitching,
  testProjectionResourcesReused,
  testDimensionDisposalReleasesResources,
} from './tests/dimension_projection_engine.test';
import { F60SuiteReport, F60TestResult } from './types';

export function runFunnel60TestSuite(): F60SuiteReport {
  const startTime = performance.now();

  const testFns: Array<{ fn: () => F60TestResult; id: string }> = [
    { fn: testDimensionEngineInitializes, id: 'TC-F60-01' },
    { fn: testDimensionLifecycleDeterministic, id: 'TC-F60-02' },
    { fn: testRegistryPreventsDuplicates, id: 'TC-F60-03' },
    { fn: testAllSupportedDimensionsRegister, id: 'TC-F60-04' },
    { fn: testZ3IsActualSpatialMode, id: 'TC-F60-05' },
    { fn: testZ4IsComputationalProjection, id: 'TC-F60-06' },
    { fn: testZ8IsComputationalProjection, id: 'TC-F60-07' },
    { fn: testZ12IsComputationalProjection, id: 'TC-F60-08' },
    { fn: testZ16IsComputationalProjection, id: 'TC-F60-09' },
    { fn: testDimensionCoordinatesPreserveIdentity, id: 'TC-F60-10' },
    { fn: testZ3CoordinateMapsToWorldSpace, id: 'TC-F60-11' },
    { fn: testZ4ProjectionDeterministic, id: 'TC-F60-12' },
    { fn: testZ8ProjectionDeterministic, id: 'TC-F60-13' },
    { fn: testZ16ProjectionDeterministic, id: 'TC-F60-14' },
    { fn: testProjectionPreservesSourceCoordinates, id: 'TC-F60-15' },
    { fn: testDimensionSwitchingPreservesStateIdentity, id: 'TC-F60-16' },
    { fn: testDimensionSwitchingPreservesRelationshipIdentity, id: 'TC-F60-17' },
    { fn: testDimensionSwitchingPreservesClusterIdentity, id: 'TC-F60-18' },
    { fn: testWorldBoundsEnforced, id: 'TC-F60-19' },
    { fn: testInvalidCoordinatesRejected, id: 'TC-F60-20' },
    { fn: testNaNInfinityBlocked, id: 'TC-F60-21' },
    { fn: testDimensionVisibilityWorks, id: 'TC-F60-22' },
    { fn: testDimensionSelectionWorks, id: 'TC-F60-23' },
    { fn: testSearchHighlightSurvivesSwitching, id: 'TC-F60-24' },
    { fn: testGraphSyncSurvivesSwitching, id: 'TC-F60-25' },
    { fn: testClusterSyncSurvivesSwitching, id: 'TC-F60-26' },
    { fn: testProjectionResourcesReused, id: 'TC-F60-27' },
    { fn: testDimensionDisposalReleasesResources, id: 'TC-F60-28' },
  ];

  const results: F60TestResult[] = [];
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
    suiteName: 'Funnel 60 — Actual 3D Dimension & Projection Engine',
    totalTests: testFns.length,
    passedTests: passedCount,
    failedTests: testFns.length - passedCount,
    allPassed: passedCount === testFns.length,
    totalDurationMs: performance.now() - startTime,
    results,
  };
}
