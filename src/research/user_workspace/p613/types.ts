/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.13: User Workspace Versioning & State Timeline — Type Definitions
 *
 * Formal contracts for Workspace Versions, Timeline, Lineage, Snapshots, Diffs,
 * Restorations, Branches, and Version Causality.
 */

import { PersonalSpace } from '../p68/types';

export type VersionType =
  | 'INITIAL'
  | 'SAVE'
  | 'AUTO_SAVE'
  | 'MANUAL_CHECKPOINT'
  | 'RESTORE_POINT'
  | 'BRANCH';

export type DiffClassification =
  | 'UNCHANGED'
  | 'MODIFIED'
  | 'ADDED'
  | 'REMOVED'
  | 'BRANCHED';

export interface CanonicalWorkspaceState {
  readonly workspaceId: string;
  readonly spaceId: string;
  readonly realityChecksum: string;
  readonly objects: readonly {
    readonly id: string;
    readonly label: string;
    readonly position: readonly [number, number, number];
    readonly category: string;
    readonly certainty?: string;
  }[];
  readonly observers: readonly {
    readonly observerId: string;
    readonly position: readonly [number, number, number];
    readonly target: readonly [number, number, number];
    readonly fov: number;
    readonly certainty?: string;
  }[];
  readonly activeObserverId: string | null;
  readonly dimension: {
    readonly dimensionType: string;
    readonly activeDimensions: number;
  };
  readonly modelChecksum: string;
  readonly geometryChecksum: string;
  readonly view: {
    readonly cameraPosition: readonly [number, number, number];
    readonly targetPosition: readonly [number, number, number];
    readonly zoom: number;
    readonly viewportMode: string;
  };
  readonly collaborationShareRef: string | null;
  readonly stateChecksum: string;
}

export interface WorkspaceVersion {
  readonly versionId: string;
  readonly workspaceId: string;
  readonly spaceId: string;
  readonly parentVersionId: string | null;
  readonly versionType: VersionType;
  readonly versionIndex: number;
  readonly stateChecksum: string;
  readonly lineageId: string;
  readonly statePayload: CanonicalWorkspaceState;
  readonly changeSummary: string;
  readonly createdAt: number;
  readonly schemaVersion: '6.13.0';
  readonly isBranchHead?: boolean;
  readonly branchName?: string;
}

export interface VersionLineage {
  readonly lineageId: string;
  readonly workspaceId: string;
  readonly rootVersionId: string;
  readonly currentVersionId: string;
  readonly versionCount: number;
  readonly ancestry: readonly string[];
}

export interface VersionDiff {
  readonly diffId: string;
  readonly versionIdA: string;
  readonly versionIdB: string;
  readonly changedReality: boolean;
  readonly changedObservers: boolean;
  readonly changedObjects: boolean;
  readonly changedModel: boolean;
  readonly changedGeometry: boolean;
  readonly changedDimension: boolean;
  readonly changedView: boolean;
  readonly changedCollaboration: boolean;
  readonly addedObjectIds: readonly string[];
  readonly removedObjectIds: readonly string[];
  readonly modifiedObjectIds: readonly string[];
  readonly overallClassification: DiffClassification;
  readonly diffChecksum: string;
}

export interface VersionTimeline {
  readonly workspaceId: string;
  readonly versions: readonly WorkspaceVersion[];
  readonly headVersionId: string;
  readonly timelineChecksum: string;
}

export interface RestoreResult {
  readonly success: boolean;
  readonly restoredVersionId: string;
  readonly newVersion: WorkspaceVersion;
  readonly restoredState: CanonicalWorkspaceState;
  readonly restoreEventId: string;
}

export interface BranchResult {
  readonly success: boolean;
  readonly branchName: string;
  readonly branchVersion: WorkspaceVersion;
  readonly parentVersionId: string;
}

export interface VersionValidationReport {
  readonly isValid: boolean;
  readonly status:
    | 'VERSION_VALID'
    | 'INVALID_PARENT'
    | 'CIRCULAR_LINEAGE'
    | 'DUPLICATE_VERSION_ID'
    | 'NON_FINITE_COORDINATES'
    | 'CHECKSUM_MISMATCH'
    | 'CROSS_WORKSPACE_LEAKAGE'
    | 'INVALID_SCHEMA_VERSION'
    | 'CORRUPTED_VERSION_STATE';
  readonly issues: readonly string[];
  readonly reportChecksum: string;
}

export interface VersionCausalityEvent {
  readonly eventId: string;
  readonly workspaceId: string;
  readonly versionId: string;
  readonly eventType: 'VERSION_CREATED' | 'VERSION_RESTORED' | 'VERSION_BRANCHED' | 'VERSION_DELETED';
  readonly description: string;
  readonly timestamp: number;
}
