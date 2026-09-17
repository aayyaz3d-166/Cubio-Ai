/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R9: Geometry History Engine
 *
 * Implements append-only, reconstructable history log for geometry operations.
 * Invariant: History is immutable and linear. Every entry links to parent operation.
 */

import {
  GeometryHistoryEntry,
  GeometryOperation,
  GeometryProvenance,
} from './types';
import {
  generateDeterministicHistoryEntryId,
  deterministicHash,
} from './determinism';

export class R9HistoryEngine {
  /**
   * Appends an operation record to history.
   */
  public static appendHistoryEntry(
    sessionId: string,
    operation: GeometryOperation,
    history: readonly GeometryHistoryEntry[],
    geometryStateBefore: readonly string[],
    geometryStateAfter: readonly string[],
    provenance: GeometryProvenance
  ): readonly GeometryHistoryEntry[] {
    const seq = history.length;
    const entryId = generateDeterministicHistoryEntryId(sessionId, seq);
    const parentEntryId = history.length > 0 ? history[history.length - 1].entryId : null;

    const entryChecksum = `HIST_CS_${deterministicHash(
      `${entryId}_${operation.operationChecksum}_${parentEntryId ?? 'ROOT'}_${geometryStateAfter.join('_')}`
    )}`;

    const newEntry: GeometryHistoryEntry = Object.freeze({
      entryId,
      operation,
      parentEntryId,
      geometryStateBefore: Object.freeze([...geometryStateBefore]),
      geometryStateAfter: Object.freeze([...geometryStateAfter]),
      provenance,
      entryChecksum,
    });

    return Object.freeze([...history, newEntry]);
  }

  /**
   * Validates linear parent chaining of a history log.
   */
  public static validateHistoryChain(history: readonly GeometryHistoryEntry[]): boolean {
    for (let i = 1; i < history.length; i++) {
      if (history[i].parentEntryId !== history[i - 1].entryId) {
        return false;
      }
    }
    return true;
  }
}
