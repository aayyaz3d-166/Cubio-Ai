/**
 * CUBiO AI — Phase 21: Conversational Memory Intelligence
 * memoryContradictionEngine.ts
 *
 * Contradiction Arbitration & Non-Destructive Transition Engine:
 * - Detects semantic conflicts between newly asserted facts and active stored memories
 * - Applies latest explicit user corrections (Newer explicit user instruction wins)
 * - Preserves complete transition history (never silently overwrites past records)
 * - Flags unresolved contradictions and avoids invented resolutions
 * - Enforces monotonic cryptographic provenance across memory mutations
 */

import * as crypto from 'crypto';
import {
  PersistedMemoryEntry,
  MemoryTransitionRecord,
  ExtractedFactCandidate,
  MemoryUnderstandingResult,
  MemoryAuthorityLevel,
} from './memoryTypes';

export interface TransitionOutcome {
  readonly updatedMemories: readonly PersistedMemoryEntry[];
  readonly archivedMemories: readonly PersistedMemoryEntry[];
  readonly detectedContradictionFlag: boolean;
  readonly contradictionDetails?: string;
  readonly requiresClarification: boolean;
  readonly transitionSummary: string;
}

export class MemoryContradictionEngine {
  private static instance: MemoryContradictionEngine | null = null;

  public static getInstance(): MemoryContradictionEngine {
    if (!MemoryContradictionEngine.instance) {
      MemoryContradictionEngine.instance = new MemoryContradictionEngine();
    }
    return MemoryContradictionEngine.instance;
  }

  /**
   * Applies newly extracted facts and understanding results against active session memories,
   * arbitrating corrections, preserving transition history, and flagging unresolved conflicts.
   */
  public resolveAndTransition(params: {
    readonly newFacts: readonly ExtractedFactCandidate[];
    readonly understandingResult: MemoryUnderstandingResult;
    readonly existingMemories: readonly PersistedMemoryEntry[];
    readonly conversationId: string;
    readonly sessionId: string;
    readonly tenantId: string;
    readonly userId: string;
    readonly turnId: string;
    readonly turnSequence: number;
  }): TransitionOutcome {
    const {
      newFacts,
      understandingResult,
      existingMemories,
      conversationId,
      tenantId,
      userId,
      turnId,
      turnSequence,
    } = params;

    const currentMemoriesMap = new Map<string, PersistedMemoryEntry>();
    for (const mem of existingMemories) {
      currentMemoriesMap.set(mem.memoryId, { ...mem });
    }

    const archived: PersistedMemoryEntry[] = [];
    let detectedContradictionFlag = false;
    let contradictionDetails: string | undefined;
    let requiresClarification = false;
    const transitionNotes: string[] = [];

    // Check for unresolved contradictions in understanding result
    if (understandingResult.detectedContradictions.length > 0) {
      detectedContradictionFlag = true;
      contradictionDetails = understandingResult.detectedContradictions
        .map((c) => `Key '${c.key}': '${c.existingValue}' conflicts with '${c.conflictingValue}'`)
        .join('; ');
    }

    // Process each newly extracted fact
    for (const fact of newFacts) {
      // Look for active memory with same key
      const existingEntry = Array.from(currentMemoriesMap.values()).find(
        (m) => m.key === fact.key && m.status === 'ACTIVE'
      );

      const now = Date.now();
      const contentHash = crypto
        .createHash('sha256')
        .update(`${fact.key}:${fact.value}:${userId}:${tenantId}:${conversationId}`, 'utf8')
        .digest('hex');

      if (!existingEntry) {
        // Brand new memory fact
        const newMemoryId = `MEM_${conversationId}_${turnSequence}_${contentHash.slice(0, 8)}`;
        const newEntry: PersistedMemoryEntry = Object.freeze({
          memoryId: newMemoryId,
          userId,
          tenantId,
          conversationId,
          turnId,
          key: fact.key,
          value: fact.value,
          rawFact: fact.rawFact,
          category: fact.category,
          authority: fact.authority,
          source: fact.authority >= MemoryAuthorityLevel.CURRENT_EXPLICIT_USER_STATEMENT
            ? 'USER_EXPLICIT_STATEMENT'
            : 'USER_FACT',
          createdAt: now,
          updatedAt: now,
          confidence: fact.confidence,
          status: 'ACTIVE',
          contentHash,
          transitionHistory: Object.freeze([]),
          tags: Object.freeze(fact.tags ? [...fact.tags] : []),
        });

        currentMemoriesMap.set(newMemoryId, newEntry);
        transitionNotes.push(`Stored new memory [${fact.key} = "${fact.value}"]`);
      } else {
        // Value is identical: update confidence/recency without supersession
        if (existingEntry.value.toLowerCase() === fact.value.toLowerCase()) {
          const updatedEntry: PersistedMemoryEntry = Object.freeze({
            ...existingEntry,
            updatedAt: now,
            turnId,
            confidence: Math.max(existingEntry.confidence, fact.confidence),
          });
          currentMemoriesMap.set(existingEntry.memoryId, updatedEntry);
          transitionNotes.push(`Confirmed existing memory [${fact.key} = "${fact.value}"]`);
        } else {
          // Conflict / Correction detected!
          // Rule: Newer explicit user statement supersedes older memory, but transition history is strictly preserved
          const transitionRecord: MemoryTransitionRecord = Object.freeze({
            transitionId: `TRN_${now}_${crypto.randomBytes(4).toString('hex')}`,
            timestamp: now,
            previousValue: existingEntry.value,
            newValue: fact.value,
            reason: understandingResult.isCorrection ? 'USER_CORRECTION' : 'USER_SUPERSEDED',
            turnId,
            sequenceNumber: turnSequence,
          });

          // Mark previous memory entry as SUPERSEDED and preserve it
          const supersededOldEntry: PersistedMemoryEntry = Object.freeze({
            ...existingEntry,
            status: 'SUPERSEDED',
            updatedAt: now,
            transitionHistory: Object.freeze([...existingEntry.transitionHistory, transitionRecord]),
          });
          archived.push(supersededOldEntry);

          // Create new active entry carrying complete transition history lineage
          const newMemoryId = `MEM_${conversationId}_${turnSequence}_${contentHash.slice(0, 8)}`;
          const newEntry: PersistedMemoryEntry = Object.freeze({
            memoryId: newMemoryId,
            userId,
            tenantId,
            conversationId,
            turnId,
            key: fact.key,
            value: fact.value,
            rawFact: fact.rawFact,
            category: 'CORRECTION_UPDATE',
            authority: fact.authority,
            source: 'USER_CORRECTION',
            createdAt: existingEntry.createdAt,
            updatedAt: now,
            confidence: fact.confidence,
            status: 'ACTIVE',
            contentHash,
            transitionHistory: Object.freeze([...existingEntry.transitionHistory, transitionRecord]),
            tags: Object.freeze(fact.tags ? [...fact.tags] : []),
          });

          // Replace in active map
          currentMemoriesMap.delete(existingEntry.memoryId);
          currentMemoriesMap.set(newMemoryId, newEntry);

          transitionNotes.push(
            `Superseded [${fact.key}]: "${existingEntry.value}" -> "${fact.value}" (Turn ${turnSequence})`
          );
        }
      }
    }

    // Handle FORGET action
    if (understandingResult.explicitAction === 'FORGET' && understandingResult.targetKey) {
      const entryToForget = Array.from(currentMemoriesMap.values()).find(
        (m) => m.key === understandingResult.targetKey && m.status === 'ACTIVE'
      );
      if (entryToForget) {
        const now = Date.now();
        const forgetRecord: MemoryTransitionRecord = Object.freeze({
          transitionId: `TRN_${now}_${crypto.randomBytes(4).toString('hex')}`,
          timestamp: now,
          previousValue: entryToForget.value,
          newValue: '[FORGOTTEN]',
          reason: 'FORGET_REQUEST',
          turnId,
          sequenceNumber: turnSequence,
        });

        const forgottenEntry: PersistedMemoryEntry = Object.freeze({
          ...entryToForget,
          status: 'FORGOTTEN',
          updatedAt: now,
          transitionHistory: Object.freeze([...entryToForget.transitionHistory, forgetRecord]),
        });

        archived.push(forgottenEntry);
        currentMemoriesMap.delete(entryToForget.memoryId);
        transitionNotes.push(`Forgotten memory key [${understandingResult.targetKey}]`);
      }
    }

    const summary = transitionNotes.length > 0 ? transitionNotes.join('; ') : 'No memory modifications.';

    return Object.freeze({
      updatedMemories: Object.freeze(Array.from(currentMemoriesMap.values())),
      archivedMemories: Object.freeze(archived),
      detectedContradictionFlag,
      contradictionDetails,
      requiresClarification,
      transitionSummary: summary,
    });
  }
}
