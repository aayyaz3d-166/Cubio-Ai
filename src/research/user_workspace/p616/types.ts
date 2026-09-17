/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.16: User Workspace Recovery, Backup & Restoration — Type Definitions
 *
 * Formal contracts for Backup Packages, Manifests, Immutable Recovery Points,
 * Previews, Validation, Corruption Detection, Conflict Resolution,
 * Transactional Restore, Rollback, Snapshots, Causality, and History.
 *
 * ISOLATION: Does NOT mutate Reality X or any previous funnel contract.
 */

// ============================================================================
// 1. RECOVERY SCOPE & STATUSES
// ============================================================================

export type RecoveryScope =
  | 'WORKSPACE'
  | 'SPACE'
  | 'EXPERIMENT'
  | 'SAVED_STATE'
  | 'VERSION'
  | 'MODEL'
  | 'GEOMETRY';

export type RecoveryEntityStatus =
  | 'VALID'
  | 'INVALID'
  | 'CORRUPTED'
  | 'BLOCKED'
  | 'RESTORE_READY'
  | 'RESTORE_FAILED'
  | 'RESTORED'
  | 'ROLLED_BACK';

export type RecoveryValidationStatus =
  | 'RECOVERY_VALID'
  | 'RECOVERY_INVALID'
  | 'CORRUPTED'
  | 'RESTORE_READY'
  | 'RESTORE_BLOCKED'
  | 'RESTORED'
  | 'ROLLBACK_COMPLETE';

export type AccessLevel = 'PUBLIC' | 'SHARED' | 'PRIVATE' | 'RESTRICTED';

export type UserRole = 'OWNER' | 'EDITOR' | 'OBSERVER' | 'NO_ACCESS';

export interface RecoveryAccessContext {
  readonly userId: string;
  readonly userRole: UserRole;
  readonly workspaceId: string;
  readonly accessibleSpaceIds?: readonly string[];
  readonly accessibleExperimentIds?: readonly string[];
}

// ============================================================================
// 2. RECOVERY ENTITY DEFINITIONS
// ============================================================================

export interface RecoverySpace {
  readonly spaceId: string;
  readonly name: string;
  readonly workspaceId: string;
  readonly ownerId: string;
  readonly accessLevel: AccessLevel;
  readonly lineageId: string;
  readonly realityChecksum: string;
  readonly checksum: string;
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly metadata: Readonly<Record<string, unknown>>;
}

export interface RecoveryExperiment {
  readonly experimentId: string;
  readonly spaceId: string;
  readonly workspaceId: string;
  readonly ownerId: string;
  readonly name: string;
  readonly description: string;
  readonly type: string;
  readonly sourceVersionId: string;
  readonly sourceStateChecksum: string;
  readonly currentStateId: string;
  readonly lineageId: string;
  readonly checksum: string;
  readonly createdAt: number;
  readonly metadata: Readonly<Record<string, unknown>>;
}

export interface RecoverySavedState {
  readonly stateId: string;
  readonly spaceId: string;
  readonly experimentId?: string;
  readonly workspaceId: string;
  readonly ownerId: string;
  readonly title: string;
  readonly certainty: 'EXACT' | 'CONSTRAINED' | 'AMBIGUOUS' | 'UNKNOWN';
  readonly realityChecksum: string;
  readonly aggregateChecksum: string;
  readonly lineageId: string;
  readonly checksum: string;
  readonly createdAt: number;
  readonly metadata: Readonly<Record<string, unknown>>;
}

export interface RecoveryVersion {
  readonly versionId: string;
  readonly spaceId: string;
  readonly workspaceId: string;
  readonly ownerId: string;
  readonly label: string;
  readonly parentVersionId: string | null;
  readonly versionType: string;
  readonly versionIndex: number;
  readonly stateChecksum: string;
  readonly lineageId: string;
  readonly checksum: string;
  readonly createdAt: number;
  readonly changeSummary: string;
}

export interface RecoveryModel {
  readonly modelId: string;
  readonly spaceId: string;
  readonly workspaceId: string;
  readonly name: string;
  readonly objectCount: number;
  readonly modelChecksum: string;
  readonly tags?: readonly string[];
  readonly metadata: Readonly<Record<string, unknown>>;
}

export interface RecoveryGeometry {
  readonly geometryId: string;
  readonly spaceId: string;
  readonly workspaceId: string;
  readonly name: string;
  readonly entityType: 'GEOMETRY_OBJECT' | 'CURVE' | 'SURFACE' | 'SOLID' | 'MESH';
  readonly certainty: 'EXACT' | 'CONSTRAINED' | 'AMBIGUOUS' | 'UNKNOWN';
  readonly coordinates: readonly [number, number, number];
  readonly geometryChecksum: string;
  readonly lineageId: string;
}

// ============================================================================
// 3. BACKUP PACKAGE & MANIFEST
// ============================================================================

export interface BackupManifest {
  readonly manifestId: string;
  readonly schemaVersion: '6.16.0';
  readonly recoveryPointId: string;
  readonly sourceWorkspaceId: string;
  readonly sourceSpaceIds: readonly string[];
  readonly entityCounts: Readonly<Record<string, number>>;
  readonly modelChecksum: string;
  readonly geometryChecksum: string;
  readonly sourceChecksum: string;
  readonly packageChecksum: string;
  readonly lineageSummary: readonly string[];
  readonly certaintySummary: Readonly<Record<string, number>>;
  readonly validationStatus: 'VALID' | 'BLOCKED';
  readonly createdAt: number;
  readonly manifestChecksum: string;
}

export interface BackupPackage {
  readonly backupId: string;
  readonly schemaVersion: '6.16.0';
  readonly scope: RecoveryScope;
  readonly workspaceId: string;
  readonly ownerId: string;
  readonly manifest: BackupManifest;
  readonly spaces: readonly RecoverySpace[];
  readonly experiments: readonly RecoveryExperiment[];
  readonly savedStates: readonly RecoverySavedState[];
  readonly versions: readonly RecoveryVersion[];
  readonly models: readonly RecoveryModel[];
  readonly geometries: readonly RecoveryGeometry[];
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly packageChecksum: string;
  readonly createdAt: number;
}

export interface RecoveryPoint {
  readonly recoveryPointId: string;
  readonly schemaVersion: '6.16.0';
  readonly scope: RecoveryScope;
  readonly sourceWorkspaceId: string;
  readonly sourceSpaceIds: readonly string[];
  readonly sourceChecksum: string;
  readonly packageChecksum: string;
  readonly manifestChecksum: string;
  readonly modelChecksum: string;
  readonly geometryChecksum: string;
  readonly entityCounts: Readonly<Record<string, number>>;
  readonly lineageSummary: readonly string[];
  readonly certaintySummary: Readonly<Record<string, number>>;
  readonly package: BackupPackage;
  readonly validationStatus: RecoveryValidationStatus;
  readonly isFrozen: true;
  readonly createdAt: number;
  readonly pointChecksum: string;
}

// ============================================================================
// 4. VALIDATION & CORRUPTION DETECTION
// ============================================================================

export type CorruptionType =
  | 'CHECKSUM_MISMATCH'
  | 'MISSING_ENTITY'
  | 'DUPLICATE_ENTITY'
  | 'MALFORMED_ENTITY'
  | 'INVALID_COORDINATE'
  | 'NAN_COORDINATE'
  | 'INFINITY_COORDINATE'
  | 'INVALID_GEOMETRY'
  | 'INVALID_TOPOLOGY'
  | 'BROKEN_LINEAGE'
  | 'BROKEN_REFERENCE'
  | 'SCHEMA_MISMATCH'
  | 'UNAUTHORIZED_ACCESS';

export interface CorruptionReport {
  readonly isCorrupted: boolean;
  readonly corruptions: readonly {
    readonly type: CorruptionType;
    readonly entityId?: string;
    readonly message: string;
  }[];
  readonly reportChecksum: string;
}

export interface RecoveryValidationReport {
  readonly isValid: boolean;
  readonly status: RecoveryValidationStatus;
  readonly issues: readonly string[];
  readonly corruptionReport: CorruptionReport;
  readonly reportChecksum: string;
}

// ============================================================================
// 5. CONFLICT & PREVIEW DEFINITIONS
// ============================================================================

export type RecoveryConflictType =
  | 'SPACE_CONFLICT'
  | 'EXPERIMENT_CONFLICT'
  | 'SAVED_STATE_CONFLICT'
  | 'VERSION_CONFLICT'
  | 'MODEL_CONFLICT'
  | 'GEOMETRY_CONFLICT'
  | 'LINEAGE_CONFLICT'
  | 'CHECKSUM_CONFLICT'
  | 'OWNERSHIP_CONFLICT';

export type RecoveryConflictResolution =
  | 'REJECT'
  | 'SKIP'
  | 'RESTORE_AS_NEW_LINEAGE';

export interface RecoveryConflict {
  readonly conflictId: string;
  readonly conflictType: RecoveryConflictType;
  readonly entityId: string;
  readonly existingChecksum?: string;
  readonly incomingChecksum?: string;
  readonly description: string;
  readonly resolvedStrategy?: RecoveryConflictResolution;
  readonly resolvedEntityId?: string;
  readonly resolvedLineageId?: string;
}

export interface RecoveryPreview {
  readonly previewId: string;
  readonly recoveryPointId: string;
  readonly activeWorkspaceChecksum: string;
  readonly recoveryPointChecksum: string;
  readonly entitiesToRestore: Readonly<Record<string, number>>;
  readonly entitiesUnchanged: Readonly<Record<string, number>>;
  readonly conflicts: readonly RecoveryConflict[];
  readonly modelChecksumMatches: boolean;
  readonly geometryChecksumMatches: boolean;
  readonly validationReport: RecoveryValidationReport;
  readonly previewChecksum: string;
  readonly isReadOnly: true;
}

// ============================================================================
// 6. RESTORATION & ROLLBACK RESULTS
// ============================================================================

export interface RecoveryResult {
  readonly success: boolean;
  readonly recoveryId?: string;
  readonly status: RecoveryEntityStatus;
  readonly preRestoreChecksum: string;
  readonly restoredChecksum?: string;
  readonly committedSpaces: readonly RecoverySpace[];
  readonly committedExperiments: readonly RecoveryExperiment[];
  readonly committedStates: readonly RecoverySavedState[];
  readonly committedVersions: readonly RecoveryVersion[];
  readonly committedModels: readonly RecoveryModel[];
  readonly committedGeometries: readonly RecoveryGeometry[];
  readonly skippedEntityIds: readonly string[];
  readonly conflictsResolved: number;
  readonly error?: string;
}

export interface RecoveryRollback {
  readonly rollbackId: string;
  readonly targetChecksum: string;
  readonly achievedChecksum: string;
  readonly isExactRollback: boolean;
  readonly status: 'ROLLBACK_COMPLETE' | 'ROLLBACK_FAILED';
  readonly restoredFromRecoveryPointId?: string;
  readonly timestamp: number;
  readonly rollbackChecksum: string;
}

// ============================================================================
// 7. SNAPSHOT, CAUSALITY & HISTORY
// ============================================================================

export interface RecoverySnapshot {
  readonly snapshotId: string;
  readonly recoveryPointId: string;
  readonly activeChecksum: string;
  readonly recoveryChecksum: string;
  readonly validationStatus: RecoveryValidationStatus;
  readonly isFrozen: true;
  readonly createdAt: number;
  readonly snapshotChecksum: string;
}

export interface RecoveryCausalityEvent {
  readonly eventId: string;
  readonly eventType:
    | 'BACKUP_CREATED'
    | 'PREVIEW_GENERATED'
    | 'VALIDATION_EXECUTED'
    | 'RESTORE_COMMITTED'
    | 'RESTORE_FAILED'
    | 'ROLLBACK_COMMITTED';
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

export type RecoveryHistoryEventType =
  | 'BACKUP_CREATED'
  | 'BACKUP_VALIDATED'
  | 'RECOVERY_PREVIEWED'
  | 'RESTORE_STARTED'
  | 'RESTORE_COMPLETED'
  | 'RESTORE_FAILED'
  | 'ROLLBACK_STARTED'
  | 'ROLLBACK_COMPLETED';

export interface RecoveryHistoryEntry {
  readonly entryId: string;
  readonly eventType: RecoveryHistoryEventType;
  readonly recoveryPointId: string;
  readonly workspaceChecksum: string;
  readonly details: string;
  readonly timestamp: number;
  readonly entryChecksum: string;
}

export interface RecoveryExportMeta {
  readonly exportId: string;
  readonly recoveryPointId: string;
  readonly sourceChecksum: string;
  readonly packageChecksum: string;
  readonly manifestChecksum: string;
  readonly validationStatus: RecoveryValidationStatus;
  readonly entityCounts: Readonly<Record<string, number>>;
  readonly schemaVersion: '6.16.0';
  readonly files: readonly string[];
  readonly exportChecksum: string;
}
