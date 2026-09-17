/**
 * 3D Memory Studio — Funnel 49
 * Dimensional Information Universe Search & Full Frontend Explorer Types
 *
 * Strongly typed structures for unified dimensional states, multi-index tables,
 * dimension-aware search queries, match reason breakdowns, and test suites.
 */

import { DataClassification, ClassificationStatus } from '../funnel47/types';

export type DimensionalNavigationScope =
  | 'ALL_STATES'
  | 'GREEN_STATES'
  | 'RED_STATES'
  | 'LLM_MODELS'
  | 'STANDARDS'
  | 'PROTOCOLS'
  | 'ONTOLOGY';

export interface DimensionalCoordinateMap {
  readonly [dimension: number]: {
    readonly formattedCoordinate: string;
    readonly coordinateValues: readonly number[];
    readonly coordinateId: string;
  };
}

export interface DimensionalInformationState {
  readonly stateId: string;
  readonly recordId: string;
  readonly entityId: string;
  readonly entityName: string;
  readonly category: string;
  readonly classification: DataClassification;
  readonly classificationStatus: ClassificationStatus;
  readonly processingAllowed: boolean;
  readonly classificationRuleId: string;
  readonly classificationReason: string;
  readonly sourceDomain: string;
  readonly sourceUrl: string;
  readonly dimension: number;
  readonly dimensionPath: string;
  readonly coordinatesByDimension: DimensionalCoordinateMap;
  readonly sequence369: string | null;
  readonly numericStateBigIntString: string | null;
  readonly payloadChecksum: string;
  readonly semanticTerms: readonly string[];
  readonly modelMetadata?: {
    readonly modelName: string;
    readonly provider: string;
    readonly parameterCount?: string;
    readonly licenseType?: string;
    readonly explicitlyAuthorized: boolean;
  };
  readonly provenanceLineage: readonly string[];
  readonly connectedEntityIds: readonly string[];
  readonly isRestricted: boolean;
}

export interface InformationUniverseIndex {
  readonly universeId: string;
  readonly totalStates: number;
  readonly greenStatesCount: number;
  readonly redStatesCount: number;
  readonly llmModelsCount: number;
  readonly states: readonly DimensionalInformationState[];
  readonly stateById: ReadonlyMap<string, DimensionalInformationState>;
  readonly statesByEntity: ReadonlyMap<string, readonly DimensionalInformationState[]>;
  readonly statesByCategory: ReadonlyMap<string, readonly DimensionalInformationState[]>;
  readonly statesByClassification: ReadonlyMap<DataClassification, readonly DimensionalInformationState[]>;
  readonly statesByDomain: ReadonlyMap<string, readonly DimensionalInformationState[]>;
  readonly statesBySemanticTerm: ReadonlyMap<string, readonly DimensionalInformationState[]>;
}

export type SearchMatchReasonType =
  | 'EXACT_ID_MATCH'
  | 'ENTITY_MATCH'
  | 'MODEL_NAME_MATCH'
  | 'PROVIDER_MATCH'
  | 'SEMANTIC_TERM_MATCH'
  | 'CATEGORY_MATCH'
  | 'DOMAIN_MATCH'
  | 'CLASSIFICATION_MATCH'
  | 'SEQUENCE_369_MATCH'
  | 'COORDINATE_MATCH'
  | 'DIMENSION_MATCH'
  | 'CHECKSUM_MATCH'
  | 'PROVENANCE_MATCH'
  | 'GRAPH_RELATION_MATCH';

export interface DimensionalSearchMatchReason {
  readonly type: SearchMatchReasonType;
  readonly description: string;
  readonly fieldMatched: string;
  readonly matchedValue: string;
}

export interface DimensionalSearchResultItem {
  readonly rank: number;
  readonly score: number;
  readonly stateId: string;
  readonly recordId: string;
  readonly entityName: string;
  readonly category: string;
  readonly classification: DataClassification;
  readonly sourceDomain: string;
  readonly provider?: string;
  readonly sequence369Snippet: string | null;
  readonly formattedCoordinateZ3: string | null;
  readonly formattedCoordinateZ8: string | null;
  readonly payloadChecksum: string;
  readonly processingAllowed: boolean;
  readonly matchReasons: readonly DimensionalSearchMatchReason[];
}

export interface DimensionalSearchResponse {
  readonly query: string;
  readonly totalFound: number;
  readonly results: readonly DimensionalSearchResultItem[];
  readonly durationMs: number;
  readonly rankingPolicy: string;
}

export interface DimensionalExplorerViewModel {
  readonly universeId: string;
  readonly currentDimension: number;
  readonly activeScope: DimensionalNavigationScope;
  readonly selectedState?: DimensionalInformationState;
  readonly totalStatesInScope: number;
  readonly visibleStates: readonly DimensionalInformationState[];
  readonly pageIndex: number;
  readonly pageSize: number;
  readonly totalPages: number;
  readonly greenCount: number;
  readonly redCount: number;
  readonly llmCount: number;
  readonly breadcrumbPath: readonly string[];
}

export interface F49TestResult {
  readonly testId: string;
  readonly name: string;
  readonly passed: boolean;
  readonly details: string;
  readonly durationMs: number;
  readonly totalEvaluations?: number;
  readonly collisions?: number;
  readonly variance?: number;
}

export interface F49SuiteReport {
  readonly suiteName: string;
  readonly totalTests: number;
  readonly passedTests: number;
  readonly failedTests: number;
  readonly allPassed: boolean;
  readonly totalDurationMs: number;
  readonly results: readonly F49TestResult[];
}
