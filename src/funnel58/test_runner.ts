/**
 * 3D Memory Studio — Funnel 58: Test Suite Runner
 */

import {
  testGraphEngineInitializes,
  testGraphLifecycleDeterministic,
  testRegistryPreventsDuplicates,
  testGreenRelationshipEntersGraph,
  testRedRelationshipBlocked,
  testInvalidSourceRejected,
  testInvalidTargetRejected,
  testRelationshipTypesConsistent,
  testStrengthNormalizationWorks,
  testStraightEdgeGeometryConnects,
  testCurvedEdgeGeometryUpdates,
  testSourceMovementUpdatesEdge,
  testTargetMovementUpdatesEdge,
  testRelationshipMaterialReuse,
  testGraphFilteringWorks,
  testGraphVisibilityWorks,
  testNodeSelectionHighlightsEdges,
  testRelationshipSelectionWorks,
  testSearchHighlightSynchronizes,
  testNeighborQueryWorks,
  testDepth3TraversalBounded,
  testGraphRenderingBudgetEnforced,
  testOrphanRelationshipsRemoved,
  testGraphDisposalReleasesResources,
} from './tests/relationship_graph_engine.test';
import { F58SuiteReport, F58TestResult } from './types';

export function runFunnel58TestSuite(): F58SuiteReport {
  const startTime = performance.now();

  const testFns: Array<{ fn: () => F58TestResult; id: string }> = [
    { fn: testGraphEngineInitializes, id: 'TC-F58-01' },
    { fn: testGraphLifecycleDeterministic, id: 'TC-F58-02' },
    { fn: testRegistryPreventsDuplicates, id: 'TC-F58-03' },
    { fn: testGreenRelationshipEntersGraph, id: 'TC-F58-04' },
    { fn: testRedRelationshipBlocked, id: 'TC-F58-05' },
    { fn: testInvalidSourceRejected, id: 'TC-F58-06' },
    { fn: testInvalidTargetRejected, id: 'TC-F58-07' },
    { fn: testRelationshipTypesConsistent, id: 'TC-F58-08' },
    { fn: testStrengthNormalizationWorks, id: 'TC-F58-09' },
    { fn: testStraightEdgeGeometryConnects, id: 'TC-F58-10' },
    { fn: testCurvedEdgeGeometryUpdates, id: 'TC-F58-11' },
    { fn: testSourceMovementUpdatesEdge, id: 'TC-F58-12' },
    { fn: testTargetMovementUpdatesEdge, id: 'TC-F58-13' },
    { fn: testRelationshipMaterialReuse, id: 'TC-F58-14' },
    { fn: testGraphFilteringWorks, id: 'TC-F58-15' },
    { fn: testGraphVisibilityWorks, id: 'TC-F58-16' },
    { fn: testNodeSelectionHighlightsEdges, id: 'TC-F58-17' },
    { fn: testRelationshipSelectionWorks, id: 'TC-F58-18' },
    { fn: testSearchHighlightSynchronizes, id: 'TC-F58-19' },
    { fn: testNeighborQueryWorks, id: 'TC-F58-20' },
    { fn: testDepth3TraversalBounded, id: 'TC-F58-21' },
    { fn: testGraphRenderingBudgetEnforced, id: 'TC-F58-22' },
    { fn: testOrphanRelationshipsRemoved, id: 'TC-F58-23' },
    { fn: testGraphDisposalReleasesResources, id: 'TC-F58-24' },
  ];

  const results: F58TestResult[] = [];
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
    suiteName: 'Funnel 58 — Actual 3D Relationship & Graph Rendering Engine',
    totalTests: testFns.length,
    passedTests: passedCount,
    failedTests: testFns.length - passedCount,
    allPassed: passedCount === testFns.length,
    totalDurationMs: performance.now() - startTime,
    results,
  };
}
