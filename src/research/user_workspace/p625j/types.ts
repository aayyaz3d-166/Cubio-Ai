/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.25-J: Active 3D User Workspace Scene & P6.6 Geometry Binding — Types
 *
 * Scientific boundary: Computational geometric model only.
 * Authoritative integration between User Workspace Space and P6.6 Advanced Geometry.
 */

import {
  AdvancedGeometryObject,
  AdvancedGeometryScene,
  Point3D,
  Curve3D,
  Surface3D,
  Solid3D,
  AdvancedMesh3D,
  TopologyTopologyStructure,
} from '../p66/types';
import { CertaintyLevel } from '../../observation_reconstruction/p52/types';
import {
  LiveSpaceState,
  LiveSavedState,
  LiveExperimentState,
  LiveRecentView,
  WorkspaceUserContext,
  WorkspaceAccessRole,
  WorkspaceIntegrationValidationReport,
  WorkspaceActivationReport,
} from '../p625i/types';

export * from '../p625i/types';

export type WorkspaceGeometryType =
  | 'POINT'
  | 'CURVE'
  | 'SURFACE'
  | 'SOLID'
  | 'MESH'
  | 'BOOLEAN_RESULT';

export type WorkspaceGeometryValidationStatus =
  | 'WORKSPACE_GEOMETRY_VALID'
  | 'WORKSPACE_GEOMETRY_INVALID'
  | 'SPACE_SCENE_NOT_FOUND'
  | 'GEOMETRY_REFERENCE_INVALID'
  | 'CROSS_SPACE_REFERENCE'
  | 'NON_FINITE_GEOMETRY'
  | 'UNAUTHORIZED_GEOMETRY_ACCESS';

export interface WorkspaceBoundGeometryObject {
  readonly objectId: string;
  readonly name: string;
  readonly geometryType: WorkspaceGeometryType;
  readonly coordinates: readonly [number, number, number];
  readonly dimensions: readonly [number, number, number];
  readonly bounds: {
    readonly min: readonly [number, number, number];
    readonly max: readonly [number, number, number];
  };
  readonly p66Object: AdvancedGeometryObject;
  readonly certainty: CertaintyLevel;
  readonly lineageId: string;
  readonly geometryChecksum: string;
  readonly spaceId: string;
  readonly ownerId: string;
  readonly visible: boolean;
  readonly color: string;
}

export interface WorkspaceBoundGeometryScene {
  readonly sceneId: string;
  readonly spaceId: string;
  readonly ownerId: string;
  readonly objects: readonly WorkspaceBoundGeometryObject[];
  readonly selectedObjectId: string | null;
  readonly sceneChecksum: string;
  readonly p66Scene: AdvancedGeometryScene;
  readonly isFrozen: boolean;
  readonly createdAt: number;
  readonly updatedAt: number;
}

export interface ViewportCameraState {
  readonly cameraPosition: readonly [number, number, number];
  readonly cameraTarget: readonly [number, number, number];
  readonly zoom: number;
  readonly projection: 'PERSPECTIVE' | 'ORTHOGRAPHIC';
}

export interface WorkspaceGeometryValidationReport {
  readonly status: WorkspaceGeometryValidationStatus;
  readonly isValid: boolean;
  readonly issues: readonly string[];
  readonly objectCount: number;
  readonly nonManifoldCount: number;
  readonly reportChecksum: string;
}

export type CausalityDomain =
  | 'REALITY'
  | 'MODEL'
  | 'GEOMETRY'
  | 'WORKSPACE'
  | 'SELECTION'
  | 'CAMERA'
  | 'UI';

export interface WorkspaceCausalityEvent {
  readonly eventId: string;
  readonly domain: CausalityDomain;
  readonly operation: string;
  readonly targetSpaceId: string;
  readonly targetObjectId?: string;
  readonly realityChecksumBefore: string;
  readonly realityChecksumAfter: string;
  readonly modelChecksumBefore: string;
  readonly modelChecksumAfter: string;
  readonly geometryChecksumBefore: string;
  readonly geometryChecksumAfter: string;
  readonly isRealityInvariant: boolean;
  readonly isModelInvariant: boolean;
  readonly isGeometryInvariant: boolean;
  readonly sequence: number;
  readonly timestamp: number;
}

export interface SceneSnapshot3D {
  readonly snapshotId: string;
  readonly spaceId: string;
  readonly sceneId: string;
  readonly stateName: string;
  readonly sceneData: WorkspaceBoundGeometryScene;
  readonly cameraState: ViewportCameraState;
  readonly snapshotChecksum: string;
  readonly timestamp: number;
}

export interface StudioWorkspaceIntegrationAudit {
  readonly auditId: string;
  readonly entryRoute: string;
  readonly isProductionStudio: boolean;
  readonly isQueryParamIndependent: boolean;
  readonly activeSpace: LiveSpaceState | null;
  readonly mySpacesCount: number;
  readonly myExperimentsCount: number;
  readonly recentViewsCount: number;
  readonly savedStatesCount: number;
  readonly isRealityInvariant: boolean;
  readonly isUserBoundaryPreserved: boolean;
  readonly isCausalityPreserved: boolean;
  readonly stateChecksum: string;
}

export interface StudioWorkspaceBridgeState {
  readonly isDockOpen: boolean;
  readonly activeTab: 'SPACES' | 'EXPERIMENTS' | 'SAVED_STATES' | 'RECENT_VIEWS' | 'STATE';
  readonly isDirty: boolean;
  readonly activeSpace: LiveSpaceState | null;
}
