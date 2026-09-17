/**
 * 3D Memory Studio — Funnel 69
 * Conversation Manager
 *
 * Manages chat history, active limits (max 100), rendered limits (max 50),
 * and message status updates.
 */

import { ChatMessage, MessageRole, MessageStatus, AIAction } from '../types';
import { MAX_ACTIVE_MESSAGES, MAX_RENDERED_MESSAGES } from '../context/contextLimits';
import { createChatMessage } from './chatMessage';

export class ConversationManager {
  private messages: ChatMessage[] = [];

  public addUserMessage(content: string, timestamp?: number): ChatMessage {
    const msg = createChatMessage({
      role: 'USER',
      content,
      status: 'COMPLETE',
      timestamp,
    });
    this.appendMessage(msg);
    return msg;
  }

  public addAssistantMessage(
    content: string,
    modelId?: string,
    status: MessageStatus = 'PENDING',
    actions?: AIAction[],
    citations?: string[],
    timestamp?: number
  ): ChatMessage {
    const msg = createChatMessage({
      role: 'ASSISTANT',
      content,
      modelId,
      status,
      actions,
      citations,
      timestamp,
    });
    this.appendMessage(msg);
    return msg;
  }

  private appendMessage(msg: ChatMessage): void {
    this.messages.push(msg);
    if (this.messages.length > MAX_ACTIVE_MESSAGES) {
      this.messages = this.messages.slice(-MAX_ACTIVE_MESSAGES);
    }
  }

  public updateMessage(id: string, updates: Partial<ChatMessage>): boolean {
    const idx = this.messages.findIndex((m) => m.id === id);
    if (idx === -1) return false;
    this.messages[idx] = { ...this.messages[idx], ...updates };
    return true;
  }

  public getMessages(): readonly ChatMessage[] {
    return [...this.messages];
  }

  public getRenderedMessages(): readonly ChatMessage[] {
    return this.messages.slice(-MAX_RENDERED_MESSAGES);
  }

  public getLastMessage(): ChatMessage | undefined {
    return this.messages[this.messages.length - 1];
  }

  public getMessageCount(): number {
    return this.messages.length;
  }

  public clear(): void {
    this.messages = [];
  }
}
