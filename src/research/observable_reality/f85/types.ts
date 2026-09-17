/**
 * 3D Memory Studio — Funnel 85
 * Observer Spatial Separation & Dimensional Visibility — Types
 *
 * Formal Pipeline:
 * Reality X → Spatial Config S → Observer O → Projection P → Display D → Experience E
 */

export type F85ExperimentType =
  | 'SAME_POSITION'
  | 'X_SEPARATION'
  | 'Y_SEPARATION'
  | 'Z_DEPTH'
  | 'CUBE_3D'
  | 'DIMENSIONAL_Z4';

export type F85ProjectionType =
  | 'PERSPECTIVE_3D'
  | 'ORTHOGRAPHIC_3D'
  | 'ISOMETRIC_3D'
  | 'DIMENSIONAL_SLICE_Z4_Z3'
  | 'DIMENSIONAL_COLLAPSE_Z4_Z3'
  | 'DIMENSIONAL_PROJECT_Z3_Z2'
  | 'DIMENSIONAL_PROJECT_Z2_Z1';

export interface F85SpatialObject {
  readonly id: string;
  readonly type: string;
  readonly canonicalCoordinate: readonly [number, number, number]; // [5, 3, 6] (Immutable Reality X)
  readonly experimentalWorldPosition: readonly number[]; // [x, y, z, w?] (Experimental S)
  readonly color: string;
  readonly label: string;
  readonly category: string;
}

export interface F85SpatialConfiguration {
  readonly configId: string;
  readonly experimentType: F85ExperimentType;
  readonly isSynthetic: boolean; // strictly true
  readonly objects: readonly F85SpatialObject[];
  readonly description: string;
}

export interface F85ObserverState {
  readonly observerId: string;
  readonly name: string;
  readonly position: readonly [number, number, number]; // [x, y, z]
  readonly orientation: readonly [number, number]; // [yawDeg, pitchDeg]
  readonly zoom: number;
  readonly fovDegrees: number;
  readonly focalLength: number;
}

export interface F85ObjectViewRecord {
  readonly id: string;
  readonly canonicalCoordinate: readonly [number, number, number];
  readonly worldPosition: readonly number[];
  readonly observerRelativePosition: readonly [number, number, number];
  readonly projectedPosition: readonly [number, number, number];
  readonly screenPosition: readonly [number, number]; // [sx, sy]
  readonly screenRadius: number;
  readonly depthZ: number;
  readonly apparentScale: number;
  readonly visible: boolean;
  readonly inFrustum: boolean;
  readonly color: string;
  readonly label: string;
}

export interface F85ScreenCollisionReport {
  readonly collisionCount: number;
  readonly collisionPairs: readonly [string, string][];
  readonly uniqueScreenPositions: number;
  readonly visuallyDistinctObjectCount: number;
  readonly thresholdPx: number;
  readonly areAllDistinct: boolean;
}

export interface F85DisplayState {
  readonly displayId: string;
  readonly experimentType: F85ExperimentType;
  readonly observerId: string;
  readonly projectionType: F85ProjectionType;
  readonly objectRecords: readonly F85ObjectViewRecord[];
  readonly collisionReport: F85ScreenCollisionReport;
  readonly width: number;
  readonly height: number;
  readonly displayChecksum: string;
}

export interface F85ObserverComparisonReport {
  readonly experimentType: F85ExperimentType;
  readonly displays: readonly F85DisplayState[];
  readonly areAllDisplaysDistinct: boolean;
  readonly realityXPreserved: boolean;
}

export interface F85DepthVisibilityReport {
  readonly experimentName: string;
  readonly perspectiveDistinctCount: number;
  readonly orthographicDistinctCount: number;
  readonly doesPerspectiveSeparateDepth: boolean;
  readonly doesOrthographicSeparateDepth: boolean;
  readonly mathematicalDifferenceVerified: boolean;
}
