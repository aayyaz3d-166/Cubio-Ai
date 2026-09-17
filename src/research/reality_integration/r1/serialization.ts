/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R1: Reality Serialization Engine
 *
 * Lossless JSON serialization/deserialization for Reality states and snapshots.
 */

import {
  ObservableRealityState,
  RealitySnapshot,
} from './types';
import { RealityValidator } from './realityValidator';

export class RealitySerializationEngine {
  public static serializeRealityState(state: ObservableRealityState): string {
    return JSON.stringify(state, null, 2);
  }

  public static deserializeRealityState(json: string): ObservableRealityState | null {
    try {
      const parsed = JSON.parse(json);
      if (!parsed || typeof parsed !== 'object') return null;

      // Reject non-finite values
      if (
        !Array.isArray(parsed.coordinates) ||
        parsed.coordinates.length !== 3 ||
        parsed.coordinates.some((n: any) => typeof n !== 'number' || !Number.isFinite(n) || Number.isNaN(n))
      ) {
        return null;
      }

      // Schema version check
      if (parsed.realityIdentity?.schemaVersion !== 'R1_SCHEMA_V1') {
        return null;
      }

      const validation = RealityValidator.validateRealityState(parsed);
      if (!validation.isValid) return null;

      return Object.freeze({
        ...parsed,
        coordinates: Object.freeze([...parsed.coordinates] as [number, number, number]),
        dimensions: Object.freeze([...parsed.dimensions] as [number, number, number]),
      });
    } catch {
      return null;
    }
  }

  public static serializeSnapshot(snapshot: RealitySnapshot): string {
    return JSON.stringify(snapshot, null, 2);
  }

  public static deserializeSnapshot(json: string): RealitySnapshot | null {
    try {
      const parsed = JSON.parse(json);
      if (!parsed || typeof parsed !== 'object') return null;
      if (parsed.schemaVersion !== 'R1_SNAPSHOT_V1') return null;
      if (!parsed.snapshotChecksum || !parsed.realityState) return null;

      return Object.freeze(parsed);
    } catch {
      return null;
    }
  }
}
