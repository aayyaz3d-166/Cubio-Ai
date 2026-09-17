/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R4: Multi-Object Serialization Engine
 *
 * Implements deterministic export and import for Object Collections and Snapshots.
 * Schema: R4_SCHEMA_V1
 */

import {
  RealityObjectCollection,
  RealityMultiObjectSnapshot,
} from './types';
import { RealityMultiObjectValidator } from './multiObjectValidator';

export class RealityMultiObjectSerializationEngine {
  public static readonly SCHEMA_VERSION = 'R4_SCHEMA_V1';

  public static exportObjectCollection(collection: RealityObjectCollection): string {
    return JSON.stringify(collection, null, 2);
  }

  public static importObjectCollection(json: string): RealityObjectCollection | null {
    try {
      const parsed = JSON.parse(json);
      if (!parsed || typeof parsed !== 'object') return null;
      if (!Array.isArray(parsed.objects) || !Array.isArray(parsed.relationships)) return null;

      const val = RealityMultiObjectValidator.validateCollection(parsed);
      if (!val.isValid) return null;

      return Object.freeze({
        collectionId: parsed.collectionId,
        realityStateId: parsed.realityStateId,
        objects: Object.freeze([...parsed.objects.map((o: any) => Object.freeze({ ...o }))]),
        relationships: Object.freeze([...parsed.relationships.map((r: any) => Object.freeze({ ...r }))]),
        collectionChecksum: parsed.collectionChecksum,
      });
    } catch {
      return null;
    }
  }

  public static exportSnapshot(snapshot: RealityMultiObjectSnapshot): string {
    return JSON.stringify(snapshot, null, 2);
  }

  public static importSnapshot(json: string): RealityMultiObjectSnapshot | null {
    try {
      const parsed = JSON.parse(json);
      if (!parsed || typeof parsed !== 'object') return null;
      if (parsed.schemaVersion !== 'R4_SNAPSHOT_V1') return null;
      if (!parsed.snapshotChecksum || !parsed.realityStateId) return null;

      return Object.freeze({
        ...parsed,
        objects: Object.freeze([...parsed.objects]),
        relationships: Object.freeze([...parsed.relationships]),
      });
    } catch {
      return null;
    }
  }
}
