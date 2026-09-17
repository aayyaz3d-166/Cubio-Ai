/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel F10: Snapshot Engine & Immutability
 */

import { F10Snapshot, AIConversationMessage, F10HistoryEntry } from './types';
import { generateDeterministicSnapshotId } from './determinism';

export class F10SnapshotEngine {
  public static createSnapshot(
    sessionId: string,
    conversation: readonly AIConversationMessage[],
    history: readonly F10HistoryEntry[],
    lastActiveTargetId: string | null,
    realityChecksum: string,
    workspaceChecksum: string,
    sequence = 1
  ): Readonly<F10Snapshot> {
    const snapshotId = generateDeterministicSnapshotId(sessionId, sequence);

    const snapshot: F10Snapshot = {
      snapshotId,
      sessionId,
      conversation: Object.freeze([...conversation]),
      history: Object.freeze([...history]),
      lastActiveTargetId,
      realityChecksum,
      workspaceChecksum,
      schemaVersion: 'F10_SNAPSHOT_V1',
      timestamp: Date.now(),
    };

    return Object.freeze(snapshot);
  }
}
