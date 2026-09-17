/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.20: User Workspace Audit, Integrity & Recovery — Type Definitions
 *
 * Formal contracts for:
 * 1. End-to-end Workspace Graph Audit (User -> Space -> Experiment -> Reality -> Model -> Geometry -> Timeline -> Collaboration)
 * 2. Integrity Verification & Issue Classification
 * 3. Immutable Recovery Checkpoints & Snapshot Verification
 * 4. Deterministic Recovery Engine & Causal Boundaries
 *
 * ISOLATION: Does NOT mutate Reality X or any previous funnel contract.
 */

// ============================================================================
// 1. INTEGRITY & RECOVERY STATUSES
// ============================================================================

export type IntegrityStatus =
  | 'INTEGRITY_VALID'
  | 'INTEGRITY_INVALID'
  | 'BROKEN_REFERENCE'
  | 'CHECKSUM_MISMATCH'
  | 'LINEAGE_MISMATCH'
  | 'PRIVATE_DATA_DETECTED'
  | 'CORRUPTED';

export type RecoveryStatus =
  | 'RECOVERY_READY'
  | 'RECOVERY_BLOCKED'
  | 'RESTORED'
  | 'UNSUPPORTED_RECOVERY_CASE';

export type AccessRole = 'OWNER' | 'EDITOR' | 'OBSERVER' | 'NO_ACCESS';

export type IssueSeverity = 'CRITICAL' | 'ERROR' | 'WARNING';

export interface IntegrityIssue {
  readonly issueId: string;
  readonly code:
    | 'DUPLICATE_ID'
    | 'MISSING_ID'
    | 'BROKEN_LINEAGE'
    | 'INVALID_PARENT_REF'
    | 'CHECKSUM_MISMATCH'
    | 'INVALID_COORDINATE'
    | 'NAN_COORDINATE'
    | 'INFINITY_COORDINATE'
    | 'INVALID_GEOMETRY'
    | 'INVALID_SAVED_STATE'
    | 'INVALID_TIMELINE_REF'
    | 'COLLABORATION_BOUNDARY_BREACH'
    | 'PRIVATE_DATA_LEAK'
    | 'AUTH_CREDENTIAL_LEAK'
    | 'PAYMENT_DATA_LEAK';
  readonly entityType: string;
  readonly entityId: string;
  readonly message: string;
  readonly severity: IssueSeverity;
}

// ============================================================================
// 2. AUDITABLE GRAPH ENTITIES
// ============================================================================

export interface AuditableRealityState {
  readonly realityStateId: string;
  readonly spaceId: string;
  readonly realityChecksum: string;
  readonly canonicalCoordinates: readonly [number, number, number];
  readonly certainty: 'EXACT' | 'CONSTRAINED' | 'AMBIGUOUS' | 'UNKNOWN';
  readonly isAuthoritative: true;
}

export interface AuditableModel {
  readonly modelId: string;
  readonly spaceId: string;
  readonly name: string;
  readonly objectCount: number;
  readonly modelChecksum: string;
  readonly tags?: readonly string[];
}

export interface AuditableGeometry {
  readonly geometryId: string;
  readonly spaceId: string;
  readonly name: string;
  readonly entityType: 'GEOMETRY_OBJECT' | 'CURVE' | 'SURFACE' | 'SOLID' | 'MESH';
  readonly certainty: 'EXACT' | 'CONSTRAINED' | 'AMBIGUOUS' | 'UNKNOWN';
  readonly coordinates: readonly [number, number, number];
  readonly geometryChecksum: string;
  readonly lineageId: string;
}

export interface AuditableSavedState {
  readonly stateId: string;
  readonly spaceId: string;
  readonly experimentId?: string;
  readonly title: string;
  readonly certainty: 'EXACT' | 'CONSTRAINED' | 'AMBIGUOUS' | 'UNKNOWN';
  readonly realityChecksum: string;
  readonly aggregateChecksum: string;
  readonly lineageId: string;
  readonly checksum: string;
  readonly createdAt: number;
}

export interface AuditableVersion {
  readonly versionId: string;
  readonly spaceId: string;
  readonly label: string;
  readonly parentVersionId: string | null;
  readonly versionType: string;
  readonly versionIndex: number;
  readonly stateChecksum: string;
  readonly lineageId: string;
  readonly checksum: string;
}

export interface AuditableTimeline {
  readonly timelineId: string;
  readonly spaceId: string;
  readonly eventType: string;
  readonly timestamp: number;
  readonly stateChecksum: string;
  readonly details: string;
}

export interface AuditableCollaboration {
  readonly collaborationId: string;
  readonly spaceId: string;
  readonly participantRoles: Readonly<Record<string, AccessRole>>;
  readonly permissionsChecksum: string;
}

export interface AuditableExperiment {
  readonly experimentId: string;
  readonly spaceId: string;
  readonly name: string;
  readonly type: string;
  readonly sourceVersionId: string;
  readonly sourceStateChecksum: string;
  readonly currentStateId: string;
  readonly lineageId: string;
  readonly checksum: string;
}

export interface AuditableSpace {
  readonly spaceId: string;
  readonly name: string;
  readonly workspaceId: string;
  readonly ownerId: string;
  readonly accessLevel: 'PUBLIC' | 'SHARED' | 'PRIVATE' | 'RESTRICTED';
  readonly lineageId: string;
  readonly realityChecksum: string;
  readonly checksum: string;
}

export interface AuditableWorkspace {
  readonly workspaceId: string;
  readonly ownerId: string;
  readonly spaces: readonly AuditableSpace[];
  readonly experiments: readonly AuditableExperiment[];
  readonly realityStates: readonly AuditableRealityState[];
  readonly models: readonly AuditableModel[];
  readonly geometries: readonly AuditableGeometry[];
  readonly savedStates: readonly AuditableSavedState[];
  readonly versions: readonly AuditableVersion[];
  readonly timelines: readonly AuditableTimeline[];
  readonly collaborations: readonly AuditableCollaboration[];
  readonly workspaceChecksum: string;
}

// ============================================================================
// 3. AUDIT REPORT & SNAPSHOT DEFINITIONS
// ============================================================================

export interface StateLineage {
  readonly lineageId: string;
  readonly rootEntityId: string;
  readonly currentEntityId: string;
  readonly parentLineageId: string | null;
  readonly stepCount: number;
  readonly lineageChecksum: string;
}

export interface IntegrityReport {
  readonly reportId: string;
  readonly workspaceId: string;
  readonly status: IntegrityStatus;
  readonly isValid: boolean;
  readonly issues: readonly IntegrityIssue[];
  readonly entityCounts: Readonly<Record<string, number>>;
  readonly checksumSummary: Readonly<Record<string, string>>;
  readonly auditChecksum: string;
  readonly auditedAt: number;
}

export interface WorkspaceAudit {
  readonly auditId: string;
  readonly workspaceId: string;
  readonly schemaVersion: '6.20.0';
  readonly graphValidation: {
    readonly isUserLinked: boolean;
    readonly areSpacesLinked: boolean;
    readonly areExperimentsLinked: boolean;
    readonly areStatesLinked: boolean;
    readonly areModelsLinked: boolean;
    readonly areGeometriesLinked: boolean;
    readonly areTimelinesLinked: boolean;
    readonly areCollaborationsLinked: boolean;
  };
  readonly integrityReport: IntegrityReport;
  readonly auditChecksum: string;
}

export interface IntegritySnapshot {
  readonly snapshotId: string;
  readonly workspaceId: string;
  readonly auditChecksum: string;
  readonly workspaceChecksum: string;
  readonly realityChecksum: string;
  readonly modelChecksum: string;
  readonly geometryChecksum: string;
  readonly lineageChecksum: string;
  readonly collaborationChecksum: string;
  readonly status: IntegrityStatus;
  readonly isFrozen: true;
  readonly createdAt: number;
  readonly snapshotChecksum: string;
}

// ============================================================================
// 4. RECOVERY CHECKPOINT & RESTORATION TYPES
// ============================================================================

export interface RecoveryCheckpoint {
  readonly checkpointId: string;
  readonly schemaVersion: '6.20.0';
  readonly spaceId: string;
  readonly workspaceId: string;
  readonly realityChecksum: string;
  readonly modelChecksum: string;
  readonly geometryChecksum: string;
  readonly observerState: Readonly<Record<string, unknown>>;
  readonly dimensionState: Readonly<Record<string, unknown>>;
  readonly viewState: Readonly<Record<string, unknown>>;
  readonly savedStateRef: string;
  readonly versionRef: string;
  readonly timelineRef?: string;
  readonly collaborationRef?: string;
  readonly canonicalCoordinates: readonly [number, number, number];
  readonly certainty: 'EXACT' | 'CONSTRAINED' | 'AMBIGUOUS' | 'UNKNOWN';
  readonly capturedState: RecoveryState;
  readonly isImmutable: true;
  readonly checkpointChecksum: string;
}

export interface RecoveryState {
  readonly space: AuditableSpace;
  readonly experiment?: AuditableExperiment;
  readonly realityState: AuditableRealityState;
  readonly models: readonly AuditableModel[];
  readonly geometries: readonly AuditableGeometry[];
  readonly savedState: AuditableSavedState;
  readonly version: AuditableVersion;
  readonly timeline?: AuditableTimeline;
  readonly collaboration?: AuditableCollaboration;
  readonly stateChecksum: string;
}

export interface RecoveryResult {
  readonly success: boolean;
  readonly recoveryId?: string;
  readonly status: RecoveryStatus;
  readonly sourceCheckpointId?: string;
  readonly restoredChecksum?: string;
  readonly restoredState?: RecoveryState;
  readonly validationIssues: readonly string[];
  readonly error?: string;
}

export interface AuditEvent {
  readonly eventId: string;
  readonly eventType:
    | 'AUDIT_STARTED'
    | 'AUDIT_COMPLETED'
    | 'CHECKPOINT_CAPTURED'
    | 'RECOVERY_REQUESTED'
    | 'RECOVERY_COMPLETED'
    | 'RECOVERY_BLOCKED';
  readonly targetId: string;
  readonly checksum: string;
  readonly timestamp: number;
  readonly details: string;
}

export interface RecoveryCausalityEvent {
  readonly eventId: string;
  readonly eventType: 'REALITY_MUTATION' | 'OBSERVER_MUTATION' | 'CAMERA_MUTATION' | 'PERMISSION_MUTATION' | 'RECOVERY_RESTORE';
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
