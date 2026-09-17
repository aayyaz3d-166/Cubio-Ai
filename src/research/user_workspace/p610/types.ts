/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.10: Workspace Indexing & Navigation — Type Definitions
 *
 * Formal contracts for Workspace Index, Indexed Entities, Search Queries,
 * Filter/Sort Specifications, Navigation, Pinning, Tagging, Stale Detection, and Reindexing.
 */

import { PersonalSpace, SavedStateRecord, ExperimentRecord, RecentViewRecord } from '../p68/types';
import { ResearchExportPackage, SharePackage } from '../p69/types';

export type IndexEntityType =
  | 'SPACE'
  | 'EXPERIMENT'
  | 'SAVED_STATE'
  | 'RECENT_VIEW'
  | 'IMPORT'
  | 'CLONE'
  | 'SHARE_PACKAGE';

export type EntityStatus = 'ACTIVE' | 'ARCHIVED' | 'PINNED' | 'LOCKED' | 'STALE';

export interface IndexRecord {
  readonly recordId: string;
  readonly entityType: IndexEntityType;
  readonly entityId: string;
  readonly spaceId: string;
  readonly userId: string;
  readonly name: string;
  readonly lineageId: string | null;
  readonly checksumRef: string;
  readonly schemaVersion: string;
  readonly status: EntityStatus;
  readonly isPinned: boolean;
  readonly tags: readonly string[];
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly lastViewedAt: number;
  readonly objectCount?: number;
  readonly observerCount?: number;
  readonly dimensionType?: string;
  readonly certainty?: string;
  readonly provenanceSourceId?: string | null;
}

export interface WorkspaceSearchQuery {
  readonly queryText?: string;
  readonly entityTypes?: readonly IndexEntityType[];
  readonly spaceId?: string;
  readonly tags?: readonly string[];
  readonly isPinned?: boolean;
  readonly status?: EntityStatus;
  readonly schemaVersion?: string;
  readonly dimensionType?: string;
  readonly certainty?: string;
}

export type SortField =
  | 'NAME'
  | 'CREATED_AT'
  | 'UPDATED_AT'
  | 'LAST_VIEWED_AT'
  | 'CHECKSUM'
  | 'OBJECT_COUNT'
  | 'ENTITY_TYPE';

export type SortDirection = 'ASC' | 'DESC';

export interface SortSpec {
  readonly primaryField: SortField;
  readonly direction: SortDirection;
  readonly secondaryField?: SortField;
}

export interface StaleDetectionReport {
  readonly isStale: boolean;
  readonly staleRecordIds: readonly string[];
  readonly details: readonly {
    readonly recordId: string;
    readonly indexedChecksum: string;
    readonly authoritativeChecksum: string;
  }[];
}

export interface OrphanDetectionReport {
  readonly hasOrphans: boolean;
  readonly orphanedRecordIds: readonly string[];
  readonly issues: readonly string[];
}

export interface ReindexResult {
  readonly success: boolean;
  readonly totalIndexed: number;
  readonly removedOrphans: number;
  readonly updatedStale: number;
  readonly indexChecksum: string;
  readonly reindexedAt: number;
}

export interface WorkspaceIndexState {
  readonly userId: string;
  readonly schemaVersion: '6.10.0';
  readonly records: readonly IndexRecord[];
  readonly indexChecksum: string;
  readonly lastReindexedAt: number;
}

export interface IndexValidationReport {
  readonly isValid: boolean;
  readonly status:
    | 'INDEX_VALID'
    | 'INDEX_STALE'
    | 'ORPHANED_REFERENCE'
    | 'DUPLICATE_INDEX_ID'
    | 'CROSS_USER_VIOLATION'
    | 'INVALID_SCHEMA_VERSION'
    | 'CORRUPTED_INDEX';
  readonly issues: readonly string[];
  readonly reportChecksum: string;
}
