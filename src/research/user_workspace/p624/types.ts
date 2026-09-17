/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.24: Workspace Import, Export & Portability — Types
 *
 * IMPORT/EXPORT IS A REPRESENTATION AND PORTABILITY LAYER.
 * It must NOT become a second Reality authority.
 */

export type PortabilityEntityType =
  | 'SPACE'
  | 'EXPERIMENT'
  | 'SAVED_STATE'
  | 'VERSION'
  | 'MODEL_OBJECT'
  | 'GEOMETRY_OBJECT'
  | 'SHARED_SPACE'
  | 'RECENT_VIEW';

export type ImportConflictType =
  | 'ID_COLLISION'
  | 'LINEAGE_CONFLICT'
  | 'CHECKSUM_MISMATCH'
  | 'SCHEMA_INCOMPATIBLE'
  | 'MISSING_DEPENDENCY'
  | 'UNAUTHORIZED_ENTITY'
  | 'CORRUPTED_PACKAGE'
  | 'INVALID_REFERENCE'
  | 'DUPLICATE_ENTITY';

export type PackageValidationStatus =
  | 'PACKAGE_VALID'
  | 'PACKAGE_CORRUPTED'
  | 'PACKAGE_UNAUTHORIZED'
  | 'PACKAGE_INCOMPATIBLE'
  | 'PACKAGE_INVALID';

export type PortabilityAccessRole = 'OWNER' | 'EDITOR' | 'OBSERVER' | 'NO_ACCESS';

export type PortabilityLifecycleState = 'ACTIVE' | 'TRASHED' | 'ARCHIVED';

export interface PortabilityPermissionContext {
  readonly userId: string;
  readonly userRole: PortabilityAccessRole;
  readonly workspaceId: string;
  readonly isRevoked?: boolean;
  readonly accessibleSpaceIds?: readonly string[];
}

export interface PackageDependency {
  readonly dependencyId: string;
  readonly targetEntityType: PortabilityEntityType;
  readonly isRequired: boolean;
  readonly targetLineageId?: string;
}

export interface PackageEntity {
  readonly entityId: string;
  readonly entityType: PortabilityEntityType;
  readonly name: string;
  readonly spaceId: string;
  readonly experimentId?: string;
  readonly ownerId: string;
  readonly lineageId: string;
  readonly checksum: string;
  readonly lifecycleState?: PortabilityLifecycleState;
  readonly coordinates?: readonly [number, number, number];
  readonly dimensions?: readonly [number, number, number];
  readonly certainty?: 'EXACT' | 'CONSTRAINED' | 'AMBIGUOUS' | 'UNKNOWN';
  readonly stateData?: Readonly<Record<string, unknown>>;
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly dependencies?: readonly PackageDependency[];
}

export interface WorkspacePackageManifest {
  readonly manifestId: string;
  readonly schemaVersion: '6.24.0';
  readonly packageId: string;
  readonly sourceSpaceId?: string;
  readonly sourceOwnerId: string;
  readonly exportScope: 'SPACE' | 'EXPERIMENT' | 'SAVED_STATE' | 'VERSION' | 'FULL_WORKSPACE';
  readonly entityCount: number;
  readonly entitySummaries: readonly {
    readonly entityId: string;
    readonly entityType: PortabilityEntityType;
    readonly checksum: string;
    readonly lineageId: string;
  }[];
  readonly dependencies: readonly PackageDependency[];
  readonly createdAt: number;
  readonly manifestChecksum: string;
}

export interface WorkspacePackage {
  readonly packageId: string;
  readonly schemaVersion: '6.24.0';
  readonly manifest: WorkspacePackageManifest;
  readonly entities: readonly PackageEntity[];
  readonly packageChecksum: string;
  readonly createdAt: number;
}

export interface PackageValidationReport {
  readonly isValid: boolean;
  readonly status: PackageValidationStatus;
  readonly issues: readonly string[];
  readonly reportChecksum: string;
}

export interface ImportConflict {
  readonly conflictId: string;
  readonly entityId: string;
  readonly entityType: PortabilityEntityType;
  readonly conflictType: ImportConflictType;
  readonly description: string;
  readonly suggestedResolution: 'REJECT' | 'SKIP' | 'IMPORT_AS_NEW_LINEAGE';
}

export interface ImportPreview {
  readonly previewId: string;
  readonly packageId: string;
  readonly isValid: boolean;
  readonly entitiesToImport: readonly PackageEntity[];
  readonly conflicts: readonly ImportConflict[];
  readonly spacesCount: number;
  readonly experimentsCount: number;
  readonly statesCount: number;
  readonly versionsCount: number;
  readonly modelsCount: number;
  readonly geometriesCount: number;
  readonly requiresExplicitResolution: boolean;
  readonly previewChecksum: string;
}

export interface ImportResult {
  readonly transactionId: string;
  readonly success: boolean;
  readonly status: 'IMPORT_COMMITTED' | 'IMPORT_BLOCKED' | 'IMPORT_ROLLED_BACK';
  readonly importedEntityCount: number;
  readonly importedEntityIds: readonly string[];
  readonly conflictsEncountered: readonly ImportConflict[];
  readonly committedAt: number;
  readonly resultChecksum: string;
  readonly error?: string;
}

export interface ExportOptions {
  readonly includeDependencies?: boolean;
  readonly includeTrash?: boolean;
  readonly includeArchive?: boolean;
  readonly targetScope?: 'SPACE' | 'EXPERIMENT' | 'SAVED_STATE' | 'VERSION' | 'FULL_WORKSPACE';
}

export interface ImportOptions {
  readonly conflictStrategy?: 'REJECT' | 'SKIP' | 'IMPORT_AS_NEW_LINEAGE';
  readonly targetSpaceId?: string;
}

export interface PortabilitySnapshot {
  readonly snapshotId: string;
  readonly manifest: WorkspacePackageManifest;
  readonly packageChecksum: string;
  readonly validationReport: PackageValidationReport;
  readonly importPreview: ImportPreview;
  readonly importResult?: ImportResult;
  readonly isFrozen: true;
  readonly createdAt: number;
  readonly snapshotChecksum: string;
}

export interface PortabilityCausalityEvent {
  readonly eventId: string;
  readonly eventType:
    | 'EXPORT_GENERATED'
    | 'IMPORT_PREVIEWED'
    | 'IMPORT_COMMITTED'
    | 'IMPORT_ROLLED_BACK'
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
