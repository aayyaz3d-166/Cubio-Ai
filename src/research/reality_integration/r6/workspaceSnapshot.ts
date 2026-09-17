/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R6: Workspace Snapshot Engine
 *
 * Captures deeply frozen immutable snapshots of Workspace states.
 * Invariant: Snapshots are immutable (Object.isFrozen === true).
 */

import { WorkspaceState, WorkspaceSnapshot } from './types';
import {
  generateDeterministicWorkspaceSnapshotId,
  deterministicHash,
} from './determinism';

export class WorkspaceSnapshotEngine {
  public static readonly SCHEMA_VERSION = 'R6_SNAPSHOT_V1';

  public static createSnapshot(workspaceState: WorkspaceState, seq = 0): WorkspaceSnapshot {
    const snapshotId = generateDeterministicWorkspaceSnapshotId(workspaceState.workspaceId, seq);

    const raw = JSON.stringify([
      snapshotId,
      workspaceState.workspaceId,
      workspaceState.realityBinding.realityStateChecksum,
      workspaceState.workspaceChecksum,
      WorkspaceSnapshotEngine.SCHEMA_VERSION,
    ]);
    const snapshotChecksum = `CS_SNAP_R6_${deterministicHash(raw)}`;

    return Object.freeze({
      snapshotId,
      workspaceState: Object.freeze({
        ...workspaceState,
        objects: Object.freeze([...workspaceState.objects.map((o) => Object.freeze({ ...o }))]),
        relationships: Object.freeze([...workspaceState.relationships.map((r) => Object.freeze({ ...r }))]),
        spatialRelations: Object.freeze([...workspaceState.spatialRelations.map((s) => Object.freeze({ ...s }))]),
      }),
      realityStateChecksum: workspaceState.realityBinding.realityStateChecksum,
      workspaceChecksum: workspaceState.workspaceChecksum,
      snapshotChecksum,
      schemaVersion: WorkspaceSnapshotEngine.SCHEMA_VERSION,
      timestamp: 0,
    });
  }
}
