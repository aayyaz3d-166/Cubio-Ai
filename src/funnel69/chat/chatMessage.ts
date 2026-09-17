/**
 * 3D Memory Studio — Funnel 69
 * Chat Message Model & Factory
 */

import { ChatMessage, MessageRole, MessageStatus, AIAction } from '../types';

let messageCounter = 0;

export function resetMessageCounter(): void {
  messageCounter = 0;
}

export function createChatMessage(options: {
  role: MessageRole;
  content: string;
  modelId?: string;
  status?: MessageStatus;
  actions?: AIAction[];
  citations?: string[];
  id?: string;
  timestamp?: number;
}): ChatMessage {
  messageCounter++;
  return {
    id: options.id ?? `msg-${String(messageCounter).padStart(4, '0')}`,
    role: options.role,
    content: options.content,
    timestamp: options.timestamp ?? Date.now(),
    modelId: options.modelId,
    status: options.status ?? 'COMPLETE',
    actions: options.actions,
    citations: options.citations,
  };
}
