/**
 * CUBiO AI — Phase 6: Task 77
 * Native Language Model Scaling
 * src/cubio/language/native/scaling/languageScalingTypes.ts
 *
 * Types, interfaces, invariants and error classes for sovereign scalable native language models.
 */

export enum LanguageScalingTier {
  TINY_BASELINE = 'TINY_BASELINE',
  MINI = 'MINI',
  COMPACT = 'COMPACT',
  BALANCED = 'BALANCED',
  EXTENDED = 'EXTENDED',
}

export interface LanguageArchitectureConfig {
  readonly tier: LanguageScalingTier;
  readonly embedDim: number;
  readonly hiddenDim: number;
  readonly layerCount: number;
  readonly numHeads: number;
  readonly maxContextTokens: number;
  readonly vocabSize: number;
  readonly dropoutRate?: number;
}

export interface LanguageParameterInventory {
  readonly tier: LanguageScalingTier;
  readonly tokenEmbeddingParams: number;
  readonly positionalEmbeddingParams: number;
  readonly attentionParams: number;
  readonly ffnParams: number;
  readonly normParams: number;
  readonly lmHeadParams: number;
  readonly totalParameters: number;
  readonly totalTensors: number;
  readonly weightMemoryBytes: number;
}

export interface LanguageEvaluationMetrics {
  readonly loss: number;
  readonly perplexity: number;
  readonly accuracy: number;
  readonly evaluatedTokens: number;
  readonly inferenceLatencyUs: number;
  readonly tokensPerSec: number;
  readonly saturationRatio: number;
}

export interface ParetoFrontierPoint {
  readonly tier: LanguageScalingTier;
  readonly parameterCount: number;
  readonly perplexity: number;
  readonly tokensPerSec: number;
  readonly latencyUs: number;
  readonly efficiencyScore: number; // Throughput / Perplexity
}

export interface LanguageModelSnapshot {
  readonly formatVersion: string;
  readonly modelId: string;
  readonly tenantId: string;
  readonly config: LanguageArchitectureConfig;
  readonly inventory: LanguageParameterInventory;
  readonly weights: Record<string, number[]>;
  readonly stepCount: number;
  readonly checksum: string;
  readonly timestamp: number;
}

export const STANDARD_LANGUAGE_TIERS: Record<LanguageScalingTier, LanguageArchitectureConfig> = Object.freeze({
  [LanguageScalingTier.TINY_BASELINE]: Object.freeze({
    tier: LanguageScalingTier.TINY_BASELINE,
    embedDim: 16,
    hiddenDim: 16,
    layerCount: 1,
    numHeads: 1,
    maxContextTokens: 128,
    vocabSize: 128,
    dropoutRate: 0.0,
  }),
  [LanguageScalingTier.MINI]: Object.freeze({
    tier: LanguageScalingTier.MINI,
    embedDim: 24,
    hiddenDim: 32,
    layerCount: 2,
    numHeads: 2,
    maxContextTokens: 256,
    vocabSize: 128,
    dropoutRate: 0.0,
  }),
  [LanguageScalingTier.COMPACT]: Object.freeze({
    tier: LanguageScalingTier.COMPACT,
    embedDim: 32,
    hiddenDim: 48,
    layerCount: 3,
    numHeads: 4,
    maxContextTokens: 512,
    vocabSize: 128,
    dropoutRate: 0.0,
  }),
  [LanguageScalingTier.BALANCED]: Object.freeze({
    tier: LanguageScalingTier.BALANCED,
    embedDim: 48,
    hiddenDim: 64,
    layerCount: 4,
    numHeads: 4,
    maxContextTokens: 512,
    vocabSize: 128,
    dropoutRate: 0.0,
  }),
  [LanguageScalingTier.EXTENDED]: Object.freeze({
    tier: LanguageScalingTier.EXTENDED,
    embedDim: 64,
    hiddenDim: 96,
    layerCount: 6,
    numHeads: 8,
    maxContextTokens: 1024,
    vocabSize: 128,
    dropoutRate: 0.0,
  }),
});

export const DEFAULT_LANGUAGE_SCALING_BUDGET = Object.freeze({
  maxParameters: 1_000_000,
  maxWeightMemoryBytes: 8 * 1024 * 1024, // 8 MB FP32
  maxLayerCount: 16,
  maxContextTokens: 2048,
  minAccuracyThreshold: 0.20,
  maxPerplexityThreshold: 150.0,
});

export class LanguageScalingError extends Error {
  public readonly code: string;
  public readonly timestamp: number;

  constructor(message: string, code = 'LANGUAGE_SCALING_ERROR') {
    super(`[${code}] ${message}`);
    this.name = 'LanguageScalingError';
    this.code = code;
    this.timestamp = Date.now();
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class LanguageScalingBudgetExceededError extends LanguageScalingError {
  constructor(message: string) {
    super(message, 'LANGUAGE_SCALING_BUDGET_EXCEEDED');
    this.name = 'LanguageScalingBudgetExceededError';
  }
}

export class LanguageModelSaturationError extends LanguageScalingError {
  constructor(message: string) {
    super(message, 'LANGUAGE_MODEL_SATURATION');
    this.name = 'LanguageModelSaturationError';
  }
}

export class IncompatibleLanguageCheckpointError extends LanguageScalingError {
  constructor(message: string) {
    super(message, 'INCOMPATIBLE_LANGUAGE_CHECKPOINT');
    this.name = 'IncompatibleLanguageCheckpointError';
  }
}
