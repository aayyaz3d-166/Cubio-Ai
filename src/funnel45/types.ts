/**
 * 3D Memory Studio — Funnel 45
 * Information Universe Studio & Multi-Dimensional Data Visualization Types
 *
 * Strongly typed deterministic structures for read-only studio inspection,
 * universe overview statistics, data explorer filtering, virtualized view models,
 * 369 sequence visualization, lower/higher dimensional projection inspectors,
 * multi-dimensional slice explorers, bounded graph view models, provenance lineages,
 * render budgets, studio closures, binary serialization, reconstruction,
 * replay, and collision verification.
 */

// ─── Enums & Classifications ────────────────────────────────────────────────

export type StudioPanelId =
  | 'UNIVERSE_OVERVIEW'
  | 'DATA_EXPLORER'
  | 'STATE_INSPECTOR'
  | 'VISUALIZER_369'
  | 'LOWER_DIMENSION_VIEW'
  | 'HIGHER_DIMENSION_VIEW'
  | 'MULTI_DIMENSIONAL_SPACE_VIEW'
  | 'KNOWLEDGE_GRAPH_VIEW'
  | 'PROVENANCE_VIEW'
  | 'SEARCH_QUERY_CONSOLE';

export type ProjectionTypeLabel =
  | 'MATHEMATICAL_PROJECTION'
  | 'COMPUTATIONAL_EXPANSION'
  | 'CANONICAL_ISOMORPHISM';

export type AxisClassification = 'SOURCE_AXIS' | 'DERIVED_AXIS' | 'DISCARDED_AXIS';

// ─── 1. Render Budget & View Options ────────────────────────────────────────

export interface StudioRenderBudget {
  readonly maxVisibleStates: number; // e.g. 50
  readonly maxVisibleNodes: number; // e.g. 30
  readonly maxVisibleEdges: number; // e.g. 60
  readonly maxVisibleSequenceSymbols: number; // e.g. 120
  readonly maxGraphDepth: number; // e.g. 3
  readonly maxDimensionDisplayAxes: number; // e.g. 8
}

export interface StudioFilterCriteria {
  readonly universeId?: string;
  readonly dimension?: number;
  readonly sourceDomain?: string;
  readonly category?: string;
  readonly recordIdPattern?: string;
  readonly checksumPattern?: string;
  readonly sequence369Prefix?: string;
  readonly coordinatePattern?: string;
  readonly pageIndex: number;
  readonly pageSize: number;
}

// ─── 2. View Models for Panels ──────────────────────────────────────────────

export interface UniverseOverviewViewModel {
  readonly viewModelId: string;
  readonly activeUniverseId: string;
  readonly activeDimension: number;
  readonly totalLogicalStates: number;
  readonly totalVisibleStates: number;
  readonly totalCapturedDocuments: number;
  readonly totalSources: number;
  readonly totalGraphNodes: number;
  readonly totalGraphRelationships: number;
  readonly totalLowerProjections: number;
  readonly totalHigherProjections: number;
  readonly renderBudget: StudioRenderBudget;
  readonly budgetExceeded: boolean;
  readonly noticeMessage?: string;
}

export interface DataExplorerItemViewModel {
  readonly itemIndex: number;
  readonly stateId: string;
  readonly recordId: string;
  readonly documentId: string;
  readonly category: string;
  readonly sourceDomain: string;
  readonly dimension: number;
  readonly formattedCoordinate: string;
  readonly payloadChecksum: string;
  readonly sequence369Snippet: string;
  readonly numericStateSnippet: string;
}

export interface DataExplorerViewModel {
  readonly viewModelId: string;
  readonly totalMatchingStates: number;
  readonly pageIndex: number;
  readonly pageSize: number;
  readonly totalPages: number;
  readonly visibleItems: readonly DataExplorerItemViewModel[];
  readonly appliedFilters: StudioFilterCriteria;
  readonly hasMoreUnrendered: boolean;
}

export interface StateInspectorViewModel<V = any> {
  readonly viewModelId: string;
  readonly stateId: string;
  readonly recordId: string;
  readonly documentId: string;
  readonly universeId: string;
  readonly dimension: number;
  readonly category: string;
  readonly rawValue: V;
  readonly canonicalJson: string;
  readonly payloadChecksum: string;
  readonly canonicalChecksum: string;
  readonly integrityValid: boolean;
  readonly sequence369: string;
  readonly numericStateBigIntString: string;
  readonly formattedCoordinate: string;
  readonly coordinateId: string;
  readonly sourceDomain: string;
  readonly sourceUrl: string;
  readonly capturePolicyId: string;
  readonly fullLineage: readonly string[];
}

export interface Visualizer369ViewModel {
  readonly viewModelId: string;
  readonly sequenceSymbols: string;
  readonly symbolCount: number;
  readonly visibleSymbols: readonly {
    readonly index: number;
    readonly symbol: '3' | '6' | '9';
    readonly digitValue: 0 | 1 | 2;
    readonly groupIndex: number;
  }[];
  readonly count3: number;
  readonly count6: number;
  readonly count9: number;
  readonly ratio3: number;
  readonly ratio6: number;
  readonly ratio9: number;
  readonly numericStateBigIntString: string;
  readonly isOrderSensitiveVerified: boolean; // 369 != 963
  readonly isTruncatedInView: boolean;
}

export interface DimensionalProjectionViewModel {
  readonly viewModelId: string;
  readonly stateId: string;
  readonly sourceDimension: number;
  readonly targetDimension: number;
  readonly direction: 'LOWER_DIMENSIONAL' | 'HIGHER_DIMENSIONAL';
  readonly projectionTypeLabel: ProjectionTypeLabel;
  readonly originalCoordinate: string;
  readonly projectedCoordinate: string;
  readonly preservedPayloadChecksum: string;
  readonly informationLossDetected: boolean;
  readonly axisBreakdown: readonly {
    readonly axisIndex: number;
    readonly axisName: string;
    readonly axisValue: number;
    readonly classification: AxisClassification;
    readonly label: string;
  }[];
  readonly description: string;
}

export interface MultiDimensionalSpaceViewModel {
  readonly viewModelId: string;
  readonly dimension: number;
  readonly activeSliceAxes: readonly [number, number]; // e.g. [1, 2] for X vs Y
  readonly axisValues: readonly number[];
  readonly formattedCoordinate: string;
  readonly pairwiseAxisPairs: readonly {
    readonly axisA: string;
    readonly axisB: string;
    readonly valA: number;
    readonly valB: number;
  }[];
  readonly isDirectPhysicalRenderingSupported: boolean; // true only for 1D, 2D, 3D
  readonly projectionStrategyLabel: string;
}

export interface GraphNodeViewModel {
  readonly nodeId: string;
  readonly label: string;
  readonly category: string;
  readonly sourceDomain: string;
  readonly depth: number;
  readonly isRoot: boolean;
}

export interface GraphEdgeViewModel {
  readonly edgeId: string;
  readonly sourceNodeId: string;
  readonly targetNodeId: string;
  readonly relationType: string;
  readonly confidence: number;
  readonly evidenceType: string;
}

export interface KnowledgeGraphViewModel {
  readonly viewModelId: string;
  readonly rootNodeId?: string;
  readonly currentDepth: number;
  readonly maxRenderedDepth: number;
  readonly totalNodesInScope: number;
  readonly totalEdgesInScope: number;
  readonly visibleNodes: readonly GraphNodeViewModel[];
  readonly visibleEdges: readonly GraphEdgeViewModel[];
  readonly hasMoreUnrenderedNodes: boolean;
}

export interface ProvenanceViewModel {
  readonly viewModelId: string;
  readonly stateId: string;
  readonly provenanceId: string;
  readonly sourceUrl: string;
  readonly sourceDomain: string;
  readonly payloadChecksum: string;
  readonly canonicalChecksum: string;
  readonly sequenceId: string;
  readonly numericStateId: string;
  readonly coordinateId: string;
  readonly dimension: number;
  readonly pipelineSteps: readonly {
    readonly stepNumber: number;
    readonly stepName: string;
    readonly artifactId: string;
    readonly details: string;
  }[];
}

export interface SearchConsoleResultItemViewModel {
  readonly rank: number;
  readonly stateId: string;
  readonly recordId: string;
  readonly category: string;
  readonly score: number;
  readonly matchType: string;
  readonly payloadChecksum: string;
}

export interface SearchConsoleViewModel {
  readonly viewModelId: string;
  readonly queryTerm: string;
  readonly queryType: string;
  readonly rankingPolicy: string;
  readonly totalFound: number;
  readonly visibleResults: readonly SearchConsoleResultItemViewModel[];
}

// ─── 3. Complete Studio Snapshot & Closure ──────────────────────────────────

export interface StudioSessionSnapshot {
  readonly sessionId: string;
  readonly universeId: string;
  readonly dimension: number;
  readonly renderBudget: StudioRenderBudget;
  readonly activePanel: StudioPanelId;
  readonly selectedStateId?: string;
  readonly overview: UniverseOverviewViewModel;
  readonly explorer: DataExplorerViewModel;
  readonly inspector?: StateInspectorViewModel;
  readonly visualizer369?: Visualizer369ViewModel;
  readonly lowerProjectionView?: DimensionalProjectionViewModel;
  readonly higherProjectionView?: DimensionalProjectionViewModel;
  readonly spaceView?: MultiDimensionalSpaceViewModel;
  readonly graphView?: KnowledgeGraphViewModel;
  readonly provenanceView?: ProvenanceViewModel;
  readonly searchConsole?: SearchConsoleViewModel;
}

export interface StudioClosure {
  readonly closureId: string;
  readonly session: StudioSessionSnapshot;
  readonly isReadOnlyAuditPassed: boolean;
  readonly fullStudioLineage: readonly string[];
  readonly shannonReferenceCapacityBigIntString: string;
  readonly creationOrder: number;
}

export interface StudioSerializationPayload {
  readonly format: '45_STUDIO_SESSION_CLOSURE_V1';
  readonly closureId: string;
  readonly sessionId: string;
  readonly universeId: string;
  readonly dimension: number;
  readonly activePanel: StudioPanelId;
  readonly selectedStateId?: string;
  readonly totalLogicalStates: number;
  readonly totalVisibleStates: number;
  readonly isReadOnlyAuditPassed: boolean;
  readonly fullStudioLineage: readonly string[];
  readonly creationOrder: number;
}

export interface StudioEqualityComparison {
  readonly closureIdMatch: boolean;
  readonly sessionIdMatch: boolean;
  readonly universeIdMatch: boolean;
  readonly dimensionMatch: boolean;
  readonly activePanelMatch: boolean;
  readonly overviewMatch: boolean;
  readonly explorerMatch: boolean;
  readonly isExactMatch: boolean;
}

// ─── 4. Collision & Determinism Records ──────────────────────────────────────

export interface F45CollisionRecord {
  readonly totalConfigurations: number;
  readonly uniqueSessionIds: number;
  readonly uniqueOverviewIds: number;
  readonly uniqueExplorerIds: number;
  readonly uniqueInspectorIds: number;
  readonly uniqueVisualizerIds: number;
  readonly uniqueProjectionViewIds: number;
  readonly uniqueSpaceViewIds: number;
  readonly uniqueGraphViewIds: number;
  readonly uniqueProvenanceViewIds: number;
  readonly uniqueClosureIds: number;
  readonly sessionCollisions: number;
  readonly overviewCollisions: number;
  readonly explorerCollisions: number;
  readonly inspectorCollisions: number;
  readonly visualizerCollisions: number;
  readonly projectionViewCollisions: number;
  readonly spaceViewCollisions: number;
  readonly graphViewCollisions: number;
  readonly provenanceViewCollisions: number;
  readonly closureCollisions: number;
  readonly serializedCollisions: number;
}

export interface F45DeterminismRecord {
  readonly trials: number;
  readonly dimension: number;
  readonly universeId: string;
  readonly closureId: string;
  readonly serializedBytes: number;
  readonly variance: number;
  readonly allIdentical: boolean;
}

export interface F45TestResult {
  readonly testId: string;
  readonly name: string;
  readonly passed: boolean;
  readonly details: string;
  readonly durationMs: number;
  readonly totalEvaluations?: number;
  readonly collisions?: number;
  readonly variance?: number;
  readonly fullBytes?: number;
  readonly sharedBytes?: number;
  readonly byteSavings?: number;
  readonly ratio?: number;
}

export interface F45SuiteReport {
  readonly suiteName: string;
  readonly totalTests: number;
  readonly passedTests: number;
  readonly failedTests: number;
  readonly allPassed: boolean;
  readonly totalDurationMs: number;
  readonly results: readonly F45TestResult[];
}
