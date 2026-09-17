/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F25: CubiO Intelligence Context & Conversation Engine (Types & Contracts)
 *
 * Master specification for multi-turn dialogue state tracking,
 * follow-up query resolution, anaphora binding, and rolling context summarization.
 */

import { CubiODimension } from '../../types';

export interface DialogueTurn {
  readonly turnIndex: number;
  readonly turnId: string;
  readonly role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  readonly prompt: string;
  readonly response: string;
  readonly activeDimension: CubiODimension;
  readonly stateId?: string;
  readonly reasoningSteps?: readonly any[];
  readonly entitiesMentioned: readonly string[];
  readonly timestamp: number;
  readonly turnChecksum: string;
}

export interface ConversationThread {
  readonly conversationId: string;
  readonly userId: string;
  readonly title: string;
  readonly activeDimension: CubiODimension;
  readonly turns: readonly DialogueTurn[];
  readonly semanticSummary?: string;
  readonly activeFocusEntities: readonly string[];
  readonly createdTimestamp: number;
  readonly updatedTimestamp: number;
  readonly threadChecksum: string;
}

export interface ResolvedFollowUp {
  readonly originalPrompt: string;
  readonly enrichedPrompt: string;
  readonly isFollowUp: boolean;
  readonly resolvedReferences: readonly { pronoun: string; refersTo: string }[];
  readonly effectiveDimension: CubiODimension;
  readonly contextSummary: string;
  readonly resolutionChecksum: string;
}

export interface ConversationReport {
  readonly reportId: string;
  readonly totalConversations: number;
  readonly totalTurns: number;
  readonly activeConversationsCount: number;
  readonly reportChecksum: string;
}
