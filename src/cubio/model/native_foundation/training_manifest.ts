/**
 * CUBiO AI — Phase 24: Native CUBiO Model Training & Genesis
 * training_manifest.ts
 *
 * Training manifest manager & cryptographic sealer.
 */

import { createHash } from 'crypto';
import { TrainingConfiguration } from './native_model_types';

export interface SealedTrainingManifest {
  readonly manifestHash: string;
  readonly configuration: TrainingConfiguration;
  readonly sealedAt: string;
}

export class TrainingManifestManager {
  public static sealManifest(config: TrainingConfiguration): SealedTrainingManifest {
    const payload = JSON.stringify({
      trainingRunId: config.trainingRunId,
      datasetHash: config.datasetHash,
      vocabularyHash: config.vocabularyHash,
      architectureHash: config.architectureHash,
      genesisHash: config.genesisHash,
      optimizer: config.optimizer,
      learningRate: config.learningRate,
      minLearningRate: config.minLearningRate,
      scheduler: config.scheduler,
      batchSize: config.batchSize,
      sequenceLength: config.sequenceLength,
      epochs: config.epochs,
      seed: config.seed,
      dtype: config.dtype,
      gradientClippingNorm: config.gradientClippingNorm,
      weightDecay: config.weightDecay,
      softwareVersion: config.softwareVersion,
      runtimeVersion: config.runtimeVersion,
    });

    const manifestHash = createHash('sha256').update(payload).digest('hex');

    return Object.freeze({
      manifestHash,
      configuration: config,
      sealedAt: new Date().toISOString(),
    });
  }

  public static verifyManifest(sealed: SealedTrainingManifest): boolean {
    const recalculated = this.sealManifest(sealed.configuration);
    return recalculated.manifestHash === sealed.manifestHash;
  }
}
