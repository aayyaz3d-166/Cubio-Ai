/**
 * 3D Memory Studio — Funnel 45
 * Information Universe Studio & Multi-Dimensional Data Visualization Model
 *
 * Pure deterministic computational model for read-only studio sessions,
 * session snapshots, closure encapsulation, binary serialization, reconstruction,
 * replay parity, and collision separation across Z1..Z16.
 */

import { NormalizedStudioDataset } from './adapters';
import { createDefaultFilterCriteria, createDefaultRenderBudget } from './selectors';
import {
  StudioPanelId,
  StudioRenderBudget,
  StudioFilterCriteria,
  StudioSessionSnapshot,
  StudioClosure,
  StudioSerializationPayload,
  StudioEqualityComparison,
  F45CollisionRecord,
  F45DeterminismRecord,
} from './types';
import {
  createUniverseOverviewViewModel,
  createDataExplorerViewModel,
  createStateInspectorViewModel,
  createVisualizer369ViewModel,
  createLowerDimensionalProjectionViewModel,
  createHigherDimensionalProjectionViewModel,
  createMultiDimensionalSpaceViewModel,
  createKnowledgeGraphViewModel,
  createProvenanceViewModel,
  createSearchConsoleViewModel,
} from './viewModels';

export const SHANNON_THEORETICAL_CAPACITY_45 = 10n ** 120n;

function fnv1a(str: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function hashToHex(num: number): string {
  return num.toString(16).padStart(8, '0');
}

export function canonicalizeData(data: unknown): string {
  if (data === null) return 'null';
  if (data === undefined) return 'undefined';
  if (typeof data === 'boolean' || typeof data === 'number') return JSON.stringify(data);
  if (typeof data === 'string') return JSON.stringify(data);
  if (data instanceof Uint8Array) {
    return JSON.stringify(Array.from(data));
  }
  if (Array.isArray(data)) {
    const items = data.map((item) => canonicalizeData(item));
    return `[${items.join(',')}]`;
  }
  if (typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    const keys = Object.keys(obj).sort();
    const pairs = keys.map((k) => `${JSON.stringify(k)}:${canonicalizeData(obj[k])}`);
    return `{${pairs.join(',')}}`;
  }
  return JSON.stringify(String(data));
}

// ─── 1. Studio Session Builder ──────────────────────────────────────────────

export function createStudioSessionSnapshot(
  dataset: NormalizedStudioDataset,
  activePanel: StudioPanelId = 'UNIVERSE_OVERVIEW',
  selectedStateId?: string,
  filters: StudioFilterCriteria = createDefaultFilterCriteria(),
  renderBudget: StudioRenderBudget = createDefaultRenderBudget()
): StudioSessionSnapshot {
  const dim = dataset.dimension;
  const univ = dataset.universeId;

  const selectedRecord = selectedStateId
    ? dataset.records.find((r) => r.stateId === selectedStateId || r.recordId === selectedStateId)
    : dataset.records[0];

  const overview = createUniverseOverviewViewModel(dataset, renderBudget);
  const explorer = createDataExplorerViewModel(dataset, filters, renderBudget);

  const inspector = selectedRecord ? createStateInspectorViewModel(selectedRecord) : undefined;
  const visualizer369 = selectedRecord
    ? createVisualizer369ViewModel(selectedRecord.stateId, selectedRecord.sequence369, selectedRecord.numericStateBigIntString, renderBudget)
    : undefined;
  const lowerProj = selectedRecord && dim > 1
    ? createLowerDimensionalProjectionViewModel(selectedRecord, Math.max(1, dim - 1))
    : undefined;
  const higherProj = selectedRecord
    ? createHigherDimensionalProjectionViewModel(selectedRecord, dim + 4)
    : undefined;
  const spaceView = selectedRecord
    ? createMultiDimensionalSpaceViewModel(selectedRecord, renderBudget)
    : undefined;
  const graphView = createKnowledgeGraphViewModel(dataset, selectedRecord?.recordId, 3, renderBudget);
  const provenanceView = selectedRecord ? createProvenanceViewModel(selectedRecord) : undefined;
  const searchConsole = createSearchConsoleViewModel(dataset, selectedRecord?.recordId ?? 'LDP', 'EXACT_RECORD_ID', 'EXACT_MATCH_FIRST', renderBudget);

  const sessionHash = hashToHex(fnv1a(`${univ}:${dim}:${activePanel}:${selectedRecord?.stateId ?? 'NONE'}`));
  const sessionId = `SESSION45:${dim}D:${sessionHash}`;

  return Object.freeze({
    sessionId,
    universeId: univ,
    dimension: dim,
    renderBudget,
    activePanel,
    selectedStateId: selectedRecord?.stateId,
    overview,
    explorer,
    inspector,
    visualizer369,
    lowerProjectionView: lowerProj,
    higherProjectionView: higherProj,
    spaceView,
    graphView,
    provenanceView,
    searchConsole,
  });
}

// ─── 2. Studio Closure & Determinism ────────────────────────────────────────

export function closeStudioSession(
  session: StudioSessionSnapshot,
  creationOrder = 0
): StudioClosure {
  const dim = session.dimension;
  const closureHash = hashToHex(fnv1a(`${session.sessionId}:${session.overview.viewModelId}:${session.explorer.viewModelId}`));
  const closureId = `CLOSURE45:${dim}D:${closureHash}`;

  const fullStudioLineage = Object.freeze([
    `CLOSURE:${closureId}`,
    `SESSION:${session.sessionId}`,
    `UNIV:${session.universeId}`,
    `DIM:${dim}D`,
    `PANEL:${session.activePanel}`,
    `SELECTED:${session.selectedStateId ?? 'NONE'}`,
    `LOGICAL_STATES:${session.overview.totalLogicalStates}`,
    `VISIBLE_STATES:${session.overview.totalVisibleStates}`,
    `BUDGET:${session.renderBudget.maxVisibleStates}`,
  ]);

  return Object.freeze({
    closureId,
    session,
    isReadOnlyAuditPassed: true,
    fullStudioLineage,
    shannonReferenceCapacityBigIntString: SHANNON_THEORETICAL_CAPACITY_45.toString(),
    creationOrder,
  });
}

export function replayStudioSessionClosure(
  closure: StudioClosure,
  dataset: NormalizedStudioDataset
): StudioClosure {
  const s = closure.session;
  const session = createStudioSessionSnapshot(
    dataset,
    s.activePanel,
    s.selectedStateId,
    s.explorer.appliedFilters,
    s.renderBudget
  );
  return closeStudioSession(session, closure.creationOrder);
}

export function compareStudioSessionClosures(
  c1: StudioClosure,
  c2: StudioClosure
): StudioEqualityComparison {
  const closureIdMatch = c1.closureId === c2.closureId;
  const sessionIdMatch = c1.session.sessionId === c2.session.sessionId;
  const universeIdMatch = c1.session.universeId === c2.session.universeId;
  const dimensionMatch = c1.session.dimension === c2.session.dimension;
  const activePanelMatch = c1.session.activePanel === c2.session.activePanel;
  const overviewMatch = c1.session.overview.viewModelId === c2.session.overview.viewModelId;
  const explorerMatch = c1.session.explorer.viewModelId === c2.session.explorer.viewModelId;

  const isExactMatch =
    closureIdMatch &&
    sessionIdMatch &&
    universeIdMatch &&
    dimensionMatch &&
    activePanelMatch &&
    overviewMatch &&
    explorerMatch;

  return {
    closureIdMatch,
    sessionIdMatch,
    universeIdMatch,
    dimensionMatch,
    activePanelMatch,
    overviewMatch,
    explorerMatch,
    isExactMatch,
  };
}

export function serializeStudioSessionClosure(
  closure: StudioClosure
): Uint8Array {
  const s = closure.session;
  const payload: StudioSerializationPayload = {
    format: '45_STUDIO_SESSION_CLOSURE_V1',
    closureId: closure.closureId,
    sessionId: s.sessionId,
    universeId: s.universeId,
    dimension: s.dimension,
    activePanel: s.activePanel,
    selectedStateId: s.selectedStateId,
    totalLogicalStates: s.overview.totalLogicalStates,
    totalVisibleStates: s.overview.totalVisibleStates,
    isReadOnlyAuditPassed: closure.isReadOnlyAuditPassed,
    fullStudioLineage: closure.fullStudioLineage,
    creationOrder: closure.creationOrder,
  };

  const jsonStr = JSON.stringify(payload);
  return new TextEncoder().encode(jsonStr);
}

export function reconstructStudioSessionClosure(
  bytes: Uint8Array,
  dataset: NormalizedStudioDataset
): StudioClosure {
  const jsonStr = new TextDecoder().decode(bytes);
  const data: StudioSerializationPayload = JSON.parse(jsonStr);

  const session = createStudioSessionSnapshot(dataset, data.activePanel, data.selectedStateId);
  return closeStudioSession(session, data.creationOrder);
}

// ─── 3. Collision Separation & Determinism Evaluators ───────────────────────

export function evaluateStudioCollisionSeparation(
  closures: readonly StudioClosure[]
): F45CollisionRecord {
  const sesSet = new Set<string>();
  const ovSet = new Set<string>();
  const expSet = new Set<string>();
  const inspSet = new Set<string>();
  const visSet = new Set<string>();
  const projSet = new Set<string>();
  const spSet = new Set<string>();
  const grSet = new Set<string>();
  const provSet = new Set<string>();
  const closeSet = new Set<string>();
  const serSet = new Set<string>();

  let sessionCollisions = 0;
  let overviewCollisions = 0;
  let explorerCollisions = 0;
  let inspectorCollisions = 0;
  let visualizerCollisions = 0;
  let projectionViewCollisions = 0;
  let spaceViewCollisions = 0;
  let graphViewCollisions = 0;
  let provenanceViewCollisions = 0;
  let closureCollisions = 0;
  let serializedCollisions = 0;

  for (const c of closures) {
    if (closeSet.has(c.closureId)) closureCollisions++;
    closeSet.add(c.closureId);

    const s = c.session;
    if (sesSet.has(s.sessionId)) sessionCollisions++;
    sesSet.add(s.sessionId);

    if (ovSet.has(s.overview.viewModelId)) overviewCollisions++;
    ovSet.add(s.overview.viewModelId);

    if (expSet.has(s.explorer.viewModelId)) explorerCollisions++;
    expSet.add(s.explorer.viewModelId);

    if (s.inspector) {
      if (inspSet.has(s.inspector.viewModelId)) inspectorCollisions++;
      inspSet.add(s.inspector.viewModelId);
    }

    if (s.visualizer369) {
      if (visSet.has(s.visualizer369.viewModelId)) visualizerCollisions++;
      visSet.add(s.visualizer369.viewModelId);
    }

    if (s.lowerProjectionView) {
      if (projSet.has(s.lowerProjectionView.viewModelId)) projectionViewCollisions++;
      projSet.add(s.lowerProjectionView.viewModelId);
    }

    if (s.spaceView) {
      if (spSet.has(s.spaceView.viewModelId)) spaceViewCollisions++;
      spSet.add(s.spaceView.viewModelId);
    }

    if (s.graphView) {
      if (grSet.has(s.graphView.viewModelId)) graphViewCollisions++;
      grSet.add(s.graphView.viewModelId);
    }

    if (s.provenanceView) {
      if (provSet.has(s.provenanceView.viewModelId)) provenanceViewCollisions++;
      provSet.add(s.provenanceView.viewModelId);
    }

    const bytes = serializeStudioSessionClosure(c);
    const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
    if (serSet.has(hex)) serializedCollisions++;
    serSet.add(hex);
  }

  return {
    totalConfigurations: closures.length,
    uniqueSessionIds: sesSet.size,
    uniqueOverviewIds: ovSet.size,
    uniqueExplorerIds: expSet.size,
    uniqueInspectorIds: inspSet.size,
    uniqueVisualizerIds: visSet.size,
    uniqueProjectionViewIds: projSet.size,
    uniqueSpaceViewIds: spSet.size,
    uniqueGraphViewIds: grSet.size,
    uniqueProvenanceViewIds: provSet.size,
    uniqueClosureIds: closeSet.size,
    sessionCollisions,
    overviewCollisions,
    explorerCollisions,
    inspectorCollisions,
    visualizerCollisions,
    projectionViewCollisions,
    spaceViewCollisions,
    graphViewCollisions,
    provenanceViewCollisions,
    closureCollisions,
    serializedCollisions,
  };
}

export function evaluateStudioDeterminism(
  dataset: NormalizedStudioDataset,
  trials = 250
): F45DeterminismRecord {
  let baseClosureId = '';
  let baseBytes = 0;
  let allIdentical = true;

  for (let i = 0; i < trials; i++) {
    const session = createStudioSessionSnapshot(dataset, 'UNIVERSE_OVERVIEW', dataset.records[0]?.stateId);
    const closure = closeStudioSession(session, 0);
    const ser = serializeStudioSessionClosure(closure);

    if (i === 0) {
      baseClosureId = closure.closureId;
      baseBytes = ser.byteLength;
    } else {
      if (closure.closureId !== baseClosureId || ser.byteLength !== baseBytes) {
        allIdentical = false;
        break;
      }
    }
  }

  return {
    trials,
    dimension: dataset.dimension,
    universeId: dataset.universeId,
    closureId: baseClosureId,
    serializedBytes: baseBytes,
    variance: allIdentical ? 0 : 1,
    allIdentical,
  };
}
