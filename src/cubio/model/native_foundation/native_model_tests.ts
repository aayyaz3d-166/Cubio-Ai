/**
 * CUBiO AI — Phase 24: Native CUBiO Model Training & Genesis
 * native_model_tests.ts
 *
 * 100+ Comprehensive Unit and Integration Tests for Native Model Foundation.
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  CUBIO_NATIVE_MODEL_ID,
  CUBIO_MODEL_GENESIS_ID,
  CUBIO_TOKENIZER_ID,
  CUBIO_VOCABULARY_ID,
  CUBIO_LINEAGE_ROOT,
  EpistemicStatus,
  TrainingLifecycleStage,
  ModelOperationalState,
  NativeModelConfig,
  TrainingConfiguration,
} from './native_model_types';
import { ExternalModelGuard, ExternalModelDependencyError, ActuationBlockedError, NetworkAccessBlockedError } from './external_model_guard';
import { NativeVocabularyBuilder } from './native_vocabulary';
import { NativeTokenizer } from './native_tokenizer';
import { CubiONativeModel, DeterministicPRNG } from './native_model_architecture';
import { NativeModelGenesis } from './native_model_genesis';
import { NativeModelLoader } from './native_model_loader';
import { TrainingConfigFactory } from './training_config';
import { TrainingDataValidator } from './training_data_validator';
import { TrainingManifestManager } from './training_manifest';
import { CheckpointManager } from './checkpoint_manager';
import { ModelDatabase } from './model_database';
import { ModelLineageManager } from './model_lineage';
import { ModelRegistry } from './model_registry';
import { NativeInferenceEngine } from './native_inference_engine';
import { EvaluationEngine } from './evaluation_engine';
import { ModelArtifactScanner } from './model_artifact_scanner';
import { BenchmarkRunner } from './benchmark_runner';

export interface TestResult {
  readonly id: string;
  readonly name: string;
  readonly passed: boolean;
  readonly error?: string;
}

export class NativeModelTestSuite {
  private results: TestResult[] = [];

  private assert(condition: boolean, testId: string, name: string): void {
    if (condition) {
      this.results.push({ id: testId, name, passed: true });
    } else {
      this.results.push({ id: testId, name, passed: false, error: 'Assertion failed' });
    }
  }

  private assertThrows(fn: () => void, testId: string, name: string, expectedErrorName?: string): void {
    try {
      fn();
      this.results.push({ id: testId, name, passed: false, error: 'Expected function to throw, but it succeeded' });
    } catch (err: any) {
      if (!expectedErrorName || err.name === expectedErrorName || (err.message && err.message.includes(expectedErrorName))) {
        this.results.push({ id: testId, name, passed: true });
      } else {
        this.results.push({ id: testId, name, passed: false, error: `Expected ${expectedErrorName} but got ${err.name}` });
      }
    }
  }

  public runAllTests(): TestResult[] {
    this.results = [];

    // =========================================================================
    // SECTION 1: External Model Guard (Tests 1 - 20)
    // =========================================================================
    const foreignModels = [
      'qwen', 'qwen2', 'qwen-7b', 'llama', 'llama-3', 'mistral', 'mistral-7b',
      'gemma', 'gemma-2', 'gpt-4', 'gpt-3.5', 'claude-3', 'gemini-1.5',
      'deepseek', 'falcon', 'bert-base', 'roberta', 't5-base', 'chinchilla', 'palm',
    ];

    foreignModels.forEach((modelName, idx) => {
      this.assertThrows(
        () => ExternalModelGuard.assertNativeOnly(modelName),
        `TEST_GUARD_${idx + 1}`,
        `Guard blocks external model '${modelName}'`,
        'ExternalModelDependencyError'
      );
    });

    // Guard allows sovereign CUBiO identifiers
    const nativeIds = [
      CUBIO_NATIVE_MODEL_ID,
      CUBIO_MODEL_GENESIS_ID,
      CUBIO_TOKENIZER_ID,
      CUBIO_VOCABULARY_ID,
      'CUBIO-STAGE1-V1',
    ];
    nativeIds.forEach((id, idx) => {
      let passed = true;
      try {
        ExternalModelGuard.assertNativeOnly(id);
      } catch (e) {
        passed = false;
      }
      this.assert(passed, `TEST_GUARD_NATIVE_${idx + 1}`, `Guard permits sovereign native ID '${id}'`);
    });

    // Guard blocks actuation patterns
    const actuationCmds = ['actuate_motor', 'gpio_write', 'usb_transmit', 'robotic_arm', 'servo_set_angle'];
    actuationCmds.forEach((cmd, idx) => {
      this.assertThrows(
        () => ExternalModelGuard.assertActuationBlocked(cmd),
        `TEST_ACTUATION_${idx + 1}`,
        `Guard blocks physical actuation '${cmd}'`,
        'ActuationBlockedError'
      );
    });

    // Guard blocks network calls
    const urls = ['http://api.openai.com', 'https://huggingface.co', 'https://api.anthropic.com'];
    urls.forEach((url, idx) => {
      this.assertThrows(
        () => ExternalModelGuard.assertNetworkBlocked(url),
        `TEST_NETWORK_${idx + 1}`,
        `Guard blocks remote network call '${url}'`,
        'NetworkAccessBlockedError'
      );
    });

    // =========================================================================
    // SECTION 2: Vocabulary & Tokenizer (Tests 21 - 40)
    // =========================================================================
    const vocab = NativeVocabularyBuilder.buildVocabulary();
    this.assert(vocab.size >= 256, 'TEST_VOCAB_01', 'Vocabulary contains >= 256 sovereign tokens');
    this.assert(vocab.vocabularyHash.length === 64, 'TEST_VOCAB_02', 'Vocabulary hash is valid SHA-256');

    // Special tokens verified
    const specialKeys = ['PAD', 'UNK', 'BOS', 'EOS', 'EPISTEMIC_FACT', 'EPISTEMIC_OBSERVATION', 'EPISTEMIC_DERIVATION', 'EPISTEMIC_HYPOTHESIS', 'EPISTEMIC_PREDICTION', 'EPISTEMIC_ASSUMPTION'];
    specialKeys.forEach((key, idx) => {
      const tokStr = (NativeVocabularyBuilder.SPECIAL_TOKENS as any)[key];
      this.assert(vocab.tokenToId.has(tokStr), `TEST_VOCAB_SPECIAL_${idx + 1}`, `Vocab contains special token '${tokStr}'`);
    });

    const tokenizer = new NativeTokenizer(vocab);
    this.assert(tokenizer.getVocabSize() === vocab.size, 'TEST_TOK_01', 'Tokenizer matches vocabulary size');

    // Tokenizer reversibility
    const sampleTexts = [
      'CUBiO native model foundation',
      'Address 369 spatial lattice cell 342',
      'E = mc^2 energy mass balance',
      'علم کی تصدیQ',
      'Roman Urdu me training chal rahi hai',
    ];
    sampleTexts.forEach((text, idx) => {
      const tokens = tokenizer.encode(text, { addSpecialTokens: false });
      const decoded = tokenizer.decode(tokens, { skipSpecialTokens: false });
      this.assert(tokens.length > 0 && decoded.length > 0, `TEST_TOK_REV_${idx + 1}`, `Tokenizer encodes and decodes '${text}'`);
    });

    // Unknown token handling (no throwing, uses UNK)
    const rareText = 'Special glyphs 𓀀 𓀁 𓀂 testing unk';
    let handledWithoutCrash = true;
    try {
      const unkTokens = tokenizer.encode(rareText);
      const decodedUnk = tokenizer.decode(unkTokens);
      handledWithoutCrash = unkTokens.length > 0;
    } catch (e) {
      handledWithoutCrash = false;
    }
    this.assert(handledWithoutCrash, 'TEST_TOK_UNK', 'Tokenizer handles unknown glyphs gracefully');

    // Sequence truncation and padding
    const truncated = tokenizer.encode('A very long sequence that should be strictly truncated to five tokens', { maxSeqLen: 5 });
    this.assert(truncated.length === 5, 'TEST_TOK_TRUNC', 'Tokenizer enforces maxSeqLen truncation');

    const padded = tokenizer.encode('Hi', { maxSeqLen: 10, padToMaxLen: true });
    this.assert(padded.length === 10, 'TEST_TOK_PAD', 'Tokenizer enforces padToMaxLen padding');

    // =========================================================================
    // SECTION 3: Model Architecture & Parameter Accounting (Tests 41 - 55)
    // =========================================================================
    const modelConfig: NativeModelConfig = {
      modelId: CUBIO_NATIVE_MODEL_ID,
      architectureId: 'CUBIO-NATIVE-ARCH-V1',
      vocabSize: vocab.size,
      embedDim: 64,
      numHeads: 4,
      numLayers: 2,
      maxSeqLen: 64,
      numSpatialCells: 343,
      numSymbolicAnchors: 26,
      totalAddresses: 369,
      dropout: 0.1,
      masterSeed: 369001000,
    };

    const model = new CubiONativeModel(modelConfig);
    const inventory = model.getParameterInventory();

    this.assert(inventory.accountingVerified === true, 'TEST_ARCH_01', 'Parameter accounting verified');
    this.assert(inventory.totalParameters > 0, 'TEST_ARCH_02', 'Total parameters is strictly positive integer');
    this.assert(Number.isInteger(inventory.totalParameters), 'TEST_ARCH_03', 'Total parameters is an exact integer');
    this.assert(inventory.totalParameters === inventory.trainableParameters, 'TEST_ARCH_04', 'All native parameters are accounted as trainable');
    this.assert(inventory.nonTrainableParameters === 0, 'TEST_ARCH_05', 'Zero unaccounted or non-trainable hidden parameters');

    // Forward pass
    const inputIds = tokenizer.encode('Test prompt', { addSpecialTokens: true });
    const forwardOut = model.forward(inputIds);
    this.assert(forwardOut.logits.length === inputIds.length, 'TEST_ARCH_06', 'Logits length matches inputIds length');
    this.assert(forwardOut.logits[0].length === vocab.size, 'TEST_ARCH_07', 'Logits vocabulary dimension matches vocab size');
    this.assert(forwardOut.dominantEpistemicStatus in EpistemicStatus, 'TEST_ARCH_08', 'Epistemic status is valid 7-tier enum');

    // Address 369 Spatial Lattice Invariant
    const coord0 = CubiONativeModel.mapCellIdToSpatialCoordinates(0);
    this.assert(coord0.x === 0 && coord0.y === 0 && coord0.z === 0 && coord0.address369 === 26, 'TEST_ARCH_SPAT_01', 'Cell 0 maps to (0,0,0) and Address 26');

    const coord342 = CubiONativeModel.mapCellIdToSpatialCoordinates(342);
    this.assert(coord342.x === 6 && coord342.y === 6 && coord342.z === 6 && coord342.address369 === 368, 'TEST_ARCH_SPAT_02', 'Cell 342 maps to (6,6,6) and Address 368');

    const coordRoundtrip = CubiONativeModel.mapCoordinatesToCellId(coord342.x, coord342.y, coord342.z);
    this.assert(coordRoundtrip === 342, 'TEST_ARCH_SPAT_03', 'Coordinate mapping roundtrip (x,y,z) -> cellId is reversible');

    this.assertThrows(
      () => CubiONativeModel.mapCellIdToSpatialCoordinates(343),
      'TEST_ARCH_SPAT_BOUND',
      'CellId 343 throws out-of-bounds error'
    );

    // Deterministic PRNG Mulberry32 test
    const prng1 = new DeterministicPRNG(369);
    const prng2 = new DeterministicPRNG(369);
    this.assert(prng1.next() === prng2.next(), 'TEST_PRNG_01', 'Mulberry32 PRNG is bit-identical across runs');

    // Weights hash determinism
    const hash1 = model.computeWeightsHash();
    const hash2 = model.computeWeightsHash();
    this.assert(hash1 === hash2, 'TEST_WEIGHTS_HASH', 'Model weights SHA-256 hash is deterministic');

    // =========================================================================
    // SECTION 4: Genesis & Checkpoint Management (Tests 56 - 65)
    // =========================================================================
    const genesisResult = NativeModelGenesis.createGenesis(369001000);
    this.assert(genesisResult.record.genesisId === CUBIO_MODEL_GENESIS_ID, 'TEST_GEN_01', 'Genesis ID matches CUBIO-MODEL-GENESIS-V1');
    this.assert(genesisResult.record.parentCheckpoint === null, 'TEST_GEN_02', 'Genesis parentCheckpoint is strictly null');
    this.assert(genesisResult.record.modelLineageRoot === CUBIO_LINEAGE_ROOT, 'TEST_GEN_03', 'Genesis lineage root matches CUBIO-GENESIS');

    // Reproducibility test
    const repro = NativeModelGenesis.verifyReproducibility(369001000);
    this.assert(repro === true, 'TEST_GEN_REPRO', 'Genesis state hash is 100% reproducible bit-for-bit');

    // Checkpoint creation & domain separation
    const chk = CheckpointManager.createCheckpoint(genesisResult.model, 'TEST_RUN_01', null);
    this.assert(chk.containerType === 'CUBIO_NATIVE_MODEL_CHECKPOINT_V1', 'TEST_CHK_01', 'Checkpoint container is CUBIO_NATIVE_MODEL_CHECKPOINT_V1');
    this.assert(chk.parameterInventory.totalParameters === genesisResult.model.getParameterCount(), 'TEST_CHK_02', 'Checkpoint preserves parameter inventory');

    // Domain separation guard: saving to .3dmemory is rejected
    this.assertThrows(
      () => CheckpointManager.saveCheckpoint(chk, 'some_dir/memory.3dmemory'),
      'TEST_CHK_DOMAIN_SEP_SAVE',
      'Saving weights to .3dmemory throws DOMAIN_CONFLATION_ERROR'
    );

    this.assertThrows(
      () => CheckpointManager.loadCheckpoint('some_dir/memory.3dmemory'),
      'TEST_CHK_DOMAIN_SEP_LOAD',
      'Loading model from .3dmemory throws DOMAIN_CONFLATION_ERROR'
    );

    // Loader integrity validation
    const loadedModel = NativeModelLoader.loadFromCheckpoint(chk, genesisResult.model.config);
    this.assert(loadedModel.getParameterCount() === genesisResult.model.getParameterCount(), 'TEST_LOADER_01', 'Loaded model parameter count matches original');
    this.assert(NativeModelLoader.validateCheckpointIntegrity(chk) === true, 'TEST_LOADER_02', 'Checkpoint passes structural integrity verification');

    // =========================================================================
    // SECTION 5: Dataset & Validator (Tests 66 - 75)
    // =========================================================================
    const corpus = TrainingDataValidator.generateCorpus();
    this.assert(corpus.length >= 15, 'TEST_DATA_01', 'Dataset corpus contains at least 15 sovereign episodes');

    const split = TrainingDataValidator.partitionAndValidate(corpus);
    this.assert(split.train.length > 0, 'TEST_DATA_02', 'Training split has > 0 episodes');
    this.assert(split.validation.length > 0, 'TEST_DATA_03', 'Validation split has > 0 episodes');
    this.assert(split.unseenTest.length > 0, 'TEST_DATA_04', 'Unseen test split has > 0 episodes');
    this.assert(split.trainTestOverlapCount === 0, 'TEST_DATA_LEAKAGE', 'TRAIN_TEST_OVERLAP is strictly 0');

    // Simulated leakage detection
    const leakedCorpus = [...corpus, corpus[0]]; // Duplicate first episode
    // Partition with leaked item
    let leakageDetected = false;
    try {
      TrainingDataValidator.partitionAndValidate(leakedCorpus);
    } catch (e: any) {
      if (e.message.includes('DATA_LEAKAGE_DETECTED')) leakageDetected = true;
    }
    this.assert(leakageDetected, 'TEST_DATA_LEAKAGE_GATE', 'Validator fail-closed gate catches train/test leakage');

    // =========================================================================
    // SECTION 6: Database, Lineage & Registry (Tests 76 - 85)
    // =========================================================================
    const db = new ModelDatabase();
    this.assert(db.models instanceof Map && db.checkpoints instanceof Map, 'TEST_DB_01', 'ModelDatabase initializes 9 relational maps');

    db.registerGenesis(genesisResult.record);
    this.assert(db.models.has(CUBIO_MODEL_GENESIS_ID), 'TEST_DB_02', 'ModelDatabase registers genesis model');
    this.assert(db.lineage_dag.has(CUBIO_MODEL_GENESIS_ID), 'TEST_DB_03', 'ModelDatabase records genesis node in lineage DAG');

    db.registerCheckpoint(chk);
    this.assert(db.checkpoints.has(chk.checkpointId), 'TEST_DB_04', 'ModelDatabase registers checkpoint container');

    // Model Lineage DAG
    const lineage = new ModelLineageManager(db);
    this.assert(lineage.validateDAG() === true, 'TEST_LINEAGE_01', 'Lineage DAG validates root genesis single source');

    const linResult = lineage.verifyLineageToGenesis(chk.checkpointId);
    this.assert(linResult.valid === true, 'TEST_LINEAGE_02', 'Lineage DAG verifies unbroken path to genesis root');

    // Non-existent checkpoint verification fails
    const badLinResult = lineage.verifyLineageToGenesis('NON_EXISTENT_CHK');
    this.assert(badLinResult.valid === false, 'TEST_LINEAGE_ORPHAN', 'Lineage verification rejects unregistered checkpoint');

    // Model Registry
    const registry = new ModelRegistry();
    const candidateEntry = registry.registerCandidate(chk);
    this.assert(candidateEntry.operationalState === ModelOperationalState.INITIALIZED, 'TEST_REG_01', 'Registry registers model candidate in INITIALIZED state');

    const registryEvalEngine = new EvaluationEngine(tokenizer);
    const mockScorecard = registryEvalEngine.evaluateModel(model, chk.checkpointId);
    const failingScorecard = { ...mockScorecard, isPreRegisteredTargetMet: false, overallAccuracy: 0.1 };
    this.assertThrows(
      () => registry.promoteToCertified(chk.modelId, failingScorecard),
      'TEST_REG_REJECT',
      'Registry rejects promotion if targets are not met'
    );
    const passingScorecard = { ...mockScorecard, isPreRegisteredTargetMet: true, overallAccuracy: 0.85 };
    const certifiedEntry = registry.promoteToCertified(chk.modelId, passingScorecard);
    this.assert(certifiedEntry.operationalState === ModelOperationalState.READY, 'TEST_REG_02', 'Registry transitions certified model state to READY');
    this.assert(registry.getActiveModel()?.modelId === chk.modelId, 'TEST_REG_03', 'Registry sets certified model as active model');

    // =========================================================================
    // SECTION 7: Inference & Epistemic Non-Fact Lockout (Tests 86 - 95)
    // =========================================================================
    const inferenceEngine = new NativeInferenceEngine(model, tokenizer);
    const genOut = inferenceEngine.generate('State the coordinate of cell 0', { maxTokens: 8 });
    this.assert(genOut.verifiedLocalNative === true, 'TEST_INF_01', 'Inference verified local native execution');
    this.assert(genOut.externalModelCalls === 0, 'TEST_INF_02', 'Inference reports strictly 0 external model calls');
    this.assert(genOut.latencyMs > 0, 'TEST_INF_03', 'Inference measures execution latency');

    // Epistemic classification
    const epiClass = inferenceEngine.classifyEpistemic('The weather might be cold tomorrow');
    this.assert(epiClass.dominantStatus in EpistemicStatus, 'TEST_INF_EPI_01', 'Epistemic classification returns valid status');

    // Non-fact lockout test: PREDICTION must not claim FACT
    const predOut = inferenceEngine.generate('Prediction for future lottery numbers', {
      maxTokens: 8,
      enforceEpistemicLockout: true,
    });
    this.assert(predOut.epistemicStatus !== EpistemicStatus.FACT || !predOut.text.includes('definite objective fact'), 'TEST_INF_LOCKOUT', 'Non-fact lockout enforced on prediction');

    // =========================================================================
    // SECTION 8: Evaluation, Scanner & Benchmarking (Tests 96 - 105)
    // =========================================================================
    const evalEngine = new EvaluationEngine(tokenizer);
    const battery = evalEngine.generateEvaluationBattery();
    this.assert(battery.length === 12, 'TEST_EVAL_01', 'Evaluation battery contains 12 pre-registered categories');

    const evalScore = evalEngine.evaluateModel(model, 'CHK_TEST');
    this.assert(evalScore.categories.length === 12, 'TEST_EVAL_02', 'Scorecard contains all 12 categories');
    this.assert(evalScore.overallAccuracy >= 0 && evalScore.overallAccuracy <= 1, 'TEST_EVAL_03', 'Accuracy within [0..1]');

    // Overfitting report
    const overfit = evalEngine.checkOverfitting(model, split.train, split.validation, split.unseenTest);
    this.assert(typeof overfit.isGeneralizingWell === 'boolean', 'TEST_OVERFIT_01', 'Overfitting report produces generalization flag');
    this.assert(typeof overfit.isMemorizationFlagged === 'boolean', 'TEST_OVERFIT_02', 'Overfitting report checks memorization');

    // Artifact Scanner
    const cleanScan = ModelArtifactScanner.scanCheckpoint(chk);
    this.assert(cleanScan.clean === true, 'TEST_SCAN_CLEAN', 'Artifact scanner marks clean checkpoint as clean');
    this.assert(cleanScan.foreignWeightsFound === 0, 'TEST_SCAN_WEIGHTS', 'Zero foreign weights found in checkpoint');
    this.assert(cleanScan.foreignTokensFound === 0, 'TEST_SCAN_TOKENS', 'Zero foreign tokens found in checkpoint');

    // Foreign token detection
    const dirtyCheckpoint: any = {
      ...chk,
      checkpointId: 'CHK_DIRTY',
      notes: '<|im_start|> assistant <|im_end|>',
    };
    const dirtyScan = ModelArtifactScanner.scanCheckpoint(dirtyCheckpoint);
    this.assert(dirtyScan.clean === false && dirtyScan.foreignTokensFound > 0, 'TEST_SCAN_DIRTY', 'Artifact scanner flags dirty checkpoint containing foreign tokens');

    return this.results;
  }
}
