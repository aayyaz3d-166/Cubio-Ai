/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel F10: Serialization & Deserialization
 *
 * Provides deterministic JSON export and import for F10 snapshots.
 */

import { F10Snapshot } from './types';

export class F10SerializationEngine {
  public static exportSnapshotToJson(snapshot: Readonly<F10Snapshot>): string {
    return JSON.stringify(snapshot, null, 2);
  }

  public static importSnapshotFromJson(jsonStr: string): Readonly<F10Snapshot> {
    const parsed = JSON.parse(jsonStr);

    if (!parsed.snapshotId || !parsed.sessionId || !parsed.schemaVersion) {
      throw new Error(`Invalid F10 snapshot JSON schema.`);
    }

    return Object.freeze({
      snapshotId: String(parsed.snapshotId),
      sessionId: String(parsed.sessionId),
      conversation: Object.freeze(parsed.conversation || []),
      history: Object.freeze(parsed.history || []),
      lastActiveTargetId: parsed.lastActiveTargetId || null,
      realityChecksum: String(parsed.realityChecksum),
      workspaceChecksum: String(parsed.workspaceChecksum),
      schemaVersion: String(parsed.schemaVersion),
      timestamp: Number(parsed.timestamp) || Date.now(),
    });
  }
}
