/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 2 (F47): Hermetic Mock LLM Provider
 */

import { ProviderInfo, ProviderStatus, LanguageCode } from '../../universalTypes';
import {
  IUniversalLLMProvider,
  LLMCapabilityMatrix,
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
} from '../types';

export class MockLLMProvider implements IUniversalLLMProvider {
  public readonly providerId = 'cubio-mock-llm-provider';
  public readonly providerName = 'Hermetic Mock LLM Testing Provider';
  public readonly modelId = 'mock-llm-v1';

  public readonly capabilities: LLMCapabilityMatrix = Object.freeze({
    supportsStreaming: true,
    supportsStructuredJson: true,
    supportsFunctionCalling: true,
    supportsMultilingual: true,
    maxContextTokens: 65536,
    modelFamily: 'MOCK',
  });

  public getInfo(): ProviderInfo {
    return Object.freeze({
      providerId: this.providerId,
      providerType: 'LLM',
      name: this.providerName,
      version: '1.0.0-mock',
      status: 'AVAILABLE',
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
    return 'AVAILABLE';
  }

  public async chat(messages: readonly LLMChatMessage[], options?: LLMChatOptions): Promise<LLMChatResult> {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    const prompt = lastUser?.content || 'hello';
    return Object.freeze({
      text: `[Mock Response]: ${prompt}`,
      finishReason: 'stop',
      confidence: 1.0,
      providerId: this.providerId,
      modelId: this.modelId,
      latencyMs: 1,
    });
  }

  public async reason(hypothesis: string, context?: string, options?: LLMReasonOptions): Promise<LLMReasonResult> {
    return Object.freeze({
      hypothesis,
      reasoningSteps: [{ stepIndex: 0, thought: 'Mock deduction step', confidence: 1.0 }],
      finalConclusion: `Mock conclusion for "${hypothesis}"`,
      confidence: 1.0,
      providerId: this.providerId,
      latencyMs: 1,
    });
  }

  public async summarize(text: string, options?: LLMSummarizeOptions): Promise<LLMSummarizeResult> {
    return Object.freeze({
      summary: `Mock summary of ${text.length} chars`,
      keyPoints: ['Mock point 1'],
      compressionRatio: 0.5,
      providerId: this.providerId,
      latencyMs: 1,
    });
  }

  public async plan(goal: string, context?: string, options?: LLMPlanOptions): Promise<LLMPlanResult> {
    return Object.freeze({
      goal,
      tasks: [{ taskId: 'M1', title: 'Mock Task', description: goal, dependencies: [], estimatedComplexity: 'LOW' as const }],
      criticalPath: ['M1'],
      providerId: this.providerId,
      latencyMs: 1,
    });
  }

  public async analyze(content: string, options?: LLMAnalyzeOptions): Promise<LLMAnalyzeResult> {
    return Object.freeze({
      targetContentSummary: 'Mock analysis',
      findings: [{ category: 'INVARIANT' as const, description: 'Mock finding', severity: 'INFO' as const }],
      overallScore: 1.0,
      providerId: this.providerId,
      latencyMs: 1,
    });
  }

  public async structuredOutput<T = unknown>(prompt: string, schema: LLMJsonSchema, options?: LLMStructuredOptions): Promise<LLMStructuredResult<T>> {
    const mockData = { mockStatus: 'OK', promptEcho: prompt };
    return Object.freeze({
      parsedData: mockData as T,
      rawJson: JSON.stringify(mockData),
      isValidAgainstSchema: true,
      providerId: this.providerId,
      latencyMs: 1,
    });
  }

  public async multilingualReason(prompt: string, sourceLanguage: LanguageCode, targetLanguage: LanguageCode, options?: LLMMultilingualOptions): Promise<LLMMultilingualResult> {
    return Object.freeze({
      sourceText: prompt,
      sourceLanguage,
      targetLanguage,
      translatedText: `Mock translation [${sourceLanguage} -> ${targetLanguage}]: ${prompt}`,
      conceptualAlignmentScore: 1.0,
      crossLingualReasoning: 'Mock cross lingual reasoning',
      providerId: this.providerId,
      latencyMs: 1,
    });
  }
}
