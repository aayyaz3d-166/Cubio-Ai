/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F56: Universal Memory Layer Types
 *
 * Core contracts for 4-tier memory architecture:
 * Tier 1: Working Memory (active scratchpad, temporary variables)
 * Tier 2: Conversation Memory (multi-turn history, entity recall)
 * Tier 3: Project Memory (D7 project context, ADRs, artifacts)
 * Tier 4: Long-Term Memory (cross-session episodic knowledge base)
 */

export type UniversalMemoryTier = 'WORKING' | 'CONVERSATION' | 'PROJECT' | 'LONG_TERM';

export interface MemoryEntry {
  readonly entryId: string;
  readonly tier: UniversalMemoryTier;
  readonly key: string;
  readonly value: unknown;
  readonly tags: readonly string[];
  readonly timestamp: number;
}

export interface WorkingMemoryState {
  readonly scratchpad: Readonly<Record<string, unknown>>;
  readonly activeTokensCount: number;
  readonly currentTurnVariables: Readonly<Record<string, unknown>>;
}

export interface ConversationTurn {
  readonly turnId: string;
  readonly userMessage: string;
  readonly assistantResponse: string;
  readonly intent: string;
  readonly entities: readonly string[];
  readonly timestamp: number;
}

export interface ConversationMemoryState {
  readonly conversationId: string;
  readonly turns: readonly ConversationTurn[];
  readonly userPreferences: Readonly<Record<string, unknown>>;
  readonly entitiesRecognized: readonly string[];
}

export interface ProjectMemoryState {
  readonly projectId: string;
  readonly goal: string;
  readonly activeFiles: readonly string[];
  readonly decisions: readonly string[];
  readonly artifacts: readonly string[];
}

export interface LongTermMemoryEntry {
  readonly memoryId: string;
  readonly topic: string;
  readonly summary: string;
  readonly payload: unknown;
  readonly importance: number; // 0.0 .. 1.0
  readonly episodicHash: string;
  readonly createdAt: number;
}

export interface MemoryRetrievalOptions {
  readonly query: string;
  readonly conversationId?: string;
  readonly projectId?: string;
  readonly includeLongTerm?: boolean;
  readonly maxResults?: number;
}

export interface MemoryRetrievalResult {
  readonly query: string;
  readonly workingContext: Readonly<Record<string, unknown>>;
  readonly conversationTurns: readonly ConversationTurn[];
  readonly projectContext?: ProjectMemoryState;
  readonly longTermMemories: readonly LongTermMemoryEntry[];
  readonly consolidatedPromptHeader: string;
  readonly relevanceScore: number;
  readonly retrievalChecksum: string;
}

export interface IUniversalMemoryManager {
  setWorkingVariable(key: string, value: unknown): void;
  getWorkingVariable(key: string): unknown;
  recordConversationTurn(conversationId: string, turn: Omit<ConversationTurn, 'turnId' | 'timestamp'>): ConversationTurn;
  getConversationState(conversationId: string): ConversationMemoryState | null;
  saveLongTermMemory(topic: string, summary: string, payload?: unknown, importance?: number): LongTermMemoryEntry;
  retrieveContext(options: MemoryRetrievalOptions): MemoryRetrievalResult;
}
