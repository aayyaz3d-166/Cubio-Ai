/**
 * CUBiO AI — Task 298: Native 1M Live Model Connection Service
 * src/cubio/inference/native1mProductionService.ts
 *
 * Authoritative production service connecting the Web MVP runtime
 * to the sealed Phase 16 1M parameter sovereign model.
 *
 * INVARIANTS & BOUNDARIES:
 * 1. Checkpoint strictly read-only: data/checkpoints/phase16_production_final_sealed_1m.3dmemory
 *    Size: 6,038,463 bytes (Delta = 0).
 *    File SHA-256: 453590e284f250525d42d5f99d8fca07957f1e0ac1218b7d43eff6d3a762c1b8.
 *    Weights State Hash: 0942c34c1ad6d725063072e37f6d7a5e91537d6e894988f551605bb3691e7c37.
 * 2. ZERO external pretrained models (no Qwen, HuggingFace, PyTorch, Ollama, ONNX-cloud, OpenAI, Claude).
 * 3. Exact parameter accounting: 971,520 parameters across 53 tensors (FP32).
 * 4. Permanent hardware actuation lockout: IS_ACTUATION_BLOCKED === true.
 * 5. Spatial reasoning bound to Address 369 ([0..25] anchors, [26..368] 343 HCP cells).
 * 6. Epistemic non-fact lockout & 7-tier epistemic projection.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { performance } from 'perf_hooks';

import {
  NativeParameterScalingEngine,
  SCALED_1M_CONFIG,
  ParameterTierConfig,
} from '../scaling/parameterScalingEngine';
import {
  NativeTrainingIntegrationEngine,
  IS_ACTUATION_BLOCKED,
} from '../core/nativeTrainingIntegration';
import {
  CubiONativeModel,
  ModelForwardOutput,
} from '../model/native_foundation/native_model_architecture';
import {
  NativeTokenizer,
} from '../model/native_foundation/native_tokenizer';
import {
  NativeInferenceEngine,
} from '../model/native_foundation/native_inference_engine';
import {
  EpistemicStatus,
  NativeInferenceOptions,
  NativeInferenceOutput,
} from '../model/native_foundation/native_model_types';
import {
  ExternalModelGuard,
  ActuationBlockedError,
  ExternalModelDependencyError,
} from '../model/native_foundation/external_model_guard';
import {
  ModelRegistry,
} from '../model/native_foundation/model_registry';
import {
  cellIdToAddress369,
  cellIdToCoordinate,
  validateCellId,
  TOTAL_SPATIAL_CELLS,
} from '../../core/address369';

export { IS_ACTUATION_BLOCKED };

export const NATIVE_1M_PRODUCTION_CHECKPOINT_PATH = path.resolve(
  process.cwd(),
  'data',
  'checkpoints',
  'phase16_production_final_sealed_1m.3dmemory'
);

export const EXPECTED_NATIVE_1M_CHECKPOINT_SIZE = 6038463;
export const EXPECTED_NATIVE_1M_CHECKPOINT_SHA256 =
  '453590e284f250525d42d5f99d8fca07957f1e0ac1218b7d43eff6d3a762c1b8';
export const EXPECTED_NATIVE_1M_STATE_HASH =
  '0942c34c1ad6d725063072e37f6d7a5e91537d6e894988f551605bb3691e7c37';
export const EXPECTED_NATIVE_1M_PARAMETERS = 971520;
export const EXPECTED_NATIVE_1M_TENSORS = 53;

export enum Native1MServiceStatus {
  UNINITIALIZED = 'UNINITIALIZED',
  HELD = 'HELD',
  LOADING = 'LOADING',
  READY = 'READY',
  ERROR = 'ERROR',
}

export interface Native1MPromptEvaluation {
  readonly prompt: string;
  readonly promptTokens: number[];
  readonly predictedNextTokenId: number;
  readonly predictedNextTokenText: string;
  readonly dominantEpistemic: EpistemicStatus;
  readonly epistemicScores: Record<EpistemicStatus, number>;
  readonly spatialCellId?: number;
  readonly spatialAddress369?: number;
  readonly spatialCoordinates?: { x: number; y: number; z: number };
  readonly tokenLoss: number;
  readonly latencyMs: number;
  readonly isActuationBlocked: boolean;
  readonly isOfflineIsolated: boolean;
}

export interface Native1MModelMetadata {
  readonly modelId: string;
  readonly version: string;
  readonly tierId: string;
  readonly parameters: number;
  readonly tensorCount: number;
  readonly layerCount: number;
  readonly hiddenDimension: number;
  readonly attentionHeads: number;
  readonly maxSequenceLength: number;
  readonly vocabSize: number;
  readonly spatialCells: number;
  readonly epistemicClasses: number;
  readonly stateHash: string;
  readonly checkpointPath: string;
  readonly checkpointSha256: string;
  readonly checkpointSizeBytes: number;
  readonly status: Native1MServiceStatus;
  readonly isActuationBlocked: boolean;
  readonly isOfflineIsolated: boolean;
  readonly totalInferences: number;
}

export class Native1MProductionService {
  private static instance: Native1MProductionService | null = null;

  private status: Native1MServiceStatus = Native1MServiceStatus.HELD;
  private scalingEngine: NativeParameterScalingEngine | null = null;
  private trainingEngine: NativeTrainingIntegrationEngine | null = null;
  private model: CubiONativeModel | null = null;
  private tokenizer: NativeTokenizer | null = null;
  private inferenceEngine: NativeInferenceEngine | null = null;

  private verifiedStateHash: string | null = null;
  private totalInferences = 0;
  private lastError: string | null = null;

  private constructor() {}

  public static getInstance(): Native1MProductionService {
    if (!Native1MProductionService.instance) {
      Native1MProductionService.instance = new Native1MProductionService();
    }
    return Native1MProductionService.instance;
  }

  public static reset(): void {
    Native1MProductionService.instance = null;
  }

  public getStatus(): Native1MServiceStatus {
    return this.status;
  }

  public isReady(): boolean {
    return this.status === Native1MServiceStatus.READY && this.model !== null;
  }

  public getLastError(): string | null {
    return this.lastError;
  }

  public getTotalInferences(): number {
    return this.totalInferences;
  }

  /**
   * Initializes and restores the sealed Phase 16 1M model checkpoint into memory.
   * Strictly verifies file size, SHA-256 hash, and weights state hash before transitioning to READY.
   */
  public async initialize(customPath?: string): Promise<boolean> {
    const ckptPath = customPath || NATIVE_1M_PRODUCTION_CHECKPOINT_PATH;
    this.status = Native1MServiceStatus.LOADING;

    try {
      // 1. Assert permanent actuation lock and absence of external models
      ExternalModelGuard.assertNativeOnly('CUBIO-NATIVE-EDGE-1M');
      if (!IS_ACTUATION_BLOCKED) {
        throw new ActuationBlockedError('Permanent actuation lock violated: IS_ACTUATION_BLOCKED must be true');
      }

      // 2. Forensically verify file existence, size, and cryptographic hash
      if (!fs.existsSync(ckptPath)) {
        throw new Error(`[CHECKPOINT_NOT_FOUND] Phase 16 sealed checkpoint missing at: ${ckptPath}`);
      }

      const fileBuf = fs.readFileSync(ckptPath);
      const actualSize = fileBuf.length;
      if (actualSize !== EXPECTED_NATIVE_1M_CHECKPOINT_SIZE) {
        throw new Error(
          `[CHECKPOINT_SIZE_TAMPER] Size mismatch: expected ${EXPECTED_NATIVE_1M_CHECKPOINT_SIZE} bytes, found ${actualSize} bytes`
        );
      }

      const actualSha256 = crypto.createHash('sha256').update(fileBuf).digest('hex');
      if (actualSha256 !== EXPECTED_NATIVE_1M_CHECKPOINT_SHA256) {
        throw new Error(
          `[CHECKPOINT_HASH_TAMPER] SHA-256 mismatch: expected ${EXPECTED_NATIVE_1M_CHECKPOINT_SHA256}, found ${actualSha256}`
        );
      }

      // 3. Cold restore into fresh NativeParameterScalingEngine
      this.scalingEngine = new NativeParameterScalingEngine(42);
      this.trainingEngine = this.scalingEngine.createEngineForTier(SCALED_1M_CONFIG, 42);

      const restoreRes = this.trainingEngine.restoreCheckpoint(ckptPath, 'root');
      if (!restoreRes.restored) {
        throw new Error('[RESTORE_FAILURE] Failed to restore .3dmemory V3 checkpoint records');
      }

      this.model = this.trainingEngine.getModel();
      this.tokenizer = this.trainingEngine.getTokenizer();

      // 4. Verify parameter count and tensor structure
      const inventory = this.model.getParameterInventory();
      if (inventory.totalParameters !== EXPECTED_NATIVE_1M_PARAMETERS) {
        throw new Error(
          `[PARAMETER_COUNT_MISMATCH] Expected ${EXPECTED_NATIVE_1M_PARAMETERS} parameters, found ${inventory.totalParameters}`
        );
      }
      if (inventory.tensors.length !== EXPECTED_NATIVE_1M_TENSORS) {
        throw new Error(
          `[TENSOR_COUNT_MISMATCH] Expected ${EXPECTED_NATIVE_1M_TENSORS} tensors, found ${inventory.tensors.length}`
        );
      }

      // 5. Verify restored weights state hash
      const computedStateHash = this.model.computeWeightsHash();
      if (computedStateHash !== EXPECTED_NATIVE_1M_STATE_HASH) {
        throw new Error(
          `[STATE_HASH_DRIFT] State hash mismatch: expected ${EXPECTED_NATIVE_1M_STATE_HASH}, found ${computedStateHash}`
        );
      }
      this.verifiedStateHash = computedStateHash;

      // 6. Bind sovereign inference engine
      this.inferenceEngine = new NativeInferenceEngine(this.model, this.tokenizer);

      // 7. Register model in authoritative ModelRegistry
      const registry = ModelRegistry.getInstance();
      registry.registerProductionModel('cubio-native-1m-production', {
        parameters: EXPECTED_NATIVE_1M_PARAMETERS,
        layerCount: SCALED_1M_CONFIG.layerCount,
        hiddenDimension: SCALED_1M_CONFIG.hiddenDimension,
        checkpointId: 'phase16_production_final_sealed_1m',
        stateHash: this.verifiedStateHash || EXPECTED_NATIVE_1M_STATE_HASH,
        capability: 'LEVEL 4: Native 1M Sovereign Transformer (6 layers, d=128, 343 spatial cells, 7 epistemic tiers)',
        productionMode: 'NATIVE_1M_PRODUCTION_SEALED',
        metadata: {
          tierId: SCALED_1M_CONFIG.tierId,
          attentionHeads: SCALED_1M_CONFIG.attentionHeads,
          maxSequenceLength: SCALED_1M_CONFIG.maxSequenceLength,
          vocabSize: SCALED_1M_CONFIG.vocabSize,
          spatialCells: SCALED_1M_CONFIG.spatialCells,
          epistemicClasses: SCALED_1M_CONFIG.epistemicClasses,
        },
      });

      this.status = Native1MServiceStatus.READY;
      this.lastError = null;
      return true;
    } catch (err: any) {
      this.status = Native1MServiceStatus.ERROR;
      this.lastError = err.message || String(err);
      console.error('[NATIVE_1M_SERVICE_ERROR]', this.lastError);
      return false;
    }
  }

  /**
   * Evaluates a prompt forward pass through the sealed Native 1M model.
   * Computes next-token probability distribution, dominant epistemic classification,
   * spatial Address369 projection, and token loss.
   */
  public evaluatePrompt(
    prompt: string,
    spatialCellId?: number
  ): Native1MPromptEvaluation {
    if (!this.isReady() || !this.model || !this.tokenizer) {
      throw new Error(`[SERVICE_NOT_READY] Native 1M model is not ready (status: ${this.status})`);
    }

    const t0 = performance.now();

    // 1. Guard against actuation directives & external model keywords
    ExternalModelGuard.assertNativeOnly(prompt);
    ExternalModelGuard.assertActuationBlocked(prompt);

    // 2. Spatial boundary check
    let resolvedAddress369: number | undefined;
    let resolvedCoords: { x: number; y: number; z: number } | undefined;
    if (spatialCellId !== undefined) {
      validateCellId(spatialCellId);
      resolvedAddress369 = cellIdToAddress369(spatialCellId);
      resolvedCoords = cellIdToCoordinate(spatialCellId);
    }

    // 3. Tokenize prompt
    const promptTokens = this.tokenizer.encode(prompt, { addSpecialTokens: true });
    const clampedTokens = promptTokens.slice(0, SCALED_1M_CONFIG.maxSequenceLength);

    // 4. Model forward pass
    const forwardOut: ModelForwardOutput = this.model.forward(clampedTokens, {
      spatialCellId,
      returnHidden: true,
    });

    // 5. Predict next token and compute token loss
    const lastLogits = forwardOut.logits[forwardOut.logits.length - 1];
    let maxLogit = -Infinity;
    let predictedNextTokenId = 0;
    for (let v = 0; v < SCALED_1M_CONFIG.vocabSize; v++) {
      if (lastLogits[v] > maxLogit) {
        maxLogit = lastLogits[v];
        predictedNextTokenId = v;
      }
    }
    const predictedNextTokenText = this.tokenizer.decode([predictedNextTokenId]);

    // Cross-entropy loss over prompt sequence
    let tokenLoss = 0;
    if (clampedTokens.length > 1) {
      for (let t = 0; t < clampedTokens.length - 1; t++) {
        const target = clampedTokens[t + 1];
        const logits = forwardOut.logits[t];
        let m = -Infinity;
        for (let v = 0; v < SCALED_1M_CONFIG.vocabSize; v++) {
          if (logits[v] > m) m = logits[v];
        }
        let sumExp = 0;
        for (let v = 0; v < SCALED_1M_CONFIG.vocabSize; v++) {
          sumExp += Math.exp(logits[v] - m);
        }
        const logSumExp = m + Math.log(Math.max(sumExp, 1e-12));
        tokenLoss += logSumExp - logits[target];
      }
      tokenLoss /= clampedTokens.length - 1;
    }

    const latencyMs = performance.now() - t0;
    this.totalInferences++;

    return {
      prompt,
      promptTokens: clampedTokens,
      predictedNextTokenId,
      predictedNextTokenText,
      dominantEpistemic: forwardOut.dominantEpistemicStatus,
      epistemicScores: forwardOut.epistemicScores,
      spatialCellId,
      spatialAddress369: resolvedAddress369,
      spatialCoordinates: resolvedCoords,
      tokenLoss,
      latencyMs,
      isActuationBlocked: IS_ACTUATION_BLOCKED,
      isOfflineIsolated: true,
    };
  }

  /**
   * Autoregressive generative completion using the sealed Native 1M model.
   */
  public generate(
    prompt: string,
    options: NativeInferenceOptions = {},
    spatialCellId?: number
  ): NativeInferenceOutput {
    if (!this.isReady() || !this.inferenceEngine) {
      throw new Error(`[SERVICE_NOT_READY] Native 1M model is not ready (status: ${this.status})`);
    }

    // Guard assertions
    ExternalModelGuard.assertNativeOnly(prompt);
    ExternalModelGuard.assertActuationBlocked(prompt);

    const out = this.inferenceEngine.generate(prompt, options, spatialCellId);
    this.totalInferences++;
    return out;
  }

  /**
   * Returns safe public metadata regarding the active CUBiO Native 1M model.
   */
  public getModelMetadata(): Native1MModelMetadata {
    return {
      modelId: 'cubio-native-1m-production',
      version: '16.0.0-sealed',
      tierId: SCALED_1M_CONFIG.tierId,
      parameters: EXPECTED_NATIVE_1M_PARAMETERS,
      tensorCount: EXPECTED_NATIVE_1M_TENSORS,
      layerCount: SCALED_1M_CONFIG.layerCount,
      hiddenDimension: SCALED_1M_CONFIG.hiddenDimension,
      attentionHeads: SCALED_1M_CONFIG.attentionHeads,
      maxSequenceLength: SCALED_1M_CONFIG.maxSequenceLength,
      vocabSize: SCALED_1M_CONFIG.vocabSize,
      spatialCells: SCALED_1M_CONFIG.spatialCells,
      epistemicClasses: SCALED_1M_CONFIG.epistemicClasses,
      stateHash: this.verifiedStateHash || EXPECTED_NATIVE_1M_STATE_HASH,
      checkpointPath: NATIVE_1M_PRODUCTION_CHECKPOINT_PATH,
      checkpointSha256: EXPECTED_NATIVE_1M_CHECKPOINT_SHA256,
      checkpointSizeBytes: EXPECTED_NATIVE_1M_CHECKPOINT_SIZE,
      status: this.status,
      isActuationBlocked: IS_ACTUATION_BLOCKED,
      isOfflineIsolated: true,
      totalInferences: this.totalInferences,
    };
  }
}
