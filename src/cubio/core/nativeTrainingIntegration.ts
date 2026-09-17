/**
 * CUBiO AI — Task 15: Native CUBiO Training Integration
 * src/cubio/core/nativeTrainingIntegration.ts
 *
 * Sovereign Native CUBiO Training Pipeline connecting:
 * Canonical VDB / Memory
 *        ↓
 * Training Data Selection
 *        ↓
 * Canonical Training Samples (sampleId, objectId, tenantId, stateVersion, checksum, cellId, address369)
 *        ↓
 * Native CUBiO Training Engine (219,264 params, 4 layers, vocab 478, embed 64, heads 4)
 *        ↓
 * Parameter Update Verification (parameter_before !== parameter_after, loss decrease)
 *        ↓
 * Checkpoint Export (.3dmemory V3 format)
 *        ↓
 * Checkpoint Restore & Verification (bit-identical state hash)
 *        ↓
 * Working Set Eviction (Bounded Memory)
 *
 * ARCHITECTURAL LOCKS & INVARIANTS:
 * 1. ZERO external pretrained models (no Qwen, LLaMA, Mistral, Gemma, GPT, Claude, Gemini, BERT, etc.).
 * 2. ZERO external model weights or internet/cloud downloads.
 * 3. Spatial authority via src/core/address369.ts and Formula A:
 *      cellId = x + 7*y + 49*z
 *      address369 = 26 + cellId
 * 4. Exact parameter accounting: 219,264 parameters across 37 tensors, 219,264 trainable, 0 non-trainable, dtype float32.
 * 5. Permanent hardware actuation lockout: IS_ACTUATION_BLOCKED === true.
 * 6. Store once -> reference everywhere -> load on demand -> train -> checkpoint -> evict.
 * 7. Tenant isolation enforced fail-closed (TENANT_MISMATCH_CONFLICT).
 * 8. Data integrity enforced fail-closed (TRAINING_DATA_INTEGRITY_FAILURE).
 * 9. Finite numerical safety: log-sum-exp trick, zero silent NaN / Inf acceptance.
 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { IS_ACTUATION_BLOCKED } from '../intelligence/core/coreEngineContract';
import {
  calculateCanonicalChecksum,
  CanonicalIdentityKey,
  canonicalStringify,
  validateCanonicalIdentity,
} from './canonicalIdentity';
import {
  cellIdToAddress369,
  validateCellId,
  TOTAL_SPATIAL_CELLS,
  TOTAL_ADDRESS_SPACE,
  cellIdToCoordinate,
} from '../../core/address369';
import { SQLiteDataStore } from '../../funnel71/persistence/sqlitePersistence';
import { StudioRecord } from '../../funnel71/types';
import {
  ThreeDMemoryCheckpointEngine,
  CheckpointRecord,
} from './threeDMemoryStreaming';

// Native model architecture and types from sovereign foundation
import {
  CUBIO_NATIVE_MODEL_ID,
  CUBIO_MODEL_GENESIS_ID,
  EpistemicStatus,
  NativeModelConfig,
  TrainingConfiguration,
  ParameterInventory,
} from '../model/native_foundation/native_model_types';
import {
  CubiONativeModel,
  NativeModelWeights,
  DeterministicPRNG,
} from '../model/native_foundation/native_model_architecture';
import { NativeVocabularyBuilder, VocabularyCatalog } from '../model/native_foundation/native_vocabulary';
import { NativeTokenizer } from '../model/native_foundation/native_tokenizer';
import { ExternalModelGuard, ExternalModelDependencyError, ActuationBlockedError } from '../model/native_foundation/external_model_guard';

export { IS_ACTUATION_BLOCKED };

// =============================================================================
// ERROR CLASSES
// =============================================================================

export class TrainingIntegrityError extends Error {
  constructor(message: string) {
    super(`[TRAINING_DATA_INTEGRITY_FAILURE] ${message}`);
    this.name = 'TrainingIntegrityError';
  }
}

export class TenantMismatchError extends Error {
  constructor(message: string) {
    super(`[TENANT_MISMATCH_CONFLICT] ${message}`);
    this.name = 'TenantMismatchError';
  }
}

export class NumericalSafetyError extends Error {
  constructor(message: string) {
    super(`[NUMERICAL_SAFETY_VIOLATION] ${message}`);
    this.name = 'NumericalSafetyError';
  }
}

// =============================================================================
// CONSTANTS & CONSTRAINTS
// =============================================================================

export const MAX_TRAINING_BATCH_SIZE = 8;
export const MAX_WORKING_CACHE_CAPACITY = 256;
export const DEFAULT_MASTER_SEED = 369001000;
export const DEFAULT_NUM_LAYERS = 4;
export const DEFAULT_VOCAB_SIZE = 478;
export const DEFAULT_EMBED_DIM = 64;
export const DEFAULT_NUM_HEADS = 4;
export const DEFAULT_MAX_SEQ_LEN = 64;
export const TOTAL_NATIVE_PARAMETERS = 219264;

// =============================================================================
// DATA CONTRACTS
// =============================================================================

export interface CanonicalTrainingSample {
  readonly sampleId: string;
  readonly objectId: string;
  readonly tenantId: string;
  readonly stateVersion: number;
  readonly checksum: string;
  readonly cellId: number;
  readonly address369: number;
  readonly domain: string;
  readonly prompt: string;
  readonly completion: string;
  readonly epistemicStatus: EpistemicStatus;
}

export interface TrainingBatch {
  readonly batchId: string;
  readonly samples: readonly CanonicalTrainingSample[];
  readonly tenantId: string;
  readonly batchSize: number;
}

export interface TrainingStepResult {
  readonly step: number;
  readonly loss: number;
  readonly changedParameters: number;
  readonly paramBefore: number;
  readonly paramAfter: number;
  readonly gradientNorm: number;
  readonly isFinite: boolean;
  readonly learningRate: number;
}

export interface NativeTrainingDiagnostics {
  samplesLoaded: number;
  batchesProcessed: number;
  forwardPasses: number;
  backwardPasses: number;
  optimizerSteps: number;
  parametersChanged: number;
  initialLoss: number;
  finalLoss: number;
  lossDelta: number;
  initialAccuracy: number;
  finalAccuracy: number;
  accuracyDelta: number;
  actuationInterceptions: number;
  tenantConflicts: number;
  integrityFailures: number;
}

// =============================================================================
// CANONICAL VDB TRAINING DATA LOADER
// =============================================================================

export class CanonicalTrainingDataLoader {
  private readonly store: SQLiteDataStore;
  private readonly workingCache: Map<string, CanonicalTrainingSample> = new Map();

  constructor(store?: SQLiteDataStore) {
    this.store = store ?? new SQLiteDataStore();
  }

  /**
   * Loads a canonical training sample for a specific entity ID via targeted point lookup.
   * No full-table database dumps.
   */
  public async loadSample(
    id: string,
    requestedTenantId: string = 'root'
  ): Promise<CanonicalTrainingSample> {
    const record = await this.store.get(id);
    if (!record) {
      throw new Error(`[CANONICAL_DATA_LOADER] Record '${id}' not found in VDB`);
    }

    return this.recordToSample(record, requestedTenantId);
  }

  /**
   * Loads a bounded batch of canonical training samples by specific entity IDs.
   * Enforces batch size limit <= MAX_TRAINING_BATCH_SIZE (8).
   */
  public async loadBatch(
    entityIds: readonly string[],
    requestedTenantId: string = 'root'
  ): Promise<TrainingBatch> {
    if (entityIds.length === 0) {
      throw new Error('[CANONICAL_DATA_LOADER] Batch entity IDs cannot be empty');
    }
    if (entityIds.length > MAX_TRAINING_BATCH_SIZE) {
      throw new Error(
        `[BOUNDED_MEMORY_VIOLATION] Batch size ${entityIds.length} exceeds maximum allowable ${MAX_TRAINING_BATCH_SIZE}`
      );
    }

    const samples: CanonicalTrainingSample[] = [];
    for (const id of entityIds) {
      // Check working cache first
      const cacheKey = `${requestedTenantId}:${id}`;
      let sample = this.workingCache.get(cacheKey);
      if (!sample) {
        sample = await this.loadSample(id, requestedTenantId);
        // Manage bounded working cache capacity
        if (this.workingCache.size >= MAX_WORKING_CACHE_CAPACITY) {
          const oldest = this.workingCache.keys().next().value;
          if (oldest) this.workingCache.delete(oldest);
        }
        this.workingCache.set(cacheKey, sample);
      }
      samples.push(sample);
    }

    return Object.freeze({
      batchId: `BATCH_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      samples: Object.freeze(samples),
      tenantId: requestedTenantId,
      batchSize: samples.length,
    });
  }

  /**
   * Evicts all samples in the working memory cache.
   * Part of LOAD ON DEMAND -> TRAIN -> EVICT lifecycle.
   */
  public evictWorkingSet(): void {
    this.workingCache.clear();
  }

  public getCacheSize(): number {
    return this.workingCache.size;
  }

  /**
   * Converts a VDB StudioRecord into a verified CanonicalTrainingSample.
   * Enforces:
   * - Tenant isolation (fail closed on mismatch)
   * - Checksum verification (fail closed on tampering)
   * - Formula A spatial authority: cellId = x + 7*y + 49*z, address369 = 26 + cellId
   */
  public recordToSample(
    record: StudioRecord,
    requestedTenantId: string = 'root'
  ): CanonicalTrainingSample {
    const meta = (record.metadata as any) ?? {};
    const recordTenant = meta.tenantId ?? (record as any).tenantId ?? 'root';

    // 1. Tenant Isolation Check (Fail Closed)
    if (requestedTenantId !== 'root' && recordTenant !== requestedTenantId) {
      throw new TenantMismatchError(
        `Requested tenant '${requestedTenantId}' cannot access record owned by '${recordTenant}'`
      );
    }

    // 2. Canonical Checksum Verification (Fail Closed)
    const expectedChecksum = calculateCanonicalChecksum(record);
    const storedChecksum = meta.checksum;
    if (storedChecksum && storedChecksum !== expectedChecksum) {
      throw new TrainingIntegrityError(
        `Checksum mismatch for object '${record.id}'. Stored=${storedChecksum}, Computed=${expectedChecksum}`
      );
    }

    // 3. Formula A Spatial Authority
    // cellId = x + 7*y + 49*z
    // address369 = 26 + cellId
    let cellId: number;
    let address369: number;

    const pos = (record as any).position;
    if (Array.isArray(pos) && pos.length >= 3) {
      const x = Math.abs(pos[0]) % 7;
      const y = Math.abs(pos[1]) % 7;
      const z = Math.abs(pos[2]) % 7;
      cellId = x + 7 * y + 49 * z;
    } else if (meta.cellId !== undefined) {
      cellId = Number(meta.cellId);
    } else {
      // Deterministic fallback derived from objectId hash
      const hashInt = parseInt(crypto.createHash('sha256').update(record.id).digest('hex').slice(0, 8), 16);
      cellId = hashInt % TOTAL_SPATIAL_CELLS;
    }

    validateCellId(cellId);
    address369 = cellIdToAddress369(cellId);

    // 4. State Version
    const stateVersion = meta.stateVersion ?? 1;

    // 5. Prompt & Completion generation from canonical structure (concise to fit within maxSeqLen=64)
    const prompt = `ENTITY:${record.id} c:${cellId} a:${address369}`;
    const completion = `TYPE:${record.type} stat:${record.status}`;

    // 6. Epistemic Classification
    const epistemicStatus = record.type === 'STATES' ? EpistemicStatus.FACT : EpistemicStatus.DERIVATION;

    return Object.freeze({
      sampleId: `SMPL_${record.id}`,
      objectId: record.id,
      tenantId: recordTenant,
      stateVersion,
      checksum: expectedChecksum,
      cellId,
      address369,
      domain: record.type,
      prompt,
      completion,
      epistemicStatus,
    });
  }
}

// =============================================================================
// NATIVE TRAINING INTEGRATION ENGINE
// =============================================================================

export class NativeTrainingIntegrationEngine {
  private model: CubiONativeModel;
  private modelConfig: NativeModelConfig;
  private readonly vocabulary: VocabularyCatalog;
  private readonly tokenizer: NativeTokenizer;
  private readonly dataLoader: CanonicalTrainingDataLoader;
  private readonly diagnostics: NativeTrainingDiagnostics;

  // AdamW moment accumulators
  private m_lmHead: number[][];
  private v_lmHead: number[][];
  private m_epiHead: number[][];
  private v_epiHead: number[][];
  private m_tokenEmb: number[][];
  private v_tokenEmb: number[][];

  // Persistent gradient accumulators (zero transient allocations per step)
  private gradLmHead: number[][];
  private gradEpiHead: number[][];
  private gradTokenEmb: number[][];

  private stepCount = 0;

  constructor(options?: {
    modelConfig?: Partial<NativeModelConfig>;
    store?: SQLiteDataStore;
  }) {
    // Permanent Actuation Lock Enforcement
    if (IS_ACTUATION_BLOCKED !== true) {
      throw new ActuationBlockedError('IS_ACTUATION_BLOCKED must be true in NativeTrainingIntegrationEngine');
    }

    // Assert Native Only
    ExternalModelGuard.assertNativeOnly(CUBIO_NATIVE_MODEL_ID);

    this.vocabulary = NativeVocabularyBuilder.buildVocabulary();
    this.tokenizer = new NativeTokenizer(this.vocabulary);

    this.modelConfig = {
      modelId: CUBIO_NATIVE_MODEL_ID,
      architectureId: 'CUBIO-NATIVE-ARCH-V1',
      vocabSize: options?.modelConfig?.vocabSize ?? DEFAULT_VOCAB_SIZE,
      embedDim: options?.modelConfig?.embedDim ?? DEFAULT_EMBED_DIM,
      numHeads: options?.modelConfig?.numHeads ?? DEFAULT_NUM_HEADS,
      numLayers: options?.modelConfig?.numLayers ?? DEFAULT_NUM_LAYERS,
      maxSeqLen: options?.modelConfig?.maxSeqLen ?? DEFAULT_MAX_SEQ_LEN,
      numSpatialCells: TOTAL_SPATIAL_CELLS,
      numSymbolicAnchors: 26,
      totalAddresses: TOTAL_ADDRESS_SPACE,
      dropout: 0.1,
      masterSeed: options?.modelConfig?.masterSeed ?? DEFAULT_MASTER_SEED,
    };

    this.model = new CubiONativeModel(this.modelConfig);
    this.dataLoader = new CanonicalTrainingDataLoader(options?.store);

    // Verify parameter accounting dynamically based on architecture config
    const d = this.modelConfig.embedDim;
    const V = this.modelConfig.vocabSize;
    const T = this.modelConfig.maxSeqLen;
    const L = this.modelConfig.numLayers;
    const S = this.modelConfig.numSpatialCells;
    const E = 7;
    const expectedParams =
      V * d +
      T * d +
      S * d +
      L * (8 * d * d + 2 * d) +
      E * d +
      V * d;
    const inventory = this.model.getParameterInventory();
    if (inventory.totalParameters !== expectedParams) {
      throw new Error(
        `[PARAMETER_ACCOUNTING_MISMATCH] Expected ${expectedParams} parameters for config (L=${L}, d=${d}, T=${T}, V=${V}), got ${inventory.totalParameters}`
      );
    }
    if (inventory.trainableParameters !== expectedParams) {
      throw new Error(
        `[TRAINABLE_ACCOUNTING_MISMATCH] Expected ${expectedParams} trainable parameters for config, got ${inventory.trainableParameters}`
      );
    }

    // Initialize AdamW moment accumulators
    const weights = this.model.getWeights();
    this.m_lmHead = weights.lmHead.map((row) => new Array(row.length).fill(0));
    this.v_lmHead = weights.lmHead.map((row) => new Array(row.length).fill(0));
    this.m_epiHead = weights.epistemicHead.map((row) => new Array(row.length).fill(0));
    this.v_epiHead = weights.epistemicHead.map((row) => new Array(row.length).fill(0));
    this.m_tokenEmb = weights.tokenEmbedding.map((row) => new Array(row.length).fill(0));
    this.v_tokenEmb = weights.tokenEmbedding.map((row) => new Array(row.length).fill(0));

    // Initialize persistent gradient accumulators
    this.gradLmHead = weights.lmHead.map((row) => new Array(row.length).fill(0));
    this.gradEpiHead = weights.epistemicHead.map((row) => new Array(row.length).fill(0));
    this.gradTokenEmb = weights.tokenEmbedding.map((row) => new Array(row.length).fill(0));

    this.diagnostics = {
      samplesLoaded: 0,
      batchesProcessed: 0,
      forwardPasses: 0,
      backwardPasses: 0,
      optimizerSteps: 0,
      parametersChanged: 0,
      initialLoss: 0,
      finalLoss: 0,
      lossDelta: 0,
      initialAccuracy: 0,
      finalAccuracy: 0,
      accuracyDelta: 0,
      actuationInterceptions: 0,
      tenantConflicts: 0,
      integrityFailures: 0,
    };
  }

  public getModel(): CubiONativeModel {
    return this.model;
  }

  public getModelConfig(): Readonly<NativeModelConfig> {
    return this.modelConfig;
  }

  public getTokenizer(): NativeTokenizer {
    return this.tokenizer;
  }

  public getDataLoader(): CanonicalTrainingDataLoader {
    return this.dataLoader;
  }

  public getDiagnostics(): Readonly<NativeTrainingDiagnostics> {
    return Object.freeze({ ...this.diagnostics });
  }

  public getStepCount(): number {
    return this.stepCount;
  }

  public getOptimizerState(): {
    stepCount: number;
    m_lmHead: number[][];
    v_lmHead: number[][];
    m_epiHead: number[][];
    v_epiHead: number[][];
    m_tokenEmb: number[][];
    v_tokenEmb: number[][];
  } {
    return {
      stepCount: this.stepCount,
      m_lmHead: this.m_lmHead.map((r) => [...r]),
      v_lmHead: this.v_lmHead.map((r) => [...r]),
      m_epiHead: this.m_epiHead.map((r) => [...r]),
      v_epiHead: this.v_epiHead.map((r) => [...r]),
      m_tokenEmb: this.m_tokenEmb.map((r) => [...r]),
      v_tokenEmb: this.v_tokenEmb.map((r) => [...r]),
    };
  }

  public setOptimizerState(state: {
    stepCount?: number;
    m_lmHead?: number[][];
    v_lmHead?: number[][];
    m_epiHead?: number[][];
    v_epiHead?: number[][];
    m_tokenEmb?: number[][];
    v_tokenEmb?: number[][];
  }): void {
    if (typeof state.stepCount === 'number') {
      this.stepCount = state.stepCount;
    }
    if (state.m_lmHead) {
      for (let i = 0; i < this.m_lmHead.length; i++) {
        for (let j = 0; j < this.m_lmHead[i].length; j++) {
          if (state.m_lmHead[i] && state.m_lmHead[i][j] !== undefined) {
            this.m_lmHead[i][j] = state.m_lmHead[i][j];
          }
        }
      }
    }
    if (state.v_lmHead) {
      for (let i = 0; i < this.v_lmHead.length; i++) {
        for (let j = 0; j < this.v_lmHead[i].length; j++) {
          if (state.v_lmHead[i] && state.v_lmHead[i][j] !== undefined) {
            this.v_lmHead[i][j] = state.v_lmHead[i][j];
          }
        }
      }
    }
    if (state.m_epiHead) {
      for (let i = 0; i < this.m_epiHead.length; i++) {
        for (let j = 0; j < this.m_epiHead[i].length; j++) {
          if (state.m_epiHead[i] && state.m_epiHead[i][j] !== undefined) {
            this.m_epiHead[i][j] = state.m_epiHead[i][j];
          }
        }
      }
    }
    if (state.v_epiHead) {
      for (let i = 0; i < this.v_epiHead.length; i++) {
        for (let j = 0; j < this.v_epiHead[i].length; j++) {
          if (state.v_epiHead[i] && state.v_epiHead[i][j] !== undefined) {
            this.v_epiHead[i][j] = state.v_epiHead[i][j];
          }
        }
      }
    }
    if (state.m_tokenEmb) {
      for (let i = 0; i < this.m_tokenEmb.length; i++) {
        for (let j = 0; j < this.m_tokenEmb[i].length; j++) {
          if (state.m_tokenEmb[i] && state.m_tokenEmb[i][j] !== undefined) {
            this.m_tokenEmb[i][j] = state.m_tokenEmb[i][j];
          }
        }
      }
    }
    if (state.v_tokenEmb) {
      for (let i = 0; i < this.v_tokenEmb.length; i++) {
        for (let j = 0; j < this.v_tokenEmb[i].length; j++) {
          if (state.v_tokenEmb[i] && state.v_tokenEmb[i][j] !== undefined) {
            this.v_tokenEmb[i][j] = state.v_tokenEmb[i][j];
          }
        }
      }
    }
  }

  /**
   * Computes forward pass and cross-entropy loss over a single sample.
   * Numerical safety: uses log-sum-exp trick to prevent underflow/overflow.
   */
  public evaluateSample(sample: CanonicalTrainingSample): { tokenLoss: number; epistemicLoss: number; totalLoss: number } {
    const promptTokens = this.tokenizer.encode(sample.prompt, { addSpecialTokens: true });
    const completionTokens = this.tokenizer.encode(sample.completion, { addSpecialTokens: false });
    const fullTokens = promptTokens.concat(completionTokens).slice(0, this.modelConfig.maxSeqLen);

    if (fullTokens.length < 2) {
      return { tokenLoss: 0, epistemicLoss: 0, totalLoss: 0 };
    }

    const forwardOut = this.model.forward(fullTokens, {
      spatialCellId: sample.cellId,
      returnHidden: true,
    });
    this.diagnostics.forwardPasses++;

    // 1. Next-token cross-entropy loss
    let tokenLoss = 0;
    let count = 0;
    const targetStartIndex = Math.max(0, promptTokens.length - 1);

    for (let t = targetStartIndex; t < fullTokens.length - 1; t++) {
      const targetToken = fullTokens[t + 1];
      const logits = forwardOut.logits[t];

      const maxLogit = Math.max(...logits);
      let sumExp = 0;
      for (let v = 0; v < this.modelConfig.vocabSize; v++) {
        sumExp += Math.exp(logits[v] - maxLogit);
      }
      const logSumExp = maxLogit + Math.log(Math.max(sumExp, 1e-12));
      const stepLoss = logSumExp - logits[targetToken];

      if (!Number.isFinite(stepLoss) || Number.isNaN(stepLoss)) {
        throw new NumericalSafetyError(`Encountered non-finite token loss at index ${t}`);
      }
      tokenLoss += stepLoss;
      count++;
    }

    const avgTokenLoss = count > 0 ? tokenLoss / count : 0;

    // 2. Epistemic Classification cross-entropy loss
    const epistemicKeys: EpistemicStatus[] = [
      EpistemicStatus.FACT,
      EpistemicStatus.DERIVATION,
      EpistemicStatus.OBSERVATION,
      EpistemicStatus.HYPOTHESIS,
      EpistemicStatus.PREDICTION,
      EpistemicStatus.ASSUMPTION,
      EpistemicStatus.UNKNOWN,
    ];
    const targetEpiIdx = Math.max(0, epistemicKeys.indexOf(sample.epistemicStatus));
    const lastH = forwardOut.lastHiddenState[fullTokens.length - 1];
    const weights = this.model.getWeights();

    const rawEpistemic: number[] = new Array(7).fill(0);
    for (let d = 0; d < this.modelConfig.embedDim; d++) {
      const hD = lastH[d];
      const epiRow = weights.epistemicHead[d];
      for (let c = 0; c < 7; c++) {
        rawEpistemic[c] += hD * epiRow[c];
      }
    }
    const maxE = Math.max(...rawEpistemic);
    let sumExpE = 0;
    for (let c = 0; c < 7; c++) sumExpE += Math.exp(rawEpistemic[c] - maxE);
    const logSumExpE = maxE + Math.log(Math.max(sumExpE, 1e-12));
    const epistemicLoss = logSumExpE - rawEpistemic[targetEpiIdx];

    if (!Number.isFinite(epistemicLoss) || Number.isNaN(epistemicLoss)) {
      throw new NumericalSafetyError(`Encountered non-finite epistemic loss`);
    }

    const totalLoss = avgTokenLoss * 0.7 + epistemicLoss * 0.3;
    return { tokenLoss: avgTokenLoss, epistemicLoss, totalLoss };
  }

  /**
   * Executes a controlled training step on a canonical training batch.
   * Performs:
   * 1. Forward pass
   * 2. Loss computation
   * 3. Backpropagation / Gradient computation
   * 4. AdamW optimizer update
   * 5. Parameter update verification (parameter_before !== parameter_after)
   * 6. Eviction of batch memory
   */
  public trainStep(
    batch: TrainingBatch,
    options?: {
      learningRate?: number;
      weightDecay?: number;
      gradientClippingNorm?: number;
      microBatchSize?: number;
      gradientAccumulationSteps?: number;
    }
  ): TrainingStepResult {
    // Assert actuation is blocked
    if (IS_ACTUATION_BLOCKED !== true) {
      throw new ActuationBlockedError('Actuation blocked');
    }

    if (!batch || !batch.samples || batch.samples.length === 0) {
      throw new TrainingIntegrityError('Cannot execute trainStep on empty batch');
    }

    this.stepCount++;
    const lr = options?.learningRate ?? 0.05;
    const weightDecay = options?.weightDecay ?? 0.01;
    const clipNorm = options?.gradientClippingNorm ?? 1.0;

    const weights = this.model.getWeights();
    const embedDim = this.modelConfig.embedDim;
    const vocabSize = this.modelConfig.vocabSize;

    // Snapshot representative parameter before update
    const paramBefore = weights.lmHead[0][0];

    const beta1 = 0.9;
    const beta2 = 0.999;
    const eps = 1e-8;

    let totalBatchLoss = 0;
    let changedParams = 0;

    // Reset persistent gradient accumulators in-place (zero transient allocations per step)
    for (let d = 0; d < embedDim; d++) this.gradLmHead[d].fill(0);
    for (let d = 0; d < embedDim; d++) this.gradEpiHead[d].fill(0);
    const numTokens = weights.tokenEmbedding.length;
    for (let i = 0; i < numTokens; i++) this.gradTokenEmb[i].fill(0);

    const gradLmHead = this.gradLmHead;
    const gradEpiHead = this.gradEpiHead;
    const gradTokenEmb = this.gradTokenEmb;

    // 1. Accumulate gradients across batch samples
    for (const sample of batch.samples) {
      const promptTokens = this.tokenizer.encode(sample.prompt, { addSpecialTokens: true });
      const completionTokens = this.tokenizer.encode(sample.completion, { addSpecialTokens: false });
      const fullTokens = promptTokens.concat(completionTokens).slice(0, this.modelConfig.maxSeqLen);

      if (fullTokens.length < 2) continue;

      let forwardOut = this.model.forward(fullTokens, {
        spatialCellId: sample.cellId,
        returnHidden: true,
      });
      this.diagnostics.forwardPasses++;

      // Token loss & gradients
      let tokenLoss = 0;
      let tokenCount = 0;
      const targetStartIndex = Math.max(0, promptTokens.length - 1);

      for (let t = targetStartIndex; t < fullTokens.length - 1; t++) {
        const targetToken = fullTokens[t + 1];
        const logits = forwardOut.logits[t];

        const maxLogit = Math.max(...logits);
        let sumExp = 0;
        for (let v = 0; v < vocabSize; v++) {
          sumExp += Math.exp(logits[v] - maxLogit);
        }
        const logSumExp = maxLogit + Math.log(Math.max(sumExp, 1e-12));
        tokenLoss += logSumExp - logits[targetToken];
        tokenCount++;

        const h = forwardOut.lastHiddenState[t];
        const curTok = fullTokens[t];
        const gradEmbRow = gradTokenEmb[curTok];
        const numSamples = batch.samples.length;
        const invNumSamples = 1.0 / numSamples;
        const invSamplesScaled01 = 0.1 * invNumSamples;

        for (let v = 0; v < vocabSize; v++) {
          const prob_v = Math.exp(logits[v] - logSumExp);
          const dLogit = prob_v - (v === targetToken ? 1.0 : 0.0);
          const scaledDLogit = dLogit * invNumSamples;
          const scaledDLogit01 = dLogit * invSamplesScaled01;

          for (let d = 0; d < embedDim; d++) {
            gradLmHead[d][v] += h[d] * scaledDLogit;
            gradEmbRow[d] += weights.lmHead[d][v] * scaledDLogit01;
          }
        }
      }

      const avgTokenLoss = tokenCount > 0 ? tokenLoss / tokenCount : 0;

      // Epistemic loss & gradients
      const epistemicKeys: EpistemicStatus[] = [
        EpistemicStatus.FACT,
        EpistemicStatus.DERIVATION,
        EpistemicStatus.OBSERVATION,
        EpistemicStatus.HYPOTHESIS,
        EpistemicStatus.PREDICTION,
        EpistemicStatus.ASSUMPTION,
        EpistemicStatus.UNKNOWN,
      ];
      const targetEpiIdx = Math.max(0, epistemicKeys.indexOf(sample.epistemicStatus));
      const lastH = forwardOut.lastHiddenState[fullTokens.length - 1];

      const rawEpistemic: number[] = new Array(7).fill(0);
      for (let d = 0; d < embedDim; d++) {
        const hD = lastH[d];
        const epiRow = weights.epistemicHead[d];
        for (let c = 0; c < 7; c++) {
          rawEpistemic[c] += hD * epiRow[c];
        }
      }
      const maxE = Math.max(...rawEpistemic);
      let sumExpE = 0;
      for (let c = 0; c < 7; c++) sumExpE += Math.exp(rawEpistemic[c] - maxE);
      const logSumExpE = maxE + Math.log(Math.max(sumExpE, 1e-12));
      const epistemicLoss = logSumExpE - rawEpistemic[targetEpiIdx];

      const invNumSamples = 1.0 / batch.samples.length;
      for (let c = 0; c < 7; c++) {
        const prob_c = Math.exp(rawEpistemic[c] - logSumExpE);
        const dEpi = prob_c - (c === targetEpiIdx ? 1.0 : 0.0);
        const scaledDEpi = dEpi * invNumSamples;
        for (let d = 0; d < embedDim; d++) {
          gradEpiHead[d][c] += lastH[d] * scaledDEpi;
        }
      }

      const sampleLoss = avgTokenLoss * 0.7 + epistemicLoss * 0.3;
      totalBatchLoss += sampleLoss;
      this.diagnostics.backwardPasses++;
      // Explicitly release transient activation tensors to allow immediate GC reclamation
      (forwardOut as any) = null;
    }

    const meanBatchLoss = batch.samples.length > 0 ? totalBatchLoss / batch.samples.length : 0;

    // 2. Gradient Norm & Finite check
    let gradSqSum = 0;
    for (let d = 0; d < embedDim; d++) {
      const lmRow = gradLmHead[d];
      for (let v = 0; v < vocabSize; v++) gradSqSum += lmRow[v] ** 2;
      const epiRow = gradEpiHead[d];
      for (let c = 0; c < 7; c++) gradSqSum += epiRow[c] ** 2;
    }
    const gradNorm = Math.sqrt(gradSqSum);

    if (!Number.isFinite(gradNorm) || Number.isNaN(gradNorm)) {
      throw new NumericalSafetyError(`Gradient norm is non-finite (${gradNorm}) at step ${this.stepCount}`);
    }

    const clipScale = gradNorm > clipNorm ? clipNorm / gradNorm : 1.0;

    // 3. AdamW Parameter Updates (Hoisted bias-correction factors & row caching)
    const invBias1 = 1.0 / (1.0 - Math.pow(beta1, this.stepCount));
    const invBias2 = 1.0 / (1.0 - Math.pow(beta2, this.stepCount));

    // A. lmHead update
    for (let d = 0; d < embedDim; d++) {
      const gradRow = gradLmHead[d];
      const mRow = this.m_lmHead[d];
      const vRow = this.v_lmHead[d];
      const wRow = weights.lmHead[d];

      for (let v = 0; v < vocabSize; v++) {
        const g = gradRow[v] * clipScale;
        if (g !== 0) {
          mRow[v] = beta1 * mRow[v] + (1 - beta1) * g;
          vRow[v] = beta2 * vRow[v] + (1 - beta2) * (g * g);

          const mHat = mRow[v] * invBias1;
          const vHat = vRow[v] * invBias2;

          const prev = wRow[v];
          wRow[v] -= lr * (mHat / (Math.sqrt(vHat) + eps) + weightDecay * wRow[v]);

          if (wRow[v] !== prev) {
            changedParams++;
          }
        }
      }
    }

    // B. epistemicHead update
    for (let d = 0; d < embedDim; d++) {
      const gradRow = gradEpiHead[d];
      const mRow = this.m_epiHead[d];
      const vRow = this.v_epiHead[d];
      const wRow = weights.epistemicHead[d];

      for (let c = 0; c < 7; c++) {
        const g = gradRow[c] * clipScale;
        if (g !== 0) {
          mRow[c] = beta1 * mRow[c] + (1 - beta1) * g;
          vRow[c] = beta2 * vRow[c] + (1 - beta2) * (g * g);

          const mHat = mRow[c] * invBias1;
          const vHat = vRow[c] * invBias2;

          const prev = wRow[c];
          wRow[c] -= lr * (mHat / (Math.sqrt(vHat) + eps) + weightDecay * wRow[c]);

          if (wRow[c] !== prev) {
            changedParams++;
          }
        }
      }
    }

    // C. tokenEmbedding update
    for (let i = 0; i < numTokens; i++) {
      const gradRow = gradTokenEmb[i];
      const mRow = this.m_tokenEmb[i];
      const vRow = this.v_tokenEmb[i];
      const wRow = weights.tokenEmbedding[i];

      for (let d = 0; d < embedDim; d++) {
        const g = gradRow[d] * clipScale;
        if (g !== 0) {
          mRow[d] = beta1 * mRow[d] + (1 - beta1) * g;
          vRow[d] = beta2 * vRow[d] + (1 - beta2) * (g * g);

          const mHat = mRow[d] * invBias1;
          const vHat = vRow[d] * invBias2;

          const prev = wRow[d];
          wRow[d] -= lr * (mHat / (Math.sqrt(vHat) + eps) + weightDecay * wRow[d]);

          if (wRow[d] !== prev) {
            changedParams++;
          }
        }
      }
    }

    this.diagnostics.optimizerSteps++;
    this.diagnostics.parametersChanged += changedParams;
    this.diagnostics.batchesProcessed++;

    const paramAfter = weights.lmHead[0][0];

    // EVICTION: Evict working set batch after training step
    this.dataLoader.evictWorkingSet();

    return Object.freeze({
      step: this.stepCount,
      loss: meanBatchLoss,
      changedParameters: changedParams,
      paramBefore,
      paramAfter,
      gradientNorm: gradNorm,
      isFinite: Number.isFinite(meanBatchLoss) && Number.isFinite(gradNorm),
      learningRate: lr,
    });
  }

  // ===========================================================================
  // CHECKPOINT & RESTORE (.3dmemory V3 INTEGRATION)
  // ===========================================================================

  /**
   * Exports trained model weights and parameter inventory into a .3dmemory V3 checkpoint file.
   */
  public exportCheckpoint(
    filePath: string,
    options?: {
      tenantId?: string;
      trainingRunId?: string;
      datasetPosition?: number;
      epoch?: number;
      provenanceHash?: string;
    }
  ): { checkpointId: string; filePath: string; bytesWritten: number; stateHash: string } {
    const tenantId = options?.tenantId ?? 'root';
    const trainingRunId = options?.trainingRunId ?? `RUN_${Date.now()}`;
    const datasetPosition = options?.datasetPosition ?? 0;
    const epoch = options?.epoch ?? 1;
    const provenanceHash = options?.provenanceHash ?? `PROV_${Date.now()}`;
    const weights = this.model.getWeights();
    const inventory = this.model.getParameterInventory();
    const stateHash = this.model.computeWeightsHash();

    const checkpointEngine = new ThreeDMemoryCheckpointEngine();

    const manifestPayload = {
      modelId: this.modelConfig.modelId,
      trainingRunId,
      inventory,
      stateHash,
      config: this.modelConfig,
      stepCount: this.stepCount,
      datasetPosition,
      epoch,
      provenanceHash,
      exportedAt: new Date().toISOString(),
    };

    const weightsPayload = {
      stateHash,
      lmHead: weights.lmHead,
      epistemicHead: weights.epistemicHead,
      tokenEmbedding: weights.tokenEmbedding,
    };

    const optimizerPayload = {
      stepCount: this.stepCount,
      m_lmHead: this.m_lmHead,
      v_lmHead: this.v_lmHead,
      m_epiHead: this.m_epiHead,
      v_epiHead: this.v_epiHead,
      m_tokenEmb: this.m_tokenEmb,
      v_tokenEmb: this.v_tokenEmb,
    };

    const records: CheckpointRecord[] = [
      {
        identity: {
          objectId: `CUBIO_MODEL_MANIFEST_${this.modelConfig.modelId}`,
          tenantId,
          stateVersion: 1,
          domain: 'TRAINING',
          checksum: calculateCanonicalChecksum(manifestPayload),
        },
        payload: manifestPayload,
      },
      {
        identity: {
          objectId: `CUBIO_MODEL_WEIGHTS_${this.modelConfig.modelId}`,
          tenantId,
          stateVersion: 1,
          domain: 'TRAINING',
          checksum: calculateCanonicalChecksum(weightsPayload),
        },
        payload: weightsPayload,
      },
      {
        identity: {
          objectId: `CUBIO_MODEL_OPTIMIZER_${this.modelConfig.modelId}`,
          tenantId,
          stateVersion: 1,
          domain: 'TRAINING',
          checksum: calculateCanonicalChecksum(optimizerPayload),
        },
        payload: optimizerPayload,
      },
    ];

    const result = checkpointEngine.createCheckpoint(filePath, records, {
      tenantId,
      metadata: {
        trainingRunId,
        stateHash,
        totalParameters: inventory.totalParameters,
      },
    });

    return {
      checkpointId: result.checkpointId,
      filePath: result.filePath,
      bytesWritten: result.bytesWritten,
      stateHash,
    };
  }

  /**
   * Restores model weights from a .3dmemory V3 checkpoint file and verifies bit-identical restoration.
   */
  public restoreCheckpoint(
    filePath: string,
    expectedTenantId: string = 'root'
  ): { restored: boolean; stateHash: string; matchesBefore: boolean } {
    if (!fs.existsSync(filePath)) {
      throw new Error(`[CHECKPOINT_RESTORE_ERROR] File not found: ${filePath}`);
    }

    const checkpointEngine = new ThreeDMemoryCheckpointEngine();
    const index = checkpointEngine.readIndex(filePath);

    // Verify tenant on all index entries
    for (const entry of index) {
      if (expectedTenantId !== 'root' && entry.tenantId !== expectedTenantId) {
        throw new TenantMismatchError(
          `Checkpoint belongs to tenant '${entry.tenantId}', expected '${expectedTenantId}'`
        );
      }
    }

    // 1. Restore manifest metadata first if present
    const manifestEntry = index.find((e) => e.objectId.startsWith('CUBIO_MODEL_MANIFEST_'));
    let manifestData: any = {};
    if (manifestEntry) {
      const manifestRec = checkpointEngine.readEntry(filePath, manifestEntry.objectId);
      const computedManifest = calculateCanonicalChecksum(manifestRec.payload);
      if (manifestRec.identity.checksum !== computedManifest) {
        throw new TrainingIntegrityError(
          `Restored manifest record '${manifestRec.identity.objectId}' failed checksum verification`
        );
      }
      manifestData = manifestRec.payload as any;

      // Realign model architecture & seed if specified in manifest
      if (manifestData.config) {
        const cfg = manifestData.config;
        if (
          cfg.masterSeed !== this.modelConfig.masterSeed ||
          cfg.embedDim !== this.modelConfig.embedDim ||
          cfg.numLayers !== this.modelConfig.numLayers ||
          cfg.vocabSize !== this.modelConfig.vocabSize ||
          cfg.maxSeqLen !== this.modelConfig.maxSeqLen
        ) {
          this.modelConfig = { ...this.modelConfig, ...cfg };
          this.model = new CubiONativeModel(this.modelConfig);

          const w = this.model.getWeights();
          this.m_lmHead = w.lmHead.map((row) => new Array(row.length).fill(0));
          this.v_lmHead = w.lmHead.map((row) => new Array(row.length).fill(0));
          this.m_epiHead = w.epistemicHead.map((row) => new Array(row.length).fill(0));
          this.v_epiHead = w.epistemicHead.map((row) => new Array(row.length).fill(0));
          this.m_tokenEmb = w.tokenEmbedding.map((row) => new Array(row.length).fill(0));
          this.v_tokenEmb = w.tokenEmbedding.map((row) => new Array(row.length).fill(0));
          this.gradLmHead = w.lmHead.map((row) => new Array(row.length).fill(0));
          this.gradEpiHead = w.epistemicHead.map((row) => new Array(row.length).fill(0));
          this.gradTokenEmb = w.tokenEmbedding.map((row) => new Array(row.length).fill(0));
        }
      }
    }

    // 2. Restore model weights
    const weightsEntry = index.find((e) => e.objectId.startsWith('CUBIO_MODEL_WEIGHTS_'));
    if (!weightsEntry) {
      throw new Error('[CHECKPOINT_RESTORE_ERROR] Checkpoint missing CUBIO_MODEL_WEIGHTS record');
    }

    const weightsRec = checkpointEngine.readEntry(filePath, weightsEntry.objectId);
    const computed = calculateCanonicalChecksum(weightsRec.payload);
    if (weightsRec.identity.checksum !== computed) {
      throw new TrainingIntegrityError(
        `Restored record '${weightsRec.identity.objectId}' failed checksum verification`
      );
    }

    const payload = weightsRec.payload as any;
    const restoredStateHash = payload.stateHash;

    // Apply restored weights to model
    const currentWeights = this.model.getWeights();
    if (payload.lmHead) {
      for (let i = 0; i < currentWeights.lmHead.length; i++) {
        for (let j = 0; j < currentWeights.lmHead[i].length; j++) {
          currentWeights.lmHead[i][j] = payload.lmHead[i][j];
        }
      }
    }
    if (payload.epistemicHead) {
      for (let i = 0; i < currentWeights.epistemicHead.length; i++) {
        for (let j = 0; j < currentWeights.epistemicHead[i].length; j++) {
          currentWeights.epistemicHead[i][j] = payload.epistemicHead[i][j];
        }
      }
    }
    if (payload.tokenEmbedding) {
      for (let i = 0; i < currentWeights.tokenEmbedding.length; i++) {
        for (let j = 0; j < currentWeights.tokenEmbedding[i].length; j++) {
          currentWeights.tokenEmbedding[i][j] = payload.tokenEmbedding[i][j];
        }
      }
    }

    // 3. Restore optimizer state if present
    const optEntry = index.find((e) => e.objectId.startsWith('CUBIO_MODEL_OPTIMIZER_'));
    let hasOptimizerState = false;
    if (optEntry) {
      const optRec = checkpointEngine.readEntry(filePath, optEntry.objectId);
      const computedOpt = calculateCanonicalChecksum(optRec.payload);
      if (optRec.identity.checksum !== computedOpt) {
        throw new TrainingIntegrityError(
          `Restored optimizer record '${optRec.identity.objectId}' failed checksum verification`
        );
      }
      const optPayload = optRec.payload as any;
      if (typeof optPayload.stepCount === 'number') {
        this.stepCount = optPayload.stepCount;
      }
      if (Array.isArray(optPayload.m_lmHead)) {
        for (let i = 0; i < optPayload.m_lmHead.length; i++) {
          for (let j = 0; j < optPayload.m_lmHead[i].length; j++) {
            this.m_lmHead[i][j] = optPayload.m_lmHead[i][j];
            this.v_lmHead[i][j] = optPayload.v_lmHead[i][j];
          }
        }
      }
      if (Array.isArray(optPayload.m_epiHead)) {
        for (let i = 0; i < optPayload.m_epiHead.length; i++) {
          for (let j = 0; j < optPayload.m_epiHead[i].length; j++) {
            this.m_epiHead[i][j] = optPayload.m_epiHead[i][j];
            this.v_epiHead[i][j] = optPayload.v_epiHead[i][j];
          }
        }
      }
      if (Array.isArray(optPayload.m_tokenEmb)) {
        for (let i = 0; i < optPayload.m_tokenEmb.length; i++) {
          for (let j = 0; j < optPayload.m_tokenEmb[i].length; j++) {
            this.m_tokenEmb[i][j] = optPayload.m_tokenEmb[i][j];
            this.v_tokenEmb[i][j] = optPayload.v_tokenEmb[i][j];
          }
        }
      }
      hasOptimizerState = true;
    }

    const currentStateHash = this.model.computeWeightsHash();

    return {
      restored: true,
      stateHash: currentStateHash,
      matchesBefore: currentStateHash === restoredStateHash,
      stepCount: this.stepCount,
      hasOptimizerState,
      datasetPosition: manifestData.datasetPosition ?? 0,
      epoch: manifestData.epoch ?? 1,
      provenanceHash: manifestData.provenanceHash ?? '',
      config: manifestData.config ?? this.modelConfig,
    };
  }
}
