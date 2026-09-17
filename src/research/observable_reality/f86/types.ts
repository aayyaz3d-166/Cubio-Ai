/**
 * 3D Memory Studio — Funnel 86
 * Observer Field of View, Occlusion & Line-of-Sight — Types
 *
 * Formal Pipeline:
 * Reality X → Spatial Config S → Observer O → View V → Projection P → Visibility Test → Occlusion Test → Display D → Experience E
 */

export type F86SceneType =
  | 'DIRECT'
  | 'OCCLUSION'
  | 'PARTIAL_OCCLUSION'
  | 'OUTSIDE_FOV'
  | 'BEHIND_OBSERVER'
  | 'DIMENSIONAL_Z4';

export type F86ProjectionType =
  | 'PERSPECTIVE_3D'
  | 'ORTHOGRAPHIC_3D'
  | 'ISOMETRIC_3D'
  | 'DIMENSIONAL_SLICE_Z4_Z3'
  | 'DIMENSIONAL_COLLAPSE_Z4_Z3';

export type F86VisibilityReason =
  | 'VISIBLE'
  | 'OUTSIDE_FOV'
  | 'BEHIND_OBSERVER'
  | 'BEFORE_NEAR_PLANE'
  | 'BEYOND_FAR_PLANE'
  | 'OCCLUDED'
  | 'PARTIALLY_OCCLUDED'
  | 'SCREEN_COLLISION';

export interface F86SpatialObject {
  readonly id: string;
  readonly type: string;
  readonly canonicalCoordinate: readonly [number, number, number]; // [5, 3, 6] (Immutable Reality X)
  readonly experimentalWorldPosition: readonly number[]; // [x, y, z, w?]
  readonly color: string;
  readonly label: string;
  readonly category: string;
  readonly baseRadius?: number;
}

export interface F86SpatialScene {
  readonly sceneId: string;
  readonly sceneType: F86SceneType;
  readonly isSynthetic: boolean; // strictly true
  readonly objects: readonly F86SpatialObject[];
  readonly description: string;
}

export interface F86ObserverState {
  readonly observerId: string;
  readonly name: string;
  readonly position: readonly [number, number, number]; // [x, y, z]
  readonly orientation: readonly [number, number]; // [yawDeg, pitchDeg]
  readonly zoom: number;
  readonly horizontalFov: number; // e.g. 60 deg
  readonly verticalFov: number; // e.g. 45 deg
  readonly nearPlane: number; // e.g. 1.0
  readonly farPlane: number; // e.g. 200.0
  readonly focalLength: number;
}

export interface F86LineOfSightRecord {
  readonly observerId: string;
  readonly targetId: string;
  readonly direction: readonly [number, number, number];
  readonly distance: number;
  readonly depth: number;
  readonly lineOfSight: 'CLEAR' | 'BLOCKED';
  readonly blockedBy: string | null;
}

export interface F86ObjectVisibilityRecord {
  readonly id: string;
  readonly canonicalCoordinate: readonly [number, number, number];
  readonly worldPosition: readonly number[];
  readonly cameraSpacePosition: readonly [number, number, number]; // [vx, vy, vz]
  readonly projectedPosition: readonly [number, number, number];
  readonly screenPosition: readonly [number, number]; // [sx, sy]
  readonly depthZ: number;
  readonly apparentScale: number;
  readonly screenRadius: number;
  readonly inFrustum: boolean;
  readonly behindObserver: boolean;
  readonly lineOfSight: 'CLEAR' | 'BLOCKED';
  readonly occluded: boolean;
  readonly occludedBy: string | null;
  readonly depthRank: number;
  readonly visibleFraction: number; // 1.0 = fully visible, 0.0 = fully occluded
  readonly occludedFraction: number; // 0.0 = not occluded, 1.0 = fully occluded
  readonly visible: boolean;
  readonly visibilityReason: F86VisibilityReason;
  readonly color: string;
  readonly label: string;
}

export interface F86OcclusionReport {
  readonly occluderPairs: readonly [string, string][]; // [occluderId, occludedId]
  readonly totalOccluded: number;
  readonly totalVisible: number;
  readonly totalOutsideFov: number;
  readonly totalBehindObserver: number;
}

export interface F86DisplayState {
  readonly displayId: string;
  readonly sceneType: F86SceneType;
  readonly observerId: string;
  readonly projectionType: F86ProjectionType;
  readonly objectRecords: readonly F86ObjectVisibilityRecord[];
  readonly occlusionReport: F86OcclusionReport;
  readonly width: number;
  readonly height: number;
  readonly displayChecksum: string;
}

export interface F86DepthOrderingReport {
  readonly sortedObjectIdsByDepth: readonly string[];
  readonly isStrictlyOrdered: boolean;
  readonly depthRange: readonly [number, number];
}

export interface F86VisibilityDifferenceReport {
  readonly areDisplaysDistinct: boolean;
  readonly visibleIdsA: readonly string[];
  readonly visibleIdsB: readonly string[];
  readonly changedVisibilityIds: readonly string[];
  readonly checksumA: string;
  readonly checksumB: string;
}
