/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel F10: Conversation State Manager
 *
 * Manages deterministic conversational history, active pronoun resolution targets,
 * and explanation records.
 */

import { AIConversationMessage, AIExplanation } from './types';
import { generateDeterministicMessageId, computeConversationChecksum } from './determinism';

export class F10ConversationStateManager {
  private messages: AIConversationMessage[] = [];
  private activeTargetId: string | null = null;
  private lastCreatedId: string | null = null;
  private readonly sessionId: string;
  private messageSeq = 0;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  public addUserMessage(text: string): AIConversationMessage {
    this.messageSeq++;
    const msg: AIConversationMessage = {
      messageId: generateDeterministicMessageId(this.sessionId, this.messageSeq),
      sender: 'USER',
      text,
      timestamp: Date.now(),
    };
    this.messages.push(msg);
    return msg;
  }

  public addAIMessage(
    text: string,
    commandPlanId?: string | null,
    explanation?: AIExplanation | null
  ): AIConversationMessage {
    this.messageSeq++;
    const msg: AIConversationMessage = {
      messageId: generateDeterministicMessageId(this.sessionId, this.messageSeq),
      sender: 'REALITY_AI',
      text,
      timestamp: Date.now(),
      commandPlanId: commandPlanId || null,
      explanation: explanation || null,
    };
    this.messages.push(msg);
    return msg;
  }

  public getMessages(): readonly AIConversationMessage[] {
    return Object.freeze([...this.messages]);
  }

  public getActiveTargetId(): string | null {
    return this.activeTargetId;
  }

  public setActiveTargetId(id: string | null): void {
    this.activeTargetId = id;
  }

  public getLastCreatedId(): string | null {
    return this.lastCreatedId;
  }

  public setLastCreatedId(id: string | null): void {
    this.lastCreatedId = id;
    if (id) this.activeTargetId = id; // New creation automatically becomes active target
  }

  public getConversationChecksum(): string {
    const lastId = this.messages.length > 0 ? this.messages[this.messages.length - 1].messageId : 'EMPTY';
    return computeConversationChecksum(this.messages.length, lastId);
  }

  public reset(): void {
    this.messages = [];
    this.activeTargetId = null;
    this.lastCreatedId = null;
    this.messageSeq = 0;
  }
}
