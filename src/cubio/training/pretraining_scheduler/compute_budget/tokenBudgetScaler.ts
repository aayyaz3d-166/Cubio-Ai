/**
 * CubiO — Universal Spatial Operating Environment
 * Step 65: Token Budget & Architecture Scaler
 *
 * Implements architecture dimension definitions and compute-optimal
 * token targets according to Chinchilla (D ~ 20N) and inference-optimal (D ~ 100N) scaling.
 *
 * Classification: SOFTWARE_VALIDATED
 */

import { ModelArchitectureDimensions, ModelScaleTier } from '../types';

export class TokenBudgetScaler {
  public static readonly ARCHITECTURES: Readonly<Record<ModelScaleTier, ModelArchitectureDimensions>> = {
    '8M': Object.freeze({
      scale: '8M',
      parameterCount: 8_420_000,
      hiddenDimension: 256,
      numLayers: 8,
      numAttentionHeads: 8,
      numKeyValueHeads: 4,
      intermediateDimension: 688,
      vocabSize: 32768,
      maxContextLength: 2048,
    }),
    '32M': Object.freeze({
      scale: '32M',
      parameterCount: 33_600_000,
      hiddenDimension: 512,
      numLayers: 10,
      numAttentionHeads: 8,
      numKeyValueHeads: 4,
      intermediateDimension: 1376,
      vocabSize: 32768,
      maxContextLength: 2048,
    }),
    '128M': Object.freeze({
      scale: '128M',
      parameterCount: 134_500_000,
      hiddenDimension: 768,
      numLayers: 14,
      numAttentionHeads: 12,
      numKeyValueHeads: 4,
      intermediateDimension: 2064,
      vocabSize: 32768,
      maxContextLength: 4096,
    }),
    '512M': Object.freeze({
      scale: '512M',
      parameterCount: 524_000_000,
      hiddenDimension: 1536,
      numLayers: 24,
      numAttentionHeads: 16,
      numKeyValueHeads: 4,
      intermediateDimension: 4128,
      vocabSize: 32768,
      maxContextLength: 4096,
    }),
    '1B': Object.freeze({
      scale: '1B',
      parameterCount: 1_120_000_000,
      hiddenDimension: 2048,
      numLayers: 28,
      numAttentionHeads: 16,
      numKeyValueHeads: 4,
      intermediateDimension: 5504,
      vocabSize: 32768,
      maxContextLength: 8192,
    }),
    '7B': Object.freeze({
      scale: '7B',
      parameterCount: 7_241_738_240,
      hiddenDimension: 4096,
      numLayers: 32,
      numAttentionHeads: 32,
      numKeyValueHeads: 8,
      intermediateDimension: 11008,
      vocabSize: 32768,
      maxContextLength: 8192,
    }),
  };

  /**
   * Resolves architecture dimensions for a given scale.
   */
  public static getArchitecture(scale: ModelScaleTier): ModelArchitectureDimensions {
    return this.ARCHITECTURES[scale];
  }

  /**
   * Computes recommended token budget:
   * - 'CHINCHILLA_OPTIMAL': D = 20 * N
   * - 'OVERTRAINED_INFERENCE_OPTIMAL': D = 100 * N
   */
  public static computeTargetTokens(
    scale: ModelScaleTier,
    regime: 'CHINCHILLA_OPTIMAL' | 'OVERTRAINED_INFERENCE_OPTIMAL' = 'CHINCHILLA_OPTIMAL'
  ): number {
    const arch = this.getArchitecture(scale);
    const multiplier = regime === 'OVERTRAINED_INFERENCE_OPTIMAL' ? 100 : 20;
    return arch.parameterCount * multiplier;
  }
}
