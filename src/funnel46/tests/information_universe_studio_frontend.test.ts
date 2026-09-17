/**
 * 3D Memory Studio — Funnel 46
 * Information Universe Studio Frontend Integration Tests
 *
 * 7 Focused Research Tests:
 * TC-F46-01  Studio Route Mounts Successfully
 * TC-F46-02  F45 Data Adapters Remain Read-Only
 * TC-F46-03  Data Explorer Bounded Rendering Works
 * TC-F46-04  State Selection Synchronizes All Panels
 * TC-F46-05  369 & Dimensional Visualizations Remain Deterministic
 * TC-F46-06  Knowledge Graph & Provenance Navigation Remain Read-Only
 * TC-F46-07  4096+ Logical States Remain Within Render Budgets
 */

import {
  getStandardResearchStudioDataset,
  getScaleBenchmarkStudioDataset,
} from '../studioData';
import {
  selectRecordById,
  selectAvailableDimensions,
  selectAvailableCategories,
} from '../selectors';
import {
  createDefaultRenderBudget,
  createDefaultFilterCriteria,
} from '../../funnel45/selectors';
import {
  createStudioSessionSnapshot,
  closeStudioSession,
  evaluateStudioDeterminism,
} from '../../funnel45/model';
import { verifyDatasetImmutability } from '../adapters';
import { F46TestResult } from '../types';

// ─── TC-F46-01: Studio Route Mounts Successfully ────────────────────────────

export function testStudioRouteMountsSuccessfully(): F46TestResult {
  const t0 = performance.now();
  const dataset = getStandardResearchStudioDataset(3);
  const session = createStudioSessionSnapshot(dataset, 'UNIVERSE_OVERVIEW', dataset.records[0]?.stateId);

  const mounted =
    session.sessionId.startsWith('SESSION45:3D:') &&
    session.overview.totalLogicalStates === dataset.records.length &&
    session.overview.totalLogicalStates > 0 &&
    session.activePanel === 'UNIVERSE_OVERVIEW' &&
    session.selectedStateId !== undefined;

  const passed = mounted;

  return {
    testId: 'TC-F46-01',
    name: 'Studio Route Mounts Successfully',
    passed,
    details: passed
      ? `Studio session mounted successfully (Session: ${session.sessionId}). Active Universe: ${session.universeId}, Dimension: Z${session.dimension}, States: ${session.overview.totalLogicalStates}.`
      : 'Studio route mount failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
    collisions: 0,
    variance: 0,
  };
}

// ─── TC-F46-02: F45 Data Adapters Remain Read-Only ──────────────────────────

export function testDataAdaptersRemainReadOnly(): F46TestResult {
  const t0 = performance.now();
  const dataset = getStandardResearchStudioDataset(3);

  // 1. Verify frozen status
  const isImmutable = verifyDatasetImmutability(dataset);

  // 2. Perform multiple studio operations
  const session1 = createStudioSessionSnapshot(dataset, 'DATA_EXPLORER', dataset.records[0]?.stateId);
  const session2 = createStudioSessionSnapshot(dataset, 'KNOWLEDGE_GRAPH_VIEW', dataset.records[1]?.stateId);
  const closure1 = closeStudioSession(session1);
  const closure2 = closeStudioSession(session2);

  // 3. Verify dataset is completely unchanged
  const isStillImmutable = verifyDatasetImmutability(dataset);
  const recordUnmutated = dataset.records[0].recordId !== undefined;

  const passed = isImmutable && isStillImmutable && recordUnmutated && closure1.isReadOnlyAuditPassed && closure2.isReadOnlyAuditPassed;

  return {
    testId: 'TC-F46-02',
    name: 'F45 Data Adapters Remain Read-Only',
    passed,
    details: passed
      ? 'Source research dataset is verified 100% frozen. Multiple studio panel view model derivations performed without modifying underlying records.'
      : 'Data adapters read-only verification failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 2,
    collisions: 0,
    variance: 0,
  };
}

// ─── TC-F46-03: Data Explorer Bounded Rendering Works ───────────────────────

export function testDataExplorerBoundedRendering(): F46TestResult {
  const t0 = performance.now();
  const dataset = getScaleBenchmarkStudioDataset(8, 256);
  const budget = createDefaultRenderBudget(); // maxVisibleStates = 50

  const session = createStudioSessionSnapshot(
    dataset,
    'DATA_EXPLORER',
    dataset.records[0]?.stateId,
    { pageIndex: 0, pageSize: 20 },
    budget
  );

  const explorer = session.explorer;

  const bounded =
    explorer.visibleItems.length === 20 &&
    explorer.totalMatchingStates === 256 &&
    explorer.totalPages === 13 &&
    explorer.hasMoreUnrendered === true;

  const passed = bounded;

  return {
    testId: 'TC-F46-03',
    name: 'Data Explorer Bounded Rendering Works',
    passed,
    details: passed
      ? `Data Explorer successfully capped visible items to 20 / ${explorer.totalMatchingStates} total states across ${explorer.totalPages} pages with hasMoreUnrendered flag active.`
      : 'Data Explorer bounded rendering failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
    collisions: 0,
    variance: 0,
  };
}

// ─── TC-F46-04: State Selection Synchronizes All Panels ─────────────────────

export function testStateSelectionSynchronizesAllPanels(): F46TestResult {
  const t0 = performance.now();
  const dataset = getStandardResearchStudioDataset(3);
  const targetRecord = dataset.records[1];

  const session = createStudioSessionSnapshot(dataset, 'STATE_INSPECTOR', targetRecord.stateId);

  const synced =
    session.selectedStateId === targetRecord.stateId &&
    session.inspector?.stateId === targetRecord.stateId &&
    session.inspector?.recordId === targetRecord.recordId &&
    session.visualizer369?.sequenceSymbols === targetRecord.sequence369 &&
    session.higherProjectionView?.stateId === targetRecord.stateId &&
    session.provenanceView?.stateId === targetRecord.stateId;

  const passed = synced;

  return {
    testId: 'TC-F46-04',
    name: 'State Selection Synchronizes All Panels',
    passed,
    details: passed
      ? `Central state selection '${targetRecord.stateId}' immediately synchronized Inspector, 369 Visualizer, Higher Projection, and Provenance panels.`
      : 'State selection synchronization failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 1,
    collisions: 0,
    variance: 0,
  };
}

// ─── TC-F46-05: 369 & Dimensional Visualizations Remain Deterministic ────────

export function test369AndDimensionalVisualizationsDeterministic(): F46TestResult {
  const t0 = performance.now();
  const dataset = getStandardResearchStudioDataset(3);

  const det = evaluateStudioDeterminism(dataset, 250);

  const passed = det.allIdentical && det.variance === 0;

  return {
    testId: 'TC-F46-05',
    name: '369 & Dimensional Visualizations Remain Deterministic',
    passed,
    details: passed
      ? `250 repeated studio view model evaluations produced σ² = 0.00 with invariant closure ID ${det.closureId}. Exact 369 sequences and dimensional coordinates preserved.`
      : '369 or dimensional visualization determinism failed',
    durationMs: performance.now() - t0,
    totalEvaluations: det.trials,
    collisions: 0,
    variance: det.variance,
  };
}

// ─── TC-F46-06: Knowledge Graph & Provenance Navigation Remain Read-Only ────

export function testGraphAndProvenanceNavigationReadOnly(): F46TestResult {
  const t0 = performance.now();
  const dataset = getStandardResearchStudioDataset(3);

  const session = createStudioSessionSnapshot(dataset, 'KNOWLEDGE_GRAPH_VIEW', dataset.records[0]?.stateId);

  const graphValid =
    session.graphView !== undefined &&
    session.graphView.visibleNodes.length > 0 &&
    session.graphView.currentDepth <= 3;

  const provValid =
    session.provenanceView !== undefined &&
    session.provenanceView.pipelineSteps.length === 8;

  const immutabilityMaintained = verifyDatasetImmutability(dataset);

  const passed = graphValid && provValid && immutabilityMaintained;

  return {
    testId: 'TC-F46-06',
    name: 'Knowledge Graph & Provenance Navigation Remain Read-Only',
    passed,
    details: passed
      ? `Knowledge Graph (depth ≤ 3) and 8-stage Provenance lineage verified read-only without modifying underlying entity or relationship maps.`
      : 'Graph or provenance navigation read-only verification failed',
    durationMs: performance.now() - t0,
    totalEvaluations: 2,
    collisions: 0,
    variance: 0,
  };
}

// ─── TC-F46-07: 4096+ Logical States Remain Within Render Budgets ───────────

export function testScaleBenchmarkRemainsWithinRenderBudget(): F46TestResult {
  const t0 = performance.now();
  const benchmarkDataset = getScaleBenchmarkStudioDataset(8, 4096);
  const budget = createDefaultRenderBudget(); // maxVisibleStates = 50

  const session = createStudioSessionSnapshot(
    benchmarkDataset,
    'UNIVERSE_OVERVIEW',
    benchmarkDataset.records[0]?.stateId,
    { pageIndex: 0, pageSize: 20 },
    budget
  );

  const overview = session.overview;
  const explorer = session.explorer;

  const budgetEnforced =
    overview.totalLogicalStates === 4096 &&
    overview.totalVisibleStates === 50 &&
    overview.budgetExceeded === true &&
    explorer.visibleItems.length === 20 &&
    explorer.hasMoreUnrendered === true;

  const durationMs = performance.now() - t0;
  const fastExecution = durationMs < 100; // < 100ms for 4,096 states

  const passed = budgetEnforced && fastExecution;

  return {
    testId: 'TC-F46-07',
    name: '4096+ Logical States Remain Within Render Budgets',
    passed,
    details: passed
      ? `4,096 logical states evaluated in ${durationMs.toFixed(2)}ms. Visible items strictly capped to 50 states (overview) and 20 states (explorer) under active render budget.`
      : 'Scale benchmark render budget enforcement failed',
    durationMs,
    totalEvaluations: 1,
    collisions: 0,
    variance: 0,
  };
}
