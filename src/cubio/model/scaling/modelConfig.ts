/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 45: Model Scaling Configurations
 *
 * Pre-defined model scale profiles (Tiny, Edge, Small, Medium, Large)
 * and custom architecture builder with strict constraint validation.
 */

import {
  ModelScaleProfile,
  ScalableModelArchitectureConfig,
} from './types';

export class ModelConfigRegistry {
  public static readonly STANDARD_PROFILES: Readonly<Record<ModelScaleProfile, ScalableModelArchitectureConfig>> = {
    TINY: Object.freeze({
      modelId: 'CUBIO_MODEL_TINY',
      modelName: 'CubiO-Tiny',
      profile: 'TINY',
      layerCount: 4,
      hiddenDimension: 128,
      attentionHeads: 4,
      ffnDimension: 512,
      vocabSize: 8192,
      maxSequenceLength: 512,
      defaultQuantization: 'INT8',
      enableMultimodalHeads: true,
      enableActivationCheckpointing: false,
      tileSizeBytes: 512 * 1024, // 512 KB
    }),
    EDGE: Object.freeze({
      modelId: 'CUBIO_MODEL_EDGE',
      modelName: 'CubiO-Edge',
      profile: 'EDGE',
      layerCount: 8,
      hiddenDimension: 256,
      attentionHeads: 8,
      ffnDimension: 1024,
      vocabSize: 16384,
      maxSequenceLength: 1024,
      defaultQuantization: 'INT8',
      enableMultimodalHeads: true,
      enableActivationCheckpointing: true,
      tileSizeBytes: 1 * 1024 * 1024, // 1 MB
    }),
    SMALL: Object.freeze({
      modelId: 'CUBIO_MODEL_SMALL',
      modelName: 'CubiO-Small',
      profile: 'SMALL',
      layerCount: 12,
      hiddenDimension: 512,
      attentionHeads: 8,
      ffnDimension: 2048,
      vocabSize: 32768,
      maxSequenceLength: 2048,
      defaultQuantization: 'INT8',
      enableMultimodalHeads: true,
      enableActivationCheckpointing: true,
      tileSizeBytes: 2 * 1024 * 1024, // 2 MB
    }),
    MEDIUM: Object.freeze({
      modelId: 'CUBIO_MODEL_MEDIUM',
      modelName: 'CubiO-Medium',
      profile: 'MEDIUM',
      layerCount: 24,
      hiddenDimension: 1024,
      attentionHeads: 16,
      ffnDimension: 4096,
      vocabSize: 32768,
      maxSequenceLength: 2048,
      defaultQuantization: 'INT8',
      enableMultimodalHeads: true,
      enableActivationCheckpointing: true,
      tileSizeBytes: 4 * 1024 * 1024, // 4 MB
    }),
    LARGE: Object.freeze({
      modelId: 'CUBIO_MODEL_LARGE',
      modelName: 'CubiO-Large',
      profile: 'LARGE',
      layerCount: 32,
      hiddenDimension: 2048,
      attentionHeads: 32,
      ffnDimension: 8192,
      vocabSize: 65536,
      maxSequenceLength: 4096,
      defaultQuantization: 'INT4',
      enableMultimodalHeads: true,
      enableActivationCheckpointing: true,
      tileSizeBytes: 8 * 1024 * 1024, // 8 MB
    }),
    CUSTOM: Object.freeze({
      modelId: 'CUBIO_MODEL_CUSTOM',
      modelName: 'CubiO-Custom',
      profile: 'CUSTOM',
      layerCount: 16,
      hiddenDimension: 768,
      attentionHeads: 12,
      ffnDimension: 3072,
      vocabSize: 32768,
      maxSequenceLength: 2048,
      defaultQuantization: 'INT8',
      enableMultimodalHeads: true,
      enableActivationCheckpointing: true,
      tileSizeBytes: 2 * 1024 * 1024,
    }),
  };

  public static getProfile(profile: ModelScaleProfile): ScalableModelArchitectureConfig {
    return this.STANDARD_PROFILES[profile] || this.STANDARD_PROFILES.EDGE;
  }

  /**
   * Validates a model configuration and ensures architectural consistency.
   */
  public static validateConfig(cfg: ScalableModelArchitectureConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (cfg.layerCount <= 0 || cfg.layerCount > 128) {
      errors.push(`Invalid layerCount: ${cfg.layerCount}. Must be in range [1..128].`);
    }
    if (cfg.hiddenDimension <= 0 || cfg.hiddenDimension % cfg.attentionHeads !== 0) {
      errors.push(`hiddenDimension (${cfg.hiddenDimension}) must be divisible by attentionHeads (${cfg.attentionHeads}).`);
    }
    if (cfg.ffnDimension <= 0) {
      errors.push(`ffnDimension must be positive: ${cfg.ffnDimension}`);
    }
    if (cfg.vocabSize <= 0) {
      errors.push(`vocabSize must be positive: ${cfg.vocabSize}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
