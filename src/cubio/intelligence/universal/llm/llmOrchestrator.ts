/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 2 (F47): Master Universal LLM Orchestrator
 *
 * Orchestrates multiple pluggable LLM providers behind a single unified interface.
 * Supports dynamic provider hot-swapping, automatic failover ladders, and full
 * capability coverage across all 7 LLM intelligence modes.
 */

import { LanguageCode } from '../universalTypes';
import {
  IUniversalLLMProvider,
  LLMChatMessage,
  LLMChatOptions,
  LLMChatResult,
  LLMReasonOptions,
  LLMReasonResult,
  LLMSummarizeOptions,
  LLMSummarizeResult,
  LLMPlanOptions,
  LLMPlanResult,
  LLMAnalyzeOptions,
  LLMAnalyzeResult,
  LLMJsonSchema,
  LLMStructuredOptions,
  LLMStructuredResult,
  LLMMultilingualOptions,
  LLMMultilingualResult,
} from './types';
import { SovereignLocalLLMProvider } from './adapters/sovereignLocalProvider';
import { GeminiCompatibleLLMProvider } from './adapters/geminiCompatibleProvider';
import { OpenAICompatibleLLMProvider } from './adapters/openAICompatibleProvider';
import { AnthropicCompatibleLLMProvider } from './adapters/anthropicCompatibleProvider';
import { CubiOProviderRegistry } from '../providerRegistry';
import { RealLLMProviderPool } from './realLLMProviderPool';
import { ProviderKeyManager } from './providerKeyManager';

export class CubiOLLMOrchestrator {
  private providers: Map<string, IUniversalLLMProvider> = new Map();
  private activeProviderId: string;
  private sovereignFallback: SovereignLocalLLMProvider;
  private pool: RealLLMProviderPool;
  private keyManager: ProviderKeyManager;

  constructor(providerRegistry?: CubiOProviderRegistry) {
    this.sovereignFallback = new SovereignLocalLLMProvider();
    this.keyManager = ProviderKeyManager.getInstance();
    this.pool = RealLLMProviderPool.getInstance();

    this.registerProvider(this.sovereignFallback);
    this.registerProvider(new GeminiCompatibleLLMProvider({ apiKey: this.keyManager.getKey('gemini') }));
    this.registerProvider(new OpenAICompatibleLLMProvider({ apiKey: this.keyManager.getKey('openai') }));
    this.registerProvider(new AnthropicCompatibleLLMProvider({ apiKey: this.keyManager.getKey('anthropic') }));

    this.activeProviderId = this.sovereignFallback.providerId;

    // Register with main CubiO Provider Registry if passed
    if (providerRegistry) {
      providerRegistry.registerProvider(this.sovereignFallback as any);
    }
  }

  public getProviderPool(): RealLLMProviderPool {
    return this.pool;
  }

  public getKeyManager(): ProviderKeyManager {
    return this.keyManager;
  }

  /**
   * Registers a new LLM provider.
   */
  public registerProvider(provider: IUniversalLLMProvider): void {
    this.providers.set(provider.providerId, provider);
  }

  /**
   * Sets the active primary LLM provider.
   */
  public setActiveProvider(providerId: string): boolean {
    if (this.providers.has(providerId)) {
      this.activeProviderId = providerId;
      return true;
    }
    return false;
  }

  /**
   * Gets the currently active LLM provider.
   */
  public getActiveProvider(): IUniversalLLMProvider {
    return this.providers.get(this.activeProviderId) || this.sovereignFallback;
  }

  /**
   * Lists all registered providers.
   */
  public listProviders(): readonly IUniversalLLMProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Safe execution wrapper with automatic fallback to sovereign local provider.
   */
  private async executeWithFallback<T>(
    operationName: string,
    action: (provider: IUniversalLLMProvider) => Promise<T>,
    fallbackAction: (fallback: SovereignLocalLLMProvider) => Promise<T>
  ): Promise<T> {
    const active = this.getActiveProvider();
    if (active.getStatus() === 'AVAILABLE') {
      try {
        return await action(active);
      } catch (_err) {
        // Fallback to sovereign local
        return await fallbackAction(this.sovereignFallback);
      }
    }
    return await fallbackAction(this.sovereignFallback);
  }

  // ─── 1. CHAT ─────────────────────────────────────────────────────────────

  public async chat(
    messages: readonly LLMChatMessage[],
    options?: LLMChatOptions
  ): Promise<LLMChatResult> {
    return this.executeWithFallback(
      'chat',
      (p) => p.chat(messages, options),
      (f) => f.chat(messages, options)
    );
  }

  // ─── 2. REASONING ────────────────────────────────────────────────────────

  public async reason(
    hypothesis: string,
    context?: string,
    options?: LLMReasonOptions
  ): Promise<LLMReasonResult> {
    return this.executeWithFallback(
      'reason',
      (p) => p.reason(hypothesis, context, options),
      (f) => f.reason(hypothesis, context, options)
    );
  }

  // ─── 3. SUMMARIZATION ────────────────────────────────────────────────────

  public async summarize(
    text: string,
    options?: LLMSummarizeOptions
  ): Promise<LLMSummarizeResult> {
    return this.executeWithFallback(
      'summarize',
      (p) => p.summarize(text, options),
      (f) => f.summarize(text, options)
    );
  }

  // ─── 4. PLANNING ─────────────────────────────────────────────────────────

  public async plan(
    goal: string,
    context?: string,
    options?: LLMPlanOptions
  ): Promise<LLMPlanResult> {
    return this.executeWithFallback(
      'plan',
      (p) => p.plan(goal, context, options),
      (f) => f.plan(goal, context, options)
    );
  }

  // ─── 5. ANALYSIS ─────────────────────────────────────────────────────────

  public async analyze(
    content: string,
    options?: LLMAnalyzeOptions
  ): Promise<LLMAnalyzeResult> {
    return this.executeWithFallback(
      'analyze',
      (p) => p.analyze(content, options),
      (f) => f.analyze(content, options)
    );
  }

  // ─── 6. STRUCTURED OUTPUT ────────────────────────────────────────────────

  public async structuredOutput<T = unknown>(
    prompt: string,
    schema: LLMJsonSchema,
    options?: LLMStructuredOptions
  ): Promise<LLMStructuredResult<T>> {
    return this.executeWithFallback(
      'structuredOutput',
      (p) => p.structuredOutput<T>(prompt, schema, options),
      (f) => f.structuredOutput<T>(prompt, schema, options)
    );
  }

  // ─── 7. MULTILINGUAL REASONING ───────────────────────────────────────────

  public async multilingualReason(
    prompt: string,
    sourceLanguage: LanguageCode,
    targetLanguage: LanguageCode,
    options?: LLMMultilingualOptions
  ): Promise<LLMMultilingualResult> {
    return this.executeWithFallback(
      'multilingualReason',
      (p) => p.multilingualReason(prompt, sourceLanguage, targetLanguage, options),
      (f) => f.multilingualReason(prompt, sourceLanguage, targetLanguage, options)
    );
  }
}
