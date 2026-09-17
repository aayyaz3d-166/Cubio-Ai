/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel F11: Serialization Engine
 *
 * Lossless JSON export and import for World Model Snapshots (R11_SCHEMA_V1).
 */

import { WorldModelSnapshot } from './types';

export class F11SerializationEngine {
  public static exportSnapshotToJson(snapshot: Readonly<WorldModelSnapshot>): string {
    return JSON.stringify(snapshot, null, 2);
  }

  public static importSnapshotFromJson(jsonStr: string): Readonly<WorldModelSnapshot> {
    const parsed = JSON.parse(jsonStr);

    if (!parsed.snapshotId || !parsed.model || parsed.schemaVersion !== 'R11_SNAPSHOT_V1') {
      throw new Error(`Invalid F11 snapshot JSON schema (expected R11_SNAPSHOT_V1).`);
    }

    return Object.freeze({
      snapshotId: String(parsed.snapshotId),
      model: Object.freeze({
        modelId: String(parsed.model.modelId),
        version: Number(parsed.model.version),
        realityStateId: String(parsed.model.realityStateId),
        workspaceId: String(parsed.model.workspaceId),
        entities: Object.freeze(parsed.model.entities || {}),
        relations: Object.freeze(parsed.model.relations || []),
        inferences: Object.freeze(parsed.model.inferences || []),
        constraints: Object.freeze(parsed.model.constraints || []),
        realityChecksum: String(parsed.model.realityChecksum),
        workspaceChecksum: String(parsed.model.workspaceChecksum),
        modelChecksum: String(parsed.model.modelChecksum),
        graphChecksum: String(parsed.model.graphChecksum),
        syncStatus: parsed.model.syncStatus,
        timestamp: Number(parsed.model.timestamp),
      }),
      reasoningTraces: Object.freeze(parsed.reasoningTraces || []),
      schemaVersion: 'R11_SNAPSHOT_V1',
      timestamp: Number(parsed.timestamp) || Date.now(),
    });
  }
}
