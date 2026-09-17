/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R3: Observation Serialization Engine
 *
 * Implements deterministic export and import for Observations and Temporal Snapshots.
 * Schema: R3_SCHEMA_V1
 */

import {
  RealityObservationRecord,
  RealityTemporalSnapshot,
} from './types';
import { ObservationValidator } from './observationValidator';

export class RealityObservationSerializationEngine {
  public static readonly SCHEMA_VERSION = 'R3_SCHEMA_V1';

  public static exportObservation(obs: RealityObservationRecord): string {
    return JSON.stringify(obs, null, 2);
  }

  public static importObservation(json: string): RealityObservationRecord | null {
    try {
      const parsed = JSON.parse(json);
      if (!parsed || typeof parsed !== 'object') return null;
      if (parsed.identity?.schemaVersion !== RealityObservationSerializationEngine.SCHEMA_VERSION) {
        return null;
      }

      const rep = ObservationValidator.validateObservation(parsed);
      if (!rep.isValid) return null;

      return Object.freeze({
        ...parsed,
        coordinates: parsed.coordinates ? Object.freeze([...parsed.coordinates] as [number, number, number]) : undefined,
        dimensions: parsed.dimensions ? Object.freeze([...parsed.dimensions] as [number, number, number]) : undefined,
        identity: Object.freeze({ ...parsed.identity }),
        provenance: Object.freeze({ ...parsed.provenance }),
        temporal: Object.freeze({ ...parsed.temporal }),
        lineage: Object.freeze({ ...parsed.lineage }),
      });
    } catch {
      return null;
    }
  }

  public static exportSnapshot(snapshot: RealityTemporalSnapshot): string {
    return JSON.stringify(snapshot, null, 2);
  }

  public static importSnapshot(json: string): RealityTemporalSnapshot | null {
    try {
      const parsed = JSON.parse(json);
      if (!parsed || typeof parsed !== 'object') return null;
      if (parsed.schemaVersion !== 'R3_SNAPSHOT_V1') return null;
      if (!parsed.snapshotChecksum || !parsed.realityStateId) return null;

      return Object.freeze({
        ...parsed,
        observations: Object.freeze([...parsed.observations]),
        events: Object.freeze([...parsed.events]),
        timeline: Object.freeze({ ...parsed.timeline }),
      });
    } catch {
      return null;
    }
  }
}
