/**
 * 3D Memory Studio — Funnel 64: Test Suite Runner
 */

import {
  testWorkspaceInitializes,
  testWorkspaceLifecycleDeterministic,
  testPanelRegistryInitializes,
  testDuplicatePanelIdsRejected,
  testPanelOpeningWorks,
  testPanelClosingWorks,
  testPanelActivationWorks,
  testPanelVisibilityWorks,
  testMaxVisiblePanelsEnforced,
  testWorkspaceLayoutDeterministic,
  testSidebarLayoutWorks,
  testThreeColumnLayoutWorks,
  testPanelResizingBounded,
  testPanelDockingWorks,
  testViewportAdapterAttaches,
  testF55RendererAuthoritative,
  testNoSecondRAFLoop,
  testDatabasePanelAdapterWorks,
  testCoordinatesPanelSyncWithF60,
  testInfoPanelSyncWithState,
  testChatPanelInitializes,
  testModelRegistryWorks,
  testSearchPanelRoutesThroughF50,
  testSearchSelectionSyncsWorkspace,
  testGraphPanelSyncWithF58,
  testClusterPanelSyncWithF59,
  testDimensionPanelSyncWithF60,
  testCameraFocusSyncWithF61,
  testGreenSelectionPermitted,
  testRedSelectionBlocked,
} from './tests/studio_workspace_engine.test';
import { F64SuiteReport, F64TestResult } from './types';

export async function runFunnel64TestSuite(): Promise<F64SuiteReport> {
  const startTime = performance.now();

  const testFns: Array<{ fn: () => F64TestResult | Promise<F64TestResult>; id: string }> = [
    { fn: testWorkspaceInitializes, id: 'TC-F64-01' },
    { fn: testWorkspaceLifecycleDeterministic, id: 'TC-F64-02' },
    { fn: testPanelRegistryInitializes, id: 'TC-F64-03' },
    { fn: testDuplicatePanelIdsRejected, id: 'TC-F64-04' },
    { fn: testPanelOpeningWorks, id: 'TC-F64-05' },
    { fn: testPanelClosingWorks, id: 'TC-F64-06' },
    { fn: testPanelActivationWorks, id: 'TC-F64-07' },
    { fn: testPanelVisibilityWorks, id: 'TC-F64-08' },
    { fn: testMaxVisiblePanelsEnforced, id: 'TC-F64-09' },
    { fn: testWorkspaceLayoutDeterministic, id: 'TC-F64-10' },
    { fn: testSidebarLayoutWorks, id: 'TC-F64-11' },
    { fn: testThreeColumnLayoutWorks, id: 'TC-F64-12' },
    { fn: testPanelResizingBounded, id: 'TC-F64-13' },
    { fn: testPanelDockingWorks, id: 'TC-F64-14' },
    { fn: testViewportAdapterAttaches, id: 'TC-F64-15' },
    { fn: testF55RendererAuthoritative, id: 'TC-F64-16' },
    { fn: testNoSecondRAFLoop, id: 'TC-F64-17' },
    { fn: testDatabasePanelAdapterWorks, id: 'TC-F64-18' },
    { fn: testCoordinatesPanelSyncWithF60, id: 'TC-F64-19' },
    { fn: testInfoPanelSyncWithState, id: 'TC-F64-20' },
    { fn: testChatPanelInitializes, id: 'TC-F64-21' },
    { fn: testModelRegistryWorks, id: 'TC-F64-22' },
    { fn: testSearchPanelRoutesThroughF50, id: 'TC-F64-23' },
    { fn: testSearchSelectionSyncsWorkspace, id: 'TC-F64-24' },
    { fn: testGraphPanelSyncWithF58, id: 'TC-F64-25' },
    { fn: testClusterPanelSyncWithF59, id: 'TC-F64-26' },
    { fn: testDimensionPanelSyncWithF60, id: 'TC-F64-27' },
    { fn: testCameraFocusSyncWithF61, id: 'TC-F64-28' },
    { fn: testGreenSelectionPermitted, id: 'TC-F64-29' },
    { fn: testRedSelectionBlocked, id: 'TC-F64-30' },
  ];

  const results: F64TestResult[] = [];
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
    suiteName: 'Funnel 64 — Actual Studio Workspace & Panel Orchestration Engine',
    totalTests: testFns.length,
    passedTests: passedCount,
    failedTests: testFns.length - passedCount,
    allPassed: passedCount === testFns.length,
    totalDurationMs: performance.now() - startTime,
    results,
  };
}
