/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R3: Observation Engine
 *
 * Implements observation creation, updating, lineage tracking, and Reality binding.
 */

import {
  RealityObservationRecord,
  ObservationIdentity,
  ObservationProvenance,
  ObservationTemporalMetadata,
  ObservationLineage,
  ObservationCertainty,
  ObservationOrigin,
  ObservationSource,
  RealityObservationValidationReport,
  ObservationDiff,
  RealityObservationReference,
} from './types';
import { RealityState } from '../r2/types';
import {
  generateDeterministicObservationId,
  generateDeterministicObservationLineageId,
  computeObservationChecksum,
  deterministicHash,
} from './determinism';
import { ObservationValidator } from './observationValidator';
import { ObservationDiffEngine } from './observationDiff';
import { R3CausalityAuditor } from './causality';
import { TemporalEngine } from './temporalEngine';

export class ObservationEngine {
  private observations: Map<string, RealityObservationRecord> = new Map();
  private causalityAuditor: R3CausalityAuditor;
  private temporalEngine: TemporalEngine;

  constructor() {
    this.causalityAuditor = new R3CausalityAuditor();
    this.temporalEngine = new TemporalEngine();
  }

  public createObservation(
    realityState: RealityState,
    coordinates?: readonly [number, number, number],
    dimensions?: readonly [number, number, number],
    certainty: ObservationCertainty = 'EXACT',
    origin: ObservationOrigin = 'OBSERVED',
    source: ObservationSource = 'SENSOR',
    observerId = 'OBS_PRIMARY',
    captureMethod = 'DIRECT_SPATIAL_PROBE',
    parentObservationId: string | null = null,
    notes?: string
  ): RealityObservationRecord {
    const seq = this.observations.size;
    const observationId = generateDeterministicObservationId(realityState.stateId, seq);

    const identity: ObservationIdentity = Object.freeze({
      observationId,
      targetRealityId: realityState.lineage.rootStateId,
      targetRealityStateId: realityState.stateId,
      schemaVersion: 'R3_SCHEMA_V1',
    });

    const provenance: ObservationProvenance = Object.freeze({
      observerId,
      source,
      captureMethod,
      notes,
    });

    const temporal: ObservationTemporalMetadata = Object.freeze({
      sequenceIndex: seq,
      temporalTag: `SEQ_${seq}`,
    });

    const rootObsId = parentObservationId
      ? this.observations.get(parentObservationId)?.lineage.rootObservationId ?? observationId
      : observationId;

    const lineageId = generateDeterministicObservationLineageId(rootObsId, parentObservationId, seq);

    const lineage: ObservationLineage = Object.freeze({
      lineageId,
      rootObservationId: rootObsId,
      parentObservationId,
      associatedEventId: `EVT_${observationId}`,
      depth: parentObservationId ? (this.observations.get(parentObservationId)?.lineage.depth ?? 0) + 1 : 0,
    });

    const observationChecksum = computeObservationChecksum(
      observationId,
      realityState.stateId,
      realityState.checksum,
      coordinates,
      dimensions,
      certainty,
      origin,
      seq
    );

    const record: RealityObservationRecord = Object.freeze({
      identity,
      coordinates: coordinates ? Object.freeze([...coordinates] as [number, number, number]) : undefined,
      dimensions: dimensions ? Object.freeze([...dimensions] as [number, number, number]) : undefined,
      certainty,
      origin,
      provenance,
      temporal,
      lineage,
      realityStateChecksum: realityState.checksum,
      observationChecksum,
    });

    this.observations.set(observationId, record);

    // Log causality event (Delta Reality = 0)
    const evt = this.causalityAuditor.logEvent(
      parentObservationId ? 'OBSERVATION_UPDATED' : 'OBSERVATION_ADDED',
      realityState.stateId,
      realityState.checksum,
      realityState.checksum,
      observationId,
      realityState.stateId,
      provenance.captureMethod
    );

    // Record timeline point
    this.temporalEngine.recordTimelinePoint(
      realityState.stateId,
      [observationId],
      [evt.eventId]
    );

    return record;
  }

  public updateObservation(
    parentObservationId: string,
    realityState: RealityState,
    newCoordinates?: readonly [number, number, number],
    newDimensions?: readonly [number, number, number],
    certainty: ObservationCertainty = 'EXACT',
    origin: ObservationOrigin = 'OBSERVED',
    notes = 'UPDATED_OBSERVATION'
  ): RealityObservationRecord {
    const parent = this.observations.get(parentObservationId);
    if (!parent) {
      throw new Error(`Parent observation ${parentObservationId} not found`);
    }

    return this.createObservation(
      realityState,
      newCoordinates ?? parent.coordinates,
      newDimensions ?? parent.dimensions,
      certainty,
      origin,
      parent.provenance.source,
      parent.provenance.observerId,
      'INCREMENTAL_UPDATE',
      parentObservationId,
      notes
    );
  }

  public getObservation(observationId: string): RealityObservationRecord | null {
    return this.observations.get(observationId) ?? null;
  }

  public listObservations(): readonly RealityObservationRecord[] {
    return Object.freeze(Array.from(this.observations.values()));
  }

  public validateObservation(obs: RealityObservationRecord): RealityObservationValidationReport {
    return ObservationValidator.validateObservation(obs);
  }

  public compareObservations(obsA: RealityObservationRecord, obsB: RealityObservationRecord): ObservationDiff {
    return ObservationDiffEngine.compareObservations(obsA, obsB);
  }

  public createObservationReference(obs: RealityObservationRecord): RealityObservationReference {
    const raw = JSON.stringify([obs.identity.observationId, obs.identity.targetRealityStateId, obs.observationChecksum]);
    return Object.freeze({
      referenceId: `REF_OBS_${deterministicHash(raw)}`,
      observationId: obs.identity.observationId,
      realityStateId: obs.identity.targetRealityStateId,
      domain: 'OBSERVATION',
      referenceChecksum: obs.observationChecksum,
    });
  }

  public getCausalityAuditor(): R3CausalityAuditor {
    return this.causalityAuditor;
  }

  public getTemporalEngine(): TemporalEngine {
    return this.temporalEngine;
  }
}
