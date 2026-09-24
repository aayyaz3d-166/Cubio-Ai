/**
 * CUBiO AI — Task 159: Native Model Scaling Architecture
 * src/cubio/model/native_scaling/scalingProfiles.ts
 *
 * Explicit scaling profile catalog and exact parameter breakdown mathematics
 * for the native CUBiO language model architecture.
 *
 * Invariants:
 * - 100% native architecture: token/spatial/pos embeddings + native transformer blocks + epistemic/lm heads.
 * - Exact parameter accounting with zero floating-point approximation errors.
 * - Frozen Phase 1-10 compatibility: NATIVE_219K reproduces the exact 219,264 parameter baseline.
 */

import {
  NativeScalingProfileId,
  NativeModelArchitectureConfig,
  NativeParameterBreakdown,
} from './types';

/**
 * Calculates exact parameter counts across all tensor groups for a given architecture config.
 */
export function calculateParameterBreakdown(config: NativeModelArchitectureConfig): NativeParameterBreakdown {
  const d = config.hiddenDimension;
  const V = config.vocabSize;
  const T = config.maxSequenceLength;
  const L = config.layerCount;
  const ffnDim = config.ffnDimension;
  const S = config.spatialCells;
  const E = config.epistemicClasses;

  // 1. Embeddings
  const tokenEmbeddingParams = V * d;
  const positionalEmbeddingParams = T * d;
  const spatialEmbeddingParams = S * d;

  // 2. Transformer Backbone (Per Layer)
  // Attention: Q, K, V, Out projections (4 * d * d)
  const attentionPerLayer = 4 * d * d;
  // FFN: Gate/Up (d * ffnDim) + Down (ffnDim * d)
  const ffnPerLayer = 2 * d * ffnDim;
  // LayerNorm: Input LN (d) + Post-Attention LN (d)
  const layerNormPerLayer = 2 * d;

  const attentionParamsTotal = L * attentionPerLayer;
  const ffnParamsTotal = L * ffnPerLayer;
  const layerNormParamsTotal = L * layerNormPerLayer;
  const backboneParams = attentionParamsTotal + ffnParamsTotal + layerNormParamsTotal;

  // 3. Projection Heads
  const epistemicHeadParams = d * E;
  const lmHeadParams = d * V;

  // Total
  const totalParameters =
    tokenEmbeddingParams +
    positionalEmbeddingParams +
    spatialEmbeddingParams +
    backboneParams +
    epistemicHeadParams +
    lmHeadParams;

  // Tensor count: 3 embeddings + L * 8 layer tensors (Q, K, V, Out, FFN1, FFN2, LN1, LN2) + 2 heads
  const tensorCount = 3 + L * 8 + 2;

  const fp32WeightBytes = totalParameters * 4;
  const int8WeightBytes = totalParameters * 1;

  return Object.freeze({
    tokenEmbeddingParams,
    positionalEmbeddingParams,
    spatialEmbeddingParams,
    attentionParamsTotal,
    ffnParamsTotal,
    layerNormParamsTotal,
    epistemicHeadParams,
    lmHeadParams,
    backboneParams,
    totalParameters,
    tensorCount,
    fp32WeightBytes,
    int8WeightBytes,
  });
}

/**
 * Canonical 6 Scaling Profiles spanning 219K to 100M parameters.
 */
export const NATIVE_SCALING_PROFILES: Readonly<Record<Exclude<NativeScalingProfileId, 'CUSTOM'>, NativeModelArchitectureConfig>> = Object.freeze({
  [NativeScalingProfileId.NATIVE_219K]: Object.freeze({
    profileId: NativeScalingProfileId.NATIVE_219K,
    modelName: 'CUBiO Native Base 219K (Baseline)',
    layerCount: 4,
    hiddenDimension: 64,
    attentionHeads: 4,
    ffnDimension: 128,
    vocabSize: 478,
    maxSequenceLength: 64,
    spatialCells: 343,
    symbolicAnchors: 26,
    epistemicClasses: 7,
    masterSeed: 369001000,
    description: 'Frozen Phase 10 baseline model with 219,264 parameters and 37 tensors.',
  }),

  [NativeScalingProfileId.NATIVE_1M]: Object.freeze({
    profileId: NativeScalingProfileId.NATIVE_1M,
    modelName: 'CUBiO Native Edge 1M',
    layerCount: 6,
    hiddenDimension: 128,
    attentionHeads: 4,
    ffnDimension: 256,
    vocabSize: 768,
    maxSequenceLength: 128,
    spatialCells: 343,
    symbolicAnchors: 26,
    epistemicClasses: 7,
    masterSeed: 369002000,
    description: 'Edge-optimized spatial reasoning model with ~1.05M parameters and 53 tensors.',
  }),

  [NativeScalingProfileId.NATIVE_5M]: Object.freeze({
    profileId: NativeScalingProfileId.NATIVE_5M,
    modelName: 'CUBiO Native Compact 5M',
    layerCount: 8,
    hiddenDimension: 256,
    attentionHeads: 8,
    ffnDimension: 512,
    vocabSize: 1536,
    maxSequenceLength: 256,
    spatialCells: 343,
    symbolicAnchors: 26,
    epistemicClasses: 7,
    masterSeed: 369003000,
    description: 'Compact conversational reasoning model with ~5.14M parameters and 69 tensors.',
  }),

  [NativeScalingProfileId.NATIVE_20M]: Object.freeze({
    profileId: NativeScalingProfileId.NATIVE_20M,
    modelName: 'CUBiO Native Balanced 20M',
    layerCount: 14,
    hiddenDimension: 384,
    attentionHeads: 12,
    ffnDimension: 768,
    vocabSize: 4096,
    maxSequenceLength: 512,
    spatialCells: 343,
    symbolicAnchors: 26,
    epistemicClasses: 7,
    masterSeed: 369004000,
    description: 'High-accuracy balanced reasoning model with ~20.0M parameters and 117 tensors.',
  }),

  [NativeScalingProfileId.NATIVE_50M]: Object.freeze({
    profileId: NativeScalingProfileId.NATIVE_50M,
    modelName: 'CUBiO Native Extended 50M',
    layerCount: 20,
    hiddenDimension: 512,
    attentionHeads: 16,
    ffnDimension: 1024,
    vocabSize: 8192,
    maxSequenceLength: 1024,
    spatialCells: 343,
    symbolicAnchors: 26,
    epistemicClasses: 7,
    masterSeed: 369005000,
    description: 'Extended multi-hop spatial-symbolic model with ~51.1M parameters and 165 tensors.',
  }),

  [NativeScalingProfileId.NATIVE_100M]: Object.freeze({
    profileId: NativeScalingProfileId.NATIVE_100M,
    modelName: 'CUBiO Native Sovereign 100M',
    layerCount: 26,
    hiddenDimension: 640,
    attentionHeads: 20,
    ffnDimension: 1280,
    vocabSize: 11264,
    maxSequenceLength: 2048,
    spatialCells: 343,
    symbolicAnchors: 26,
    epistemicClasses: 7,
    masterSeed: 369006000,
    description: 'Sovereign flagship CUBiO language model with ~101.2M parameters and 213 tensors.',
  }),
});

/**
 * Retrieve a scaling profile by its identifier.
 */
export function getScalingProfile(profileId: NativeScalingProfileId): NativeModelArchitectureConfig {
  if (profileId === 'CUSTOM') {
    throw new Error('[SCALING_PROFILE_ERROR] Custom profile must provide an explicit NativeModelArchitectureConfig.');
  }
  const profile = NATIVE_SCALING_PROFILES[profileId];
  if (!profile) {
    throw new Error(`[SCALING_PROFILE_NOT_FOUND] Unknown profile: ${profileId}`);
  }
  return profile;
}

/**
 * Returns all predefined scaling profiles in ascending parameter order.
 */
export function getAllScalingProfiles(): readonly NativeModelArchitectureConfig[] {
  return Object.freeze([
    NATIVE_SCALING_PROFILES[NativeScalingProfileId.NATIVE_219K],
    NATIVE_SCALING_PROFILES[NativeScalingProfileId.NATIVE_1M],
    NATIVE_SCALING_PROFILES[NativeScalingProfileId.NATIVE_5M],
    NATIVE_SCALING_PROFILES[NativeScalingProfileId.NATIVE_20M],
    NATIVE_SCALING_PROFILES[NativeScalingProfileId.NATIVE_50M],
    NATIVE_SCALING_PROFILES[NativeScalingProfileId.NATIVE_100M],
  ]);
}

/**
 * Validates structural integrity of a scaling configuration.
 */
export function validateProfileConfig(config: NativeModelArchitectureConfig): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.profileId) errors.push('Missing profileId.');
  if (config.layerCount <= 0 || !Number.isInteger(config.layerCount)) errors.push('layerCount must be a positive integer.');
  if (config.hiddenDimension <= 0 || config.hiddenDimension % config.attentionHeads !== 0) {
    errors.push(`hiddenDimension (${config.hiddenDimension}) must be divisible by attentionHeads (${config.attentionHeads}).`);
  }
  if (config.attentionHeads <= 0) errors.push('attentionHeads must be positive.');
  if (config.vocabSize <= 0) errors.push('vocabSize must be positive.');
  if (config.maxSequenceLength <= 0) errors.push('maxSequenceLength must be positive.');
  if (config.spatialCells !== 343) errors.push(`spatialCells must strictly equal 343 for HCP lattice integrity (got ${config.spatialCells}).`);
  if (config.epistemicClasses !== 7) errors.push(`epistemicClasses must strictly equal 7 (got ${config.epistemicClasses}).`);

  return {
    isValid: errors.length === 0,
    errors,
  };
}
