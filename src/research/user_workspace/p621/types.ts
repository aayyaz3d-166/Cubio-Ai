/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.21: User Workspace Search, Indexing & State Discovery — Types
 *
 * SEARCH IS OBSERVATION.
 * No search, indexing, filtering, or discovery operation may mutate
 * authoritative Reality, Model, Geometry, or Timeline states.
 */

export type SearchResultType =
  | 'SPACE'
  | 'EXPERIMENT'
  | 'SAVED_STATE'
  | 'VERSION'
  | 'CHECKPOINT'
  | 'TIMELINE'
  | 'SHARED_SPACE'
  | 'MODEL'
  | 'GEOMETRY';

export type SearchScope =
  | 'ALL'
  | 'SPACES'
  | 'EXPERIMENTS'
  | 'SAVED_STATES'
  | 'VERSIONS'
  | 'CHECKPOINTS'
  | 'SHARED'
  | 'MODELS'
  | 'GEOMETRIES';

export type SearchAccessRole = 'OWNER' | 'EDITOR' | 'OBSERVER' | 'NO_ACCESS';

export type SearchValidationStatus =
  | 'SEARCH_VALID'
  | 'SEARCH_INVALID'
  | 'UNAUTHORIZED_SEARCH'
  | 'BROKEN_INDEX'
  | 'INVALID_QUERY'
  | 'INVALID_FILTER'
  | 'INVALID_SORT'
  | 'RESULT_BOUNDARY_VIOLATION';

export interface SearchPermissionContext {
  readonly userId: string;
  readonly userRole: SearchAccessRole;
  readonly workspaceId: string;
  readonly accessibleSpaceIds?: readonly string[];
  readonly accessibleExperimentIds?: readonly string[];
}

export type FilterOperator =
  | 'EQUALS'
  | 'CONTAINS'
  | 'IN'
  | 'EXACT'
  | 'AND'
  | 'OR';

export interface SearchFilter {
  readonly field: string;
  readonly operator: FilterOperator;
  readonly value: string | readonly string[];
  readonly andConditions?: readonly SearchFilter[];
  readonly orConditions?: readonly SearchFilter[];
}

export interface SearchSort {
  readonly field: 'name' | 'type' | 'id' | 'lineage' | 'checksum' | 'createdAt';
  readonly direction: 'ASC' | 'DESC';
}

export interface SearchQuery {
  readonly queryId?: string;
  readonly term?: string;
  readonly scope?: SearchScope;
  readonly filters?: readonly SearchFilter[];
  readonly sort?: SearchSort;
  readonly limit?: number;
  readonly offset?: number;
}

export interface SearchIndexEntry {
  readonly entryId: string;
  readonly sourceId: string;
  readonly sourceType: SearchResultType;
  readonly name: string;
  readonly spaceId: string;
  readonly experimentId?: string;
  readonly ownerId: string;
  readonly accessLevel: 'PUBLIC' | 'SHARED' | 'PRIVATE' | 'RESTRICTED';
  readonly lineageId: string;
  readonly checksum: string;
  readonly certainty: 'EXACT' | 'CONSTRAINED' | 'AMBIGUOUS' | 'UNKNOWN';
  readonly coordinates?: readonly [number, number, number];
  readonly createdAt: number;
  readonly metadata: Readonly<Record<string, unknown>>;
}

export interface SearchIndex {
  readonly indexId: string;
  readonly schemaVersion: '6.21.0';
  readonly workspaceId: string;
  readonly entries: readonly SearchIndexEntry[];
  readonly entryCount: number;
  readonly indexChecksum: string;
  readonly createdAt: number;
}

export interface SearchResult {
  readonly resultId: string;
  readonly sourceId: string;
  readonly resultType: SearchResultType;
  readonly name: string;
  readonly spaceId: string;
  readonly experimentId?: string;
  readonly ownerId: string;
  readonly accessLevel: 'PUBLIC' | 'SHARED' | 'PRIVATE' | 'RESTRICTED';
  readonly lineageId: string;
  readonly checksum: string;
  readonly certainty: 'EXACT' | 'CONSTRAINED' | 'AMBIGUOUS' | 'UNKNOWN';
  readonly coordinates?: readonly [number, number, number];
  readonly score: number;
  readonly metadata: Readonly<Record<string, unknown>>;
}

export interface DiscoveryState {
  readonly recentResults: readonly SearchResult[];
  readonly savedStates: readonly SearchResult[];
  readonly versions: readonly SearchResult[];
  readonly checkpoints: readonly SearchResult[];
  readonly sharedSpaces: readonly SearchResult[];
  readonly assets: readonly SearchResult[];
  readonly totalDiscoverableCount: number;
}

export interface SearchValidationReport {
  readonly isValid: boolean;
  readonly status: SearchValidationStatus;
  readonly issues: readonly string[];
  readonly reportChecksum: string;
}

export interface SearchSnapshot {
  readonly snapshotId: string;
  readonly query: SearchQuery;
  readonly results: readonly SearchResult[];
  readonly resultChecksums: readonly string[];
  readonly permissionContext: SearchPermissionContext;
  readonly indexChecksum: string;
  readonly isFrozen: true;
  readonly createdAt: number;
  readonly searchChecksum: string;
}

export interface SearchCausalityEvent {
  readonly eventId: string;
  readonly eventType:
    | 'SEARCH_EXECUTED'
    | 'FILTER_APPLIED'
    | 'SORT_APPLIED'
    | 'RESULT_SELECTED'
    | 'INDEX_REBUILT'
    | 'SNAPSHOT_CAPTURED'
    | 'REALITY_MUTATED'
    | 'OBSERVER_MUTATED'
    | 'CAMERA_MOVED';
  readonly realityChecksumBefore: string;
  readonly realityChecksumAfter: string;
  readonly modelChecksumBefore: string;
  readonly modelChecksumAfter: string;
  readonly geometryChecksumBefore: string;
  readonly geometryChecksumAfter: string;
  readonly isRealityInvariant: boolean;
  readonly isModelInvariant: boolean;
  readonly isGeometryInvariant: boolean;
}
