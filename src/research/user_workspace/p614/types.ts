/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.14: User Workspace Search, Indexing & Navigation — Type Definitions
 *
 * Formal contracts for Workspace Indexing, Search Queries, Results, Access Filtering,
 * Deterministic Ranking, Navigation Targets, Snapshots, Causality, and Validation.
 *
 * ISOLATION: Does NOT modify Reality X or any previous funnel contract.
 */

import { PersonalSpace } from '../p68/types';
import { WorkspaceVersion, CanonicalWorkspaceState } from '../p613/types';

// ============================================================================
// 1. ENTITY & ACCESS TYPES
// ============================================================================

export type EntityType =
  | 'SPACE'
  | 'EXPERIMENT'
  | 'SAVED_STATE'
  | 'VERSION'
  | 'TIMELINE_EVENT'
  | 'RECENT_VIEW'
  | 'MODEL_OBJECT'
  | 'GEOMETRY_OBJECT'
  | 'CURVE'
  | 'SURFACE'
  | 'SOLID'
  | 'MESH';

export type AccessLevel = 'PUBLIC' | 'SHARED' | 'PRIVATE' | 'RESTRICTED';

export type UserRole = 'OWNER' | 'EDITOR' | 'OBSERVER' | 'NO_ACCESS';

export interface SearchAccessContext {
  readonly userId: string;
  readonly userRole: UserRole;
  readonly workspaceId: string;
  readonly accessibleSpaceIds?: readonly string[];
  readonly accessibleExperimentIds?: readonly string[];
}

export interface IndexedEntity {
  readonly entityId: string;
  readonly entityType: EntityType;
  readonly workspaceId: string;
  readonly ownerId: string;
  readonly spaceId?: string;
  readonly experimentId?: string;
  readonly versionId?: string;
  readonly stateId?: string;
  readonly title: string;
  readonly name: string;
  readonly description?: string;
  readonly tags?: readonly string[];
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly accessLevel: AccessLevel;
  readonly lineageId: string;
  readonly checksum?: string;
  readonly certainty?: 'EXACT' | 'CONSTRAINED' | 'AMBIGUOUS' | 'UNKNOWN';
  readonly coordinates?: readonly [number, number, number];
}

export interface WorkspaceIndex {
  readonly indexId: string;
  readonly workspaceId: string;
  readonly schemaVersion: '6.14.0';
  readonly entityCount: number;
  readonly entities: readonly IndexedEntity[];
  readonly indexChecksum: string;
  readonly createdAt: number;
}

// ============================================================================
// 2. SEARCH QUERY & RESULT TYPES
// ============================================================================

export type SearchScope =
  | 'ALL'
  | 'SPACES'
  | 'EXPERIMENTS'
  | 'STATES'
  | 'GEOMETRY'
  | 'MODELS';

export interface SearchFilter {
  readonly entityTypes?: readonly EntityType[];
  readonly spaceId?: string;
  readonly experimentId?: string;
  readonly versionId?: string;
  readonly stateId?: string;
  readonly accessLevel?: AccessLevel;
  readonly certainty?: 'EXACT' | 'CONSTRAINED' | 'AMBIGUOUS' | 'UNKNOWN';
  readonly minTimestamp?: number;
  readonly maxTimestamp?: number;
  readonly tags?: readonly string[];
}

export type SearchSortField = 'RELEVANCE' | 'NAME' | 'CREATED_AT' | 'UPDATED_AT' | 'TYPE';
export type SearchSortOrder = 'ASC' | 'DESC';

export interface SearchSort {
  readonly field: SearchSortField;
  readonly order: SearchSortOrder;
}

export interface SearchQuery {
  readonly queryId: string;
  readonly text: string;
  readonly scope: SearchScope;
  readonly filter?: SearchFilter;
  readonly sort?: SearchSort;
  readonly pagination?: { readonly offset: number; readonly limit: number };
  readonly accessContext: SearchAccessContext;
  readonly querySignature: string;
}

export type MatchType =
  | 'EXACT_ID'
  | 'EXACT_TITLE'
  | 'EXACT_TYPE'
  | 'PREFIX'
  | 'TOKEN'
  | 'SUBSTRING'
  | 'METADATA';

export interface SearchResult {
  readonly resultId: string;
  readonly entity: IndexedEntity;
  readonly score: number;
  readonly matchType: MatchType;
  readonly highlights: readonly string[];
}

export interface SearchResults {
  readonly querySignature: string;
  readonly totalMatches: number;
  readonly offset: number;
  readonly limit: number;
  readonly results: readonly SearchResult[];
  readonly searchChecksum: string;
  readonly searchDurationMs: number;
}

// ============================================================================
// 3. NAVIGATION & SNAPSHOT TYPES
// ============================================================================

export type NavigationStatus = 'NAVIGATED' | 'BLOCKED_UNAUTHORIZED' | 'TARGET_NOT_FOUND';

export interface SearchNavigationTarget {
  readonly navigationId: string;
  readonly targetEntityId: string;
  readonly targetEntityType: EntityType;
  readonly targetSpaceId?: string;
  readonly targetExperimentId?: string;
  readonly targetVersionId?: string;
  readonly targetStateId?: string;
  readonly targetObjectId?: string;
  readonly cameraAction?: {
    readonly cameraPosition: readonly [number, number, number];
    readonly cameraTarget: readonly [number, number, number];
  };
  readonly status: NavigationStatus;
  readonly navigationChecksum: string;
}

export interface RecentSearchItem {
  readonly queryText: string;
  readonly scope: SearchScope;
  readonly filterSummary?: string;
  readonly timestamp: number;
  readonly querySignature: string;
}

export interface SearchSnapshot {
  readonly snapshotId: string;
  readonly indexChecksum: string;
  readonly querySignature: string;
  readonly query: SearchQuery;
  readonly accessContext: SearchAccessContext;
  readonly orderedResults: readonly SearchResult[];
  readonly navigationTargetIdentities: readonly string[];
  readonly searchChecksum: string;
  readonly snapshotChecksum: string;
  readonly createdAt: number;
}

// ============================================================================
// 4. HISTORY & CAUSALITY TYPES
// ============================================================================

export type SearchHistoryEvent =
  | 'SEARCH_EXECUTED'
  | 'FILTER_APPLIED'
  | 'RESULT_SELECTED'
  | 'NAVIGATION_REQUESTED'
  | 'NAVIGATION_COMPLETED';

export interface SearchHistoryRecord {
  readonly recordId: string;
  readonly event: SearchHistoryEvent;
  readonly querySignature?: string;
  readonly entityId?: string;
  readonly accessContext: SearchAccessContext;
  readonly timestamp: number;
  readonly checksum: string;
  readonly details: string;
}

export interface SearchCausalityEvent {
  readonly eventId: string;
  readonly eventType: 'SEARCH' | 'FILTER' | 'SORT' | 'PAGINATE' | 'SELECT_RESULT' | 'NAVIGATE';
  readonly realityChecksumBefore: string;
  readonly realityChecksumAfter: string;
  readonly modelChecksumBefore: string;
  readonly modelChecksumAfter: string;
  readonly geometryChecksumBefore: string;
  readonly geometryChecksumAfter: string;
  readonly isRealityInvariant: boolean;
  readonly isModelInvariant: boolean;
  readonly isGeometryInvariant: boolean;
  readonly timestamp: number;
}

// ============================================================================
// 5. VALIDATION & EXPORT TYPES
// ============================================================================

export type SearchValidationStatus =
  | 'SEARCH_VALID'
  | 'SEARCH_INVALID'
  | 'UNAUTHORIZED_ENTITY_DETECTED'
  | 'DUPLICATE_ENTITY_DETECTED'
  | 'INVALID_BOUNDARY'
  | 'CHECKSUM_MISMATCH'
  | 'NON_FINITE_COORDINATE';

export interface SearchValidationReport {
  readonly isValid: boolean;
  readonly status: SearchValidationStatus;
  readonly issues: readonly string[];
  readonly reportChecksum: string;
}

export type SearchExportStatus = 'RESEARCH_EXPORT_READY' | 'RESEARCH_EXPORT_BLOCKED';

export interface SearchExportPackage {
  readonly exportId: string;
  readonly indexChecksum: string;
  readonly querySignature: string;
  readonly resultCount: number;
  readonly accessScope: string;
  readonly status: SearchExportStatus;
  readonly schemaVersion: '6.14.0';
  readonly files: readonly string[];
  readonly exportChecksum: string;
}

// ============================================================================
// 6. BACKWARD COMPATIBILITY EXPERIMENT TYPES (Preserved for P6.15 and tests)
// ============================================================================

export type ExperimentType =
  | 'BASELINE'
  | 'OBSERVATION'
  | 'GEOMETRY'
  | 'TRANSFORMATION'
  | 'DIMENSION'
  | 'COMPARISON'
  | 'RECONSTRUCTION'
  | 'CUSTOM';

export type ExperimentStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'ARCHIVED';

export type ExperimentOperation =
  | 'CREATE'
  | 'TRANSFORM'
  | 'OBSERVE'
  | 'CHANGE_DIMENSION'
  | 'MODIFY_GEOMETRY'
  | 'SAVE'
  | 'RESTORE'
  | 'RESET'
  | 'BRANCH'
  | 'MERGE'
  | 'COMPLETE';

export type ExperimentComparisonClassification =
  | 'IDENTICAL'
  | 'REALITY_CHANGED'
  | 'OBSERVATION_CHANGED'
  | 'MODEL_CHANGED'
  | 'GEOMETRY_CHANGED'
  | 'OBSERVER_ONLY'
  | 'DIMENSION_CHANGED'
  | 'VIEW_ONLY'
  | 'MULTI_LAYER_CHANGE'
  | 'INVALID_COMPARISON';

export type CommitStatus =
  | 'EXPERIMENT_ONLY'
  | 'READY_FOR_COMMIT'
  | 'COMMITTED'
  | 'COMMIT_BLOCKED';

export interface ExperimentState {
  readonly stateId: string;
  readonly experimentId: string;
  readonly parentStateId: string | null;
  readonly versionId: string;
  readonly sequenceNumber: number;
  readonly realityChecksum: string;
  readonly observationChecksum: string;
  readonly modelChecksum: string;
  readonly geometryChecksum: string;
  readonly observerStateChecksum: string;
  readonly dimensionStateChecksum: string;
  readonly viewStateChecksum: string;
  readonly aggregateChecksum: string;
  readonly createdAt: number;
  readonly operation: ExperimentOperation;
  readonly certainty: 'EXACT' | 'CONSTRAINED' | 'AMBIGUOUS';
  readonly lineageId: string;
  readonly canonicalState: CanonicalWorkspaceState;
}

export interface WorkspaceExperiment {
  readonly experimentId: string;
  readonly spaceId: string;
  readonly ownerId: string;
  readonly name: string;
  readonly description: string;
  readonly type: ExperimentType;
  readonly sourceVersionId: string;
  readonly sourceStateChecksum: string;
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly status: ExperimentStatus;
  readonly currentStateId: string;
  readonly lineageId: string;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly checksum: string;
  readonly schemaVersion: '6.14.0';
  readonly isBranch?: boolean;
  readonly parentExperimentId?: string;
  readonly parentStateId?: string;
}

export interface ExperimentComparisonReport {
  readonly comparisonId: string;
  readonly stateIdA: string;
  readonly stateIdB: string;
  readonly realityEqual: boolean;
  readonly observationEqual: boolean;
  readonly modelEqual: boolean;
  readonly geometryEqual: boolean;
  readonly observersEqual: boolean;
  readonly dimensionEqual: boolean;
  readonly viewEqual: boolean;
  readonly objectCountA: number;
  readonly objectCountB: number;
  readonly classification: ExperimentComparisonClassification;
  readonly reportChecksum: string;
}

export interface ExperimentValidationReport {
  readonly isValid: boolean;
  readonly status:
    | 'EXPERIMENT_VALID'
    | 'INVALID_EXPERIMENT_ID'
    | 'INVALID_SPACE_REF'
    | 'INVALID_VERSION_REF'
    | 'CIRCULAR_STATE_ANCESTRY'
    | 'BROKEN_PARENT_REFERENCE'
    | 'DUPLICATE_STATE_ID'
    | 'NON_FINITE_COORDINATES'
    | 'CHECKSUM_MISMATCH'
    | 'CROSS_SPACE_LEAKAGE'
    | 'INVALID_SCHEMA_VERSION'
    | 'CORRUPTED_EXPERIMENT_STATE';
  readonly issues: readonly string[];
  readonly reportChecksum: string;
}

export interface ExperimentSnapshot {
  readonly snapshotId: string;
  readonly experimentId: string;
  readonly spaceId: string;
  readonly sourceVersionId: string;
  readonly currentState: ExperimentState;
  readonly stateHistoryChecksum: string;
  readonly realityChecksum: string;
  readonly modelChecksum: string;
  readonly geometryChecksum: string;
  readonly aggregateChecksum: string;
  readonly checksum: string;
  readonly createdAt: number;
}

export interface CommitRecord {
  readonly commitId: string;
  readonly spaceId: string;
  readonly experimentId: string;
  readonly stateId: string;
  readonly beforeChecksum: string;
  readonly afterChecksum: string;
  readonly status: CommitStatus;
  readonly committedAt: number;
  readonly lineageId: string;
}

export interface ReproducibilitySignature {
  readonly experimentId: string;
  readonly sourceStateChecksum: string;
  readonly operationCount: number;
  readonly finalStateChecksum: string;
  readonly executionSignature: string;
  readonly isDeterministic: boolean;
}
