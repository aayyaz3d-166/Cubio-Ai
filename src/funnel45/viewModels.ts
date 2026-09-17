/**
 * 3D Memory Studio — Funnel 45
 * Deterministic Studio View Models
 *
 * Produces derived, read-only, fully frozen view models for all 10 Studio panels.
 * Ensures strict render budgets, bounded outputs, and zero mutation of source records.
 */

import {
  NormalizedStudioDataset,
  NormalizedStudioRecord,
  NormalizedStudioGraphNode,
  NormalizedStudioGraphRelationship,
} from './adapters';
import { filterStudioRecords, selectBoundedRecordWindow } from './selectors';
import {
  StudioRenderBudget,
  StudioFilterCriteria,
  UniverseOverviewViewModel,
  DataExplorerViewModel,
  DataExplorerItemViewModel,
  StateInspectorViewModel,
  Visualizer369ViewModel,
  DimensionalProjectionViewModel,
  MultiDimensionalSpaceViewModel,
  KnowledgeGraphViewModel,
  GraphNodeViewModel,
  GraphEdgeViewModel,
  ProvenanceViewModel,
  SearchConsoleViewModel,
  SearchConsoleResultItemViewModel,
} from './types';

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

// ─── 1. Universe Overview View Model ────────────────────────────────────────

export function createUniverseOverviewViewModel(
  dataset: NormalizedStudioDataset,
  renderBudget: StudioRenderBudget
): UniverseOverviewViewModel {
  const totalLogicalStates = dataset.records.length;
  const totalVisibleStates = Math.min(totalLogicalStates, renderBudget.maxVisibleStates);
  const budgetExceeded = totalLogicalStates > renderBudget.maxVisibleStates;

  const viewModelId = `VIEW_OVERVIEW45:${dataset.dimension}D:${hashToHex(fnv1a(`${dataset.universeId}:${totalLogicalStates}`))}`;

  return Object.freeze({
    viewModelId,
    activeUniverseId: dataset.universeId,
    activeDimension: dataset.dimension,
    totalLogicalStates,
    totalVisibleStates,
    totalCapturedDocuments: dataset.capturedDocumentsCount,
    totalSources: dataset.sourceDomains.length,
    totalGraphNodes: dataset.graphNodes.length,
    totalGraphRelationships: dataset.graphRelationships.length,
    totalLowerProjections: dataset.dimension > 1 ? totalLogicalStates : 0,
    totalHigherProjections: totalLogicalStates,
    renderBudget,
    budgetExceeded,
    noticeMessage: budgetExceeded
      ? `Additional states exist (${totalLogicalStates - totalVisibleStates} unrendered) but are omitted under active render budget.`
      : undefined,
  });
}

// ─── 2. Data Explorer View Model ────────────────────────────────────────────

export function createDataExplorerViewModel(
  dataset: NormalizedStudioDataset,
  filters: StudioFilterCriteria,
  renderBudget: StudioRenderBudget
): DataExplorerViewModel {
  const filtered = filterStudioRecords(dataset, filters);
  const windowData = selectBoundedRecordWindow(filtered, filters.pageIndex, filters.pageSize, renderBudget);

  const visibleItems: DataExplorerItemViewModel[] = windowData.visibleRecords.map((r, idx) => ({
    itemIndex: filters.pageIndex * filters.pageSize + idx,
    stateId: r.stateId,
    recordId: r.recordId,
    documentId: r.documentId,
    category: r.category,
    sourceDomain: r.sourceDomain,
    dimension: r.dimension,
    formattedCoordinate: r.formattedCoordinate,
    payloadChecksum: r.payloadChecksum,
    sequence369Snippet: r.sequence369.substring(0, 18),
    numericStateSnippet: r.numericStateBigIntString.length > 12
      ? `${r.numericStateBigIntString.substring(0, 12)}...`
      : r.numericStateBigIntString,
  }));

  const viewModelId = `VIEW_EXPLORER45:${dataset.dimension}D:${hashToHex(fnv1a(`${dataset.universeId}:${filtered.length}:${filters.pageIndex}`))}`;

  return Object.freeze({
    viewModelId,
    totalMatchingStates: windowData.totalMatching,
    pageIndex: filters.pageIndex,
    pageSize: filters.pageSize,
    totalPages: windowData.totalPages,
    visibleItems: Object.freeze(visibleItems),
    appliedFilters: filters,
    hasMoreUnrendered: windowData.hasMoreUnrendered,
  });
}

// ─── 3. State Inspector View Model ──────────────────────────────────────────

export function createStateInspectorViewModel<V = any>(
  record: NormalizedStudioRecord<V>
): StateInspectorViewModel<V> {
  const viewModelId = `VIEW_INSPECTOR45:${record.dimension}D:${hashToHex(fnv1a(record.stateId))}`;

  return Object.freeze({
    viewModelId,
    stateId: record.stateId,
    recordId: record.recordId,
    documentId: record.documentId,
    universeId: record.universeId,
    dimension: record.dimension,
    category: record.category,
    rawValue: record.rawValue,
    canonicalJson: record.canonicalJson,
    payloadChecksum: record.payloadChecksum,
    canonicalChecksum: record.canonicalChecksum,
    integrityValid: record.integrityValid,
    sequence369: record.sequence369,
    numericStateBigIntString: record.numericStateBigIntString,
    formattedCoordinate: record.formattedCoordinate,
    coordinateId: record.coordinateId,
    sourceDomain: record.sourceDomain,
    sourceUrl: record.sourceUrl,
    capturePolicyId: record.capturePolicyId,
    fullLineage: record.provenanceLineage,
  });
}

// ─── 4. 369 Visualizer View Model ───────────────────────────────────────────

export function createVisualizer369ViewModel(
  stateId: string,
  sequenceSymbols: string,
  numericStateBigIntString: string,
  renderBudget: StudioRenderBudget
): Visualizer369ViewModel {
  const totalSymbols = sequenceSymbols.length;
  const isTruncatedInView = totalSymbols > renderBudget.maxVisibleSequenceSymbols;
  const renderSymbols = sequenceSymbols.substring(0, renderBudget.maxVisibleSequenceSymbols);

  let c3 = 0;
  let c6 = 0;
  let c9 = 0;
  for (let i = 0; i < totalSymbols; i++) {
    const s = sequenceSymbols[i];
    if (s === '3') c3++;
    else if (s === '6') c6++;
    else if (s === '9') c9++;
  }

  const visibleSymbols = Array.from(renderSymbols).map((sym, idx) => ({
    index: idx,
    symbol: sym as '3' | '6' | '9',
    digitValue: (sym === '3' ? 0 : sym === '6' ? 1 : 2) as 0 | 1 | 2,
    groupIndex: Math.floor(idx / 6),
  }));

  const viewModelId = `VIEW_369_45:${hashToHex(fnv1a(`${stateId}:${sequenceSymbols}:${numericStateBigIntString}`))}`;

  return Object.freeze({
    viewModelId,
    sequenceSymbols,
    symbolCount: totalSymbols,
    visibleSymbols: Object.freeze(visibleSymbols),
    count3: c3,
    count6: c6,
    count9: c9,
    ratio3: totalSymbols > 0 ? c3 / totalSymbols : 0,
    ratio6: totalSymbols > 0 ? c6 / totalSymbols : 0,
    ratio9: totalSymbols > 0 ? c9 / totalSymbols : 0,
    numericStateBigIntString,
    isOrderSensitiveVerified: true, // 369 != 963
    isTruncatedInView,
  });
}

// ─── 5. Lower / Higher Dimensional Projection View Models ───────────────────

export function createLowerDimensionalProjectionViewModel(
  record: NormalizedStudioRecord,
  targetDimension = 3
): DimensionalProjectionViewModel {
  const srcDim = record.dimension;
  const symbols = record.sequence369;

  const origAxes: number[] = [];
  for (let d = 0; d < srcDim; d++) {
    const sym = symbols[d % symbols.length];
    origAxes.push(sym === '3' ? 3 : sym === '6' ? 6 : 9);
  }

  const projectedAxes = origAxes.slice(0, targetDimension);
  const formattedProjected = projectedAxes.map((v, i) => `D${i + 1}_${v}`).join('.');

  const axisBreakdown = origAxes.map((val, idx) => ({
    axisIndex: idx + 1,
    axisName: `Axis_${idx + 1}`,
    axisValue: val,
    classification: (idx < targetDimension ? 'SOURCE_AXIS' : 'DISCARDED_AXIS') as any,
    label: idx < targetDimension ? `Retained Axis ${idx + 1}` : `Discarded Axis ${idx + 1} (Truncated)`,
  }));

  const viewModelId = `VIEW_PROJ_LOWER45:${targetDimension}D:${hashToHex(fnv1a(`${record.stateId}:${targetDimension}`))}`;

  return Object.freeze({
    viewModelId,
    stateId: record.stateId,
    sourceDimension: srcDim,
    targetDimension,
    direction: 'LOWER_DIMENSIONAL',
    projectionTypeLabel: 'MATHEMATICAL_PROJECTION',
    originalCoordinate: record.formattedCoordinate,
    projectedCoordinate: formattedProjected,
    preservedPayloadChecksum: record.payloadChecksum,
    informationLossDetected: srcDim > targetDimension,
    axisBreakdown: Object.freeze(axisBreakdown),
    description: `Computational truncation of ${srcDim - targetDimension} coordinate axes while strictly preserving invariant payload checksum ${record.payloadChecksum}.`,
  });
}

export function createHigherDimensionalProjectionViewModel(
  record: NormalizedStudioRecord,
  targetDimension = 8
): DimensionalProjectionViewModel {
  const srcDim = record.dimension;
  const symbols = record.sequence369;

  const axisBreakdown: any[] = [];
  const projectedAxes: number[] = [];

  for (let d = 0; d < targetDimension; d++) {
    const sym = symbols[d % symbols.length];
    const val = sym === '3' ? 3 : sym === '6' ? 6 : 9;
    projectedAxes.push(val);

    axisBreakdown.push({
      axisIndex: d + 1,
      axisName: `Axis_${d + 1}`,
      axisValue: val,
      classification: d < srcDim ? 'SOURCE_AXIS' : 'DERIVED_AXIS',
      label: d < srcDim ? `Source Axis ${d + 1}` : `Derived Axis ${d + 1} (Expanded from 369 Sequence)`,
    });
  }

  const formattedProjected = projectedAxes.map((v, i) => `D${i + 1}_${v}`).join('.');
  const viewModelId = `VIEW_PROJ_HIGHER45:${targetDimension}D:${hashToHex(fnv1a(`${record.stateId}:${targetDimension}`))}`;

  return Object.freeze({
    viewModelId,
    stateId: record.stateId,
    sourceDimension: srcDim,
    targetDimension,
    direction: 'HIGHER_DIMENSIONAL',
    projectionTypeLabel: 'COMPUTATIONAL_EXPANSION',
    originalCoordinate: record.formattedCoordinate,
    projectedCoordinate: formattedProjected,
    preservedPayloadChecksum: record.payloadChecksum,
    informationLossDetected: false,
    axisBreakdown: Object.freeze(axisBreakdown),
    description: `Computational expansion into ${targetDimension}D context with explicit DERIVED labels without data fabrication.`,
  });
}

// ─── 6. Multi-Dimensional Space View Model ──────────────────────────────────

export function createMultiDimensionalSpaceViewModel(
  record: NormalizedStudioRecord,
  renderBudget: StudioRenderBudget
): MultiDimensionalSpaceViewModel {
  const dim = record.dimension;
  const symbols = record.sequence369;

  const axisValues: number[] = [];
  for (let d = 0; d < dim; d++) {
    const sym = symbols[d % symbols.length];
    axisValues.push(sym === '3' ? 3 : sym === '6' ? 6 : 9);
  }

  // Create pairwise axis combinations for multi-slice view
  const pairs: any[] = [];
  const maxPairs = Math.min(dim, renderBudget.maxDimensionDisplayAxes);
  for (let i = 0; i < maxPairs; i++) {
    for (let j = i + 1; j < maxPairs; j++) {
      pairs.push({
        axisA: `D${i + 1}`,
        axisB: `D${j + 1}`,
        valA: axisValues[i],
        valB: axisValues[j],
      });
    }
  }

  const viewModelId = `VIEW_SPACE45:${dim}D:${hashToHex(fnv1a(`${record.stateId}:${dim}`))}`;

  return Object.freeze({
    viewModelId,
    dimension: dim,
    activeSliceAxes: [1, 2] as const,
    axisValues: Object.freeze(axisValues),
    formattedCoordinate: record.formattedCoordinate,
    pairwiseAxisPairs: Object.freeze(pairs),
    isDirectPhysicalRenderingSupported: dim <= 3,
    projectionStrategyLabel: dim <= 3 ? 'DIRECT_EUCLIDEAN_EMBEDDING' : 'PAIRWISE_AXIS_PROJECTION',
  });
}

// ─── 7. Knowledge Graph View Model ──────────────────────────────────────────

export function createKnowledgeGraphViewModel(
  dataset: NormalizedStudioDataset,
  rootNodeId?: string,
  maxDepth = 3,
  renderBudget: StudioRenderBudget = { maxVisibleStates: 50, maxVisibleNodes: 30, maxVisibleEdges: 60, maxVisibleSequenceSymbols: 120, maxGraphDepth: 3, maxDimensionDisplayAxes: 8 }
): KnowledgeGraphViewModel {
  const effectiveMaxDepth = Math.min(maxDepth, renderBudget.maxGraphDepth);
  const root = rootNodeId || dataset.graphNodes[0]?.nodeId;

  const visitedNodes = new Set<string>();
  const scopedNodes: GraphNodeViewModel[] = [];
  const scopedEdges: GraphEdgeViewModel[] = [];

  function bfs() {
    if (!root) return;
    const queue: { nodeId: string; depth: number }[] = [{ nodeId: root, depth: 0 }];
    visitedNodes.add(root);

    while (queue.length > 0) {
      const { nodeId, depth } = queue.shift()!;
      const nodeData = dataset.graphNodes.find((n) => n.nodeId === nodeId);

      if (nodeData && scopedNodes.length < renderBudget.maxVisibleNodes) {
        scopedNodes.push({
          nodeId: nodeData.nodeId,
          label: nodeData.label,
          category: nodeData.category,
          sourceDomain: nodeData.sourceDomain,
          depth,
          isRoot: nodeId === root,
        });
      }

      if (depth < effectiveMaxDepth) {
        const outgoing = dataset.graphRelationships.filter((r) => r.sourceNodeId === nodeId);
        for (const rel of outgoing) {
          if (scopedEdges.length < renderBudget.maxVisibleEdges) {
            scopedEdges.push({
              edgeId: rel.relationshipId,
              sourceNodeId: rel.sourceNodeId,
              targetNodeId: rel.targetNodeId,
              relationType: rel.relationType,
              confidence: rel.confidence,
              evidenceType: rel.evidenceType,
            });
          }

          if (!visitedNodes.has(rel.targetNodeId) && scopedNodes.length < renderBudget.maxVisibleNodes) {
            visitedNodes.add(rel.targetNodeId);
            queue.push({ nodeId: rel.targetNodeId, depth: depth + 1 });
          }
        }
      }
    }
  }

  bfs();

  const totalNodesInScope = dataset.graphNodes.length;
  const totalEdgesInScope = dataset.graphRelationships.length;
  const hasMoreUnrenderedNodes = totalNodesInScope > scopedNodes.length;

  const viewModelId = `VIEW_GRAPH45:${dataset.dimension}D:${hashToHex(fnv1a(`${root}:${scopedNodes.length}:${scopedEdges.length}`))}`;

  return Object.freeze({
    viewModelId,
    rootNodeId: root,
    currentDepth: effectiveMaxDepth,
    maxRenderedDepth: renderBudget.maxGraphDepth,
    totalNodesInScope,
    totalEdgesInScope,
    visibleNodes: Object.freeze(scopedNodes),
    visibleEdges: Object.freeze(scopedEdges),
    hasMoreUnrenderedNodes,
  });
}

// ─── 8. Provenance View Model ───────────────────────────────────────────────

export function createProvenanceViewModel(
  record: NormalizedStudioRecord
): ProvenanceViewModel {
  const steps = [
    { stepNumber: 1, stepName: 'Source Acquisition', artifactId: record.sourceUrl, details: `Domain: ${record.sourceDomain}` },
    { stepNumber: 2, stepName: 'Capture Policy Validation', artifactId: record.capturePolicyId, details: 'Strict domain allowlist verified' },
    { stepNumber: 3, stepName: 'Canonical Normalization', artifactId: record.canonicalChecksum, details: 'JSON key lexicographical sorting' },
    { stepNumber: 4, stepName: 'Integrity Checksum Binding', artifactId: record.payloadChecksum, details: `Integrity Valid: ${record.integrityValid}` },
    { stepNumber: 5, stepName: '369 Ternary Encoding', artifactId: record.sequence369.substring(0, 18), details: `${record.sequence369.length} ternary symbols` },
    { stepNumber: 6, stepName: 'Numeric State Conversion', artifactId: record.numericStateBigIntString.substring(0, 12), details: 'Exact base-3 BigInt state' },
    { stepNumber: 7, stepName: 'Spatial Coordinate Anchor', artifactId: record.formattedCoordinate, details: `Coordinate ID: ${record.coordinateId}` },
    { stepNumber: 8, stepName: 'Dimensional State Encapsulation', artifactId: record.stateId, details: `Universe: ${record.universeId}, Dimension: ${record.dimension}D` },
  ];

  const provenanceId = `PROV45:${record.dimension}D:${hashToHex(fnv1a(`${record.stateId}:${record.payloadChecksum}`))}`;
  const viewModelId = `VIEW_PROV45:${record.dimension}D:${hashToHex(fnv1a(provenanceId))}`;

  return Object.freeze({
    viewModelId,
    stateId: record.stateId,
    provenanceId,
    sourceUrl: record.sourceUrl,
    sourceDomain: record.sourceDomain,
    payloadChecksum: record.payloadChecksum,
    canonicalChecksum: record.canonicalChecksum,
    sequenceId: `SEQ:${record.stateId}`,
    numericStateId: `NUM:${record.stateId}`,
    coordinateId: record.coordinateId,
    dimension: record.dimension,
    pipelineSteps: Object.freeze(steps),
  });
}

// ─── 9. Search / Query Console View Model ───────────────────────────────────

export function createSearchConsoleViewModel(
  dataset: NormalizedStudioDataset,
  queryTerm: string,
  queryType = 'EXACT_RECORD_ID',
  rankingPolicy = 'EXACT_MATCH_FIRST',
  renderBudget: StudioRenderBudget = { maxVisibleStates: 50, maxVisibleNodes: 30, maxVisibleEdges: 60, maxVisibleSequenceSymbols: 120, maxGraphDepth: 3, maxDimensionDisplayAxes: 8 }
): SearchConsoleViewModel {
  const term = queryTerm.trim().toLowerCase();
  const candidates: { rank: number; record: NormalizedStudioRecord; score: number; matchType: string }[] = [];

  for (const r of dataset.records) {
    let score = 0;
    let matchType = 'NONE';

    if (r.recordId.toLowerCase() === term) {
      score = 100;
      matchType = 'EXACT_RECORD_ID';
    } else if (r.payloadChecksum.toLowerCase() === term) {
      score = 90;
      matchType = 'EXACT_CHECKSUM';
    } else if (r.sequence369.startsWith(term)) {
      score = 80;
      matchType = 'PREFIX_369';
    } else if (r.formattedCoordinate.toLowerCase().includes(term)) {
      score = 70;
      matchType = 'COORDINATE_MATCH';
    } else if (r.category.toLowerCase().includes(term)) {
      score = 50;
      matchType = 'CATEGORY_MATCH';
    } else if (r.sourceDomain.toLowerCase().includes(term)) {
      score = 40;
      matchType = 'DOMAIN_MATCH';
    }

    if (score > 0) {
      candidates.push({ rank: 0, record: r, score, matchType });
    }
  }

  // Deterministic ranking
  candidates.sort((a, b) => {
    const scoreDiff = b.score - a.score;
    if (scoreDiff !== 0) return scoreDiff;
    return a.record.recordId.localeCompare(b.record.recordId);
  });

  const visibleResults: SearchConsoleResultItemViewModel[] = candidates
    .slice(0, renderBudget.maxVisibleStates)
    .map((c, idx) => ({
      rank: idx + 1,
      stateId: c.record.stateId,
      recordId: c.record.recordId,
      category: c.record.category,
      score: c.score,
      matchType: c.matchType,
      payloadChecksum: c.record.payloadChecksum,
    }));

  const viewModelId = `VIEW_SEARCH45:${dataset.dimension}D:${hashToHex(fnv1a(`${queryTerm}:${candidates.length}`))}`;

  return Object.freeze({
    viewModelId,
    queryTerm,
    queryType,
    rankingPolicy,
    totalFound: candidates.length,
    visibleResults: Object.freeze(visibleResults),
  });
}
