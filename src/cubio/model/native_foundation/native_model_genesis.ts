/**
 * CUBiO AI — Phase 24: Native CUBiO Model Training & Genesis
 * native_model_genesis.ts
 *
 * Sovereign Model Genesis Factory for CUBIO-MODEL-GENESIS-V1.
 * Creates deterministic root genesis from seed 369001000 with parentCheckpoint: null.
 * Strictly guarantees that createdAt exists as metadata but is EXCLUDED from the
 * deterministic model-state hash.
 */

import { createHash } from 'crypto';
import {
  CUBIO_MODEL_GENESIS_ID,
  CUBIO_LINEAGE_ROOT,
  ModelGenesisRecord,
  NativeModelConfig,
} from './native_model_types';
import { CubiONativeModel } from './native_model_architecture';
import { NativeVocabularyBuilder } from './native_vocabulary';
import { ExternalModelGuard } from './external_model_guard';

export class NativeModelGenesis {
  public static readonly DEFAULT_GENESIS_SEED = 369001000;
  public static readonly ARCHITECTURE_VERSION = '1.0.0';
  public static readonly VOCABULARY_VERSION = '1.0.0';

  /**
   * Generates the authoritative CUBIO-MODEL-GENESIS-V1 model instance and genesis record
   */
  public static createGenesis(
    customSeed = NativeModelGenesis.DEFAULT_GENESIS_SEED,
    trainingManifestHash = '0xTRAIN_MANIFEST_GENESIS_ROOT',
    datasetManifestHash = '0xDATASET_MANIFEST_GENESIS_ROOT'
  ): { model: CubiONativeModel; record: ModelGenesisRecord } {
    ExternalModelGuard.assertNativeOnly(CUBIO_MODEL_GENESIS_ID);

    const vocab = NativeVocabularyBuilder.buildVocabulary();

    const config: NativeModelConfig = {
      modelId: CUBIO_MODEL_GENESIS_ID,
      architectureId: 'CUBIO-NATIVE-ARCH-V1',
      vocabSize: vocab.size,
      embedDim: 64,
      numHeads: 4,
      numLayers: 4,
      maxSeqLen: 64,
      numSpatialCells: 343,
      numSymbolicAnchors: 26,
      totalAddresses: 369,
      dropout: 0.1,
      masterSeed: customSeed,
    };

    const model = new CubiONativeModel(config);
    const weightsHash = model.computeWeightsHash();

    // Deterministic state hash strictly excludes createdAt
    const statePayload = [
      CUBIO_MODEL_GENESIS_ID,
      CUBIO_LINEAGE_ROOT,
      customSeed.toString(),
      'null', // parentCheckpoint is strictly null
      NativeModelGenesis.ARCHITECTURE_VERSION,
      NativeModelGenesis.VOCABULARY_VERSION,
      trainingManifestHash,
      datasetManifestHash,
      'DeterministicPRNG(Mulberry32)_Xavier',
      weightsHash,
    ].join(':');

    const deterministicGenesisStateHash = createHash('sha256').update(statePayload).digest('hex');

    const record: ModelGenesisRecord = Object.freeze({
      genesisId: CUBIO_MODEL_GENESIS_ID,
      modelLineageRoot: CUBIO_LINEAGE_ROOT,
      genesisSeed: customSeed,
      parentCheckpoint: null,
      architectureVersion: NativeModelGenesis.ARCHITECTURE_VERSION,
      vocabularyVersion: NativeModelGenesis.VOCABULARY_VERSION,
      trainingManifestHash,
      datasetManifestHash,
      initializationMethod: 'DeterministicPRNG(Mulberry32)_Xavier',
      createdAt: new Date().toISOString(), // Metadata only
      deterministicGenesisStateHash,
    });

    return { model, record };
  }

  /**
   * Verifies that genesis creation is bit-identical across two separate invocations with the same seed
   */
  public static verifyReproducibility(seed = NativeModelGenesis.DEFAULT_GENESIS_SEED): boolean {
    const run1 = this.createGenesis(seed);
    const run2 = this.createGenesis(seed);

    return (
      run1.record.deterministicGenesisStateHash === run2.record.deterministicGenesisStateHash &&
      run1.model.computeWeightsHash() === run2.model.computeWeightsHash() &&
      run1.model.getParameterCount() === run2.model.getParameterCount()
    );
  }
}
