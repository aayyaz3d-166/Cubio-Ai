/**
 * 3D Memory Studio — Funnel 50
 * 3D Memory Studio Simulation Prototype Types
 *
 * Strongly typed structures for the 3D visual simulation laboratory,
 * spatial node graphs, interactive camera controls, dimension projection overlays,
 * 369 core telemetry, and test suites.
 */

import { DataClassification, ClassificationStatus } from '../funnel47/types';
import { DimensionalInformationState, InformationUniverseIndex } from '../funnel49/types';

export type SimulationClusterType =
  | 'STANDARDS'
  | 'PROTOCOLS'
  | 'ONTOLOGY'
  | 'AI_LLM'
  | 'TAXONOMY'
  | 'INFORMATION_THEORY'
  | 'SECURITY';

export type LiveSearchMatchFacet =
  | 'EXACT_STATE_ID'
  | 'EXACT_RECORD_ID'
  | 'MODEL_NAME'
  | 'ENTITY_NAME'
  | 'PROVIDER'
  | 'SOURCE_DOMAIN'
  | 'CATEGORY'
  | 'CLASSIFICATION'
  | 'CHECKSUM'
  | 'COORDINATE'
  | 'SEQUENCE_369'
  | 'SEMANTIC_TERM'
  | 'ALL_FACETS'
  | 'NONE';

export interface LiveSearchMatchReason {
  readonly facet: LiveSearchMatchFacet;
  readonly matchedField: string;
  readonly matchedValue: string;
  readonly scoreContribution?: number;
  readonly description: string;
}

export interface LiveSearchResultItem {
  readonly rank: number;
  readonly score: number;
  readonly stateId: string;
  readonly recordId: string;
  readonly entityName: string;
  readonly modelName?: string;
  readonly provider?: string;
  readonly sourceDomain: string;
  readonly category: string;
  readonly classification: DataClassification;
  readonly processingAllowed: boolean;
  readonly payloadChecksum: string;
  readonly formattedCoordinate: string | null;
  readonly sequence369Snippet: string | null;
  readonly primaryFacet: LiveSearchMatchFacet;
  readonly matchReasons: readonly LiveSearchMatchReason[];
  readonly rawState: DimensionalInformationState;
}

export interface LiveSearchQueryContext {
  readonly rawQuery: string;
  readonly normalizedQuery: string;
  readonly queryTokens?: readonly string[];
  readonly classificationFilter?: 'ALL' | 'GREEN' | 'RED';
  readonly isLLMOnlyFilter?: boolean;
  readonly categoryFilter?: string;
  readonly activeDimension?: number;
  readonly dimension?: number;
}

export interface LiveSearchResponse {
  readonly queryContext?: LiveSearchQueryContext;
  readonly query?: string;
  readonly normalizedQuery?: string;
  readonly primarySearchMode?: string;
  readonly totalMatchesFound?: number;
  readonly totalMatches?: number;
  readonly executionTimeMs?: number;
  readonly durationMs?: number;
  readonly results: readonly LiveSearchResultItem[];
}

export type SimulationViewMode =
  | 'UNIVERSE_3D'
  | 'PROJECTION_PAIRWISE'
  | 'LOWER_DIM_LOSS'
  | 'HIGHER_DIM_EXPANSION'
  | 'PROVENANCE_FLOW';

export interface Spatial3DVector {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface SimulationNode {
  readonly nodeId: string;
  readonly stateId: string;
  readonly recordId: string;
  readonly entityName: string;
  readonly cluster: SimulationClusterType;
  readonly classification: DataClassification;
  readonly classificationStatus: ClassificationStatus;
  readonly processingAllowed: boolean;
  readonly position3D: Spatial3DVector;
  readonly colorHex: string;
  readonly radius: number;
  readonly isSelected: boolean;
  readonly isHighlighted: boolean;
  readonly sequence369Snippet: string | null;
  readonly formattedCoordinateZ3: string | null;
  readonly formattedCoordinateZ8: string | null;
  readonly payloadChecksum: string;
  readonly isLLMModel: boolean;
  readonly modelProvider?: string;
  readonly rawState: DimensionalInformationState;
}

export interface SimulationEdge {
  readonly edgeId: string;
  readonly sourceNodeId: string;
  readonly targetNodeId: string;
  readonly relationType: string;
  readonly confidence: number;
  readonly isInferred: boolean;
  readonly colorHex: string;
}

export interface SimulationCameraState {
  readonly position: Spatial3DVector;
  readonly target: Spatial3DVector;
  readonly zoom: number;
  readonly pitch: number;
  readonly yaw: number;
  readonly isTransitioning: boolean;
}

export interface SimulationHUDTelemetry {
  readonly totalStates: number;
  readonly greenStatesCount: number;
  readonly redStatesCount: number;
  readonly llmModelsCount: number;
  readonly activeDimension: number;
  readonly activeCluster: string;
  readonly visibleNodesCount: number;
  readonly visibleEdgesCount: number;
  readonly fps: number;
  readonly renderBudgetMaxStates: number;
  readonly simulationStatus: 'RUNNING' | 'PAUSED' | 'FOCUSING';
}

export interface SimulationStateSummary {
  readonly stateId: string;
  readonly recordId: string;
  readonly entityName: string;
  readonly category: string;
  readonly classification: DataClassification;
  readonly status: ClassificationStatus;
  readonly sourceDomain: string;
  readonly sequence369: string | null;
  readonly numericBase3BigInt: string | null;
  readonly coordinateZ3: string | null;
  readonly coordinateZ8: string | null;
  readonly coordinateActiveDim: string | null;
  readonly checksum: string;
  readonly isRestricted: boolean;
  readonly restrictionReason?: string;
  readonly provenanceLineage: readonly string[];
}

export interface SimulationSceneSnapshot {
  readonly sceneId: string;
  readonly universeId: string;
  readonly currentDimension: number;
  readonly viewMode: SimulationViewMode;
  readonly nodes: readonly SimulationNode[];
  readonly edges: readonly SimulationEdge[];
  readonly camera: SimulationCameraState;
  readonly selectedNodeId?: string;
  readonly selectedStateSummary?: SimulationStateSummary;
  readonly telemetry: SimulationHUDTelemetry;
}

export interface F50TestResult {
  readonly testId: string;
  readonly name: string;
  readonly passed: boolean;
  readonly details: string;
  readonly durationMs: number;
  readonly totalEvaluations?: number;
  readonly collisions?: number;
  readonly variance?: number;
}

export interface F50SuiteReport {
  readonly suiteName: string;
  readonly totalTests: number;
  readonly passedTests: number;
  readonly failedTests: number;
  readonly allPassed: boolean;
  readonly totalDurationMs: number;
  readonly results: readonly F50TestResult[];
}
