/**
 * 3D Memory Studio — Phase 5: Observation & Reconstruction
 * Funnel P5.2: Multi-Observer Reconstruction & Information Recovery
 *
 * Type definitions for Multi-Observer Reconstruction, Uncertainty Model,
 * Information Gain, Ambiguity Resolution, and Payload Non-Recoverability.
 *
 * Scientific boundary: This is a computational model only.
 * No claims about physical higher-dimensional beings, consciousness, or metaphysical reality.
 */

export type SimulationDimension = 3 | 2 | 1;

export type InformationCategory =
  | 'POSITIONAL'
  | 'OBSERVER'
  | 'VISIBILITY'
  | 'STRUCTURAL'
  | 'INTERNAL_PAYLOAD';

export type CertaintyLevel = 'EXACT' | 'CONSTRAINED' | 'AMBIGUOUS' | 'UNOBSERVABLE';

/* ─── Structural Reality Record ─── */

export interface StructuralRecord {
  readonly id: string;
  readonly entityName: string;
  readonly canonicalPosition: readonly [number, number, number];
  readonly category: string;
  readonly color: string;
  readonly relationships: readonly string[];
  readonly internalPayload: string; // Non-geometric, unobservable via spatial projection
}

export interface UnderlyingState {
  readonly stateId: string;
  readonly checksum: string;
  readonly records: readonly StructuralRecord[];
  readonly timestamp: number;
}

/* ─── Observer & Observation ─── */

export interface ObserverFrame {
  readonly observerId: string;
  readonly label: string;
  readonly position: readonly [number, number, number];
  readonly target: readonly [number, number, number];
  readonly up: readonly [number, number, number];
  readonly yaw: number;
  readonly pitch: number;
  readonly distance: number;
  readonly fov: number;
  readonly dimension: SimulationDimension;
  readonly viewportWidth: number;
  readonly viewportHeight: number;
  readonly frameHash: string;
}

export interface ProjectedObject {
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

export interface ObservableFrame {
  readonly frameId: string;
  readonly observerId: string;
  readonly dimension: SimulationDimension;
  readonly objects: readonly ProjectedObject[];
  readonly visibleCount: number;
  readonly frameChecksum: string;
  readonly pixelSignature: string;
}

/* ─── Uncertainty & Property Recovery ─── */

export interface PropertyRecoveryStatus {
  readonly propertyName: string;
  readonly recordId: string;
  readonly category: InformationCategory;
  readonly trueValue: any;
  readonly recoveredValue: any;
  readonly certainty: CertaintyLevel;
  readonly candidateBounds?: readonly [number, number];
  readonly errorMagnitude: number;
}

/* ─── Multi-Observer Reconstruction ─── */

export interface ReconstructionIntersection {
  readonly combinationKey: string;
  readonly observerIds: readonly string[];
  readonly dimension: SimulationDimension;
  readonly totalRecords: number;
  readonly initialCandidateVolume: number;
  readonly remainingCandidateVolume: number;
  readonly volumeReductionRatio: number;
  readonly recoveredPropertiesCount: number;
  readonly constrainedPropertiesCount: number;
  readonly ambiguousPropertiesCount: number;
  readonly unobservablePropertiesCount: number;
  readonly informationGain: number; // in percentage [0, 100]
  readonly informationLoss: number; // in percentage [0, 100]
  readonly accuracyScore: number; // [0, 1]
  readonly isExact: boolean;
  readonly propertyStatuses: readonly PropertyRecoveryStatus[];
  readonly reconstructedCoordinates: ReadonlyArray<{
    readonly recordId: string;
    readonly truePosition: readonly [number, number, number];
    readonly reconstructedPosition: readonly [number | null, number | null, number | null];
    readonly error: number;
    readonly certainty: CertaintyLevel;
  }>;
}

/* ─── Ambiguity Resolution Experiment ─── */

export interface AmbiguityExperimentResult {
  readonly caseId: string;
  readonly description: string;
  readonly stateAId: string;
  readonly stateBId: string;
  readonly singleObserverAmbiguity: boolean;
  readonly multiObserverAmbiguity: boolean;
  readonly wasAmbiguityResolved: boolean;
  readonly singleObserverFrameIdentical: boolean;
  readonly multiObserverFrameIdentical: boolean;
  readonly remainingAmbiguityDegree: 'NONE' | 'PARTIAL' | 'PERSISTENT';
}

/* ─── Payload Non-Recoverability Result ─── */

export interface PayloadLossResult {
  readonly caseId: string;
  readonly statesDifferInPayload: boolean;
  readonly statesDifferInGeometry: boolean;
  readonly multiObserverGeometryAccuracy: number;
  readonly multiObserverPayloadRecoveryRatio: number;
  readonly classification: 'NON_GEOMETRIC_INFORMATION_LOSS';
  readonly message: string;
}

/* ─── Observation Trace ─── */

export interface MultiObserverTrace {
  readonly traceId: string;
  readonly sequence: readonly string[];
  readonly initialLoss: number;
  readonly stepGains: readonly number[];
  readonly finalLoss: number;
  readonly stateChecksumBefore: string;
  readonly stateChecksumAfter: string;
  readonly isInvariant: boolean;
}
