/**
 * CUBiO AI — Phase 24: Native CUBiO Model Training & Genesis
 * training_config.ts
 *
 * Training configuration generator with scientific bounds & fail-closed validation.
 */

import { TrainingConfiguration } from './native_model_types';

export class TrainingConfigFactory {
  public static readonly DEFAULT_SEED = 369001000;
  public static readonly DEFAULT_LEARNING_RATE = 0.001;
  public static readonly DEFAULT_MIN_LR = 0.0001;
  public static readonly DEFAULT_BATCH_SIZE = 8;
  public static readonly DEFAULT_SEQ_LEN = 64;
  public static readonly DEFAULT_EPOCHS = 5;

  public static createDefaultConfig(
    trainingRunId: string,
    datasetHash: string,
    vocabularyHash: string,
    architectureHash: string,
    genesisHash: string,
    overrides: Partial<TrainingConfiguration> = {}
  ): TrainingConfiguration {
    const config: TrainingConfiguration = {
      trainingRunId,
      datasetHash,
      vocabularyHash,
      architectureHash,
      genesisHash,
      optimizer: overrides.optimizer ?? 'AdamW',
      learningRate: overrides.learningRate ?? TrainingConfigFactory.DEFAULT_LEARNING_RATE,
      minLearningRate: overrides.minLearningRate ?? TrainingConfigFactory.DEFAULT_MIN_LR,
      scheduler: overrides.scheduler ?? 'cosine',
      batchSize: overrides.batchSize ?? TrainingConfigFactory.DEFAULT_BATCH_SIZE,
      sequenceLength: overrides.sequenceLength ?? TrainingConfigFactory.DEFAULT_SEQ_LEN,
      epochs: overrides.epochs ?? TrainingConfigFactory.DEFAULT_EPOCHS,
      seed: overrides.seed ?? TrainingConfigFactory.DEFAULT_SEED,
      dtype: 'float32',
      gradientClippingNorm: overrides.gradientClippingNorm ?? 1.0,
      weightDecay: overrides.weightDecay ?? 0.01,
      softwareVersion: '1.0.0',
      runtimeVersion: '1.0.0',
    };

    TrainingConfigFactory.validateConfig(config);
    return Object.freeze(config);
  }

  public static validateConfig(config: TrainingConfiguration): void {
    if (!config.trainingRunId) throw new Error('Invalid trainingRunId');
    if (config.learningRate <= 0 || !Number.isFinite(config.learningRate)) {
      throw new Error(`Invalid learningRate: ${config.learningRate}`);
    }
    if (config.epochs <= 0 || !Number.isInteger(config.epochs)) {
      throw new Error(`Invalid epochs: ${config.epochs}`);
    }
    if (config.batchSize <= 0 || !Number.isInteger(config.batchSize)) {
      throw new Error(`Invalid batchSize: ${config.batchSize}`);
    }
    if (config.sequenceLength <= 0 || !Number.isInteger(config.sequenceLength)) {
      throw new Error(`Invalid sequenceLength: ${config.sequenceLength}`);
    }
    if (config.gradientClippingNorm <= 0 || !Number.isFinite(config.gradientClippingNorm)) {
      throw new Error(`Invalid gradientClippingNorm: ${config.gradientClippingNorm}`);
    }
  }
}
