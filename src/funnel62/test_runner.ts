/**
 * 3D Memory Studio — Funnel 62: Test Suite Runner
 */

import {
  testStudioExperienceInitializes,
  testLandingExperienceInitializes,
  testLandingCubeInteractionBounded,
  testStartOpensStudio,
  testLandingTransitionDeterministic,
  testStudioShellInitializes,
  testDatabasePanelReceivesPermittedData,
  testCoordinatePanelSyncWithF60,
  testInfoPanelDisplaysSelectedState,
  testGraphPanelSyncWithF58,
  testClusterPanelSyncWithF59,
  testCameraControlsSyncWithF61,
  testDimensionSelectorSyncWithF60,
  testMoreOptionsOpensCorrectly,
  testMoreOptionsVisibilityDeterministic,
  testSearchResultSelectsPermittedState,
  testSearchSelectionFocusesCamera,
  testSearchSelectionHighlightsGraph,
  testSearchSelectionHighlightsCluster,
  testSelectionIdentityRemainsSynchronized,
  testAIContextContainsPermittedData,
  testLLMModelSelectorWorks,
  testMultipleLLMProvidersRepresented,
  testLocalDataProviderWorks,
  testRemoteDataProviderWorks,
  testREDDataNeverReachesStudioUI,
  testREDDataNeverReachesAIContext,
  testDimensionSwitchPreservesStudioSelection,
  testStudioResetRestoresDeterministicState,
  testNoSecondRAFLoop,
} from './tests/studio_experience_engine.test';
import { F62SuiteReport, F62TestResult } from './types';

export async function runFunnel62TestSuite(): Promise<F62SuiteReport> {
  const startTime = performance.now();

  const testFns: Array<{ fn: () => F62TestResult | Promise<F62TestResult>; id: string }> = [
    { fn: testStudioExperienceInitializes, id: 'TC-F62-01' },
    { fn: testLandingExperienceInitializes, id: 'TC-F62-02' },
    { fn: testLandingCubeInteractionBounded, id: 'TC-F62-03' },
    { fn: testStartOpensStudio, id: 'TC-F62-04' },
    { fn: testLandingTransitionDeterministic, id: 'TC-F62-05' },
    { fn: testStudioShellInitializes, id: 'TC-F62-06' },
    { fn: testDatabasePanelReceivesPermittedData, id: 'TC-F62-07' },
    { fn: testCoordinatePanelSyncWithF60, id: 'TC-F62-08' },
    { fn: testInfoPanelDisplaysSelectedState, id: 'TC-F62-09' },
    { fn: testGraphPanelSyncWithF58, id: 'TC-F62-10' },
    { fn: testClusterPanelSyncWithF59, id: 'TC-F62-11' },
    { fn: testCameraControlsSyncWithF61, id: 'TC-F62-12' },
    { fn: testDimensionSelectorSyncWithF60, id: 'TC-F62-13' },
    { fn: testMoreOptionsOpensCorrectly, id: 'TC-F62-14' },
    { fn: testMoreOptionsVisibilityDeterministic, id: 'TC-F62-15' },
    { fn: testSearchResultSelectsPermittedState, id: 'TC-F62-16' },
    { fn: testSearchSelectionFocusesCamera, id: 'TC-F62-17' },
    { fn: testSearchSelectionHighlightsGraph, id: 'TC-F62-18' },
    { fn: testSearchSelectionHighlightsCluster, id: 'TC-F62-19' },
    { fn: testSelectionIdentityRemainsSynchronized, id: 'TC-F62-20' },
    { fn: testAIContextContainsPermittedData, id: 'TC-F62-21' },
    { fn: testLLMModelSelectorWorks, id: 'TC-F62-22' },
    { fn: testMultipleLLMProvidersRepresented, id: 'TC-F62-23' },
    { fn: testLocalDataProviderWorks, id: 'TC-F62-24' },
    { fn: testRemoteDataProviderWorks, id: 'TC-F62-25' },
    { fn: testREDDataNeverReachesStudioUI, id: 'TC-F62-26' },
    { fn: testREDDataNeverReachesAIContext, id: 'TC-F62-27' },
    { fn: testDimensionSwitchPreservesStudioSelection, id: 'TC-F62-28' },
    { fn: testStudioResetRestoresDeterministicState, id: 'TC-F62-29' },
    { fn: testNoSecondRAFLoop, id: 'TC-F62-30' },
  ];

  const results: F62TestResult[] = [];
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
    suiteName: 'Funnel 62 — Actual 3D Memory Studio Experience & Frontend Integration Engine',
    totalTests: testFns.length,
    passedTests: passedCount,
    failedTests: testFns.length - passedCount,
    allPassed: passedCount === testFns.length,
    totalDurationMs: performance.now() - startTime,
    results,
  };
}
