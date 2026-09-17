/**
 * 3D Memory Studio — Funnel 69
 * Chat Controller
 *
 * Orchestrates conversation history, model selection, request execution,
 * streaming updates, retry, cancellation, and subscriber notifications.
 */

import { ConversationManager } from './conversationManager';
import { ModelRegistry } from '../models/modelRegistry';
import { AIRequestRouter } from '../router/aiRequestRouter';
import { ChatStateSnapshot, ChatStateListener } from './chatState';
import { MessageStatus } from '../types';

export class ChatController {
  public readonly conversation: ConversationManager;
  public readonly registry: ModelRegistry;
  public readonly router: AIRequestRouter;

  private status: MessageStatus | 'READY' | 'THINKING' = 'READY';
  private lastError: string | null = null;
  private readonly listeners: Set<ChatStateListener> = new Set();

  constructor(options?: {
    conversation?: ConversationManager;
    registry?: ModelRegistry;
    router?: AIRequestRouter;
  }) {
    this.conversation = options?.conversation ?? new ConversationManager();
    this.registry = options?.registry ?? new ModelRegistry();
    this.router =
      options?.router ??
      new AIRequestRouter({
        modelRegistry: this.registry,
      });
  }

  public getSnapshot(): ChatStateSnapshot {
    const isProcessing = this.router.getIsProcessing();
    return {
      activeProviderId: this.registry.getActiveProviderId(),
      activeModelId: this.registry.getActiveModelId(),
      status: this.status,
      messages: this.conversation.getMessages(),
      renderedMessages: this.conversation.getRenderedMessages(),
      lastError: this.lastError,
      canSend: !isProcessing && this.status !== 'STREAMING',
      canCancel: isProcessing || this.status === 'STREAMING' || this.status === 'THINKING',
      canRetry: !isProcessing && this.router.getLastPrompt() !== null,
    };
  }

  public subscribe(listener: ChatStateListener): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const snap = this.getSnapshot();
    for (const listener of this.listeners) {
      listener(snap);
    }
  }

  public async sendMessage(prompt: string, targetStateId?: string): Promise<boolean> {
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt) return false;

    // Add user message
    this.conversation.addUserMessage(cleanPrompt);
    this.lastError = null;
    this.status = 'THINKING';
    this.notify();

    // Create placeholder assistant message
    const activeModel = this.registry.getActiveModel();
    const assistantMsg = this.conversation.addAssistantMessage(
      '',
      activeModel?.id,
      'PENDING'
    );
    this.notify();

    try {
      this.status = 'STREAMING';
      this.conversation.updateMessage(assistantMsg.id, { status: 'STREAMING' });
      this.notify();

      let streamAccumulator = '';
      const response = await this.router.send(cleanPrompt, {
        targetStateId,
        onChunk: (chunk) => {
          streamAccumulator = chunk;
          this.conversation.updateMessage(assistantMsg.id, {
            content: streamAccumulator,
            status: 'STREAMING',
          });
          this.notify();
        },
      });

      this.conversation.updateMessage(assistantMsg.id, {
        content: response.text,
        status: (response.metadata?.status as MessageStatus) ?? 'COMPLETE',
        actions: response.actions,
        citations: response.citations,
      });

      this.status = (response.metadata?.status as MessageStatus) ?? 'COMPLETE';
      this.notify();
      return true;
    } catch (err: any) {
      const errorMsg = err?.message ?? 'An unknown error occurred';
      this.lastError = errorMsg;
      this.status = 'ERROR';
      this.conversation.updateMessage(assistantMsg.id, {
        content: `Error: ${errorMsg}`,
        status: 'ERROR',
        error: errorMsg,
      });
      this.notify();
      return false;
    }
  }

  public cancel(): boolean {
    const cancelled = this.router.cancel();
    if (cancelled) {
      this.status = 'CANCELLED';
      const lastMsg = this.conversation.getLastMessage();
      if (lastMsg && lastMsg.role === 'ASSISTANT' && (lastMsg.status === 'PENDING' || lastMsg.status === 'STREAMING')) {
        this.conversation.updateMessage(lastMsg.id, {
          content: lastMsg.content || 'Request cancelled by user.',
          status: 'CANCELLED',
        });
      }
      this.notify();
    }
    return cancelled;
  }

  public async retry(): Promise<boolean> {
    const lastPrompt = this.router.getLastPrompt();
    if (!lastPrompt) return false;
    return this.sendMessage(lastPrompt);
  }

  public selectProvider(providerId: string): boolean {
    const ok = this.registry.setActiveProvider(providerId);
    if (ok) this.notify();
    return ok;
  }

  public selectModel(modelId: string): boolean {
    const ok = this.registry.setActiveModel(modelId);
    if (ok) this.notify();
    return ok;
  }

  public clear(): void {
    this.conversation.clear();
    this.lastError = null;
    this.status = 'READY';
    this.notify();
  }
}
