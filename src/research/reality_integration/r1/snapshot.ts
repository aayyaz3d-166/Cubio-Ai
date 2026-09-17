/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R1: Reality Snapshot Engine
 *
 * Captures deeply frozen immutable snapshots of Reality integration state.
 */

import {
  ObservableRealityState,
  ModelRepresentation,
  GeometryRepresentation,
  DownstreamWorkspaceState,
  RealitySnapshot,
} from './types';
import {
  generateDeterministicSnapshotId,
  deterministicHash,
} from './determinism';

export class RealitySnapshotEngine {
  public static readonly SCHEMA_VERSION = 'R1_SNAPSHOT_V1';

  public static createSnapshot(
    realityState: ObservableRealityState,
    model: ModelRepresentation,
    geometry: GeometryRepresentation,
    workspace: DownstreamWorkspaceState
  ): RealitySnapshot {
    const snapshotId = generateDeterministicSnapshotId(realityState.stateId);
    const raw = JSON.stringify([
      snapshotId,
      realityState.checksum,
      model.modelChecksum,
      geometry.geometryChecksum,
      workspace.workspaceChecksum,
      RealitySnapshotEngine.SCHEMA_VERSION,
    ]);
    const snapshotChecksum = `CS_SNAP_${deterministicHash(raw)}`;

    return Object.freeze({
      snapshotId,
      realityState: Object.freeze({ ...realityState }),
      downstreamModel: Object.freeze({ ...model }),
      downstreamGeometry: Object.freeze({ ...geometry }),
      downstreamWorkspace: Object.freeze({ ...workspace }),
      snapshotChecksum,
      schemaVersion: RealitySnapshotEngine.SCHEMA_VERSION,
      timestamp: 0,
    });
  }

  public static restoreFromSnapshot(snapshot: RealitySnapshot): {
    realityState: ObservableRealityState;
    model: ModelRepresentation;
    geometry: GeometryRepresentation;
    workspace: DownstreamWorkspaceState;
  } {
    return {
      realityState: snapshot.realityState,
      model: snapshot.downstreamModel,
      geometry: snapshot.downstreamGeometry,
      workspace: snapshot.downstreamWorkspace,
    };
  }
}
