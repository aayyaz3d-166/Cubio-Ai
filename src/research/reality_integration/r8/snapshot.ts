/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R8: Interaction Snapshot Engine
 *
 * Deeply immutable snapshots (Object.isFrozen === true) capturing
 * complete R8 interaction state including Reality reference, transforms, selection, and history.
 */

import {
  InteractionSnapshot,
  RealityInteractionSession,
} from './types';
import {
  generateDeterministicSnapshotId,
  deterministicHash,
} from './determinism';

export class R8SnapshotEngine {
  public static readonly SCHEMA_VERSION = 'R8_SNAPSHOT_V1';

  public static createSnapshot(
    session: RealityInteractionSession,
    realityChecksum: string,
    workspaceChecksum: string,
    seq = 0
  ): InteractionSnapshot {
    const snapshotId = generateDeterministicSnapshotId(session.sessionId, seq);

    const interactionChecksum = `CS_INT_${deterministicHash(
      JSON.stringify([
        snapshotId,
        session.sessionChecksum,
        realityChecksum,
        workspaceChecksum,
        session.selection.selectionChecksum,
        session.history.length,
      ])
    )}`;

    return Object.freeze({
      snapshotId,
      session: R8SnapshotEngine.deepFreezeSession(session),
      realityChecksum,
      workspaceChecksum,
      interactionChecksum,
      schemaVersion: R8SnapshotEngine.SCHEMA_VERSION,
      timestamp: 0,
    });
  }

  private static deepFreezeSession(session: RealityInteractionSession): RealityInteractionSession {
    return Object.freeze({
      ...session,
      targets: Object.freeze(
        Object.fromEntries(
          Object.entries(session.targets).map(([k, v]) => [k, Object.freeze({ ...v })])
        )
      ),
      selection: Object.freeze({ ...session.selection }),
      history: Object.freeze(session.history.map((h) => Object.freeze({ ...h }))),
      undoStack: Object.freeze(session.undoStack.map((h) => Object.freeze({ ...h }))),
      redoStack: Object.freeze(session.redoStack.map((h) => Object.freeze({ ...h }))),
    });
  }
}
