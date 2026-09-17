/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F46: Universal Multimodal Intelligence Types
 *
 * Core type definitions for the Universal Intelligence Orchestration layer.
 * Provider-agnostic abstractions for LLM, Image, Speech, Code, Tool capabilities.
 */

import { CubiODimension } from '../../types';

// ─── CAPABILITY CLASSES ─────────────────────────────────────────────────────

export type UniversalCapabilityClass =
  | 'NATURAL_LANGUAGE'
  | 'LLM_REASONING'
  | 'MULTILINGUAL'
  | 'VISION'
  | 'IMAGE_GENERATION'
  | 'VOICE_INPUT'
  | 'VOICE_OUTPUT'
  | 'CODE_GENERATION'
  | 'CODE_ANALYSIS'
  | 'CODE_DEBUGGING'
  | 'WORKFLOW_EXECUTION'
  | 'PROJECT_ASSISTANCE'
  | 'FILE_ANALYSIS'
  | 'RESEARCH'
  | 'MATHEMATICAL_REASONING'
  | 'SPATIAL_REASONING'
  | 'GEOMETRIC_REASONING'
  | 'PREDICTION'
  | 'HARMONIC_369'
  | 'MULTI_AGENT_PROBLEM_SOLVING';

// ─── PROVIDER TYPES ─────────────────────────────────────────────────────────

export type ProviderType = 'LLM' | 'IMAGE' | 'VISION' | 'SPEECH' | 'CODE_EXECUTION' | 'TOOL';

export type ProviderStatus = 'AVAILABLE' | 'UNAVAILABLE' | 'DEGRADED' | 'RATE_LIMITED';

export interface ProviderInfo {
  readonly providerId: string;
  readonly providerType: ProviderType;
  readonly name: string;
  readonly version: string;
  readonly status: ProviderStatus;
  readonly supportedCapabilities: readonly UniversalCapabilityClass[];
}

// ─── PROVIDER INTERFACES ────────────────────────────────────────────────────

export interface ILLMProvider {
  readonly providerId: string;
  readonly providerType: 'LLM';
  getInfo(): ProviderInfo;
  generate(prompt: string, options?: LLMGenerateOptions): Promise<LLMGenerateResult>;
  stream?(prompt: string, options?: LLMGenerateOptions): AsyncIterable<string>;
  reason?(prompt: string, options?: LLMGenerateOptions): Promise<LLMGenerateResult>;
  structuredOutput?(prompt: string, schema: Record<string, unknown>, options?: LLMGenerateOptions): Promise<LLMGenerateResult>;
}

export interface LLMGenerateOptions {
  readonly temperature?: number;
  readonly maxTokens?: number;
  readonly systemPrompt?: string;
  readonly context?: string;
  readonly language?: LanguageCode;
}

export interface LLMGenerateResult {
  readonly text: string;
  readonly tokensUsed?: number;
  readonly finishReason?: string;
  readonly confidence?: number;
  readonly providerId: string;
}

export interface IImageProvider {
  readonly providerId: string;
  readonly providerType: 'IMAGE';
  getInfo(): ProviderInfo;
  generateImage(prompt: string, options?: ImageGenerateOptions): Promise<ImageResult>;
  editImage?(imageData: Uint8Array, prompt: string, options?: ImageGenerateOptions): Promise<ImageResult>;
  analyzeImage?(imageData: Uint8Array, prompt?: string): Promise<ImageAnalysisResult>;
}

export interface ImageGenerateOptions {
  readonly width?: number;
  readonly height?: number;
  readonly style?: string;
  readonly format?: 'png' | 'jpg' | 'webp';
}

export interface ImageResult {
  readonly imageData?: Uint8Array;
  readonly imageUrl?: string;
  readonly description: string;
  readonly providerId: string;
}

export interface ImageAnalysisResult {
  readonly description: string;
  readonly labels: readonly string[];
  readonly confidence: number;
  readonly providerId: string;
}

export interface IVisionProvider {
  readonly providerId: string;
  readonly providerType: 'VISION';
  getInfo(): ProviderInfo;
  analyzeImage(imageData: Uint8Array, prompt?: string): Promise<ImageAnalysisResult>;
}

export interface ISpeechProvider {
  readonly providerId: string;
  readonly providerType: 'SPEECH';
  getInfo(): ProviderInfo;
  speechToText(audioData: Uint8Array, options?: SpeechOptions): Promise<SpeechToTextResult>;
  textToSpeech(text: string, options?: SpeechOptions): Promise<TextToSpeechResult>;
}

export interface SpeechOptions {
  readonly language?: LanguageCode;
  readonly voice?: string;
  readonly format?: 'wav' | 'mp3' | 'ogg';
}

export interface SpeechToTextResult {
  readonly text: string;
  readonly language: LanguageCode;
  readonly confidence: number;
  readonly providerId: string;
}

export interface TextToSpeechResult {
  readonly audioData?: Uint8Array;
  readonly audioUrl?: string;
  readonly durationMs: number;
  readonly providerId: string;
}

export interface ICodeExecutionProvider {
  readonly providerId: string;
  readonly providerType: 'CODE_EXECUTION';
  getInfo(): ProviderInfo;
  generateCode(prompt: string, options?: CodeOptions): Promise<CodeResult>;
  analyzeCode(code: string, language: string): Promise<CodeAnalysisResult>;
  debugCode?(code: string, error: string, language: string): Promise<CodeResult>;
  executeCode?(code: string, language: string, options?: CodeExecutionOptions): Promise<CodeExecutionResult>;
}

export interface CodeOptions {
  readonly language?: string;
  readonly framework?: string;
  readonly style?: string;
}

export interface CodeResult {
  readonly code: string;
  readonly language: string;
  readonly explanation: string;
  readonly providerId: string;
}

export interface CodeAnalysisResult {
  readonly issues: readonly CodeIssue[];
  readonly suggestions: readonly string[];
  readonly complexity: number;
  readonly providerId: string;
}

export interface CodeIssue {
  readonly severity: 'error' | 'warning' | 'info';
  readonly message: string;
  readonly line?: number;
  readonly column?: number;
}

export interface CodeExecutionOptions {
  readonly timeout?: number;
  readonly sandboxed?: boolean;
}

export interface CodeExecutionResult {
  readonly stdout: string;
  readonly stderr: string;
  readonly exitCode: number;
  readonly executionTimeMs: number;
  readonly providerId: string;
}

export interface IToolProvider {
  readonly providerId: string;
  readonly providerType: 'TOOL';
  getInfo(): ProviderInfo;
  discover(): Promise<ToolDefinition[]>;
  execute(toolId: string, params: Record<string, unknown>): Promise<ToolExecutionResult>;
  verify?(toolId: string, result: ToolExecutionResult): Promise<boolean>;
}

export interface ToolDefinition {
  readonly toolId: string;
  readonly name: string;
  readonly description: string;
  readonly parameters: Record<string, unknown>;
  readonly requiresAuthorization: boolean;
}

export interface ToolExecutionResult {
  readonly toolId: string;
  readonly output: unknown;
  readonly success: boolean;
  readonly executionTimeMs: number;
  readonly providerId: string;
}

// ─── LANGUAGE ───────────────────────────────────────────────────────────────

export type LanguageCode =
  | 'en'
  | 'ur'
  | 'ur-roman'
  | 'pa'
  | 'pa-shahmukhi'
  | 'pa-gurmukhi'
  | 'pa-roman'
  | 'ar'
  | 'hi'
  | 'zh'
  | 'es'
  | 'fr'
  | 'de'
  | string;

export interface LanguageDetectionResult {
  readonly detectedLanguage: LanguageCode;
  readonly confidence: number;
  readonly script: string;
  readonly isRTL: boolean;
}

// ─── DIMENSIONAL STATE ──────────────────────────────────────────────────────

export type DimensionalStateLevel =
  | 'D0_RAW_INPUT'
  | 'D1_TOKEN_SIGNAL'
  | 'D2_STRUCTURED_DATA'
  | 'D3_SEMANTIC_SPATIAL'
  | 'D4_RELATIONSHIP'
  | 'D5_REASONING'
  | 'D6_WORKFLOW_AGENT'
  | 'D7_PROJECT'
  | 'D8_META_CROSS_DOMAIN';

export interface DimensionalState {
  readonly stateId: string;
  readonly level: DimensionalStateLevel;
  readonly data: Readonly<Record<string, unknown>>;
  readonly timestamp: number;
  readonly checksum: string;
}

export interface DimensionalTransformation {
  readonly transformId: string;
  readonly sourceDimension: DimensionalStateLevel;
  readonly targetDimension: DimensionalStateLevel;
  readonly inputSchema: string;
  readonly outputSchema: string;
  readonly transformationIdentity: string;
  readonly verificationStatus: 'VERIFIED' | 'UNVERIFIED' | 'FAILED';
}

// ─── PROBLEM SOLVER ─────────────────────────────────────────────────────────

export interface ProblemSolverRequest {
  readonly requestId: string;
  readonly prompt: string;
  readonly requiredCapabilities: readonly UniversalCapabilityClass[];
  readonly projectId?: string;
  readonly language?: LanguageCode;
  readonly context?: Record<string, unknown>;
}

export interface ProblemSolverPlan {
  readonly planId: string;
  readonly steps: readonly ProblemSolverStep[];
  readonly estimatedCapabilities: readonly UniversalCapabilityClass[];
  readonly requiresAuthorization: boolean;
}

export interface ProblemSolverStep {
  readonly stepIndex: number;
  readonly description: string;
  readonly requiredCapability: UniversalCapabilityClass;
  readonly providerType: ProviderType | 'INTERNAL_ENGINE';
  readonly isDestructive: boolean;
  readonly authorized: boolean;
}

export interface ProblemSolverResult {
  readonly resultId: string;
  readonly planId: string;
  readonly textOutput: string;
  readonly stepResults: readonly StepResult[];
  readonly overallConfidence: number;
  readonly executionTimeMs: number;
  readonly providersUsed: readonly string[];
  readonly unavailableCapabilities: readonly UniversalCapabilityClass[];
}

export interface StepResult {
  readonly stepIndex: number;
  readonly success: boolean;
  readonly output: string;
  readonly providerId: string;
  readonly executionTimeMs: number;
}

// ─── PROJECT ────────────────────────────────────────────────────────────────

export interface ProjectContext {
  readonly projectId: string;
  readonly goal: string;
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED';
  readonly files: readonly ProjectFile[];
  readonly tasks: readonly ProjectTask[];
  readonly artifacts: readonly ProjectArtifact[];
  readonly decisions: readonly ProjectDecision[];
  readonly state: Readonly<Record<string, unknown>>;
}

export interface ProjectFile {
  readonly fileId: string;
  readonly path: string;
  readonly type: string;
  readonly addedAt: number;
}

export interface ProjectTask {
  readonly taskId: string;
  readonly description: string;
  readonly status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
  readonly dependencies: readonly string[];
  readonly assignedCapability?: UniversalCapabilityClass;
}

export interface ProjectArtifact {
  readonly artifactId: string;
  readonly type: string;
  readonly description: string;
  readonly createdAt: number;
  readonly data?: unknown;
}

export interface ProjectDecision {
  readonly decisionId: string;
  readonly description: string;
  readonly rationale: string;
  readonly decidedAt: number;
}

// ─── WORKFLOW ───────────────────────────────────────────────────────────────

export interface WorkflowDefinition {
  readonly workflowId: string;
  readonly name: string;
  readonly description: string;
  readonly steps: readonly WorkflowStepDefinition[];
  readonly requiresAuthorization: boolean;
}

export interface WorkflowStepDefinition {
  readonly stepIndex: number;
  readonly name: string;
  readonly action: string;
  readonly requiredCapability: UniversalCapabilityClass;
  readonly isDestructive: boolean;
  readonly condition?: string;
  readonly verificationCriteria?: string;
}

export type WorkflowStatus = 'PENDING' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'FAILED' | 'AWAITING_AUTHORIZATION';

export interface WorkflowState {
  readonly workflowId: string;
  readonly status: WorkflowStatus;
  readonly currentStepIndex: number;
  readonly stepResults: readonly WorkflowStepResult[];
  readonly startedAt: number;
  readonly completedAt?: number;
}

export interface WorkflowStepResult {
  readonly stepIndex: number;
  readonly status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED' | 'AWAITING_AUTHORIZATION';
  readonly output?: string;
  readonly error?: string;
  readonly executionTimeMs?: number;
}

// ─── UNIVERSAL ORCHESTRATION REQUEST / RESPONSE ─────────────────────────────

export interface UniversalIntelligenceRequest {
  readonly requestId: string;
  readonly prompt: string;
  readonly language?: LanguageCode;
  readonly projectId?: string;
  readonly workflowId?: string;
  readonly imageData?: Uint8Array;
  readonly audioData?: Uint8Array;
  readonly videoData?: Uint8Array;
  readonly activeDimension?: CubiODimension;
  readonly conversationId?: string;
  readonly context?: Record<string, unknown>;
}

export interface UniversalIntelligenceResponse {
  readonly responseId: string;
  readonly textOutput: string;
  readonly detectedCapabilities: readonly UniversalCapabilityClass[];
  readonly usedProviders: readonly string[];
  readonly unavailableCapabilities: readonly UniversalCapabilityClass[];
  readonly detectedLanguage?: LanguageDetectionResult;
  readonly dimensionalState?: DimensionalState;
  readonly confidence: number;
  readonly executionTimeMs: number;
  readonly success: boolean;
}
