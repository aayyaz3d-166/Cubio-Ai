/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 2 (F47): LLM Provider Layer — Core Contracts & Types
 *
 * Defines the unified, pluggable interface for all LLM providers across 7 capabilities:
 * 1. Chat (multi-turn conversation)
 * 2. Reasoning (chain-of-thought and theorem deduction)
 * 3. Summarization (content distillation)
 * 4. Planning (goal decomposition)
 * 5. Analysis (structural, semantic, and safety audit)
 * 6. Structured Output (strict JSON schema validation)
 * 7. Multilingual Reasoning (cross-lingual conceptual reasoning)
 */

import { LanguageCode } from '../universalTypes';
import { ProviderInfo, ProviderStatus } from '../universalTypes';

export type LLMModelFamily = 'OPENAI' | 'ANTHROPIC' | 'GEMINI' | 'OLLAMA' | 'SOVEREIGN_LOCAL' | 'MOCK';

export interface LLMTokenUsage {
  readonly promptTokens: number;
  readonly completionTokens: number;
  readonly totalTokens: number;
}

export interface LLMCapabilityMatrix {
  readonly supportsStreaming: boolean;
  readonly supportsStructuredJson: boolean;
  readonly supportsFunctionCalling: boolean;
  readonly supportsMultilingual: boolean;
  readonly maxContextTokens: number;
  readonly modelFamily: LLMModelFamily;
}

// ─── 1. CHAT TYPES ──────────────────────────────────────────────────────────

export interface LLMChatMessage {
  readonly role: 'system' | 'user' | 'assistant' | 'tool';
  readonly content: string;
  readonly name?: string;
}

export interface LLMChatOptions {
  readonly temperature?: number;
  readonly maxTokens?: number;
  readonly systemPrompt?: string;
  readonly stopSequences?: readonly string[];
  readonly language?: LanguageCode;
}

export interface LLMChatResult {
  readonly text: string;
  readonly usage?: LLMTokenUsage;
  readonly finishReason?: string;
  readonly confidence: number;
  readonly providerId: string;
  readonly modelId: string;
  readonly latencyMs: number;
}

// ─── 2. REASONING TYPES ─────────────────────────────────────────────────────

export interface LLMReasonStep {
  readonly stepIndex: number;
  readonly thought: string;
  readonly evidence?: string;
  readonly confidence: number;
}

export interface LLMReasonOptions {
  readonly depth?: 'FAST' | 'STANDARD' | 'DEEP_CHAIN_OF_THOUGHT';
  readonly temperature?: number;
  readonly maxTokens?: number;
}

export interface LLMReasonResult {
  readonly hypothesis: string;
  readonly reasoningSteps: readonly LLMReasonStep[];
  readonly finalConclusion: string;
  readonly confidence: number;
  readonly providerId: string;
  readonly latencyMs: number;
}

// ─── 3. SUMMARIZATION TYPES ─────────────────────────────────────────────────

export interface LLMSummarizeOptions {
  readonly targetLength?: 'BRIEF' | 'MODERATE' | 'DETAILED';
  readonly format?: 'BULLETS' | 'PARAGRAPH' | 'EXECUTIVE_BRIEF';
  readonly focusAreas?: readonly string[];
}

export interface LLMSummarizeResult {
  readonly summary: string;
  readonly keyPoints: readonly string[];
  readonly compressionRatio: number;
  readonly providerId: string;
  readonly latencyMs: number;
}

// ─── 4. PLANNING TYPES ──────────────────────────────────────────────────────

export interface LLMPlanTask {
  readonly taskId: string;
  readonly title: string;
  readonly description: string;
  readonly dependencies: readonly string[];
  readonly estimatedComplexity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface LLMPlanOptions {
  readonly maxSteps?: number;
  readonly includeRiskAssessment?: boolean;
}

export interface LLMPlanResult {
  readonly goal: string;
  readonly tasks: readonly LLMPlanTask[];
  readonly criticalPath: readonly string[];
  readonly providerId: string;
  readonly latencyMs: number;
}

// ─── 5. ANALYSIS TYPES ──────────────────────────────────────────────────────

export interface LLMAnalysisFinding {
  readonly category: 'STRENGTH' | 'WEAKNESS' | 'RISK' | 'OPPORTUNITY' | 'INVARIANT';
  readonly description: string;
  readonly severity: 'INFO' | 'WARNING' | 'CRITICAL';
  readonly recommendation?: string;
}

export interface LLMAnalyzeOptions {
  readonly criteria?: readonly string[];
  readonly strictMode?: boolean;
}

export interface LLMAnalyzeResult {
  readonly targetContentSummary: string;
  readonly findings: readonly LLMAnalysisFinding[];
  readonly overallScore: number; // 0.0 to 1.0
  readonly providerId: string;
  readonly latencyMs: number;
}

// ─── 6. STRUCTURED OUTPUT TYPES ─────────────────────────────────────────────

export interface LLMJsonSchema {
  readonly type: 'object';
  readonly properties: Record<string, unknown>;
  readonly required?: readonly string[];
  readonly description?: string;
}

export interface LLMStructuredOptions {
  readonly strict?: boolean;
  readonly temperature?: number;
}

export interface LLMStructuredResult<T = unknown> {
  readonly parsedData: T;
  readonly rawJson: string;
  readonly isValidAgainstSchema: boolean;
  readonly validationErrors?: readonly string[];
  readonly providerId: string;
  readonly latencyMs: number;
}

// ─── 7. MULTILINGUAL REASONING TYPES ────────────────────────────────────────

export interface LLMMultilingualOptions {
  readonly preserveTerminology?: readonly string[];
  readonly targetScript?: string;
}

export interface LLMMultilingualResult {
  readonly sourceText: string;
  readonly sourceLanguage: LanguageCode;
  readonly targetLanguage: LanguageCode;
  readonly translatedText: string;
  readonly conceptualAlignmentScore: number;
  readonly crossLingualReasoning: string;
  readonly providerId: string;
  readonly latencyMs: number;
}

// ─── MASTER COMMON LLM PROVIDER INTERFACE ──────────────────────────────────

export interface IUniversalLLMProvider {
  readonly providerId: string;
  readonly providerName: string;
  readonly modelId: string;
  readonly capabilities: LLMCapabilityMatrix;

  getInfo(): ProviderInfo;
  getStatus(): ProviderStatus;

  chat(messages: readonly LLMChatMessage[], options?: LLMChatOptions): Promise<LLMChatResult>;
  reason(hypothesis: string, context?: string, options?: LLMReasonOptions): Promise<LLMReasonResult>;
  summarize(text: string, options?: LLMSummarizeOptions): Promise<LLMSummarizeResult>;
  plan(goal: string, context?: string, options?: LLMPlanOptions): Promise<LLMPlanResult>;
  analyze(content: string, options?: LLMAnalyzeOptions): Promise<LLMAnalyzeResult>;
  structuredOutput<T = unknown>(
    prompt: string,
    schema: LLMJsonSchema,
    options?: LLMStructuredOptions
  ): Promise<LLMStructuredResult<T>>;
  multilingualReason(
    prompt: string,
    sourceLanguage: LanguageCode,
    targetLanguage: LanguageCode,
    options?: LLMMultilingualOptions
  ): Promise<LLMMultilingualResult>;
}
