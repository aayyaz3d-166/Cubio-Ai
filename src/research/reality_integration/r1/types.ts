/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R1: Observable Reality Integration Foundation — Type Definitions
 *
 * Core Principle:
 * Reality != Observation != Model != Geometry != UI/View
 *
 * Downstream mutations NEVER alter authoritative Reality state.
 * Authorized Reality mutations propagate deterministically to downstream representations.
 */

export type RealityCertaintyLevel = 'EXACT' | 'CONSTRAINED' | 'AMBIGUOUS';

export type GeometryOriginClassification =
  | 'OBSERVED'
  | 'RECONSTRUCTED'
  | 'DERIVED'
  | 'AMBIGUOUS';

export type RealityValidationStatus =
  | 'REALITY_VALID'
  | 'INVALID_IDENTITY'
  | 'MISSING_REALITY_STATE'
  | 'NON_FINITE_COORDINATES'
  | 'INVALID_DIMENSIONS'
  | 'CHECKSUM_MISMATCH'
  | 'BROKEN_LINEAGE'
  | 'UNAUTHORIZED_MUTATION'
  | 'REALITY_MODEL_MISMATCH'
  | 'REALITY_GEOMETRY_MISMATCH'
  | 'FABRICATED_CERTAINTY'
  | 'FABRICATED_COORDINATES';

export interface RealityIdentity {
  readonly realityId: string;
  readonly realityStateId: string;
  readonly canonicalCoordinateReference: readonly [number, number, number];
  readonly dimension: readonly [number, number, number];
  readonly observableState: string;
  readonly sourceLineage: string;
  readonly certainty: RealityCertaintyLevel;
  readonly checksum: string;
  readonly schemaVersion: string;
}

export interface ObservableRealityState {
  readonly stateId: string;
  readonly realityIdentity: RealityIdentity;
  readonly coordinates: readonly [number, number, number];
  readonly dimensions: readonly [number, number, number];
  readonly certainty: RealityCertaintyLevel;
  readonly lineageId: string;
  readonly checksum: string;
  readonly timestamp: number;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface RealityObservation {
  readonly observationId: string;
  readonly observerId: string;
  readonly targetRealityId: string;
  readonly observedCoordinates: readonly [number, number, number];
  readonly observedCertainty: RealityCertaintyLevel;
  readonly timestamp: number;
}

export interface RealityLineage {
  readonly lineageId: string;
  readonly realityId: string;
  readonly predecessorStateId: string | null;
  readonly mutationType: string;
  readonly timestamp: number;
}

export interface RealityMutation {
  readonly mutationId: string;
  readonly sourceStateId: string;
  readonly targetStateId: string;
  readonly newCoordinates: readonly [number, number, number];
  readonly newDimensions: readonly [number, number, number];
  readonly causalReason: string;
  readonly timestamp: number;
}

export interface RealityStateReference {
  readonly referenceId: string;
  readonly targetRealityId: string;
  readonly targetStateId: string;
  readonly domain: 'MODEL' | 'GEOMETRY' | 'WORKSPACE';
  readonly representationId: string;
  readonly referenceChecksum: string;
}

export interface ModelRepresentation {
  readonly modelId: string;
  readonly sourceRealityId: string;
  readonly sourceStateId: string;
  readonly coordinates: readonly [number, number, number];
  readonly dimensions: readonly [number, number, number];
  readonly certainty: RealityCertaintyLevel;
  readonly lineageId: string;
  readonly modelChecksum: string;
  readonly timestamp: number;
}

export interface GeometryRepresentation {
  readonly geometryId: string;
  readonly sourceRealityId: string;
  readonly sourceModelId: string;
  readonly originClassification: GeometryOriginClassification;
  readonly coordinates: readonly [number, number, number];
  readonly dimensions: readonly [number, number, number];
  readonly certainty: RealityCertaintyLevel;
  readonly lineageId: string;
  readonly geometryChecksum: string;
  readonly timestamp: number;
}

export interface DownstreamWorkspaceState {
  readonly workspaceSpaceId: string;
  readonly sourceRealityId: string;
  readonly sourceModelId: string;
  readonly sourceGeometryId: string;
  readonly coordinates: readonly [number, number, number];
  readonly dimensions: readonly [number, number, number];
  readonly workspaceChecksum: string;
  readonly timestamp: number;
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

export interface RealityIntegrationEvent {
  readonly eventId: string;
  readonly sourceDomain: RealityCausalDomain;
  readonly targetDomain: RealityCausalDomain;
  readonly operation: string;
  readonly realityChecksumBefore: string;
  readonly realityChecksumAfter: string;
  readonly modelChecksumBefore: string;
  readonly modelChecksumAfter: string;
  readonly geometryChecksumBefore: string;
  readonly geometryChecksumAfter: string;
  readonly workspaceChecksumBefore: string;
  readonly workspaceChecksumAfter: string;
  readonly isRealityInvariant: boolean;
  readonly sequence: number;
  readonly timestamp: number;
}

export interface RealityValidationReport {
  readonly status: RealityValidationStatus;
  readonly isValid: boolean;
  readonly issues: readonly string[];
  readonly realityId: string;
  readonly stateId: string;
  readonly reportChecksum: string;
}

export interface RealitySnapshot {
  readonly snapshotId: string;
  readonly realityState: ObservableRealityState;
  readonly downstreamModel: ModelRepresentation;
  readonly downstreamGeometry: GeometryRepresentation;
  readonly downstreamWorkspace: DownstreamWorkspaceState;
  readonly snapshotChecksum: string;
  readonly schemaVersion: string;
  readonly timestamp: number;
}
