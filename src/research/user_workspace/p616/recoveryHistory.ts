/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.16: Isolated Recovery History Engine
 *
 * Maintains an append-only, chronologically ordered log of recovery lifecycle events.
 * Strictly isolated from Reality, Model, Geometry, and Collaboration history.
 */

import { RecoveryHistoryEntry, RecoveryHistoryEventType } from './types';
import {
  generateDeterministicEventId,
  deterministicHash,
} from './determinism';

export class RecoveryHistoryEngine {
  private history: RecoveryHistoryEntry[] = [];

  public append(
    eventType: RecoveryHistoryEventType,
    recoveryPointId: string,
    workspaceChecksum: string,
    details: string
  ): RecoveryHistoryEntry {
    const sequence = this.history.length;
    const entryId = generateDeterministicEventId(eventType, recoveryPointId, sequence);

    const raw = JSON.stringify([
      entryId,
      eventType,
      recoveryPointId,
      workspaceChecksum,
      details,
      sequence,
    ]);
    const entryChecksum = deterministicHash(raw);

    const entry: RecoveryHistoryEntry = Object.freeze({
      entryId,
      eventType,
      recoveryPointId,
      workspaceChecksum,
      details,
      timestamp: 0,
      entryChecksum,
    });

    this.history.push(entry);
    return entry;
  }

  public getHistory(): readonly RecoveryHistoryEntry[] {
    return Object.freeze([...this.history]);
  }

  public clear(): void {
    this.history = [];
  }
}
