/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R2: Reality State Snapshot Engine
 *
 * Captures deeply frozen immutable snapshots of Reality State and transition history.
 */

import {
  RealityState,
  RealityTransition,
  RealityStateSnapshot,
} from './types';
import {
  generateDeterministicSnapshotId,
  deterministicHash,
} from './determinism';

export class RealityStateSnapshotEngine {
  public static readonly SCHEMA_VERSION = 'R2_SNAPSHOT_V1';

  public static createSnapshot(
    state: RealityState,
    transitionHistory: readonly RealityTransition[] = []
  ): RealityStateSnapshot {
    const raw = JSON.stringify([
      state.stateId,
      state.checksum,
      transitionHistory.map((t) => t.transitionId),
      RealityStateSnapshotEngine.SCHEMA_VERSION,
    ]);
    const snapshotChecksum = `CS_SNAP_R2_${deterministicHash(raw)}`;
    const snapshotId = generateDeterministicSnapshotId(state.stateId, snapshotChecksum);

    return Object.freeze({
      snapshotId,
      state: Object.freeze({ ...state }),
      transitionHistory: Object.freeze([...transitionHistory.map((t) => Object.freeze({ ...t }))]),
      snapshotChecksum,
      schemaVersion: RealityStateSnapshotEngine.SCHEMA_VERSION,
      timestamp: 0,
    });
  }

  public static restoreSnapshot(snapshot: RealityStateSnapshot): {
    state: RealityState;
    transitionHistory: readonly RealityTransition[];
  } {
    return {
      state: snapshot.state,
      transitionHistory: snapshot.transitionHistory,
    };
  }
}
