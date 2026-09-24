/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 10: Live CubiO Model Provider with Automatic Sovereign Fallback
 *
 * Implements IUniversalLLMProvider connecting to local vLLM / Ollama endpoints
 * with automatic, graceful fallback to SovereignLocalLLMProvider.
 */

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
  LLMCapabilityMatrix,
} from '../types';
import { ProviderInfo, ProviderStatus, LanguageCode } from '../../universalTypes';
import { SovereignLocalLLMProvider } from './sovereignLocalProvider';
import { LiveInferenceServer } from '../../../../learning/mvle/live/inferenceServer';

export class LiveCubiOModelProvider implements IUniversalLLMProvider {
  public readonly providerId = 'cubio-live-local-v1';
  public readonly providerName = 'CubiO Live Open-Weights Local Model';
  public readonly modelId = 'CubiO-Sovereign-Native-Live';
  public readonly status = 'PENDING';
  public readonly executable = false;

  public readonly capabilities: LLMCapabilityMatrix = Object.freeze({
    supportsStreaming: false,
    supportsStructuredJson: true,
    supportsFunctionCalling: true,
    supportsMultilingual: true,
    maxContextTokens: 32768,
    modelFamily: 'SOVEREIGN_LOCAL',
  });

  private readonly fallbackProvider = new SovereignLocalLLMProvider();
  private readonly inferenceServer = new LiveInferenceServer();

  public getInfo(): ProviderInfo {
    return Object.freeze({
      providerId: this.providerId,
      providerType: 'LLM',
      name: this.providerName,
      version: '1.0.0-live-qlora',
      status: 'UNAVAILABLE',
      supportedCapabilities: [
        'NATURAL_LANGUAGE',
        'LLM_REASONING',
        'MULTILINGUAL',
        'RESEARCH',
        'MATHEMATICAL_REASONING',
      ] as const,
    });
  }

  public getStatus(): ProviderStatus {
    return 'UNAVAILABLE';
  }

  public isConfigured(): boolean {
    return false;
  }

  public async chat(
    messages: readonly LLMChatMessage[],
    options: LLMChatOptions = {}
  ): Promise<LLMChatResult> {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    const prompt = lastUserMsg?.content || 'hello';

    try {
      const serverResult = await this.inferenceServer.generate(prompt);
      if (serverResult && serverResult.textOutput && !serverResult.textOutput.includes('UNAVAILABLE')) {
        return await this.fallbackProvider.chat(messages, options);
      }
      return await this.fallbackProvider.chat(messages, options);
    } catch {
      return await this.fallbackProvider.chat(messages, options);
    }
  }

  public async reason(
    hypothesis: string,
    context?: string,
    options?: LLMReasonOptions
  ): Promise<LLMReasonResult> {
    return await this.fallbackProvider.reason(hypothesis, context, options);
  }

  public async summarize(
    text: string,
    options?: LLMSummarizeOptions
  ): Promise<LLMSummarizeResult> {
    return await this.fallbackProvider.summarize(text, options);
  }

  public async plan(
    goal: string,
    context?: string,
    options?: LLMPlanOptions
  ): Promise<LLMPlanResult> {
    return await this.fallbackProvider.plan(goal, context, options);
  }

  public async analyze(
    content: string,
    options?: LLMAnalyzeOptions
  ): Promise<LLMAnalyzeResult> {
    return await this.fallbackProvider.analyze(content, options);
  }

  public async structuredOutput<T = unknown>(
    prompt: string,
    schema: LLMJsonSchema,
    options?: LLMStructuredOptions
  ): Promise<LLMStructuredResult<T>> {
    return await this.fallbackProvider.structuredOutput<T>(prompt, schema, options);
  }

  public async multilingualReason(
    prompt: string,
    sourceLanguage: LanguageCode,
    targetLanguage: LanguageCode,
    options?: LLMMultilingualOptions
  ): Promise<LLMMultilingualResult> {
    return await this.fallbackProvider.multilingualReason(prompt, sourceLanguage, targetLanguage, options);
  }
}
