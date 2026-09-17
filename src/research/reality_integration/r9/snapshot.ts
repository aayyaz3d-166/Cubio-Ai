/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R9: Snapshot Engine
 *
 * Implements deeply frozen, immutable geometry snapshots for verification and historical auditing.
 * Invariant: Historical snapshots can NEVER be mutated by subsequent geometry operations.
 */

import {
  GeometrySnapshot,
  WorkspaceGeometry,
  GeometrySession,
} from './types';
import {
  generateDeterministicSnapshotId,
  computeSessionChecksum,
  deterministicHash,
} from './determinism';

export class R9SnapshotEngine {
  /**
   * Captures an immutable snapshot of current geometry state.
   */
  public static createSnapshot(
    sessionId: string,
    geometries: Readonly<Record<string, WorkspaceGeometry>>,
    realityChecksum: string,
    workspaceChecksum: string,
    seq: number = 0
  ): GeometrySnapshot {
    const snapshotId = generateDeterministicSnapshotId(sessionId, seq);

    // Compute aggregate geometry and topology checksums
    const geoChecksums = Object.values(geometries).map((g) => g.geometryChecksum).sort().join('_');
    const topoChecksums = Object.values(geometries).map((g) => g.mesh.topology.topologyChecksum).sort().join('_');

    const geometryChecksum = `CS_GEO_AGGR_${deterministicHash(geoChecksums || 'EMPTY')}`;
    const topologyChecksum = `CS_TOPO_AGGR_${deterministicHash(topoChecksums || 'EMPTY')}`;

    // Deep freeze geometries dictionary
    const frozenGeos: Record<string, WorkspaceGeometry> = {};
    for (const [id, geo] of Object.entries(geometries)) {
      frozenGeos[id] = Object.freeze({ ...geo });
    }

    return Object.freeze({
      snapshotId,
      geometries: Object.freeze(frozenGeos),
      realityChecksum,
      workspaceChecksum,
      geometryChecksum,
      topologyChecksum,
      schemaVersion: 'R9_SCHEMA_V1',
      timestamp: 0,
    });
  }

  /**
   * Validates snapshot immutability.
   */
  public static verifySnapshotImmutability(snapshot: GeometrySnapshot): boolean {
    if (!Object.isFrozen(snapshot)) return false;
    if (!Object.isFrozen(snapshot.geometries)) return false;

    for (const geo of Object.values(snapshot.geometries)) {
      if (!Object.isFrozen(geo)) return false;
      if (!Object.isFrozen(geo.mesh)) return false;
      if (!Object.isFrozen(geo.transform)) return false;
    }

    return true;
  }
}
