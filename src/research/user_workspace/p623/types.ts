/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.23: User Workspace Trash, Archive & Recovery — Types
 *
 * Formal contracts for:
 * 1. Workspace Lifecycle State Transitions (ACTIVE, TRASHED, ARCHIVED, RESTORED, PERMANENTLY_DELETED)
 * 2. Immutable Trash & Archive Records
 * 3. Deterministic Recovery & Permanent Deletion
 * 4. Cascade Safety & Multi-Tenant Authorization
 */

export type WorkspaceLifecycleState =
  | 'ACTIVE'
  | 'TRASHED'
  | 'ARCHIVED'
  | 'RESTORED'
  | 'PERMANENTLY_DELETED';

export type WorkspaceEntityType =
  | 'SPACE'
  | 'EXPERIMENT'
  | 'SAVED_STATE'
  | 'VERSION'
  | 'RECENT_VIEW'
  | 'MODEL_OBJECT'
  | 'GEOMETRY_OBJECT';

export type LifecycleAccessRole = 'OWNER' | 'EDITOR' | 'OBSERVER' | 'NO_ACCESS';

export type LifecycleValidationStatus =
  | 'LIFECYCLE_VALID'
  | 'LIFECYCLE_INVALID'
  | 'RECOVERY_BLOCKED'
  | 'PERMANENT_DELETE_BLOCKED'
  | 'CASCADE_REQUIRES_EXPLICIT_ACTION'
  | 'UNAUTHORIZED_ACTION'
  | 'CORRUPTED';

export interface LifecyclePermissionContext {
  readonly userId: string;
  readonly userRole: LifecycleAccessRole;
  readonly workspaceId: string;
  readonly isRevoked?: boolean;
  readonly accessibleSpaceIds?: readonly string[];
}

export interface WorkspaceEntityReference {
  readonly entityId: string;
  readonly entityType: WorkspaceEntityType;
  readonly name: string;
  readonly spaceId: string;
  readonly experimentId?: string;
  readonly ownerId: string;
  readonly lineageId: string;
  readonly checksum: string;
  readonly realityChecksum?: string;
  readonly coordinates?: readonly [number, number, number];
  readonly certainty?: 'EXACT' | 'CONSTRAINED' | 'AMBIGUOUS' | 'UNKNOWN';
  readonly stateData?: Readonly<Record<string, unknown>>;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface TrashEntry {
  readonly trashId: string;
  readonly entity: WorkspaceEntityReference;
  readonly previousState: WorkspaceLifecycleState;
  readonly trashedAt: number;
  readonly trashedBy: string;
  readonly reason?: string;
  readonly entryChecksum: string;
}

export interface ArchiveEntry {
  readonly archiveId: string;
  readonly entity: WorkspaceEntityReference;
  readonly previousState: WorkspaceLifecycleState;
  readonly archivedAt: number;
  readonly archivedBy: string;
  readonly reason?: string;
  readonly entryChecksum: string;
}

export interface RecoveryRecord {
  readonly recoveryId: string;
  readonly entityId: string;
  readonly entityType: WorkspaceEntityType;
  readonly sourceTrashOrArchiveId: string;
  readonly restoredFrom: 'TRASH' | 'ARCHIVE';
  readonly restoredChecksum: string;
  readonly restoredAt: number;
  readonly restoredBy: string;
  readonly recordChecksum: string;
}

export interface DeletionRecord {
  readonly deletionId: string;
  readonly entityId: string;
  readonly entityType: WorkspaceEntityType;
  readonly spaceId: string;
  readonly deletedFromTrashId: string;
  readonly deletedAt: number;
  readonly deletedBy: string;
  readonly auditChecksum: string;
}

export interface TrashQuery {
  readonly spaceId?: string;
  readonly entityType?: WorkspaceEntityType;
  readonly ownerId?: string;
}

export interface ArchiveQuery {
  readonly spaceId?: string;
  readonly entityType?: WorkspaceEntityType;
  readonly ownerId?: string;
}

export interface LifecycleValidationReport {
  readonly isValid: boolean;
  readonly status: LifecycleValidationStatus;
  readonly issues: readonly string[];
  readonly reportChecksum: string;
}

export interface LifecycleSnapshot {
  readonly snapshotId: string;
  readonly workspaceId: string;
  readonly activeCount: number;
  readonly trashEntries: readonly TrashEntry[];
  readonly archiveEntries: readonly ArchiveEntry[];
  readonly recoveryRecords: readonly RecoveryRecord[];
  readonly deletionRecords: readonly DeletionRecord[];
  readonly isFrozen: true;
  readonly createdAt: number;
  readonly snapshotChecksum: string;
}

export type LifecycleHistoryEventType =
  | 'TRASHED'
  | 'RESTORED'
  | 'ARCHIVED'
  | 'UNARCHIVED'
  | 'PERMANENTLY_DELETED'
  | 'EMPTY_TRASH'
  | 'RECOVERY_BLOCKED'
  | 'DELETE_BLOCKED';

export interface LifecycleHistoryEntry {
  readonly historyId: string;
  readonly eventType: LifecycleHistoryEventType;
  readonly entityId: string;
  readonly entityType: WorkspaceEntityType;
  readonly actorId: string;
  readonly details: string;
  readonly timestamp: number;
  readonly historyChecksum: string;
}

export interface LifecycleCausalityEvent {
  readonly eventId: string;
  readonly eventType:
    | 'TRASH_MOVE'
    | 'TRASH_RESTORE'
    | 'ARCHIVE_MOVE'
    | 'ARCHIVE_RESTORE'
    | 'PERMANENT_DELETE'
    | 'EMPTY_TRASH'
    | 'SEARCH_INSPECTION'
    | 'CAMERA_MOVED'
    | 'OBSERVER_MUTATED';
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
