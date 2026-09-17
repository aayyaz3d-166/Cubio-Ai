/**
 * 3D Memory Studio — Funnel 87
 * Observer Parallax, Depth Cues & Motion — Types
 *
 * Pipeline: Reality X → Spatial State S → Observer O → Relative Geometry V → Projection P → Parallax/Depth Cues → Display D → Observation E
 */

export type F87ExperimentType =
  | 'DEPTH_STACK'
  | 'PARALLAX_X'
  | 'PARALLAX_Y'
  | 'ORBIT_PARALLAX'
  | 'DEPTH_ORDER'
  | 'MOTION_SEQUENCE'
  | 'MULTI_OBSERVER'
  | 'DIMENSIONAL_PARALLAX';

export type F87ProjectionType =
  | 'PERSPECTIVE_3D'
  | 'ORTHOGRAPHIC_3D'
  | 'ISOMETRIC_3D'
  | 'DIMENSIONAL_SLICE_Z4_Z3'
  | 'DIMENSIONAL_COLLAPSE_Z4_Z3';

export interface F87SpatialObject {
  readonly id: string;
  readonly type: string;
  readonly canonicalCoordinate: readonly [number, number, number]; // [5, 3, 6] (Immutable Reality X)
  readonly experimentalWorldPosition: readonly number[]; // [x, y, z, w?]
  readonly color: string;
  readonly label: string;
  readonly category: string;
  readonly isAnchor?: boolean;
}

export interface F87SpatialState {
  readonly stateId: string;
  readonly experimentType: F87ExperimentType;
  readonly isSynthetic: boolean; // strictly true
  readonly objects: readonly F87SpatialObject[];
  readonly description: string;
}

export interface F87ObserverState {
  readonly observerId: string;
  readonly name: string;
  readonly position: readonly [number, number, number]; // [x, y, z]
  readonly orientation: readonly [number, number]; // [yawDeg, pitchDeg]
  readonly zoom: number;
  readonly fovDegrees: number;
  readonly focalLength: number;
}

export interface F87ObjectRenderRecord {
  readonly id: string;
  readonly canonicalCoordinate: readonly [number, number, number];
  readonly worldPosition: readonly number[];
  readonly relativeVector: readonly [number, number, number]; // vector from observer
  readonly cameraSpacePosition: readonly [number, number, number]; // [vx, vy, vz]
  readonly projectedPosition: readonly [number, number, number];
  readonly screenPosition: readonly [number, number]; // [sx, sy]
  readonly depthZ: number;
  readonly apparentScale: number;
  readonly screenRadius: number;
  readonly visible: boolean;
  readonly depthRank: number;
  readonly color: string;
  readonly label: string;
}

export interface F87ParallaxMeasurement {
  readonly nearObjectId: string;
  readonly farObjectId: string;
  readonly nearScreenPos: readonly [number, number];
  readonly farScreenPos: readonly [number, number];
  readonly deltaScreenNear: readonly [number, number]; // [Δsx, Δsy]
  readonly deltaScreenFar: readonly [number, number]; // [Δsx, Δsy]
  readonly parallaxDifferenceX: number; // |Δsx_near - Δsx_far|
  readonly parallaxDifferenceY: number; // |Δsy_near - Δsy_far|
  readonly totalParallaxDifference: number;
  readonly isParallaxDetected: boolean;
}

export interface F87DisplayState {
  readonly displayId: string;
  readonly experimentType: F87ExperimentType;
  readonly observerId: string;
  readonly projectionType: F87ProjectionType;
  readonly objectRecords: readonly F87ObjectRenderRecord[];
  readonly parallaxMeasurement: F87ParallaxMeasurement | null;
  readonly sortedDepthIds: readonly string[];
  readonly width: number;
  readonly height: number;
  readonly displayChecksum: string;
}

export interface F87MotionStepRecord {
  readonly stepIndex: number;
  readonly observerState: F87ObserverState;
  readonly displayState: F87DisplayState;
  readonly deltaFromInitial: number;
}
