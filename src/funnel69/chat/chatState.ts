/**
 * 3D Memory Studio — Funnel 69
 * Chat State Definitions & Listener Types
 */

import { ChatMessage, MessageStatus } from '../types';

export interface ChatStateSnapshot {
  activeProviderId: string | null;
  activeModelId: string | null;
  status: MessageStatus | 'READY' | 'THINKING';
  messages: readonly ChatMessage[];
  renderedMessages: readonly ChatMessage[];
  lastError: string | null;
  canSend: boolean;
  canCancel: boolean;
  canRetry: boolean;
}

export type ChatStateListener = (state: ChatStateSnapshot) => void;
