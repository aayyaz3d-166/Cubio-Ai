/**
 * 3D Memory Studio — Funnel 56: Test Suite Runner
 */

import {
  testSceneEngineInitializes,
  testSceneLifecycleDeterministic,
  testSceneGraphCreatesHierarchy,
  testSceneRegistryPreventsDuplicates,
  testGreenStateBecomesSceneObject,
  testRedStateIsBlocked,
  testSceneLayersInitializeCorrectly,
  testLayerVisibilityWorks,
  testObjectAddRemoveWorks,
  testObjectLifecycleWorks,
  testLocalTransformWorks,
  testWorldTransformWorks,
  testParentChildTransformWorks,
  testStateSelectionWorks,
  testSearchHighlightSynchronizationWorks,
  testDimensionObjectWorks,
  testSceneSynchronizationWithF52Works,
  testObjectBoundsAreEnforced,
  testSceneDisposalReleasesObjects,
  testDeterministicSceneReplay,
} from './tests/scene_engine.test';
import { F56SuiteReport, F56TestResult } from './types';

export function runFunnel56TestSuite(): F56SuiteReport {
  const startTime = performance.now();

  const testFns: Array<{ fn: () => F56TestResult; id: string }> = [
    { fn: testSceneEngineInitializes, id: 'TC-F56-01' },
    { fn: testSceneLifecycleDeterministic, id: 'TC-F56-02' },
    { fn: testSceneGraphCreatesHierarchy, id: 'TC-F56-03' },
    { fn: testSceneRegistryPreventsDuplicates, id: 'TC-F56-04' },
    { fn: testGreenStateBecomesSceneObject, id: 'TC-F56-05' },
    { fn: testRedStateIsBlocked, id: 'TC-F56-06' },
    { fn: testSceneLayersInitializeCorrectly, id: 'TC-F56-07' },
    { fn: testLayerVisibilityWorks, id: 'TC-F56-08' },
    { fn: testObjectAddRemoveWorks, id: 'TC-F56-09' },
    { fn: testObjectLifecycleWorks, id: 'TC-F56-10' },
    { fn: testLocalTransformWorks, id: 'TC-F56-11' },
    { fn: testWorldTransformWorks, id: 'TC-F56-12' },
    { fn: testParentChildTransformWorks, id: 'TC-F56-13' },
    { fn: testStateSelectionWorks, id: 'TC-F56-14' },
    { fn: testSearchHighlightSynchronizationWorks, id: 'TC-F56-15' },
    { fn: testDimensionObjectWorks, id: 'TC-F56-16' },
    { fn: testSceneSynchronizationWithF52Works, id: 'TC-F56-17' },
    { fn: testObjectBoundsAreEnforced, id: 'TC-F56-18' },
    { fn: testSceneDisposalReleasesObjects, id: 'TC-F56-19' },
    { fn: testDeterministicSceneReplay, id: 'TC-F56-20' },
  ];

  const results: F56TestResult[] = [];
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
    suiteName: 'Funnel 56 — Actual 3D Scene Engine',
    totalTests: testFns.length,
    passedTests: passedCount,
    failedTests: testFns.length - passedCount,
    allPassed: passedCount === testFns.length,
    totalDurationMs: performance.now() - startTime,
    results,
  };
}
