/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F67: Rollback Engine & Snapshot Store
 *
 * Implements pre-execution state snapshots and automatic/manual rollback hooks.
 */

import { deterministicHash } from '../../../state/determinism';
import { RollbackSnapshot } from './types';

export class RollbackEngine {
  private snapshots: Map<string, RollbackSnapshot> = new Map();

  public captureSnapshot(actionId: string, stateBefore: unknown): RollbackSnapshot {
    const createdAt = Date.now();
    const snapshotId = `SNAP_${deterministicHash(`${actionId}:${createdAt}:${JSON.stringify(stateBefore)}`).slice(2, 10)}`;

    const snapshot: RollbackSnapshot = Object.freeze({
      snapshotId,
      actionId,
      stateBefore: stateBefore !== undefined ? JSON.parse(JSON.stringify(stateBefore)) : null,
      isReverted: false,
      createdAt,
    });

    this.snapshots.set(snapshotId, snapshot);
    return snapshot;
  }

  public rollback(snapshotId: string): { success: boolean; snapshot: RollbackSnapshot } {
    const existing = this.snapshots.get(snapshotId);
    if (!existing) {
      throw new Error(`Rollback failed: Snapshot "${snapshotId}" does not exist.`);
    }

    const reverted: RollbackSnapshot = Object.freeze({
      ...existing,
      isReverted: true,
    });

    this.snapshots.set(snapshotId, reverted);
    return { success: true, snapshot: reverted };
  }

  public getSnapshot(snapshotId: string): RollbackSnapshot | undefined {
    return this.snapshots.get(snapshotId);
  }
}
