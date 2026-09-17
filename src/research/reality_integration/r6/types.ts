/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R6: Observable Reality -> User Workspace Integration — Types
 *
 * Core Principle:
 * REALITY -> REALITY STATE -> OBSERVATIONS -> OBJECTS/RELATIONSHIPS -> SPATIAL/TOPOLOGY -> WORKSPACE -> UI/CAMERA/SELECTION
 *
 * The Workspace is a faithful downstream representation of the authoritative Reality state.
 * The Workspace is NOT Reality authority.
 * Workspace mutations, camera orbit, zoom, panel state, and selection NEVER mutate Reality (Delta Reality = 0).
 */

import {
  RealityObjectType,
  RealityObjectCertainty,
  RealityObjectOrigin,
  RealityRelationshipType,
  RealityRelationshipEvidence,
  RealityObjectLineage,
} from '../r4/types';

import {
  SpatialRelationType,
  SpatialRelationEvidence,
  SpatialRelationCertainty,
  SpatialDirectionType,
} from '../r5/types';

export type WorkspaceSyncStatus = 'SYNCED' | 'STALE' | 'INVALID' | 'UNKNOWN';

export type WorkspaceSelectionType =
  | 'NONE'
  | 'OBJECT'
  | 'RELATIONSHIP'
  | 'SPATIAL_RELATION'
  | 'TOPOLOGY_NODE'
  | 'TOPOLOGY_EDGE';

export interface WorkspaceCameraState {
  readonly position: readonly [number, number, number];
  readonly target: readonly [number, number, number];
  readonly zoom: number;
  readonly orbitAngle: number;
  readonly isOrtho?: boolean;
}

export interface WorkspaceSelectionState {
  readonly selectionType: WorkspaceSelectionType;
  readonly selectedId: string | null;
  readonly realityReferenceId?: string;
  readonly realityStateId?: string;
  readonly provenance?: string;
  readonly certainty?: RealityObjectCertainty | SpatialRelationCertainty;
  readonly spatialDetails?: Readonly<Record<string, unknown>>;
}

export interface WorkspaceObjectBinding {
  readonly workspaceObjectId: string;
  readonly realityObjectId: string;
  readonly realityStateId: string;
  readonly name: string;
  readonly geometryType: RealityObjectType;
  readonly coordinates?: readonly [number, number, number];
  readonly dimensions?: readonly [number, number, number];
  readonly certainty: RealityObjectCertainty;
  readonly origin: RealityObjectOrigin;
  readonly observationReferences: readonly string[];
  readonly lineage: RealityObjectLineage;
  readonly sourceObjectChecksum: string;
  readonly bindingChecksum: string;
}

export interface WorkspaceRelationshipBinding {
  readonly workspaceRelationshipId: string;
  readonly realityRelationshipId: string;
  readonly sourceWorkspaceObjectId: string;
  readonly targetWorkspaceObjectId: string;
  readonly sourceRealityObjectId: string;
  readonly targetRealityObjectId: string;
  readonly relationshipType: RealityRelationshipType;
  readonly evidence: RealityRelationshipEvidence;
  readonly certainty: RealityObjectCertainty;
  readonly origin: RealityObjectOrigin;
  readonly sourceRelationshipChecksum: string;
  readonly bindingChecksum: string;
}

export interface WorkspaceSpatialBinding {
  readonly workspaceSpatialId: string;
  readonly realitySpatialId: string;
  readonly sourceWorkspaceObjectId: string;
  readonly targetWorkspaceObjectId: string;
  readonly sourceRealityObjectId: string;
  readonly targetRealityObjectId: string;
  readonly relationType: SpatialRelationType;
  readonly evidence: SpatialRelationEvidence;
  readonly certainty: SpatialRelationCertainty;
  readonly distance: number;
  readonly direction: SpatialDirectionType;
  readonly containment: string;
  readonly sourceSpatialChecksum: string;
  readonly bindingChecksum: string;
}

export interface WorkspaceTopologyBinding {
  readonly workspaceTopologyId: string;
  readonly realityTopologyId: string;
  readonly nodeCount: number;
  readonly edgeCount: number;
  readonly isAcyclic: boolean;
  readonly sourceTopologyChecksum: string;
  readonly bindingChecksum: string;
}

export interface WorkspaceRealityBinding {
  readonly realityId: string;
  readonly realityStateId: string;
  readonly realityStateChecksum: string;
  readonly syncStatus: WorkspaceSyncStatus;
  readonly lastSyncedRealityChecksum: string;
}

export interface WorkspaceState {
  readonly workspaceId: string;
  readonly realityBinding: WorkspaceRealityBinding;
  readonly objects: readonly WorkspaceObjectBinding[];
  readonly relationships: readonly WorkspaceRelationshipBinding[];
  readonly spatialRelations: readonly WorkspaceSpatialBinding[];
  readonly topology: WorkspaceTopologyBinding | null;
  readonly selection: WorkspaceSelectionState;
  readonly camera: WorkspaceCameraState;
  readonly uiPanels: Readonly<Record<string, unknown>>;
  readonly workspaceChecksum: string;
  readonly version: number;
}

export interface WorkspaceSnapshot {
  readonly snapshotId: string;
  readonly workspaceState: WorkspaceState;
  readonly realityStateChecksum: string;
  readonly workspaceChecksum: string;
  readonly snapshotChecksum: string;
  readonly schemaVersion: string;
  readonly timestamp: number;
}

export type WorkspaceDiffFieldStatus = 'CHANGED' | 'UNCHANGED' | 'UNKNOWN';

export interface WorkspaceDiffField<T> {
  readonly status: WorkspaceDiffFieldStatus;
  readonly before?: T;
  readonly after?: T;
}

export type WorkspaceDiffType =
  | 'REALITY_DERIVED_CHANGE'
  | 'WORKSPACE_ONLY_CHANGE'
  | 'NO_CHANGE';

export interface WorkspaceDiff {
  readonly workspaceAId: string;
  readonly workspaceBId: string;
  readonly diffType: WorkspaceDiffType;
  readonly realityStateChange: WorkspaceDiffField<string>;
  readonly objectChanges: {
    readonly added: readonly string[];
    readonly removed: readonly string[];
    readonly modified: readonly string[];
  };
  readonly relationshipChanges: {
    readonly added: readonly string[];
    readonly removed: readonly string[];
  };
  readonly spatialChanges: {
    readonly added: readonly string[];
    readonly removed: readonly string[];
  };
  readonly selectionChange: WorkspaceDiffField<WorkspaceSelectionState>;
  readonly cameraChange: WorkspaceDiffField<WorkspaceCameraState>;
  readonly isIdentical: boolean;
}

export type WorkspaceValidationStatus =
  | 'WORKSPACE_VALID'
  | 'MISSING_REALITY_REFERENCE'
  | 'MISSING_STATE_REFERENCE'
  | 'MISSING_OBJECT_REFERENCE'
  | 'MISSING_RELATIONSHIP_REFERENCE'
  | 'BROKEN_SPATIAL_REFERENCE'
  | 'ORPHAN_TOPOLOGY_REFERENCE'
  | 'INVALID_CHECKSUM'
  | 'CHECKSUM_MISMATCH'
  | 'NON_FINITE_COORDINATES'
  | 'INVALID_DIMENSIONS'
  | 'DUPLICATE_WORKSPACE_ID'
  | 'UNAUTHORIZED_REALITY_MUTATION';

export interface WorkspaceValidationReport {
  readonly status: WorkspaceValidationStatus;
  readonly isValid: boolean;
  readonly issues: readonly string[];
  readonly workspaceId: string;
  readonly reportChecksum: string;
}

export interface WorkspaceExecutionSignature {
  readonly realityChecksum: string;
  readonly workspaceChecksum: string;
  readonly objectCount: number;
  readonly relationCount: number;
  readonly spatialCount: number;
  readonly syncStatus: WorkspaceSyncStatus;
  readonly executionHash: string;
}
