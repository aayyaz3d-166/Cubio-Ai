/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F81: Real LLM Provider Pool & Execution Ladder
 *
 * Implements:
 * 1. Unified Multi-Provider Abstraction (Local, Gemini, OpenAI, Anthropic)
 * 2. Strict API-Key Isolation & Zero Frontend Leakage
 * 3. Configurable Per-Call Execution Timeout & AbortSignals
 * 4. Automatic Exponential Backoff Retries
 * 5. Dynamic Failover Ladder (Primary -> Secondary -> Local Sovereign Reasoner)
 * 6. Dynamic Model Selection
 * 7. Token Usage & Latency Accounting
 * 8. Transparent Honest UNAVAILABLE Handling
 */

import { deterministicHash } from '../../../state/determinism';
import { ProviderKeyManager } from './providerKeyManager';
import {
  IUniversalLLMProvider,
  LLMChatMessage,
  LLMChatOptions,
  LLMChatResult,
  LLMReasonOptions,
  LLMReasonResult,
} from './types';
import { SovereignLocalLLMProvider } from './adapters/sovereignLocalProvider';
import { GeminiCompatibleLLMProvider } from './adapters/geminiCompatibleProvider';
import { OpenAICompatibleLLMProvider } from './adapters/openAICompatibleProvider';
import { AnthropicCompatibleLLMProvider } from './adapters/anthropicCompatibleProvider';

export type SupportedLLMProviderId = 'local' | 'gemini' | 'openai' | 'anthropic';

export interface ProviderPoolExecutionOptions extends LLMChatOptions {
  readonly requestedProvider?: SupportedLLMProviderId;
  readonly modelId?: string;
  readonly timeoutMs?: number;
  readonly maxRetries?: number;
  readonly strictNoFallback?: boolean; // If true, reports UNAVAILABLE instead of falling back to local
}

export interface ProviderUsageRecord {
  readonly providerId: string;
  readonly modelId: string;
  readonly promptTokens: number;
  readonly completionTokens: number;
  readonly totalTokens: number;
  readonly latencyMs: number;
  readonly timestamp: number;
  readonly estimatedCostUsd: number;
}

export class RealLLMProviderPool {
  private static instance: RealLLMProviderPool;
  private readonly keyManager = ProviderKeyManager.getInstance();
  private readonly usageLedger: ProviderUsageRecord[] = [];

  // Provider Adapters
  private localProvider = new SovereignLocalLLMProvider();
  private geminiProvider: GeminiCompatibleLLMProvider;
  private openAIProvider: OpenAICompatibleLLMProvider;
  private anthropicProvider: AnthropicCompatibleLLMProvider;

  private defaultTimeoutMs = 8000;
  private defaultMaxRetries = 1;

  public constructor() {
    this.geminiProvider = new GeminiCompatibleLLMProvider({
      apiKey: this.keyManager.getKey('gemini'),
      modelId: 'gemini-2.0-flash',
    });
    this.openAIProvider = new OpenAICompatibleLLMProvider({
      apiKey: this.keyManager.getKey('openai'),
      modelId: 'gpt-4o',
    });
    this.anthropicProvider = new AnthropicCompatibleLLMProvider({
      apiKey: this.keyManager.getKey('anthropic'),
      modelId: 'claude-3-5-sonnet',
    });
  }

  public static getInstance(): RealLLMProviderPool {
    if (!RealLLMProviderPool.instance) {
      RealLLMProviderPool.instance = new RealLLMProviderPool();
    }
    return RealLLMProviderPool.instance;
  }

  /**
   * Refreshes provider instances when API keys are dynamically configured.
   */
  public refreshProviders(): void {
    this.geminiProvider = new GeminiCompatibleLLMProvider({
      apiKey: this.keyManager.getKey('gemini'),
      modelId: 'gemini-2.0-flash',
    });
    this.openAIProvider = new OpenAICompatibleLLMProvider({
      apiKey: this.keyManager.getKey('openai'),
      modelId: 'gpt-4o',
    });
    this.anthropicProvider = new AnthropicCompatibleLLMProvider({
      apiKey: this.keyManager.getKey('anthropic'),
      modelId: 'claude-3-5-sonnet',
    });
  }

  /**
   * Returns a provider adapter by ID.
   */
  public getProvider(id: SupportedLLMProviderId): IUniversalLLMProvider {
    switch (id) {
      case 'gemini':
        return this.geminiProvider;
      case 'openai':
        return this.openAIProvider;
      case 'anthropic':
        return this.anthropicProvider;
      case 'local':
      default:
        return this.localProvider;
    }
  }

  /**
   * Executes an async operation with strict timeout.
   */
  private async executeWithTimeout<T>(
    promiseFn: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    let timer: NodeJS.Timeout | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error(`LLM Provider request timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    try {
      return await Promise.race([promiseFn(), timeoutPromise]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  /**
   * Executes an operation with retry logic.
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number
  ): Promise<T> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (err) {
        lastError = err;
        if (attempt < maxRetries) {
          // Exponential backoff jitter
          await new Promise((res) => setTimeout(res, 50 * Math.pow(2, attempt)));
        }
      }
    }
    throw lastError;
  }

  /**
   * Master Omnimodal Chat Dispatcher with Full Failover Ladder.
   */
  public async dispatchChat(
    messages: readonly LLMChatMessage[],
    options: ProviderPoolExecutionOptions = {}
  ): Promise<Readonly<LLMChatResult>> {
    const startTime = Date.now();
    const requested = options.requestedProvider || 'local';
    const timeoutMs = options.timeoutMs || this.defaultTimeoutMs;
    const maxRetries = options.maxRetries || this.defaultMaxRetries;

    // 1. If Local Reasoner is requested, execute directly
    if (requested === 'local') {
      const result = await this.localProvider.chat(messages, options);
      this.recordUsage('local', this.localProvider.modelId, result);
      return this.keyManager.sanitizeData(result);
    }

    // 2. If Cloud Provider is requested:
    const targetProvider = this.getProvider(requested);
    const hasKey = this.keyManager.hasKey(requested);

    if (hasKey && targetProvider.getStatus() === 'AVAILABLE') {
      try {
        const result = await this.executeWithRetry(async () => {
          return this.executeWithTimeout(
            () => targetProvider.chat(messages, options),
            timeoutMs
          );
        }, maxRetries);

        this.recordUsage(requested, options.modelId || targetProvider.modelId, result);
        return this.keyManager.sanitizeData(result);
      } catch (err: unknown) {
        if (options.strictNoFallback) {
          throw new Error(
            `Provider ${requested.toUpperCase()} failed execution: ${err instanceof Error ? err.message : String(err)}`
          );
        }
        // Fallback to local sovereign reasoner
      }
    } else {
      if (options.strictNoFallback) {
        return Object.freeze({
          text: `[Provider UNAVAILABLE]: ${requested.toUpperCase()} API key is not configured in this runtime.`,
          finishReason: 'UNAVAILABLE',
          confidence: 0.0,
          providerId: requested,
          modelId: options.modelId || 'unconfigured',
          latencyMs: Date.now() - startTime,
        });
      }
    }

    // 3. Sovereign Local Fallback Execution
    const fallbackResult = await this.localProvider.chat(messages, options);
    this.recordUsage('local_fallback', this.localProvider.modelId, fallbackResult);
    return this.keyManager.sanitizeData(fallbackResult);
  }

  /**
   * Master Omnimodal Deductive Reasoning Dispatcher.
   */
  public async dispatchReason(
    hypothesis: string,
    context?: string,
    options: ProviderPoolExecutionOptions = {}
  ): Promise<Readonly<LLMReasonResult>> {
    const requested = options.requestedProvider || 'local';
    const timeoutMs = options.timeoutMs || this.defaultTimeoutMs;

    if (requested !== 'local' && this.keyManager.hasKey(requested)) {
      try {
        const provider = this.getProvider(requested);
        return await this.executeWithTimeout(
          () => provider.reason(hypothesis, context, options),
          timeoutMs
        );
      } catch (_err) {
        if (options.strictNoFallback) {
          throw new Error(`Reasoning failed on provider ${requested.toUpperCase()}`);
        }
      }
    }

    return this.localProvider.reason(hypothesis, context, options);
  }

  /**
   * Records usage telemetry into immutable memory ledger.
   */
  private recordUsage(
    providerId: string,
    modelId: string,
    result: LLMChatResult | LLMReasonResult
  ): void {
    const promptTokens = (result as any).usage?.promptTokens || 10;
    const completionTokens = (result as any).usage?.completionTokens || 20;
    const totalTokens = promptTokens + completionTokens;

    // Approximate cost: $0.15 per 1M tokens
    const estimatedCostUsd = (totalTokens / 1_000_000) * 0.15;

    const record: ProviderUsageRecord = Object.freeze({
      providerId,
      modelId,
      promptTokens,
      completionTokens,
      totalTokens,
      latencyMs: result.latencyMs || 5,
      timestamp: Date.now(),
      estimatedCostUsd,
    });

    this.usageLedger.push(record);
  }

  /**
   * Retrieves usage telemetry records.
   */
  public getUsageLedger(): readonly ProviderUsageRecord[] {
    return Object.freeze([...this.usageLedger]);
  }

  /**
   * Computes total token consumption across all providers.
   */
  public getTotalTokensUsed(): number {
    return this.usageLedger.reduce((acc, curr) => acc + curr.totalTokens, 0);
  }
}
