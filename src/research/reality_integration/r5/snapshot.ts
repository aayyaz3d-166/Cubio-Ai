/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R5: Spatial Snapshot Engine
 *
 * Captures deeply frozen immutable snapshots of spatial relations and topology.
 */

import {
  SpatialRelation,
  SpatialTopologyGraph,
  SpatialSnapshot,
} from './types';
import {
  generateDeterministicSpatialSnapshotId,
  deterministicHash,
} from './determinism';

export class RealitySpatialSnapshotEngine {
  public static readonly SCHEMA_VERSION = 'R5_SNAPSHOT_V1';

  public static createSnapshot(
    realityStateId: string,
    realityStateChecksum: string,
    relations: readonly SpatialRelation[],
    topology: SpatialTopologyGraph,
    seq = 0
  ): SpatialSnapshot {
    const snapshotId = generateDeterministicSpatialSnapshotId(realityStateId, seq);
    const raw = JSON.stringify([
      snapshotId,
      realityStateId,
      realityStateChecksum,
      relations.map((r) => r.relationChecksum),
      topology.graphChecksum,
      RealitySpatialSnapshotEngine.SCHEMA_VERSION,
    ]);
    const snapshotChecksum = `CS_SNAP_R5_${deterministicHash(raw)}`;

    return Object.freeze({
      snapshotId,
      realityStateId,
      realityStateChecksum,
      relations: Object.freeze([...relations.map((r) => Object.freeze({ ...r }))]),
      topology: Object.freeze({
        ...topology,
        nodes: Object.freeze([...topology.nodes.map((n) => Object.freeze({ ...n }))]),
        edges: Object.freeze([...topology.edges.map((e) => Object.freeze({ ...e }))]),
      }),
      snapshotChecksum,
      schemaVersion: RealitySpatialSnapshotEngine.SCHEMA_VERSION,
      timestamp: 0,
    });
  }
}
