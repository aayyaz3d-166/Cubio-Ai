/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R4: Multi-Object Snapshot Engine
 *
 * Captures deeply frozen immutable snapshots of Reality multi-object collections and graphs.
 */

import {
  RealityObject,
  RealityRelationship,
  RealityMultiObjectSnapshot,
} from './types';
import {
  generateDeterministicMultiObjectSnapshotId,
  computeCollectionChecksum,
  deterministicHash,
} from './determinism';

export class RealityMultiObjectSnapshotEngine {
  public static readonly SCHEMA_VERSION = 'R4_SNAPSHOT_V1';

  public static createSnapshot(
    realityStateId: string,
    realityStateChecksum: string,
    objects: readonly RealityObject[],
    relationships: readonly RealityRelationship[],
    sequence = 0
  ): RealityMultiObjectSnapshot {
    const snapshotId = generateDeterministicMultiObjectSnapshotId(realityStateId, sequence);
    const objChecksums = objects.map((o) => o.objectChecksum);
    const relChecksums = relationships.map((r) => r.relationshipChecksum);
    const collectionChecksum = computeCollectionChecksum(`COLL_${snapshotId}`, realityStateId, objChecksums, relChecksums);

    const raw = JSON.stringify([
      snapshotId,
      realityStateId,
      realityStateChecksum,
      collectionChecksum,
      RealityMultiObjectSnapshotEngine.SCHEMA_VERSION,
    ]);
    const snapshotChecksum = `CS_SNAP_R4_${deterministicHash(raw)}`;

    return Object.freeze({
      snapshotId,
      realityStateId,
      realityStateChecksum,
      objects: Object.freeze([...objects.map((o) => Object.freeze({ ...o }))]),
      relationships: Object.freeze([...relationships.map((r) => Object.freeze({ ...r }))]),
      collectionChecksum,
      snapshotChecksum,
      schemaVersion: RealityMultiObjectSnapshotEngine.SCHEMA_VERSION,
      timestamp: 0,
    });
  }
}
