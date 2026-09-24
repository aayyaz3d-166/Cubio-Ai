/**
 * CUBiO AI — Phase 6: Task 82
 * Native Dialogue & Conversation Learning Layer
 * src/cubio/language/native/dialogue/dialogueTypes.ts
 *
 * Universal type contracts, configurations, domain errors, and interfaces
 * for sovereign multi-turn conversational intelligence.
 * Guarantees zero external LLMs, on-demand memory retrieval, strict topic tracking,
 * cross-turn contradiction detection, and epistemic segregation.
 */

import { DEFAULT_TENANT_ID } from '../../../core/canonicalIdentity';
import { EpistemicStatus } from '../../../epistemic/native/epistemicTypes';
import { GroundedClaim, GroundedResponse } from '../generation/generationTypes';

// =============================================================================
// STRUCTURED DOMAIN ERRORS
// =============================================================================

export class DialogueError extends Error {
  public readonly code: string;
  public readonly timestamp: number;

  constructor(message: string, code = 'DIALOGUE_ERROR') {
    super(message);
    this.name = 'DialogueError';
    this.code = code;
    this.timestamp = Date.now();
  }
}

export class UnauthorizedDialogueAccessError extends DialogueError {
  constructor(sessionId: string, callerTenant: string, ownerTenant: string) {
    super(
      `Unauthorized dialogue access: Session "${sessionId}" belongs to tenant "${ownerTenant}", access denied for caller tenant "${callerTenant}".`,
      'UNAUTHORIZED_DIALOGUE_ACCESS'
    );
    this.name = 'UnauthorizedDialogueAccessError';
  }
}

export class DialogueContradictionError extends DialogueError {
  public readonly conflictDetails: ContradictionAlert;

  constructor(conflict: ContradictionAlert) {
    super(
      `Dialogue contradiction detected between Turn ${conflict.priorTurnIndex} and Turn ${conflict.contradictingTurnIndex}: ${conflict.conflictReason}`,
      'DIALOGUE_CONTRADICTION_DETECTED'
    );
    this.name = 'DialogueContradictionError';
    this.conflictDetails = conflict;
  }
}

export class DialogueBudgetExceededError extends DialogueError {
  constructor(message: string) {
    super(message, 'DIALOGUE_BUDGET_EXCEEDED');
    this.name = 'DialogueBudgetExceededError';
  }
}

export class InvalidDialogueStateError extends DialogueError {
  constructor(message: string) {
    super(message, 'INVALID_DIALOGUE_STATE');
    this.name = 'InvalidDialogueStateError';
  }
}

// =============================================================================
// DIALOGUE CONTRACTS & DATA STRUCTURES
// =============================================================================

export type DialogueRole = 'user' | 'assistant' | 'system';

export interface ClarificationRequest {
  readonly reason: string;
  readonly targetEntity?: string;
  readonly ambiguousOptions?: readonly string[];
  readonly clarificationPrompt: string;
}

export interface ContradictionAlert {
  readonly contradictingTurnIndex: number;
  readonly priorTurnIndex: number;
  readonly previousStatement: string;
  readonly newStatement: string;
  readonly conflictReason: string;
  readonly epistemicStatus: EpistemicStatus;
}

export interface DialogueTurn {
  readonly turnId: string;
  readonly turnIndex: number;
  readonly role: DialogueRole;
  readonly utterance: string;
  readonly timestamp: number;
  readonly response?: GroundedResponse;
  readonly topic?: string;
  readonly epistemicStatus: EpistemicStatus;
  readonly extractedClaims: readonly GroundedClaim[];
  readonly memoryReferences: readonly string[];
  readonly isClarificationRequest?: boolean;
  readonly clarificationDetails?: ClarificationRequest;
}

export interface TopicTransition {
  readonly fromTopic?: string;
  readonly toTopic: string;
  readonly atTurnIndex: number;
  readonly timestamp: number;
}

export interface TopicState {
  readonly activeTopic?: string;
  readonly topicHistory: readonly string[];
  readonly transitions: readonly TopicTransition[];
}

export interface DialogueConfig {
  /** Maximum number of previous turns retained in active working context */
  readonly maxActiveTurns: number;
  /** Maximum token budget for active dialogue context */
  readonly maxContextTokens: number;
  /** Minimum relevance score for on-demand memory retrieval (0.0 to 1.0) */
  readonly relevanceThreshold: number;
  /** Threshold under which missing information triggers clarification */
  readonly clarificationThreshold: number;
  /** If true, immediately safe-halts on direct contradiction */
  readonly strictContradictionHalt: boolean;
  /** Time budget for turn processing in milliseconds */
  readonly budgetMs: number;
  /** Seed for deterministic reproducibility */
  readonly seed: number;
  /** If true, automatically consolidates verified turns into sparse memory */
  readonly allowEpisodicConsolidation: boolean;
}

export const DEFAULT_DIALOGUE_CONFIG: DialogueConfig = Object.freeze({
  maxActiveTurns: 10,
  maxContextTokens: 512,
  relevanceThreshold: 0.40,
  clarificationThreshold: 0.50,
  strictContradictionHalt: true,
  budgetMs: 2000,
  seed: 369,
  allowEpisodicConsolidation: false,
});

export interface DialogueSession {
  readonly sessionId: string;
  readonly tenantId: string;
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly topicState: TopicState;
  readonly turns: readonly DialogueTurn[];
  readonly consolidatedMemoryObjectIds: readonly string[];
  readonly activeContradictions: readonly ContradictionAlert[];
}

export interface DialogueSessionSnapshot {
  readonly sessionId: string;
  readonly tenantId: string;
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly turns: readonly DialogueTurn[];
  readonly topicState: TopicState;
  readonly consolidatedMemoryObjectIds: readonly string[];
  readonly contextChecksum: string;
}

export interface ChatOptions {
  readonly tenantId?: string;
  readonly sessionId?: string;
  readonly config?: Partial<DialogueConfig>;
}
