/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R2: Observable Reality State Engine — Type Definitions
 *
 * Core Principle:
 * Reality is authoritative.
 * Model, Geometry, Workspace, Camera, Observer, Selection, UI are downstream representations.
 * Downstream mutations NEVER alter Reality (Delta Reality = 0).
 * Authorized Reality transitions propagate deterministically downstream.
 */

export type RealityStateCertainty = 'EXACT' | 'CONSTRAINED' | 'AMBIGUOUS';

export type RealityStateOrigin =
  | 'OBSERVED'
  | 'RECONSTRUCTED'
  | 'DERIVED'
  | 'AMBIGUOUS';

export type RealityTransitionType =
  | 'INITIALIZE'
  | 'OBSERVATION_UPDATE'
  | 'AUTHORIZED_MUTATION'
  | 'RESTORE'
  | 'BRANCH'
  | 'MERGE'
  | 'RESET';

export type RealityStateValidationStatus =
  | 'REALITY_STATE_VALID'
  | 'INVALID_STATE_ID'
  | 'NON_FINITE_COORDINATES'
  | 'INVALID_DIMENSIONS'
  | 'CHECKSUM_MISMATCH'
  | 'BROKEN_LINEAGE'
  | 'UNAUTHORIZED_MUTATION'
  | 'MISSING_PARENT_STATE'
  | 'INVALID_TRANSITION'
  | 'FABRICATED_INFORMATION'
  | 'UNSUPPORTED_MERGE';

export interface RealityStateLineage {
  readonly lineageId: string;
  readonly rootStateId: string;
  readonly parentStateId: string | null;
  readonly transitionId: string;
  readonly transitionType: RealityTransitionType;
  readonly branchName?: string;
  readonly depth: number;
}

export interface RealityState {
  readonly stateId: string;
  readonly version: number;
  readonly coordinates: readonly [number, number, number];
  readonly dimensions: readonly [number, number, number];
  readonly certainty: RealityStateCertainty;
  readonly origin: RealityStateOrigin;
  readonly lineage: RealityStateLineage;
  readonly checksum: string;
  readonly schemaVersion: string;
  readonly timestamp: number;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface RealityMutation {
  readonly mutationId: string;
  readonly sourceStateId: string;
  readonly targetCoordinates: readonly [number, number, number];
  readonly targetDimensions: readonly [number, number, number];
  readonly certainty?: RealityStateCertainty;
  readonly origin?: RealityStateOrigin;
  readonly reason: string;
  readonly authorizedBy: string;
  readonly timestamp: number;
}

export interface RealityTransition {
  readonly transitionId: string;
  readonly transitionType: RealityTransitionType;
  readonly sourceStateId: string | null;
  readonly targetStateId: string;
  readonly sourceChecksum: string | null;
  readonly targetChecksum: string;
  readonly mutation: RealityMutation | null;
  readonly description: string;
  readonly timestamp: number;
}

export interface RealityCoordinateDiff {
  readonly before: number;
  readonly after: number;
  readonly changed: boolean;
}

export interface RealityDimensionDiff {
  readonly before: number;
  readonly after: number;
  readonly changed: boolean;
}

export interface RealityStateDiff {
  readonly stateAId: string;
  readonly stateBId: string;
  readonly coordinates: {
    readonly x: RealityCoordinateDiff;
    readonly y: RealityCoordinateDiff;
    readonly z: RealityCoordinateDiff;
  };
  readonly dimensions: {
    readonly width: RealityDimensionDiff;
    readonly height: RealityDimensionDiff;
    readonly depth: RealityDimensionDiff;
  };
  readonly certaintyChanged: boolean;
  readonly certaintyBefore: RealityStateCertainty;
  readonly certaintyAfter: RealityStateCertainty;
  readonly originChanged: boolean;
  readonly originBefore: RealityStateOrigin;
  readonly originAfter: RealityStateOrigin;
  readonly checksumChanged: boolean;
  readonly isIdentical: boolean;
}

export interface RealityStateSnapshot {
  readonly snapshotId: string;
  readonly state: RealityState;
  readonly transitionHistory: readonly RealityTransition[];
  readonly snapshotChecksum: string;
  readonly schemaVersion: string;
  readonly timestamp: number;
}

export interface RealityStateReference {
  readonly referenceId: string;
  readonly stateId: string;
  readonly domain: 'MODEL' | 'GEOMETRY' | 'WORKSPACE';
  readonly representationId: string;
  readonly referenceChecksum: string;
}

export interface R2ModelRepresentation {
  readonly modelId: string;
  readonly sourceRealityStateId: string;
  readonly coordinates: readonly [number, number, number];
  readonly dimensions: readonly [number, number, number];
  readonly certainty: RealityStateCertainty;
  readonly modelChecksum: string;
  readonly timestamp: number;
}

export interface R2GeometryRepresentation {
  readonly geometryId: string;
  readonly sourceModelId: string;
  readonly sourceRealityStateId: string;
  readonly origin: RealityStateOrigin;
  readonly coordinates: readonly [number, number, number];
  readonly dimensions: readonly [number, number, number];
  readonly geometryChecksum: string;
  readonly timestamp: number;
}

export interface R2WorkspaceState {
  readonly spaceId: string;
  readonly sourceGeometryId: string;
  readonly sourceRealityStateId: string;
  readonly coordinates: readonly [number, number, number];
  readonly dimensions: readonly [number, number, number];
  readonly workspaceChecksum: string;
  readonly timestamp: number;
}

export interface RealityStateValidationReport {
  readonly status: RealityStateValidationStatus;
  readonly isValid: boolean;
  readonly issues: readonly string[];
  readonly stateId: string;
  readonly reportChecksum: string;
}

export interface RealityTransitionValidationReport {
  readonly isValid: boolean;
  readonly transitionType: RealityTransitionType;
  readonly issues: readonly string[];
  readonly reportChecksum: string;
}

export interface RealityStateExecutionSignature {
  readonly rootChecksum: string;
  readonly currentChecksum: string;
  readonly stateCount: number;
  readonly transitionCount: number;
  readonly executionHash: string;
}

export interface RealityStateRegistry {
  readonly states: ReadonlyMap<string, RealityState>;
  readonly transitions: readonly RealityTransition[];
  readonly currentStateId: string;
  readonly rootStateId: string;
}

export interface RealityStateEngineResult {
  readonly state: RealityState;
  readonly transition: RealityTransition;
  readonly validation: RealityStateValidationReport;
}

export type RealityCausalDomain =
  | 'REALITY'
  | 'OBSERVATION'
  | 'MODEL'
  | 'GEOMETRY'
  | 'WORKSPACE'
  | 'CAMERA'
  | 'OBSERVER'
  | 'SELECTION'
  | 'UI';

export interface RealityCausalityEvent {
  readonly eventId: string;
  readonly sourceDomain: RealityCausalDomain;
  readonly targetDomain: RealityCausalDomain;
  readonly operation: string;
  readonly realityChecksumBefore: string;
  readonly realityChecksumAfter: string;
  readonly isRealityInvariant: boolean;
  readonly sequence: number;
  readonly timestamp: number;
}
