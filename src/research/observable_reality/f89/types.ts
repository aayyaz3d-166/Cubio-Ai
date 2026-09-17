/**
 * 3D Memory Studio — Funnel 89
 * Observer-Dependent Reality Reconstruction — Types
 *
 * Pipeline: Reality X → Spatial State S → Observer O → Visibility V → Projection P → Display D → Experience E → Reconstructed Reality R
 */

export type F89ExperimentType =
  | 'COMPLETE_OBSERVATION'
  | 'DEPTH_AMBIGUITY'
  | 'OCCLUDED_OBJECT'
  | 'OUTSIDE_FOV_OBJECT'
  | 'DIMENSIONAL_LOSS'
  | 'MULTI_OBSERVER'
  | 'OBSERVER_MOVEMENT'
  | 'OBSERVATION_HISTORY';

export type F89ProjectionType =
  | 'PERSPECTIVE_3D'
  | 'ORTHOGRAPHIC_3D'
  | 'ISOMETRIC_3D'
  | 'DIMENSIONAL_SLICE_Z4_Z3'
  | 'DIMENSIONAL_PROJECT_Z3_Z2'
  | 'DIMENSIONAL_PROJECT_Z2_Z1';

export type F89CertaintyState =
  | 'EXACT'
  | 'CONSTRAINED'
  | 'AMBIGUOUS'
  | 'UNKNOWN';

export type F89ObjectReconstructionStatus =
  | 'KNOWN'
  | 'AMBIGUOUS'
  | 'HIDDEN'
  | 'UNOBSERVED'
  | 'OUTSIDE_FOV'
  | 'DIMENSIONALLY_COLLAPSED';

export interface F89SpatialObject {
  readonly id: string;
  readonly type: string;
  readonly canonicalCoordinate: readonly [number, number, number]; // [5, 3, 6] (Immutable Reality X)
  readonly experimentalWorldPosition: readonly number[]; // [x, y, z, w?]
  readonly color: string;
  readonly label: string;
  readonly category: string;
}

export interface F89SpatialState {
  readonly stateId: string;
  readonly experimentType: F89ExperimentType;
  readonly isSynthetic: boolean; // strictly true
  readonly objects: readonly F89SpatialObject[];
  readonly description: string;
}

export interface F89ObserverState {
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

export interface F89ObservationRecord {
  readonly id: string;
  readonly canonicalCoordinate: readonly [number, number, number];
  readonly worldPosition: readonly number[];
  readonly cameraSpacePosition: readonly [number, number, number];
  readonly screenPosition: readonly [number, number]; // [sx, sy]
  readonly depthZ: number;
  readonly apparentScale: number;
  readonly inFrustum: boolean;
  readonly isOccluded: boolean;
  readonly occludedBy: string | null;
  readonly visibleInDisplay: boolean;
  readonly color: string;
  readonly label: string;
}

export interface F89DisplayState {
  readonly displayId: string;
  readonly experimentType: F89ExperimentType;
  readonly observerId: string;
  readonly projectionType: F89ProjectionType;
  readonly observationRecords: readonly F89ObservationRecord[];
  readonly width: number;
  readonly height: number;
  readonly displayChecksum: string;
}

export interface F89ReconstructedObject {
  readonly id: string;
  readonly canonicalCoordinate: readonly [number, number, number];
  readonly trueWorldPosition: readonly number[]; // Ground truth in Reality X
  readonly reconstructedPosition: readonly (number | null)[]; // Reconstructed estimated coords
  readonly status: F89ObjectReconstructionStatus;
  readonly certainty: F89CertaintyState;
  readonly confidenceScore: number; // 0.0 to 1.0
  readonly sourceObserverIds: readonly string[];
  readonly ambiguityReason: string | null;
  readonly color: string;
  readonly label: string;
}

export interface F89ReconstructedReality {
  readonly reconstructionId: string;
  readonly observerId: string;
  readonly objects: readonly F89ReconstructedObject[];
  readonly totalObjectsInReality: number;
  readonly knownObjectsCount: number;
  readonly ambiguousObjectsCount: number;
  readonly hiddenObjectsCount: number;
  readonly outsideFovObjectsCount: number;
  readonly overallCertaintyScore: number; // 0.0 to 1.0
  readonly isCompleteReconstruction: boolean;
  readonly reconstructionChecksum: string;
}

export interface F89EquivalenceClass {
  readonly classId: string;
  readonly sharedDisplayChecksum: string;
  readonly memberStateIds: readonly string[];
  readonly memberStates: readonly F89SpatialState[];
  readonly classSize: number;
  readonly stateAmbiguity: string;
}

export interface F89ObservationHistory {
  readonly historyId: string;
  readonly steps: readonly {
    stepIndex: number;
    observerState: F89ObserverState;
    displayState: F89DisplayState;
    cumulativeReconstruction: F89ReconstructedReality;
  }[];
  readonly totalSteps: number;
  readonly finalReconstruction: F89ReconstructedReality;
}
