/**
 * 3D Memory Studio — Funnel 82
 * Observable Reality Visualization & Observer Projection Engine — Types
 *
 * Strictly isolates FULL STATE from OBSERVABLE REPRESENTATION.
 * Invariant: FULL_STATE != OBSERVABLE_REPRESENTATION
 */

export type Coordinate4D = readonly [x: number, y: number, z: number, w: number];
export type Coordinate3D = readonly [x: number, y: number, z: number];
export type Vector4D = readonly [vx: number, vy: number, vz: number, vw: number];

export type F82ProjectionType =
  | 'DIRECT_ORTHOGRAPHIC_3D'
  | 'PERSPECTIVE_PINHOLE_3D'
  | 'SLICED_HYPERPLANE_3D'
  | 'CONVERGENT_ENERGY_3D'
  | 'COMPUTATIONAL_SHADOW_3D';

export type DifferenceCategory =
  | 'NO_CHANGE'
  | 'POSITION_CHANGE'
  | 'VISUAL_CHANGE'
  | 'OBJECT_APPEARED'
  | 'OBJECT_DISAPPEARED'
  | 'MULTIPLE_CHANGES';

export type CollisionClassification = 'UNIQUE_OBSERVATION' | 'NON_UNIQUE_OBSERVATION';

export type ReverseInferenceOutcome = 'UNIQUE_CANDIDATE' | 'MULTIPLE_CANDIDATES' | 'NO_CANDIDATE';

export type InformationLossClassification =
  | 'LOSSLESS_WITHIN_SCOPE'
  | 'INFORMATION_REDUCED'
  | 'NON_INVERTIBLE'
  | 'AMBIGUOUS';

export interface FullStateObject {
  readonly objectId: string;
  readonly entityType: string;
  readonly coordinates: Coordinate4D;
  readonly velocity: Vector4D;
  readonly relationships: readonly string[];
  readonly internalMetadata: Readonly<Record<string, unknown>>;
  readonly hiddenPayload?: string;
  readonly privateDimensions?: Readonly<Record<string, number>>;
  readonly timestamp: number;
}

export interface FullState {
  readonly stateId: string;
  readonly dimension: number;
  readonly frameIndex: number;
  readonly timestamp: number;
  readonly objects: readonly FullStateObject[];
  readonly globalParameters: Readonly<Record<string, unknown>>;
  readonly stateHash: string;
}

export interface ObservationBoundary {
  readonly boundaryId: string;
  readonly permittedFields: readonly string[];
  readonly hiddenFields: readonly string[];
  readonly allowedObjectTypes: readonly string[];
  readonly maxRange: Coordinate3D;
  readonly minRange: Coordinate3D;
  readonly maximumObjects: number;
  readonly maximumDepth: number;
  readonly exposeWDimension: boolean;
  readonly filterRedactedProperties: boolean;
}

export interface Observer {
  readonly observerId: string;
  readonly dimension: number;
  readonly position: Coordinate3D;
  readonly orientation: Coordinate3D;
  readonly projectionType: F82ProjectionType;
  readonly observationBoundary: ObservationBoundary;
  readonly fovDegrees: number;
  readonly focalLength: number;
  readonly sliceW: number;
  readonly sliceThickness: number;
}

export interface ObservableObject {
  readonly objectId: string;
  readonly entityType: string;
  readonly projectedPosition: Coordinate3D;
  readonly visibleProperties: Readonly<Record<string, unknown>>;
  readonly visibleGeometry: {
    readonly shape: 'SPHERE' | 'BOX' | 'CYLINDER' | 'PARTICLE' | 'MESH_POINT';
    readonly apparentScale: number;
    readonly opacity: number;
  };
  readonly isVisible: boolean;
}

export interface ObservableRepresentation {
  readonly representationId: string;
  readonly sourceStateId: string;
  readonly sourceStateHash: string;
  readonly observerId: string;
  readonly projectionType: F82ProjectionType;
  readonly observableObjects: readonly ObservableObject[];
  readonly underlyingDimension: number;
  readonly observableDimension: number;
  readonly frameHash: string;
  readonly determinismHash: string;
  readonly timestamp: number;
  readonly frameIndex: number;
}

export interface ObservationFrameObject {
  readonly id: string;
  readonly position: Coordinate3D;
  readonly geometryRepresentation: string;
  readonly visibleProperties: Readonly<Record<string, unknown>>;
  readonly apparentScale: number;
}

export interface ObservationFrame {
  readonly frameId: string;
  readonly observerId: string;
  readonly sourceRepresentationHash: string;
  readonly timestamp: number;
  readonly frameIndex: number;
  readonly visibleObjects: readonly ObservationFrameObject[];
  readonly projectedPositions: Readonly<Record<string, Coordinate3D>>;
  readonly visualState: {
    readonly objectCount: number;
    readonly activeProjection: F82ProjectionType;
    readonly totalVisibleScale: number;
  };
  readonly frameHash: string;
}

export interface ObservationDifference {
  readonly frameAId: string;
  readonly frameBId: string;
  readonly category: DifferenceCategory;
  readonly addedObjects: readonly string[];
  readonly removedObjects: readonly string[];
  readonly movedObjects: ReadonlyArray<{
    readonly objectId: string;
    readonly deltaPosition: Coordinate3D;
    readonly deltaDistance: number;
  }>;
  readonly changedProperties: readonly string[];
  readonly unchangedObjects: readonly string[];
  readonly observableDifferenceMagnitude: number;
  readonly underlyingStateDifferenceMagnitude: number;
  readonly underlyingStateChanged: boolean;
  readonly observationChanged: boolean;
}

export interface ObservationComparison {
  readonly frameA: ObservationFrame;
  readonly frameB: ObservationFrame;
  readonly difference: ObservationDifference;
}

export interface ProjectionCollisionReport {
  readonly classification: CollisionClassification;
  readonly observableHash: string;
  readonly candidateStateIds: readonly string[];
  readonly candidateStateHashes: readonly string[];
  readonly candidateCount: number;
  readonly isCollision: boolean;
  readonly maxCoordinateDeltaW: number;
}

export interface ReverseInferenceReport {
  readonly observationFrameId: string;
  readonly outcome: ReverseInferenceOutcome;
  readonly matchedCandidates: readonly string[];
  readonly matchedCandidateCount: number;
  readonly confidence: number;
  readonly ambiguousDimensions: readonly string[];
  readonly diagnosis: string;
}

export interface InformationLossReport {
  readonly classification: InformationLossClassification;
  readonly underlyingDimensions: number;
  readonly observedDimensions: number;
  readonly lostStateVariables: readonly string[];
  readonly informationRetentionRatio: number;
  readonly invertibleWithinScope: boolean;
}

export interface DisplayFrame {
  readonly displayId: string;
  readonly frameId: string;
  readonly renderedObjectsCount: number;
  readonly visualElements: readonly string[];
  readonly resolution: { readonly width: number; readonly height: number };
  readonly displayHash: string;
}

export interface F82EngineStats {
  readonly totalRepresentationsCreated: number;
  readonly totalFramesRendered: number;
  readonly totalCollisionsEvaluated: number;
  readonly totalInferencesAttempted: number;
  readonly determinismVerified: boolean;
}
