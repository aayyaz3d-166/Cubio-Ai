/**
 * 3D Memory Studio — Funnel 69
 * AI Request Router
 *
 * Coordinates request dispatch, security verification, context building,
 * provider execution, streaming, cancellation, and action execution.
 */

import { ModelRegistry } from '../models/modelRegistry';
import { AIContextBuilder } from '../context/aiContextBuilder';
import { AIActionRouter } from './aiActionRouter';
import { SecurityAIAdapter, RESTRICTED_NOTICE } from '../adapters/securityAIAdapter';
import { AIResponse, MessageStatus } from '../types';
import { MAX_QUERY_LENGTH } from '../context/contextLimits';

export interface RequestRouterOptions {
  modelRegistry?: ModelRegistry;
  contextBuilder?: AIContextBuilder;
  actionRouter?: AIActionRouter;
  security?: SecurityAIAdapter;
}

export class AIRequestRouter {
  public readonly modelRegistry: ModelRegistry;
  public readonly contextBuilder: AIContextBuilder;
  public readonly actionRouter: AIActionRouter;
  public readonly security: SecurityAIAdapter;

  private activeAbortController: AbortController | null = null;
  private isProcessing = false;
  private lastPrompt: string | null = null;

  constructor(options?: RequestRouterOptions) {
    this.modelRegistry = options?.modelRegistry ?? new ModelRegistry();
    this.contextBuilder = options?.contextBuilder ?? new AIContextBuilder();
    this.actionRouter = options?.actionRouter ?? new AIActionRouter();
    this.security = options?.security ?? new SecurityAIAdapter();
  }

  public getIsProcessing(): boolean {
    return this.isProcessing;
  }

  public getLastPrompt(): string | null {
    return this.lastPrompt;
  }

  public async send(
    prompt: string,
    options?: {
      onChunk?: (chunk: string) => void;
      targetStateId?: string;
    }
  ): Promise<AIResponse> {
    if (this.isProcessing) {
      throw new Error('Concurrent requests blocked: maximum 1 active request.');
    }

    const cleanPrompt = prompt.slice(0, MAX_QUERY_LENGTH).trim();
    if (!cleanPrompt) {
      throw new Error('Prompt cannot be empty.');
    }

    this.lastPrompt = cleanPrompt;
    this.isProcessing = true;
    this.activeAbortController = new AbortController();
    const signal = this.activeAbortController.signal;

    try {
      // 1. Security Check
      const promptCheck = this.security.sanitizePrompt(cleanPrompt);
      if (!promptCheck.isClean) {
        return {
          text: RESTRICTED_NOTICE,
          metadata: { restricted: true },
        };
      }

      // 2. Provider & Model Check
      const provider = this.modelRegistry.getActiveProvider();
      const model = this.modelRegistry.getActiveModel();

      if (!provider || provider.status === 'NOT_CONFIGURED') {
        throw new Error('MODEL NOT CONFIGURED');
      }
      if (provider.status === 'UNAVAILABLE') {
        throw new Error('PROVIDER UNAVAILABLE');
      }
      if (provider.status === 'ERROR') {
        throw new Error('PROVIDER ERROR');
      }
      if (!model) {
        throw new Error('MODEL NOT CONFIGURED: No model selected.');
      }

      // 3. Build Context
      const context = await this.contextBuilder.buildContext(cleanPrompt, options?.targetStateId);

      if (context.classification === 'RED') {
        return {
          text: RESTRICTED_NOTICE,
          metadata: { restricted: true },
        };
      }

      // 4. Dispatch to Provider
      const messages = [
        { role: 'system', content: context.formattedPromptContext },
        { role: 'user', content: cleanPrompt },
      ];

      const response = await provider.request(messages, {
        modelId: model.id,
        signal,
        onChunk: options?.onChunk,
      });

      // 5. Execute Structured Actions if any
      if (response.actions && response.actions.length > 0) {
        await this.actionRouter.executeActions(response.actions);
      }

      return response;
    } catch (err: any) {
      if (err?.name === 'AbortError' || signal.aborted) {
        return {
          text: 'Request was cancelled by user.',
          metadata: { status: 'CANCELLED' as MessageStatus },
        };
      }
      throw err;
    } finally {
      this.isProcessing = false;
      this.activeAbortController = null;
    }
  }

  public cancel(): boolean {
    if (this.activeAbortController && this.isProcessing) {
      this.activeAbortController.abort();
      this.isProcessing = false;
      return true;
    }
    return false;
  }

  public async retry(options?: {
    onChunk?: (chunk: string) => void;
    targetStateId?: string;
  }): Promise<AIResponse> {
    if (!this.lastPrompt) {
      throw new Error('No previous request to retry.');
    }
    return this.send(this.lastPrompt, options);
  }

  public selectProvider(providerId: string): boolean {
    return this.modelRegistry.setActiveProvider(providerId);
  }

  public selectModel(modelId: string): boolean {
    return this.modelRegistry.setActiveModel(modelId);
  }
}
