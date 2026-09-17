/**
 * CUBiO AI — Phase 9: Chat & Context Engine
 * contextIntegrity.ts
 *
 * Cryptographic SHA-256 state hashing and integrity verification:
 * - Deterministic hashing of individual canonical turns
 * - Hash generation for assembled context envelopes
 * - Tamper-evident conversation state snapshot checksums
 * - Strict fail-closed verification on corruption or drift
 */

import * as crypto from 'crypto';
import {
  CanonicalTurn,
  ConversationStateSnapshot,
  ContextCompactionRecord,
  ChatEngineError,
  ChatErrorType,
} from './chatEngineContract';

export class ContextIntegrity {
  /**
   * Computes SHA-256 hash of a single canonical turn.
   */
  public static computeTurnHash(turn: Omit<CanonicalTurn, 'integrityHash'>): string {
    const payload = JSON.stringify({
      turnId: turn.turnId,
      conversationId: turn.conversationId,
      sessionId: turn.sessionId,
      sequence: turn.sequence,
      role: turn.role,
      input: turn.input,
      output: turn.output,
      timestamp: turn.timestamp,
      contextReferences: turn.contextReferences,
      memoryReferences: turn.memoryReferences,
      intent: turn.intent,
      reasoningReference: turn.reasoningReference,
      toolReferences: turn.toolReferences,
      epistemicState: turn.epistemicState,
      safetyStatus: turn.safetyStatus,
    });
    return crypto.createHash('sha256').update(payload, 'utf8').digest('hex');
  }

  /**
   * Computes SHA-256 hash for a compaction record.
   */
  public static computeCompactionHash(
    record: Omit<ContextCompactionRecord, 'integrityHash'>
  ): string {
    const payload = JSON.stringify({
      compactionId: record.compactionId,
      timestamp: record.timestamp,
      compactedTurnRange: record.compactedTurnRange,
      originalTurnCount: record.originalTurnCount,
      summaryText: record.summaryText,
      originalTurnIds: record.originalTurnIds,
    });
    return crypto.createHash('sha256').update(payload, 'utf8').digest('hex');
  }

  /**
   * Computes SHA-256 checksum across the entire conversation state snapshot.
   */
  public static computeSnapshotChecksum(
    snapshot: Omit<ConversationStateSnapshot, 'integrityChecksum'>
  ): string {
    const payload = JSON.stringify({
      version: snapshot.version,
      conversationId: snapshot.conversationId,
      tenantId: snapshot.tenantId,
      userId: snapshot.userId,
      activeSessionId: snapshot.activeSessionId,
      createdAt: snapshot.createdAt,
      updatedAt: snapshot.updatedAt,
      turns: snapshot.turns.map((t) => ({
        turnId: t.turnId,
        sequence: t.sequence,
        role: t.role,
        integrityHash: t.integrityHash,
      })),
      constraints: snapshot.constraints,
      compactions: snapshot.compactions,
      memoryStore: snapshot.memoryStore,
      ...(snapshot.intelligentMemories && snapshot.intelligentMemories.length > 0
        ? { intelligentMemories: snapshot.intelligentMemories }
        : {}),
    });
    return crypto.createHash('sha256').update(payload, 'utf8').digest('hex');
  }

  /**
   * Verifies integrity of a loaded snapshot; throws ChatEngineError if invalid.
   */
  public static assertSnapshotIntegrity(snapshot: ConversationStateSnapshot): void {
    const computed = this.computeSnapshotChecksum(snapshot);
    if (computed !== snapshot.integrityChecksum) {
      throw new ChatEngineError(
        `Conversation snapshot integrity checksum mismatch. Expected: ${snapshot.integrityChecksum}, Computed: ${computed}`,
        ChatErrorType.INTEGRITY_CHECK_FAILED
      );
    }

    // Verify turn order sequence monotonicity
    for (let i = 0; i < snapshot.turns.length; i++) {
      const turn = snapshot.turns[i];
      const expectedSeq = i + 1;
      if (turn.sequence !== expectedSeq) {
        throw new ChatEngineError(
          `Turn sequence anomaly at index ${i}: expected sequence ${expectedSeq}, found ${turn.sequence}`,
          ChatErrorType.SEQUENCE_VIOLATION
        );
      }

      // Verify individual turn hash
      const computedTurnHash = this.computeTurnHash(turn);
      if (computedTurnHash !== turn.integrityHash) {
        throw new ChatEngineError(
          `Turn integrity hash mismatch for turnId ${turn.turnId}. Expected: ${turn.integrityHash}, Computed: ${computedTurnHash}`,
          ChatErrorType.INTEGRITY_CHECK_FAILED
        );
      }
    }
  }
}
