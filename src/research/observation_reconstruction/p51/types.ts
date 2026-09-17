/**
 * 3D Memory Studio — Phase 5: Observation & Reconstruction
 * P5.1: Observer Projection & Observable Frame
 *
 * Type definitions for the observation/reconstruction research pipeline.
 *
 * Scientific boundary: This is a computational model only.
 * No claims about physical higher-dimensional beings or external reality.
 */

export type P51ProjectionType = 'PERSPECTIVE_3D' | 'ORTHOGRAPHIC_3D' | 'DIMENSIONAL_Z2' | 'DIMENSIONAL_Z1';
export type P51Dimension = 3 | 2 | 1;

/* ─── Underlying Reality ─── */

export interface P51AuthoritativeRecord {
  readonly id: string;
  readonly entityName: string;
  readonly canonicalPosition: readonly [number, number, number];
  readonly category: string;
  readonly color: string;
  readonly properties: Readonly<Record<string, unknown>>;
}

export interface P51UnderlyingState {
  readonly stateId: string;
  readonly checksum: string;
  readonly records: readonly P51AuthoritativeRecord[];
  readonly timestamp: number;
}

/* ─── Observer Frame ─── */

export interface P51ObserverFrame {
  readonly observerId: string;
  readonly label: string;
  readonly position: readonly [number, number, number];
  readonly target: readonly [number, number, number];
  readonly up: readonly [number, number, number];
  readonly yaw: number;
  readonly pitch: number;
  readonly distance: number;
  readonly fov: number;
  readonly zoom: number;
  readonly dimension: P51Dimension;
  readonly projectionType: P51ProjectionType;
  readonly viewportWidth: number;
  readonly viewportHeight: number;
  readonly frameHash: string;
}

/* ─── Projected Object ─── */

export interface P51ProjectedObject {
  readonly sourceStateId: string;
  readonly entityName: string;
  readonly authoritativeCoordinate: readonly [number, number, number];
  readonly projectedCoordinate: readonly [number, number, number | null];
  readonly screenCoordinate: readonly [number, number];
  readonly apparentScale: number;
  readonly visible: boolean;
  readonly depth: number;
  readonly observerFrameId: string;
}

/* ─── Observable Frame ─── */

export interface P51ObservableFrame {
  readonly frameId: string;
  readonly observerId: string;
  readonly dimension: P51Dimension;
  readonly projectionType: P51ProjectionType;
  readonly objects: readonly P51ProjectedObject[];
  readonly visibleCount: number;
  readonly frameChecksum: string;
  readonly pixelSignature: string;
}

/* ─── Frame Difference ─── */

export interface P51ScreenDelta {
  readonly objectId: string;
  readonly deltaX: number;
  readonly deltaY: number;
  readonly deltaMagnitude: number;
}

export interface P51FrameDifference {
  readonly frameAId: string;
  readonly frameBId: string;
  readonly isIdentical: boolean;
  readonly screenDeltas: readonly P51ScreenDelta[];
  readonly averageDisparity: number;
  readonly maxDisparity: number;
  readonly visibilityMismatchCount: number;
}

/* ─── Reconstruction ─── */

export type P51ReconstructionCertainty = 'EXACT' | 'CONSTRAINED' | 'AMBIGUOUS' | 'UNKNOWN';

export interface P51ReconstructedObject {
  readonly id: string;
  readonly reconstructedPosition: readonly [number | null, number | null, number | null];
  readonly trueWorldPosition: readonly [number, number, number];
  readonly certainty: P51ReconstructionCertainty;
  readonly positionError: number | null;
  readonly isExactMatch: boolean;
  readonly sourceObservers: readonly string[];
}

export interface P51ReconstructionReport {
  readonly sourceFrameId: string;
  readonly observerId: string;
  readonly totalObserved: number;
  readonly reconstructedObjects: readonly P51ReconstructedObject[];
  readonly exactMatchCount: number;
  readonly missingObjectCount: number;
  readonly accuracyScore: number;
  readonly informationLossScore: number;
  readonly isExactReconstruction: boolean;
}

/* ─── Ambiguity / Information Loss ─── */

export interface P51AmbiguityCase {
  readonly caseId: string;
  readonly stateAId: string;
  readonly stateBId: string;
  readonly observerId: string;
  readonly statesDifferent: boolean;
  readonly framesIdentical: boolean;
  readonly isAmbiguityDetected: boolean;
  readonly collapsedDimension: string;
  readonly description: string;
}

/* ─── Observation Trace ─── */

export interface P51ObservationTrace {
  readonly traceId: string;
  readonly sequence: readonly string[];  // observer IDs in order
  readonly stateChecksumBefore: string;
  readonly stateChecksumAfter: string;
  readonly frameChecksums: readonly string[];
  readonly isDeterministic: boolean;
}
