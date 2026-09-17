/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.15: User Workspace Import, Export & Data Portability — Type Definitions
 *
 * Full type contracts for:
 * 1. Data Portability, Import/Export, Manifests, Validation & Conflict Resolution
 * 2. Experiment Results, Metrics, Evidence, Comparisons, Reproducibility & Snapshots
 */

// ============================================================================
// 1. DATA PORTABILITY & WORKSPACE PACKAGE TYPES
// ============================================================================

export type PortabilityEntityState =
  | 'VALID'
  | 'INVALID'
  | 'BLOCKED'
  | 'CONFLICT'
  | 'AUTHORIZED'
  | 'UNAUTHORIZED';

export type AccessLevel = 'PUBLIC' | 'SHARED' | 'PRIVATE' | 'RESTRICTED';

export type UserRole = 'OWNER' | 'EDITOR' | 'OBSERVER' | 'NO_ACCESS';

export interface PortabilityAccessContext {
  readonly userId: string;
  readonly userRole: UserRole;
  readonly workspaceId: string;
  readonly accessibleSpaceIds?: readonly string[];
  readonly accessibleExperimentIds?: readonly string[];
}

export interface PortableSpace {
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

export interface PortableExperiment {
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

export interface PortableSavedState {
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

export interface PortableVersion {
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

export interface PortableTimeline {
  readonly timelineId: string;
  readonly spaceId: string;
  readonly workspaceId: string;
  readonly eventType: string;
  readonly timestamp: number;
  readonly stateChecksum: string;
  readonly details: string;
}

export interface PortableModel {
  readonly modelId: string;
  readonly spaceId: string;
  readonly workspaceId: string;
  readonly name: string;
  readonly objectCount: number;
  readonly modelChecksum: string;
  readonly tags?: readonly string[];
  readonly metadata: Readonly<Record<string, unknown>>;
}

export interface PortableGeometry {
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

export interface ExportManifest {
  readonly manifestId: string;
  readonly schemaVersion: '6.15.0';
  readonly packageId: string;
  readonly sourceWorkspaceId: string;
  readonly sourceUserId: string;
  readonly sourceSpaceIds: readonly string[];
  readonly spaceCount: number;
  readonly experimentCount: number;
  readonly stateCount: number;
  readonly versionCount: number;
  readonly timelineCount: number;
  readonly modelCount: number;
  readonly geometryCount: number;
  readonly checksums: Readonly<Record<string, string>>;
  readonly lineageSummary: readonly string[];
  readonly certaintySummary: Readonly<Record<string, number>>;
  readonly validationStatus: 'VALID' | 'BLOCKED';
  readonly createdAt: number;
  readonly manifestChecksum: string;
}

export interface ImportManifest {
  readonly manifestId: string;
  readonly packageId: string;
  readonly schemaVersion: string;
  readonly totalEntities: number;
  readonly conflictsDetected: number;
  readonly status: PortabilityEntityState;
  readonly manifestChecksum: string;
}

export interface WorkspaceExportPackage {
  readonly packageId: string;
  readonly schemaVersion: '6.15.0';
  readonly workspaceId: string;
  readonly ownerId: string;
  readonly manifest: ExportManifest;
  readonly spaces: readonly PortableSpace[];
  readonly experiments: readonly PortableExperiment[];
  readonly savedStates: readonly PortableSavedState[];
  readonly versions: readonly PortableVersion[];
  readonly timelines: readonly PortableTimeline[];
  readonly models: readonly PortableModel[];
  readonly geometries: readonly PortableGeometry[];
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly packageChecksum: string;
  readonly exportedAt: number;
}

export type PortabilityValidationStatus =
  | 'EXPORT_VALID'
  | 'EXPORT_BLOCKED'
  | 'IMPORT_VALID'
  | 'IMPORT_BLOCKED'
  | 'CONFLICT'
  | 'INVALID_SCHEMA'
  | 'UNAUTHORIZED_DATA'
  | 'CHECKSUM_MISMATCH'
  | 'NON_FINITE_COORDINATE'
  | 'MALFORMED_GEOMETRY';

export interface ImportValidationReport {
  readonly isValid: boolean;
  readonly status: PortabilityValidationStatus;
  readonly issues: readonly string[];
  readonly reportChecksum: string;
}

export interface ExportValidationReport {
  readonly isValid: boolean;
  readonly status: PortabilityValidationStatus;
  readonly issues: readonly string[];
  readonly reportChecksum: string;
}

export type ConflictType =
  | 'DUPLICATE_SPACE_ID'
  | 'DUPLICATE_EXPERIMENT_ID'
  | 'DUPLICATE_STATE_ID'
  | 'DUPLICATE_VERSION_ID'
  | 'DUPLICATE_MODEL_ID'
  | 'DUPLICATE_GEOMETRY_ID'
  | 'LINEAGE_CONFLICT'
  | 'CHECKSUM_CONFLICT'
  | 'OWNERSHIP_CONFLICT'
  | 'SCHEMA_CONFLICT';

export type ConflictResolutionStrategy = 'REJECT' | 'SKIP' | 'CREATE_NEW_LINEAGE';

export interface ImportConflict {
  readonly conflictId: string;
  readonly conflictType: ConflictType;
  readonly entityId: string;
  readonly existingChecksum?: string;
  readonly incomingChecksum?: string;
  readonly description: string;
  readonly resolvedStrategy?: ConflictResolutionStrategy;
  readonly resolvedEntityId?: string;
  readonly resolvedLineageId?: string;
}

export interface ImportResolution {
  readonly resolutionId: string;
  readonly conflictId: string;
  readonly entityId: string;
  readonly strategy: ConflictResolutionStrategy;
  readonly originalLineageId: string;
  readonly newLineageId?: string;
  readonly newEntityId?: string;
  readonly resolutionChecksum: string;
}

export interface ImportPreview {
  readonly previewId: string;
  readonly packageId: string;
  readonly sourceWorkspaceId: string;
  readonly targetWorkspaceId: string;
  readonly spacesToImport: readonly PortableSpace[];
  readonly experimentsToImport: readonly PortableExperiment[];
  readonly statesToImport: readonly PortableSavedState[];
  readonly versionsToImport: readonly PortableVersion[];
  readonly modelsToImport: readonly PortableModel[];
  readonly geometriesToImport: readonly PortableGeometry[];
  readonly entitiesToSkip: readonly string[];
  readonly conflicts: readonly ImportConflict[];
  readonly validationReport: ImportValidationReport;
  readonly previewChecksum: string;
  readonly isReadOnly: true;
}

export interface DataPortabilitySnapshot {
  readonly snapshotId: string;
  readonly packageId: string;
  readonly packageChecksum: string;
  readonly manifestChecksum: string;
  readonly validationStatus: PortabilityValidationStatus;
  readonly previewChecksum: string;
  readonly finalImportChecksum?: string;
  readonly snapshotChecksum: string;
  readonly createdAt: number;
}

export interface PortabilityCausalityEvent {
  readonly eventId: string;
  readonly eventType: 'EXPORT' | 'PREVIEW' | 'VALIDATE' | 'RESOLVE_CONFLICT' | 'REJECT_IMPORT' | 'COMMIT_IMPORT';
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

export interface PortabilityExportPackageMeta {
  readonly exportId: string;
  readonly packageChecksum: string;
  readonly manifestChecksum: string;
  readonly entityCounts: Readonly<Record<string, number>>;
  readonly schemaVersion: '6.15.0';
  readonly status: 'RESEARCH_EXPORT_READY' | 'RESEARCH_EXPORT_BLOCKED';
  readonly files: readonly string[];
  readonly exportChecksum: string;
}

// ============================================================================
// 2. RESULTS & EVIDENCE ANALYSIS TYPES (Full Compatibility)
// ============================================================================

export type ResultType =
  | 'GEOMETRIC_RESULT'
  | 'SPATIAL_RESULT'
  | 'OBSERVATION_RESULT'
  | 'DIMENSION_RESULT'
  | 'TOPOLOGY_RESULT'
  | 'TRANSFORMATION_RESULT'
  | 'RECONSTRUCTION_RESULT'
  | 'COMPARISON_RESULT'
  | 'DETERMINISM_RESULT'
  | 'CUSTOM_RESULT';

export type ResultStatus = 'RAW' | 'COMPUTED' | 'VALIDATED' | 'REJECTED' | 'ARCHIVED';

export type MetricType =
  | 'OBJECT_COUNT'
  | 'VERTEX_COUNT'
  | 'EDGE_COUNT'
  | 'FACE_COUNT'
  | 'SHELL_COUNT'
  | 'BOUNDING_BOX'
  | 'DISTANCE'
  | 'LENGTH'
  | 'AREA'
  | 'VOLUME'
  | 'TRANSFORMATION_DELTA'
  | 'CHECKSUM_DELTA'
  | 'STATE_DELTA'
  | 'TOPOLOGY_STAT';

export type EvidenceType =
  | 'SOURCE_STATE'
  | 'EXPERIMENT_STATE'
  | 'OBSERVATION'
  | 'GEOMETRY'
  | 'TOPOLOGY'
  | 'CHECKSUM'
  | 'SNAPSHOT'
  | 'COMPARISON'
  | 'REPRODUCTION'
  | 'VALIDATION';

export type ResultValidationStatus =
  | 'RESULT_VALID'
  | 'RESULT_INVALID'
  | 'NON_FINITE_METRIC'
  | 'BROKEN_EVIDENCE_REF'
  | 'INVALID_SOURCE'
  | 'INVALID_CHECKSUM'
  | 'CHECKSUM_MISMATCH'
  | 'INVALID_LINEAGE'
  | 'FABRICATED_VALUE_DETECTED';

export type ResultComparisonClassification =
  | 'IDENTICAL'
  | 'REALITY_DIFFERENCE'
  | 'OBSERVATION_DIFFERENCE'
  | 'MODEL_DIFFERENCE'
  | 'GEOMETRY_DIFFERENCE'
  | 'TOPOLOGY_DIFFERENCE'
  | 'DIMENSION_DIFFERENCE'
  | 'METRIC_DIFFERENCE'
  | 'CERTAINTY_DIFFERENCE'
  | 'MULTI_LAYER_DIFFERENCE';

export type ResultHistoryEvent =
  | 'RESULT_CREATED'
  | 'RESULT_COMPUTED'
  | 'RESULT_VALIDATED'
  | 'RESULT_COMPARED'
  | 'RESULT_REPRODUCED'
  | 'RESULT_REJECTED'
  | 'RESULT_ARCHIVED';

export type ResultExportStatus = 'RESEARCH_EXPORT_READY' | 'RESEARCH_EXPORT_BLOCKED';

export interface DerivedMetric {
  readonly metricId: string;
  readonly metricName?: string;
  readonly metricType: MetricType;
  readonly sourceStateId: string;
  readonly calculationMethod: string;
  readonly inputValues: Readonly<Record<string, unknown>> | readonly unknown[];
  readonly outputValue: number | string | readonly number[] | Readonly<Record<string, unknown>> | null;
  readonly certainty: 'EXACT' | 'CONSTRAINED' | 'AMBIGUOUS' | 'UNKNOWN';
  readonly calculationChecksum: string;
}

export interface ResultObservation {
  readonly observationId: string;
  readonly observerId: string;
  readonly observationChecksum: string;
  readonly timestamp: number;
}

export interface ResultValidation {
  readonly isValid: boolean;
  readonly status: ResultValidationStatus;
  readonly issues: readonly string[];
  readonly validatedAt: number;
  readonly validationChecksum: string;
  readonly reportChecksum?: string;
}

export interface ExperimentResult {
  readonly resultId: string;
  readonly experimentId: string;
  readonly stateId: string;
  readonly sourceChecksum: string;
  readonly resultChecksum: string;
  readonly lineageId: string;
  readonly timestamp: number;
  readonly resultType: ResultType;
  readonly status: ResultStatus;
  readonly certainty: 'EXACT' | 'CONSTRAINED' | 'AMBIGUOUS' | 'UNKNOWN';
  readonly realityChecksum: string;
  readonly observationChecksum?: string;
  readonly modelChecksum?: string;
  readonly geometryChecksum?: string;
  readonly dimensionChecksum?: string;
  readonly objectCount: number;
  readonly metrics: readonly DerivedMetric[];
  readonly evidenceReferences: readonly string[];
  readonly validation: ResultValidation;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly reproducibilitySignature?: string;
  readonly operationHistory?: readonly string[];
  readonly schemaVersion?: '6.15.0';
}

export interface ResultEvidence {
  readonly evidenceId: string;
  readonly resultId: string;
  readonly sourceId: string;
  readonly sourceChecksum: string;
  readonly evidenceType: EvidenceType;
  readonly lineageId: string;
  readonly timestamp: number;
  readonly relationship?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly checksum: string;
  readonly details?: string;
}

export interface ResultComparisonReport {
  readonly comparisonId: string;
  readonly resultIdA: string;
  readonly resultIdB: string;
  readonly realityEqual: boolean;
  readonly observationEqual: boolean;
  readonly modelEqual: boolean;
  readonly geometryEqual: boolean;
  readonly topologyEqual: boolean;
  readonly dimensionEqual: boolean;
  readonly metricEqual: boolean;
  readonly certaintyEqual: boolean;
  readonly reproducibilityEqual: boolean;
  readonly classification: ResultComparisonClassification;
  readonly differences?: readonly string[];
  readonly reportChecksum: string;
}

export interface ResultReproducibilityReport {
  readonly resultId: string;
  readonly cycleCount: number;
  readonly uniqueSignatureCount: number;
  readonly variance: number;
  readonly isDeterministic: boolean;
  readonly executionSignature?: string;
  readonly finalExecutionSignature?: string;
}

export interface ResultExportPackage {
  readonly exportId: string;
  readonly resultId: string;
  readonly resultChecksum?: string;
  readonly schemaVersion: '6.15.0';
  readonly status: ResultExportStatus;
  readonly files: readonly string[];
  readonly exportChecksum: string;
}

export interface ResultSnapshot {
  readonly snapshotId: string;
  readonly result: ExperimentResult;
  readonly evidence: readonly ResultEvidence[];
  readonly validation: ResultValidation;
  readonly checksums: Readonly<Record<string, string>>;
  readonly snapshotChecksum: string;
  readonly createdAt: number;
}

export interface ResultHistoryRecord {
  readonly recordId: string;
  readonly resultId: string;
  readonly event: ResultHistoryEvent;
  readonly timestamp: number;
  readonly checksum: string;
  readonly details: string;
}

export interface ResultCausalityEvent {
  readonly eventId: string;
  readonly eventType: string;
  readonly realityChecksumBefore: string;
  readonly realityChecksumAfter: string;
  readonly isRealityInvariant: boolean;
  readonly timestamp: number;
}
