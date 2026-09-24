/**
 * CUBiO AI — Phase 6: Task 87
 * Native Language + Spatial Intelligence Layer
 * src/cubio/language/native/spatial/spatialLanguageTypes.ts
 *
 * Core types, interfaces, epistemic contracts, and error hierarchy for
 * native spatial-language mapping, reasoning, and retrieval over CUBiO's
 * 343-cell spatial lattice (Formula A 369 addressing).
 */

import { Coordinate3D } from '../../../../types/memory';

export type SpatialDirection =
  | 'EAST'    // +X (dx = +1)
  | 'WEST'    // -X (dx = -1)
  | 'NORTH'   // +Y (dy = +1)
  | 'SOUTH'   // -Y (dy = -1)
  | 'ABOVE'   // +Z (dz = +1)
  | 'BELOW';  // -Z (dz = -1)

export interface DirectionOffset {
  readonly dx: number;
  readonly dy: number;
  readonly dz: number;
}

export const DIRECTION_OFFSETS: Readonly<Record<SpatialDirection, DirectionOffset>> = Object.freeze({
  EAST:  Object.freeze({ dx: 1, dy: 0, dz: 0 }),
  WEST:  Object.freeze({ dx: -1, dy: 0, dz: 0 }),
  NORTH: Object.freeze({ dx: 0, dy: 1, dz: 0 }),
  SOUTH: Object.freeze({ dx: 0, dy: -1, dz: 0 }),
  ABOVE: Object.freeze({ dx: 0, dy: 0, dz: 1 }),
  BELOW: Object.freeze({ dx: 0, dy: 0, dz: -1 }),
});

export type SpatialRelationType =
  | 'SAME_CELL'
  | 'ADJACENT'
  | 'EAST_OF'
  | 'WEST_OF'
  | 'NORTH_OF'
  | 'SOUTH_OF'
  | 'ABOVE'
  | 'BELOW'
  | 'COLLINEAR_X'
  | 'COLLINEAR_Y'
  | 'COLLINEAR_Z'
  | 'DISTANCE_WITHIN';

export type SpatialEpistemicStatus =
  | 'OBSERVED_FACT'         // Directly observed canonical spatial assignment
  | 'INFERRED_RELATIONSHIP' // Proven via multi-hop or geometric deduction
  | 'AMBIGUOUS_SPATIAL'     // Underspecified spatial reference (near, around)
  | 'OUT_OF_BOUNDS'         // Coordinate/cell violates [0..6] / [0..342]
  | 'EPISTEMIC_UNKNOWN';    // Insufficient evidence or ungrounded entity

export interface SpatialProvenance {
  readonly tenantId: string;
  readonly sourceObjectId?: string;
  readonly sourceCellId?: number;
  readonly sourceAddress369?: number;
  readonly stateVersion?: number;
  readonly recordChecksum?: string;
  readonly timestamp: number;
}

export interface CanonicalSpatialReference {
  readonly objectId: string;
  readonly tenantId: string;
  readonly cellId: number;
  readonly address369: number;
  readonly coordinate: Coordinate3D;
  readonly label?: string;
  readonly checksum: string;
  readonly provenance: SpatialProvenance;
}

export interface SpatialClaim {
  readonly claimId: string;
  readonly rawText: string;
  readonly subjectEntity: string;
  readonly targetEntity?: string;
  readonly relation?: SpatialRelationType;
  readonly explicitCoordinate?: Coordinate3D;
  readonly explicitCellId?: number;
  readonly explicitAddress369?: number;
  readonly stepDistance?: number;
  readonly stepDirection?: SpatialDirection;
  readonly epistemicStatus: SpatialEpistemicStatus;
  readonly isAmbiguous: boolean;
  readonly isOutOfBounds: boolean;
}

export interface SpatialReasoningStep {
  readonly stepIndex: number;
  readonly premise: string;
  readonly ruleId: string;
  readonly intermediateCoordinate: Coordinate3D;
  readonly intermediateCellId: number;
  readonly intermediateAddress369: number;
  readonly confidence: number;
}

export interface SpatialReasoningTrace {
  readonly traceId: string;
  readonly query: string;
  readonly steps: readonly SpatialReasoningStep[];
  readonly finalConclusion: string;
  readonly reasoningDepth: number;
  readonly provenCoordinate?: Coordinate3D;
  readonly provenCellId?: number;
  readonly provenAddress369?: number;
  readonly epistemicStatus: SpatialEpistemicStatus;
  readonly confidence: number;
  readonly isSound: boolean;
  readonly traceChecksum: string;
}

export interface SpatialLanguageQuery {
  readonly queryText: string;
  readonly tenantId?: string;
  readonly maxReasoningDepth?: number;
}

export interface SpatialLanguageResponse {
  readonly responseId: string;
  readonly queryText: string;
  readonly tenantId: string;
  readonly generatedText: string;
  readonly epistemicStatus: SpatialEpistemicStatus;
  readonly confidence: number;
  readonly isGrounded: boolean;
  readonly targetCellId?: number;
  readonly targetAddress369?: number;
  readonly targetCoordinate?: Coordinate3D;
  readonly reasoningTrace?: SpatialReasoningTrace;
  readonly provenance?: SpatialProvenance;
  readonly durationMs: number;
}

export interface SpatialLanguageMetrics {
  readonly totalQueries: number;
  readonly passedQueries: number;
  readonly extractionAccuracy: number;
  readonly directRelationAccuracy: number;
  readonly multiHopReasoningAccuracy: number;
  readonly ambiguityRejectionRate: number;
  readonly outOfBoundsRejectionRate: number;
  readonly actuationBlockingRate: number;
  readonly overallAccuracy: number;
  readonly averageLatencyMs: number;
  readonly maxReasoningDepthVerified: number;
}

// =============================================================================
// DOMAIN ERROR HIERARCHY
// =============================================================================

export class SpatialLanguageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SpatialLanguageError';
  }
}

export class OutOfBoundsSpatialError extends SpatialLanguageError {
  constructor(message: string) {
    super(message);
    this.name = 'OutOfBoundsSpatialError';
  }
}

export class AmbiguousSpatialQueryError extends SpatialLanguageError {
  constructor(message: string) {
    super(message);
    this.name = 'AmbiguousSpatialQueryError';
  }
}

export class SpatialActuationBlockedError extends SpatialLanguageError {
  constructor(message = 'Spatial hardware actuation is permanently blocked in CUBiO AI sovereign runtime. Advisory output only.') {
    super(message);
    this.name = 'SpatialActuationBlockedError';
  }
}

export class UnresolvedSpatialEntityError extends SpatialLanguageError {
  constructor(entityName: string, tenantId: string) {
    super(`Spatial entity "${entityName}" is not grounded in canonical memory for tenant "${tenantId}".`);
    this.name = 'UnresolvedSpatialEntityError';
  }
}
