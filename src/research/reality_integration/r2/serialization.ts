/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R2: Reality Serialization Engine
 *
 * Implements deterministic export and import for RealityState and Snapshots.
 * Schema: R2_SCHEMA_V1 (with R1_SCHEMA_V1 backward compatibility).
 */

import {
  RealityState,
  RealityStateSnapshot,
} from './types';
import { RealityStateValidator } from './realityStateValidator';
import { RealityStateFactory } from './realityState';

export class RealityStateSerializationEngine {
  public static readonly SCHEMA_VERSION = 'R2_SCHEMA_V1';

  public static exportRealityState(state: RealityState): string {
    return JSON.stringify(state, null, 2);
  }

  public static importRealityState(json: string): RealityState | null {
    try {
      const parsed = JSON.parse(json);
      if (!parsed || typeof parsed !== 'object') return null;

      // Handle R1 compatibility
      if (parsed.realityIdentity && parsed.realityIdentity.schemaVersion === 'R1_SCHEMA_V1') {
        const state = RealityStateFactory.createInitialState(
          'IMPORTED_R1',
          parsed.coordinates,
          parsed.dimensions,
          parsed.certainty ?? 'EXACT',
          'OBSERVED'
        );
        return state;
      }

      // Check R2 schema
      if (parsed.schemaVersion !== RealityStateSerializationEngine.SCHEMA_VERSION) {
        return null;
      }

      // Coordinates validation
      if (
        !Array.isArray(parsed.coordinates) ||
        parsed.coordinates.length !== 3 ||
        parsed.coordinates.some((n: any) => typeof n !== 'number' || !Number.isFinite(n) || Number.isNaN(n))
      ) {
        return null;
      }

      const report = RealityStateValidator.validateState(parsed);
      if (!report.isValid) return null;

      return Object.freeze({
        ...parsed,
        coordinates: Object.freeze([...parsed.coordinates] as [number, number, number]),
        dimensions: Object.freeze([...parsed.dimensions] as [number, number, number]),
        lineage: Object.freeze({ ...parsed.lineage }),
      });
    } catch {
      return null;
    }
  }

  public static exportSnapshot(snapshot: RealityStateSnapshot): string {
    return JSON.stringify(snapshot, null, 2);
  }

  public static importSnapshot(json: string): RealityStateSnapshot | null {
    try {
      const parsed = JSON.parse(json);
      if (!parsed || typeof parsed !== 'object') return null;
      if (parsed.schemaVersion !== 'R2_SNAPSHOT_V1') return null;
      if (!parsed.snapshotChecksum || !parsed.state) return null;

      return Object.freeze({
        ...parsed,
        state: Object.freeze({ ...parsed.state }),
        transitionHistory: Object.freeze([...parsed.transitionHistory]),
      });
    } catch {
      return null;
    }
  }
}
