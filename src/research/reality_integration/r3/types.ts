/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R3: Observable Reality Observation & Temporal Lineage Engine — Types
 *
 * Core Principle:
 * Reality != Observation != Event != Temporal Lineage != Model != Geometry != UI
 *
 * Downstream observation and temporal operations NEVER alter authoritative Reality state.
 * Epistemic boundaries strictly preserve uncertainty, provenance, and canonical coordinates [5, 3, 6].
 */

export type ObservationCertainty = 'EXACT' | 'CONSTRAINED' | 'AMBIGUOUS' | 'UNKNOWN';

export type ObservationOrigin = 'OBSERVED' | 'RECONSTRUCTED' | 'DERIVED' | 'AMBIGUOUS';

export type ObservationSource =
  | 'SENSOR'
  | 'HUMAN_OPERATOR'
  | 'ALGORITHMIC_CAPTURE'
  | 'SIMULATION_PROBE'
  | 'CANONICAL_SOURCE'
  | 'UNKNOWN';

export type TemporalRelationship = 'BEFORE' | 'AT' | 'AFTER' | 'UNKNOWN';

export type RealityEventType =
  | 'INITIAL_OBSERVATION'
  | 'OBSERVATION_ADDED'
  | 'OBSERVATION_UPDATED'
  | 'REALITY_STATE_CREATED'
  | 'REALITY_STATE_TRANSITIONED'
  | 'REALITY_STATE_RESTORED'
  | 'REALITY_STATE_BRANCHED'
  | 'REALITY_STATE_MERGED'
  | 'SNAPSHOT_CREATED'
  | 'OBSERVATION_REJECTED'
  | 'VALIDATION_FAILED';

export interface ObservationIdentity {
  readonly observationId: string;
  readonly targetRealityId: string;
  readonly targetRealityStateId: string;
  readonly schemaVersion: string;
}

export interface ObservationProvenance {
  readonly observerId: string;
  readonly source: ObservationSource;
  readonly instrument?: string;
  readonly captureMethod: string;
  readonly notes?: string;
}

export interface ObservationTemporalMetadata {
  readonly sequenceIndex: number;
  readonly timestamp?: number;
  readonly temporalTag?: string;
  readonly relativeRelationship?: TemporalRelationship;
  readonly relativeTargetId?: string;
}

export interface ObservationLineage {
  readonly lineageId: string;
  readonly rootObservationId: string;
  readonly parentObservationId: string | null;
  readonly associatedEventId: string;
  readonly depth: number;
}

export interface RealityObservationRecord {
  readonly identity: ObservationIdentity;
  readonly coordinates?: readonly [number, number, number];
  readonly dimensions?: readonly [number, number, number];
  readonly certainty: ObservationCertainty;
  readonly origin: ObservationOrigin;
  readonly provenance: ObservationProvenance;
  readonly temporal: ObservationTemporalMetadata;
  readonly lineage: ObservationLineage;
  readonly realityStateChecksum: string;
  readonly observationChecksum: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface RealityEvent {
  readonly eventId: string;
  readonly eventType: RealityEventType;
  readonly sourceRealityStateId: string;
  readonly targetRealityStateId?: string;
  readonly observationId?: string;
  readonly parentEventId: string | null;
  readonly sequence: number;
  readonly realityChecksumBefore: string;
  readonly realityChecksumAfter: string;
  readonly isRealityInvariant: boolean;
  readonly provenance: string;
  readonly timestamp?: number;
  readonly eventChecksum: string;
}

export interface RealityTimelineEntry {
  readonly entryId: string;
  readonly sequenceIndex: number;
  readonly realityStateId: string;
  readonly observationIds: readonly string[];
  readonly eventIds: readonly string[];
  readonly timestamp?: number;
  readonly entryChecksum: string;
}

export interface RealityTimeline {
  readonly timelineId: string;
  readonly entries: readonly RealityTimelineEntry[];
  readonly totalEntries: number;
  readonly currentSequenceIndex: number;
  readonly timelineChecksum: string;
}

export interface RealityObservationReference {
  readonly referenceId: string;
  readonly observationId: string;
  readonly realityStateId: string;
  readonly domain: 'OBSERVATION' | 'MODEL' | 'GEOMETRY' | 'WORKSPACE' | 'TIMELINE';
  readonly referenceChecksum: string;
}

export interface RealityTemporalSnapshot {
  readonly snapshotId: string;
  readonly realityStateId: string;
  readonly realityStateChecksum: string;
  readonly observations: readonly RealityObservationRecord[];
  readonly events: readonly RealityEvent[];
  readonly timeline: RealityTimeline;
  readonly snapshotChecksum: string;
  readonly schemaVersion: string;
  readonly sequenceIndex: number;
}

export type ObservationValidationStatus =
  | 'OBSERVATION_VALID'
  | 'INVALID_OBSERVATION_ID'
  | 'NON_FINITE_COORDINATES'
  | 'INVALID_DIMENSIONS'
  | 'CHECKSUM_MISMATCH'
  | 'BROKEN_LINEAGE'
  | 'BROKEN_REALITY_REFERENCE'
  | 'FABRICATED_TIMESTAMP'
  | 'FABRICATED_CERTAINTY'
  | 'INVALID_EVENT_SEQUENCE'
  | 'DUPLICATE_IDENTITY';

export interface RealityObservationValidationReport {
  readonly status: ObservationValidationStatus;
  readonly isValid: boolean;
  readonly issues: readonly string[];
  readonly observationId: string;
  readonly reportChecksum: string;
}

export interface RealityTimelineValidationReport {
  readonly isValid: boolean;
  readonly issues: readonly string[];
  readonly timelineChecksum: string;
  readonly reportChecksum: string;
}

export interface RealityTemporalExecutionSignature {
  readonly rootRealityChecksum: string;
  readonly currentRealityChecksum: string;
  readonly observationCount: number;
  readonly eventCount: number;
  readonly timelineChecksum: string;
  readonly executionHash: string;
}

export type DiffFieldStatus = 'CHANGED' | 'UNCHANGED' | 'UNKNOWN';

export interface ObservationDiffField<T> {
  readonly status: DiffFieldStatus;
  readonly before?: T;
  readonly after?: T;
}

export interface ObservationDiff {
  readonly observationAId: string;
  readonly observationBId: string;
  readonly coordinates: ObservationDiffField<readonly [number, number, number]>;
  readonly dimensions: ObservationDiffField<readonly [number, number, number]>;
  readonly certainty: ObservationDiffField<ObservationCertainty>;
  readonly origin: ObservationDiffField<ObservationOrigin>;
  readonly source: ObservationDiffField<ObservationSource>;
  readonly sequence: ObservationDiffField<number>;
  readonly realityState: ObservationDiffField<string>;
  readonly isIdentical: boolean;
}
