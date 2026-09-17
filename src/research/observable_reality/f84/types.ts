/**
 * 3D Memory Studio — Funnel 84
 * Observer Experience & Perceptual Projection Research Funnel — Types
 *
 * Core Formal Pipeline:
 * FULL REALITY X → OBSERVER FRAME O → OBSERVATION FRAME F → PROJECTION P → DISPLAY D → OBSERVER EXPERIENCE E
 *
 * Invariant: X remains strictly immutable under any observer, projection, or display changes.
 */

export interface FullStateObject {
  readonly id: string;
  readonly type: string;
  readonly coordinates: readonly number[]; // e.g. [x, y, z, w] for 4D or [x, y, z] for 3D
  readonly velocity?: readonly number[];
  readonly properties: Readonly<Record<string, unknown>>;
}

export interface FullState {
  readonly stateId: string;
  readonly dimension: number;
  readonly objects: readonly FullStateObject[];
  readonly stateChecksum: string;
  readonly metadata: Readonly<Record<string, unknown>>;
}

export interface ObserverState {
  readonly observerId: string;
  readonly name: string;
  readonly position: readonly number[]; // 3D/4D coordinate [x, y, z, w?]
  readonly orientation: readonly number[]; // [yaw, pitch, roll] in degrees
  readonly zoom: number; // e.g. 1.0 = baseline
  readonly fovDegrees: number; // e.g. 60
  readonly focalLength: number;
  readonly dimension: number; // e.g. 4, 3, 2, 1
  readonly metadata: Readonly<Record<string, unknown>>;
}

export interface ObservedObject {
  readonly id: string;
  readonly sourceObjectId: string;
  readonly relativePosition: readonly number[];
  readonly distance: number;
  readonly apparentScale: number;
  readonly visible: boolean;
  readonly properties: Readonly<Record<string, unknown>>;
}

export interface ObservationFrame {
  readonly frameId: string;
  readonly observerId: string;
  readonly stateId: string;
  readonly relativeObjects: readonly ObservedObject[];
  readonly frameChecksum: string;
  readonly timestamp: number;
}

export type F84ProjectionType =
  | 'PERSPECTIVE_3D'
  | 'ORTHOGRAPHIC_3D'
  | 'ISOMETRIC_3D'
  | 'DIMENSIONAL_SLICE_Z4_Z3'
  | 'DIMENSIONAL_COLLAPSE_Z4_Z3'
  | 'DIMENSIONAL_PROJECT_Z3_Z2'
  | 'DIMENSIONAL_PROJECT_Z2_Z1'
  | 'PLANAR_ORTHO_Z2';

export interface ProjectionState {
  readonly projectionId: string;
  readonly projectionType: F84ProjectionType;
  readonly sourceDimension: number;
  readonly targetDimension: number;
  readonly sliceW?: number;
  readonly sliceThickness?: number;
  readonly focalLength: number;
  readonly parameters: Readonly<Record<string, unknown>>;
}

export interface DisplayObject {
  readonly id: string;
  readonly sourceObjectId: string;
  readonly screenCoordinates: readonly [number, number]; // [sx, sy]
  readonly screenZ: number; // depth
  readonly screenRadius: number;
  readonly screenColor: string;
  readonly screenLabel: string;
  readonly visible: boolean;
  readonly opacity: number;
}

export interface DisplayState {
  readonly displayId: string;
  readonly frameId: string;
  readonly projectionId: string;
  readonly displayObjects: readonly DisplayObject[];
  readonly width: number;
  readonly height: number;
  readonly displayChecksum: string;
}

export interface ExperienceState {
  readonly experienceId: string;
  readonly observerId: string;
  readonly displayId: string;
  readonly perceivedObjectCount: number;
  readonly focusTargetId: string | null;
  readonly perceivedDimension: number;
  readonly interactionCount: number;
  readonly experienceSummary: string;
  readonly experienceChecksum: string;
}

export interface RealityInvarianceReport {
  readonly stateId: string;
  readonly initialChecksum: string;
  readonly currentChecksum: string;
  readonly isInvariant: boolean;
  readonly transformationCount: number;
  readonly timestamp: number;
}

export interface ObservationDifferenceReport {
  readonly observerAId: string;
  readonly observerBId: string;
  readonly frameAId: string;
  readonly frameBId: string;
  readonly displayAId: string;
  readonly displayBId: string;
  readonly displayChecksumA: string;
  readonly displayChecksumB: string;
  readonly areDisplaysDistinct: boolean;
  readonly objectCoordinateDeltas: Readonly<Record<string, number>>;
}

export interface ProjectionReversibilityReport {
  readonly experimentId: string;
  readonly stateId: string;
  readonly initialObserverChecksum: string;
  readonly intermediateObserverChecksum: string;
  readonly restoredObserverChecksum: string;
  readonly initialDisplayChecksum: string;
  readonly restoredDisplayChecksum: string;
  readonly isReversible: boolean;
  readonly coordinateVariance: number; // Expected 0
}

export interface MultiObserverView {
  readonly observerId: string;
  readonly displayId: string;
  readonly displayChecksum: string;
  readonly objectCount: number;
}

export interface MultiObserverComparisonReport {
  readonly stateId: string;
  readonly stateChecksum: string;
  readonly observerViews: readonly MultiObserverView[];
  readonly totalObservers: number;
  readonly allDisplaysDistinct: boolean;
  readonly realityInvarianceVerified: boolean;
}

export interface ObservationTimelineStep {
  readonly stepIndex: number;
  readonly timestamp: number;
  readonly actionName: string;
  readonly observer: ObserverState;
  readonly frame: ObservationFrame;
  readonly projection: ProjectionState;
  readonly display: DisplayState;
  readonly experience: ExperienceState;
  readonly stateChecksum: string;
}

export interface ObservationTimeline {
  readonly timelineId: string;
  readonly stateId: string;
  readonly steps: readonly ObservationTimelineStep[];
  readonly initialChecksum: string;
  readonly isInvariant: boolean;
}
