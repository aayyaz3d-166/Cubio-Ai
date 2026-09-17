/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel F10: Command History Engine
 *
 * Maintains deterministic append-only log of all executed F10 spatial commands.
 */

import { F10HistoryEntry, SpatialCommandPlan } from './types';
import { deterministicHash } from './determinism';

export class F10HistoryEngine {
  private history: F10HistoryEntry[] = [];

  public appendEntry(
    commandId: string,
    plan: SpatialCommandPlan,
    stateBeforeChecksum: string,
    stateAfterChecksum: string
  ): F10HistoryEntry {
    const entryId = `HIST_F10_${deterministicHash(commandId + this.history.length)}`;
    const entryChecksum = `CS_HIST_${deterministicHash(entryId + stateBeforeChecksum + stateAfterChecksum)}`;

    const entry: F10HistoryEntry = {
      entryId,
      commandId,
      plan,
      stateBeforeChecksum,
      stateAfterChecksum,
      timestamp: Date.now(),
      entryChecksum,
    };

    this.history.push(entry);
    return entry;
  }

  public getHistory(): readonly F10HistoryEntry[] {
    return Object.freeze([...this.history]);
  }

  public getEntry(entryId: string): F10HistoryEntry | null {
    return this.history.find((e) => e.entryId === entryId) || null;
  }

  public reset(): void {
    this.history = [];
  }
}
