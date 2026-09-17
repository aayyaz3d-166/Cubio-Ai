/**
 * 3D Memory Studio — Funnel 88
 * Observer Information Loss & Reconstruction — Types
 *
 * Formal Pipeline:
 * Reality X → Spatial State S → Observer O → Visibility V → Projection P → Display D → Experience E
 * Inverse Pipeline:
 * Display D → Attempted Inverse X' → Equivalence Class [X]
 */

export type F88ExperimentType =
  | 'UNIQUE_RECONSTRUCTION'
  | 'DEPTH_AMBIGUITY'
  | 'PERSPECTIVE_AMBIGUITY'
  | 'OCCLUSION_LOSS'
  | 'FOV_LOSS'
  | 'PROJECTION_COLLAPSE'
  | 'MULTI_OBSERVER'
  | 'EQUIVALENCE_CLASSES';

export type F88ProjectionType =
  | 'PERSPECTIVE_3D'
  | 'ORTHOGRAPHIC_3D'
  | 'ISOMETRIC_3D'
  | 'DIMENSIONAL_SLICE_Z4_Z3'
  | 'DIMENSIONAL_COLLAPSE_Z4_Z3'
  | 'DIMENSIONAL_PROJECT_Z3_Z2'
  | 'DIMENSIONAL_PROJECT_Z2_Z1';

export interface F88SpatialObject {
  readonly id: string;
  readonly type: string;
  readonly canonicalCoordinate: readonly [number, number, number]; // [5, 3, 6] (Immutable Reality X)
  readonly experimentalWorldPosition: readonly number[]; // [x, y, z, w?]
  readonly color: string;
  readonly label: string;
  readonly category: string;
  readonly baseRadius?: number;
}

export interface F88SpatialState {
  readonly stateId: string;
  readonly experimentType: F88ExperimentType;
  readonly isSynthetic: boolean; // strictly true
  readonly objects: readonly F88SpatialObject[];
  readonly description: string;
}

export interface F88ObserverState {
  readonly observerId: string;
  readonly name: string;
  readonly position: readonly [number, number, number]; // [x, y, z]
  readonly orientation: readonly [number, number]; // [yawDeg, pitchDeg]
  readonly zoom: number;
  readonly fovDegrees: number;
  readonly nearPlane: number;
  readonly farPlane: number;
  readonly focalLength: number;
}

export interface F88ObjectDisplayRecord {
  readonly id: string;
  readonly canonicalCoordinate: readonly [number, number, number];
  readonly worldPosition: readonly number[];
  readonly cameraSpacePosition: readonly [number, number, number];
  readonly projectedPosition: readonly [number, number, number];
  readonly screenPosition: readonly [number, number]; // [sx, sy]
  readonly depthZ: number;
  readonly apparentScale: number;
  readonly screenRadius: number;
  readonly inFrustum: boolean;
  readonly isOccluded: boolean;
  readonly occludedBy: string | null;
  readonly visibleInDisplay: boolean;
  readonly color: string;
  readonly label: string;
}

export interface F88InformationMetrics {
  readonly stateDimension: number; // e.g. 3D, 4D
  readonly projectedDimension: number; // e.g. 2D screen
  readonly totalObjectsInReality: number;
  readonly visibleObjectsInDisplay: number;
  readonly hiddenObjectsCount: number;
  readonly discardedCoordinateComponents: number;
  readonly screenCollisions: number;
  readonly reconstructionMultiplicity: number; // Number of distinct X states producing identical D
  readonly ambiguityScore: number; // 0 = unique, >0 = ambiguous
  readonly isInverseUnique: boolean;
}

export interface F88DisplayState {
  readonly displayId: string;
  readonly experimentType: F88ExperimentType;
  readonly observerId: string;
  readonly projectionType: F88ProjectionType;
  readonly objectRecords: readonly F88ObjectDisplayRecord[];
  readonly informationMetrics: F88InformationMetrics;
  readonly width: number;
  readonly height: number;
  readonly displayChecksum: string;
}

export interface F88EquivalenceClass {
  readonly classId: string;
  readonly sharedDisplayChecksum: string;
  readonly memberStateIds: readonly string[];
  readonly memberStates: readonly F88SpatialState[];
  readonly classSize: number;
  readonly stateAmbiguity: string;
}

export interface F88ReconstructionResult {
  readonly attemptedStateId: string;
  readonly isExactReconstruction: boolean;
  readonly reconstructedPositions: Record<string, readonly number[]>;
  readonly confidenceScore: number;
  readonly ambiguityReasons: readonly string[];
}
