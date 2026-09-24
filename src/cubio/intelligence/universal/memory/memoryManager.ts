/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F56: Master Universal Memory Manager
 *
 * Unified multi-tier context memory retrieval:
 * Working Memory (Tier 1) + Conversation Memory (Tier 2) + Project Memory (Tier 3) + Long-Term Memory (Tier 4).
 */

import { deterministicHash } from '../../../state/determinism';
import {
  ConversationMemoryState,
  ConversationTurn,
  IUniversalMemoryManager,
  LongTermMemoryEntry,
  MemoryRetrievalOptions,
  MemoryRetrievalResult,
  ProjectMemoryState,
} from './types';
import { WorkingMemoryStore } from './workingMemory';
import { ConversationMemoryStore } from './conversationMemory';
import { ProjectMemoryStore } from './projectMemory';
import { LongTermMemoryStore } from './longTermMemory';

export class CubiOUniversalMemoryManager implements IUniversalMemoryManager {
  public readonly workingMemory: WorkingMemoryStore;
  public readonly conversationMemory: ConversationMemoryStore;
  public readonly projectMemory: ProjectMemoryStore;
  public readonly longTermMemory: LongTermMemoryStore;

  constructor() {
    this.workingMemory = new WorkingMemoryStore();
    this.conversationMemory = new ConversationMemoryStore();
    this.projectMemory = new ProjectMemoryStore();
    this.longTermMemory = new LongTermMemoryStore();
  }

  public setWorkingVariable(key: string, value: unknown): void {
    this.workingMemory.set(key, value);
  }

  public getWorkingVariable(key: string): unknown {
    return this.workingMemory.get(key);
  }

  public recordConversationTurn(
    conversationId: string,
    turn: Omit<ConversationTurn, 'turnId' | 'timestamp'>
  ): Readonly<ConversationTurn> {
    return this.conversationMemory.recordTurn(conversationId, turn);
  }

  public getConversationState(conversationId: string): Readonly<ConversationMemoryState> | null {
    return this.conversationMemory.getSession(conversationId);
  }

  public saveLongTermMemory(
    topic: string,
    summary: string,
    payload: unknown = null,
    importance: number = 0.8
  ): Readonly<LongTermMemoryEntry> {
    return this.longTermMemory.saveMemory(topic, summary, payload, importance);
  }

  /**
   * Performs unified multi-tier memory retrieval across all 4 layers.
   */
  public retrieveContext(options: MemoryRetrievalOptions): Readonly<MemoryRetrievalResult> {
    const query = options.query || '';
    const workingState = this.workingMemory.getState();

    // 1. Conversation Memory
    let conversationTurns: readonly ConversationTurn[] = Object.freeze([]);
    if (options.conversationId) {
      conversationTurns = this.conversationMemory.getRecentTurns(options.conversationId, options.maxResults || 5);
    }

    // 2. Project Memory ($D_7$)
    let projectContext: ProjectMemoryState | undefined = undefined;
    if (options.projectId) {
      const p = this.projectMemory.getProjectContext(options.projectId);
      if (p) projectContext = p;
    }

    // 3. Long-Term Memory
    const longTermMemories = options.includeLongTerm !== false
      ? this.longTermMemory.searchMemories(query, 3)
      : Object.freeze([]);

    // 4. Consolidated Prompt Header
    const parts: string[] = [];
    if (conversationTurns.length > 0) {
      parts.push(`Recent Turns: ${conversationTurns.length}`);
    }
    if (projectContext) {
      parts.push(`Project: "${projectContext.goal}"`);
    }
    if (longTermMemories.length > 0) {
      parts.push(`Prior Memories: ${longTermMemories.map((m) => m.topic).join(', ')}`);
    }

    const consolidatedPromptHeader = parts.length > 0
      ? `// [CubiO Memory Context: ${parts.join(' | ')}]`
      : '';

    const relevanceScore = Number(
      (
        (conversationTurns.length > 0 ? 0.4 : 0.0) +
        (projectContext ? 0.3 : 0.0) +
        (longTermMemories.length > 0 ? 0.3 : 0.0)
      ).toFixed(2)
    );

    const retrievalChecksum = deterministicHash(
      `MEM_RETRIEVE:${query}:${conversationTurns.length}:${projectContext ? projectContext.projectId : 'NONE'}:${longTermMemories.length}`
    );

    return Object.freeze({
      query,
      workingContext: workingState.scratchpad,
      conversationTurns,
      projectContext,
      longTermMemories,
      consolidatedPromptHeader,
      relevanceScore,
      retrievalChecksum,
    });
  }
}
