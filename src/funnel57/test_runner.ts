/**
 * 3D Memory Studio — Funnel 57: Test Suite Runner
 */

import {
  testGeometryEngineInitializes,
  testMaterialEngineInitializes,
  testGeometryRegistryPreventsDuplicates,
  testMaterialRegistryPreventsDuplicates,
  testMemoryCoreGeometryCreated,
  testGreenStateReceivesGeometry,
  testRedStateReceivesNoGeometry,
  testRelationshipGeometryConnects,
  testClusterGeometryCreated,
  testDimensionGeometryCreated,
  testStateMaterialReuseWorks,
  testMaterialReferenceCountingWorks,
  testHighlightMaterialStateWorks,
  testSceneObjectMeshSync,
  testTransformSynchronization,
  testVisibilitySynchronization,
  testSelectionHighlightSync,
  testGeometryDisposalWorks,
  testMaterialDisposalWorks,
  testSharedResourceDisposalWorks,
  testRenderingBudgetBounded,
  testLargeDatasetBoundedResources,
} from './tests/geometry_material_engine.test';
import { F57SuiteReport, F57TestResult } from './types';

export function runFunnel57TestSuite(): F57SuiteReport {
  const startTime = performance.now();

  const testFns: Array<{ fn: () => F57TestResult; id: string }> = [
    { fn: testGeometryEngineInitializes, id: 'TC-F57-01' },
    { fn: testMaterialEngineInitializes, id: 'TC-F57-02' },
    { fn: testGeometryRegistryPreventsDuplicates, id: 'TC-F57-03' },
    { fn: testMaterialRegistryPreventsDuplicates, id: 'TC-F57-04' },
    { fn: testMemoryCoreGeometryCreated, id: 'TC-F57-05' },
    { fn: testGreenStateReceivesGeometry, id: 'TC-F57-06' },
    { fn: testRedStateReceivesNoGeometry, id: 'TC-F57-07' },
    { fn: testRelationshipGeometryConnects, id: 'TC-F57-08' },
    { fn: testClusterGeometryCreated, id: 'TC-F57-09' },
    { fn: testDimensionGeometryCreated, id: 'TC-F57-10' },
    { fn: testStateMaterialReuseWorks, id: 'TC-F57-11' },
    { fn: testMaterialReferenceCountingWorks, id: 'TC-F57-12' },
    { fn: testHighlightMaterialStateWorks, id: 'TC-F57-13' },
    { fn: testSceneObjectMeshSync, id: 'TC-F57-14' },
    { fn: testTransformSynchronization, id: 'TC-F57-15' },
    { fn: testVisibilitySynchronization, id: 'TC-F57-16' },
    { fn: testSelectionHighlightSync, id: 'TC-F57-17' },
    { fn: testGeometryDisposalWorks, id: 'TC-F57-18' },
    { fn: testMaterialDisposalWorks, id: 'TC-F57-19' },
    { fn: testSharedResourceDisposalWorks, id: 'TC-F57-20' },
    { fn: testRenderingBudgetBounded, id: 'TC-F57-21' },
    { fn: testLargeDatasetBoundedResources, id: 'TC-F57-22' },
  ];

  const results: F57TestResult[] = [];
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
    suiteName: 'Funnel 57 — Actual 3D Geometry & Material Engine',
    totalTests: testFns.length,
    passedTests: passedCount,
    failedTests: testFns.length - passedCount,
    allPassed: passedCount === testFns.length,
    totalDurationMs: performance.now() - startTime,
    results,
  };
}
