/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.8: My Spaces & Workspace Persistence — Type Definitions
 *
 * Formal contracts for Personal Spaces, Experiments, Saved States, Recent Views,
 * Lineage, Persistence Envelopes, Validation Reports, and Snapshots.
 *
 * Scientific boundary: Persistence preserves state; it never manufactures
 * missing information, alters canonical coordinates [5,3,6], or creates a
 * competing Reality authority.
 */

import { WorkspaceReality } from '../p61/types';
import { ModelScene3D } from '../p65/types';
import { AdvancedGeometryScene } from '../p66/types';
import { ParametricFeatureGraph } from '../p67/types';

export type DimensionType = '3D' | '4D' | 'N_DIMENSIONAL';
export type ReconstructionCertainty = 'EXACT' | 'CONSTRAINED' | 'AMBIGUOUS';
export type SpaceStatus = 'ACTIVE' | 'ARCHIVED' | 'LOCKED';

export interface ObserverConfigRecord {
  readonly observerId: string;
  readonly position: readonly [number, number, number];
  readonly target: readonly [number, number, number];
  readonly fov: number;
  readonly certainty: ReconstructionCertainty;
}

export interface DimensionStateRecord {
  readonly dimensionType: DimensionType;
  readonly activeDimensions: number;
  readonly projectionSignature: string;
}

export interface ViewStateRecord {
  readonly cameraPosition: readonly [number, number, number];
  readonly cameraTarget: readonly [number, number, number];
  readonly zoom: number;
  readonly viewportMode: 'PERSPECTIVE' | 'ORTHOGRAPHIC' | 'WIREFRAME' | 'SOLID';
  readonly selectedObjectId: string | null;
}

export interface SpaceMetadata {
  readonly ownerUserId: string;
  readonly author: string;
  readonly description: string;
  readonly tags: readonly string[];
  readonly lineageId: string | null;
  readonly sourceSpaceIdRef: string | null;
}

export interface PersonalSpace {
  readonly spaceId: string;
  readonly name: string;
  readonly status: SpaceStatus;
  readonly schemaVersion: '6.8.0';
  readonly reality: WorkspaceReality;
  readonly modelScene: ModelScene3D;
  readonly geometryScene: AdvancedGeometryScene;
  readonly featureGraph: ParametricFeatureGraph | null;
  readonly observers: readonly ObserverConfigRecord[];
  readonly dimension: DimensionStateRecord;
  readonly view: ViewStateRecord;
  readonly metadata: SpaceMetadata;
  readonly spaceChecksum: string;
  readonly createdAt: number;
  readonly updatedAt: number;
}

export interface SavedStateRecord {
  readonly stateId: string;
  readonly spaceId: string;
  readonly label: string;
  readonly reality: WorkspaceReality;
  readonly modelScene: ModelScene3D;
  readonly geometryScene: AdvancedGeometryScene;
  readonly featureGraph: ParametricFeatureGraph | null;
  readonly observers: readonly ObserverConfigRecord[];
  readonly dimension: DimensionStateRecord;
  readonly view: ViewStateRecord;
  readonly schemaVersion: '6.8.0';
  readonly stateChecksum: string;
  readonly createdAt: number;
}

export interface ExperimentRecord {
  readonly experimentId: string;
  readonly spaceId: string;
  readonly name: string;
  readonly sourceSpaceChecksum: string;
  readonly currentChecksum: string;
  readonly observers: readonly ObserverConfigRecord[];
  readonly dimension: DimensionStateRecord;
  readonly geometryStatus: 'READY' | 'PENDING' | 'BLOCKED';
  readonly certainty: ReconstructionCertainty;
  readonly lineageId: string;
  readonly createdAt: number;
  readonly updatedAt: number;
}

export interface RecentViewRecord {
  readonly viewId: string;
  readonly spaceId: string;
  readonly view: ViewStateRecord;
  readonly dimension: DimensionStateRecord;
  readonly observers: readonly ObserverConfigRecord[];
  readonly selectedObjectId: string | null;
  readonly timestamp: number;
}

export interface PersonalWorkspaceState {
  readonly userId: string;
  readonly activeSpaceId: string;
  readonly spaces: readonly PersonalSpace[];
  readonly experiments: readonly ExperimentRecord[];
  readonly savedStates: readonly SavedStateRecord[];
  readonly recentViews: readonly RecentViewRecord[];
  readonly workspaceChecksum: string;
}

export interface WorkspaceValidationReport {
  readonly isValid: boolean;
  readonly status:
    | 'WORKSPACE_VALID'
    | 'INVALID_SPACE_ID'
    | 'DUPLICATE_SPACE_ID'
    | 'INVALID_OWNERSHIP'
    | 'NON_FINITE_COORDINATES'
    | 'CORRUPT_SAVED_STATE'
    | 'CROSS_SPACE_CONTAMINATION'
    | 'CHECKSUM_MISMATCH'
    | 'INVALID_SCHEMA_VERSION';
  readonly issues: readonly string[];
  readonly reportChecksum: string;
}

export interface WorkspaceSnapshot3D {
  readonly snapshotId: string;
  readonly label: string;
  readonly state: PersonalWorkspaceState;
  readonly snapshotChecksum: string;
  readonly timestamp: number;
}
