/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R8: Interaction History Engine
 *
 * Append-only deterministic interaction history tracking all operations.
 */

import {
  InteractionHistoryEntry,
  InteractionOperation,
  InteractionOperationType,
  WorkspaceTransform,
  InteractionProvenance,
} from './types';
import {
  generateDeterministicHistoryEntryId,
  generateDeterministicOperationId,
  deterministicHash,
} from './determinism';

export class R8HistoryEngine {
  public static createOperation(
    sessionId: string,
    opType: InteractionOperationType,
    targetObjectIds: readonly string[],
    delta: WorkspaceTransform | undefined,
    seq = 0
  ): InteractionOperation {
    const operationId = generateDeterministicOperationId(sessionId, opType, seq);
    const operationChecksum = `CS_OP_${deterministicHash(
      JSON.stringify([operationId, opType, [...targetObjectIds], seq])
    )}`;

    return Object.freeze({
      operationId,
      operationType: opType,
      targetObjectIds: Object.freeze([...targetObjectIds]),
      delta,
      timestamp: 0,
      operationChecksum,
    });
  }

  public static createEntry(
    sessionId: string,
    operation: InteractionOperation,
    parentEntryId: string | null,
    stateBefore: Readonly<Record<string, WorkspaceTransform>>,
    stateAfter: Readonly<Record<string, WorkspaceTransform>>,
    selectionBefore: readonly string[],
    selectionAfter: readonly string[],
    provenance: InteractionProvenance,
    seq = 0
  ): InteractionHistoryEntry {
    const entryId = generateDeterministicHistoryEntryId(sessionId, seq);
    const entryChecksum = `CS_ENTRY_${deterministicHash(
      JSON.stringify([entryId, operation.operationId, parentEntryId, seq])
    )}`;

    return Object.freeze({
      entryId,
      operation,
      parentEntryId,
      stateBefore: Object.freeze({ ...stateBefore }),
      stateAfter: Object.freeze({ ...stateAfter }),
      selectionBefore: Object.freeze([...selectionBefore]),
      selectionAfter: Object.freeze([...selectionAfter]),
      provenance,
      entryChecksum,
    });
  }

  public static appendToHistory(
    history: readonly InteractionHistoryEntry[],
    entry: InteractionHistoryEntry
  ): readonly InteractionHistoryEntry[] {
    return Object.freeze([...history, entry]);
  }
}
