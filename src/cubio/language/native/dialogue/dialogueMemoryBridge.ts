/**
 * CUBiO AI — Phase 6: Task 82
 * Native Dialogue & Conversation Learning Layer
 * src/cubio/language/native/dialogue/dialogueMemoryBridge.ts
 *
 * Sovereign Dialogue Memory Bridge.
 * Enforces clean architectural separation between temporary dialogue context
 * and persistent canonical long-term memory.
 * Provides on-demand historical memory retrieval without vector database duplication,
 * and selectively consolidates verified episodic dialogue facts into canonical storage.
 */

import * as crypto from 'crypto';
import { DEFAULT_TENANT_ID } from '../../../core/canonicalIdentity';
import { NativeInformationEngine } from '../../../information/native/nativeInformationEngine';
import { NativeSparseMemoryStore } from '../../../memory/native/sparseMemoryStore';
import { LongContextMemoryManager } from '../long_context/longContextMemoryManager';
import { InjectedMemoryReference } from '../long_context/longContextTypes';
import { DialogueTurn } from './dialogueTypes';

export class DialogueMemoryBridge {
  private readonly _store: NativeSparseMemoryStore;
  private readonly _infoEngine: NativeInformationEngine;
  private readonly _memoryManager: LongContextMemoryManager;

  constructor(
    store?: NativeSparseMemoryStore,
    infoEngine?: NativeInformationEngine,
    memoryManager?: LongContextMemoryManager
  ) {
    this._store = store ?? new NativeSparseMemoryStore();
    this._infoEngine = infoEngine ?? new NativeInformationEngine(this._store);
    this._memoryManager =
      memoryManager ?? new LongContextMemoryManager(this._store, this._infoEngine);
  }

  public get store(): NativeSparseMemoryStore {
    return this._store;
  }

  public get infoEngine(): NativeInformationEngine {
    return this._infoEngine;
  }

  public get memoryManager(): LongContextMemoryManager {
    return this._memoryManager;
  }

  /**
   * Selectively consolidates verified facts from a dialogue turn into persistent canonical memory.
   * Only turns containing verified CANONICAL_FACT claims are stored.
   */
  public consolidateTurnToMemory(
    sessionId: string,
    turn: DialogueTurn,
    tenantId: string = DEFAULT_TENANT_ID
  ): string | null {
    // Only consolidate if turn contains verified claims
    if (!turn.extractedClaims || turn.extractedClaims.length === 0) {
      return null;
    }

    const factualClaims = turn.extractedClaims.filter(
      (c) => c.epistemicStatus === 'CANONICAL_FACT' && c.confidence >= 1.0
    );

    if (factualClaims.length === 0) {
      return null;
    }

    const primarySubject = turn.topic || factualClaims[0].subject;
    const rawContent = factualClaims.slice(0, 2).map((c) => c.statement).join(' ');
    const content = (rawContent || primarySubject).slice(0, 256);

    const objectId = `dialogue_mem_${sessionId}_t${turn.turnIndex}`;

    // Store into InformationEngine and SparseMemoryStore
    this._infoEngine.createInformation(
      {
        objectId,
        tenantId,
        domain: 'KNOWLEDGE',
        cellId: (sessionId.length * 37 + turn.turnIndex) % 343,
        metadata: {
          subject: primarySubject,
          label: `Dialogue Episodic Memory Turn ${turn.turnIndex}`,
          sessionId,
          turnIndex: turn.turnIndex,
          epistemicStatus: 'CANONICAL_FACT',
        },
      },
      {
        modality: 'TEXT',
        content,
        charCount: content.length,
        encoding: 'utf-8',
        tokensCount: Math.ceil(content.length / 4),
        language: 'native',
      }
    );

    return objectId;
  }

  /**
   * Retrieves relevant memory references on demand for a dialogue query.
   * Avoids copying the entire transcript or full vector database into model context.
   */
  public retrieveRelevantMemory(
    queryText: string,
    tenantId: string = DEFAULT_TENANT_ID,
    threshold = 0.40
  ): InjectedMemoryReference[] {
    const memManager =
      tenantId === this._memoryManager.tenantId
        ? this._memoryManager
        : new LongContextMemoryManager(
            this._store,
            this._infoEngine,
            this._memoryManager.ranker,
            { ...this._memoryManager.config, relevanceThreshold: threshold },
            tenantId
          );

    const result = memManager.retrieveRelevantReferences(queryText, { tenantId });
    return [...result.rankedReferences];
  }
}
