/**
 * 3D Memory Studio — Funnel 59: Test Suite Runner
 */

import {
  testClusterEngineInitializes,
  testClusterLifecycleDeterministic,
  testClusterRegistryPreventsDuplicates,
  testGreenStateEntersCluster,
  testRedStateBlocked,
  testInvalidClusterMembershipRejected,
  testClusterMembershipAddRemove,
  testClusterCenterCalculation,
  testClusterBoundsCalculation,
  testClusterRadiusCalculation,
  testClusterGeometryCreation,
  testClusterMaterialReuse,
  testMemberMovementUpdatesCluster,
  testClusterOverlapResolution,
  testRadialLayoutDeterministic,
  testGridLayoutDeterministic,
  testOrbitalLayoutDeterministic,
  testHierarchicalLayoutDeterministic,
  testGraphAwareClusterMetrics,
  testInternalExternalRelationshipDetection,
  testClusterVisibilityWorks,
  testClusterSelectionWorks,
  testClusterHighlightingWorks,
  testSearchSynchronizesWithCluster,
  testDimensionProjectionWorks,
  testClusterRenderingBudgetEnforced,
  testEmptyClusterCleanupWorks,
  testClusterDisposalReleasesResources,
} from './tests/cluster_spatial_engine.test';
import { F59SuiteReport, F59TestResult } from './types';

export function runFunnel59TestSuite(): F59SuiteReport {
  const startTime = performance.now();

  const testFns: Array<{ fn: () => F59TestResult; id: string }> = [
    { fn: testClusterEngineInitializes, id: 'TC-F59-01' },
    { fn: testClusterLifecycleDeterministic, id: 'TC-F59-02' },
    { fn: testClusterRegistryPreventsDuplicates, id: 'TC-F59-03' },
    { fn: testGreenStateEntersCluster, id: 'TC-F59-04' },
    { fn: testRedStateBlocked, id: 'TC-F59-05' },
    { fn: testInvalidClusterMembershipRejected, id: 'TC-F59-06' },
    { fn: testClusterMembershipAddRemove, id: 'TC-F59-07' },
    { fn: testClusterCenterCalculation, id: 'TC-F59-08' },
    { fn: testClusterBoundsCalculation, id: 'TC-F59-09' },
    { fn: testClusterRadiusCalculation, id: 'TC-F59-10' },
    { fn: testClusterGeometryCreation, id: 'TC-F59-11' },
    { fn: testClusterMaterialReuse, id: 'TC-F59-12' },
    { fn: testMemberMovementUpdatesCluster, id: 'TC-F59-13' },
    { fn: testClusterOverlapResolution, id: 'TC-F59-14' },
    { fn: testRadialLayoutDeterministic, id: 'TC-F59-15' },
    { fn: testGridLayoutDeterministic, id: 'TC-F59-16' },
    { fn: testOrbitalLayoutDeterministic, id: 'TC-F59-17' },
    { fn: testHierarchicalLayoutDeterministic, id: 'TC-F59-18' },
    { fn: testGraphAwareClusterMetrics, id: 'TC-F59-19' },
    { fn: testInternalExternalRelationshipDetection, id: 'TC-F59-20' },
    { fn: testClusterVisibilityWorks, id: 'TC-F59-21' },
    { fn: testClusterSelectionWorks, id: 'TC-F59-22' },
    { fn: testClusterHighlightingWorks, id: 'TC-F59-23' },
    { fn: testSearchSynchronizesWithCluster, id: 'TC-F59-24' },
    { fn: testDimensionProjectionWorks, id: 'TC-F59-25' },
    { fn: testClusterRenderingBudgetEnforced, id: 'TC-F59-26' },
    { fn: testEmptyClusterCleanupWorks, id: 'TC-F59-27' },
    { fn: testClusterDisposalReleasesResources, id: 'TC-F59-28' },
  ];

  const results: F59TestResult[] = [];
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
    suiteName: 'Funnel 59 — Actual 3D Cluster & Spatial Organization Engine',
    totalTests: testFns.length,
    passedTests: passedCount,
    failedTests: testFns.length - passedCount,
    allPassed: passedCount === testFns.length,
    totalDurationMs: performance.now() - startTime,
    results,
  };
}
