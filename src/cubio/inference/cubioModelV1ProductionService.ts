/**
 * CUBiO AI — Phase MVP-01: CUBiO Model V1 Production Service
 * src/cubio/inference/cubioModelV1ProductionService.ts
 *
 * Dedicated production service connecting the Web MVP runtime to the
 * officially designated CUBiO AI Model V1 (5M-v2 architecture, 1024 vocab, Step 150).
 *
 * INVARIANTS & BOUNDARIES:
 * 1. Checkpoint strictly read-only: data/checkpoints/v1/MT10_FINAL_STAGE_2_STEP_0150.vtstate
 *    File SHA-256: 30e779a90fd2ce3ceec548b4791ee598c0eef708145bc6a1fec91ea8073b3f8b
 *    Model State Hash: 3816f99e6e04adba7dc8390f34c85541333a650e2d0500799b3103e50b73a33c
 * 2. ZERO external pretrained models (no Qwen, HuggingFace, PyTorch, Ollama, ONNX-cloud, OpenAI, Claude).
 * 3. Exact parameter accounting: 4,845,056 parameters across 69 tensors (FP32).
 * 4. Permanent hardware actuation lockout: IS_ACTUATION_BLOCKED === true.
 * 5. Spatial reasoning bound to Address 369 ([0..25] anchors, [26..368] 343 HCP cells).
 * 6. Non-destructive integration: Phase 16 sealed 1M model remains untouched and available as fallback.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { performance } from 'perf_hooks';

import {
  SCALED_5M_V2_CONFIG,
  ParameterTierConfig,
} from '../scaling/parameterScalingEngine';
import {
  IS_ACTUATION_BLOCKED,
} from '../core/nativeTrainingIntegration';
import {
  CubiONativeModel,
  ModelForwardOutput,
  NativeModelWeights,
  NativeLayerWeights,
} from '../model/native_foundation/native_model_architecture';
import {
  NativeTokenizer,
} from '../model/native_foundation/native_tokenizer';
import {
  NativeVocabularyV2Builder,
} from '../model/native_foundation/native_vocabulary_v2';
import {
  NativeInferenceEngine,
} from '../model/native_foundation/native_inference_engine';
import {
  EpistemicStatus,
  NativeInferenceOptions,
  NativeInferenceOutput,
  NativeModelConfig,
} from '../model/native_foundation/native_model_types';
import {
  ExternalModelGuard,
  ActuationBlockedError,
} from '../model/native_foundation/external_model_guard';
import {
  ModelRegistry,
} from '../model/native_foundation/model_registry';
import {
  cellIdToAddress369,
  cellIdToCoordinate,
  validateCellId,
} from '../../core/address369';

export { IS_ACTUATION_BLOCKED };

export const CUBIO_MODEL_V1_CHECKPOINT_PATH = path.resolve(
  process.cwd(),
  'data',
  'checkpoints',
  'v1',
  'MT10_FINAL_STAGE_2_STEP_0150.vtstate'
);

export const EXPECTED_V1_CHECKPOINT_SHA256 =
  '30e779a90fd2ce3ceec548b4791ee598c0eef708145bc6a1fec91ea8073b3f8b';
export const EXPECTED_V1_MODEL_STATE_HASH =
  '3816f99e6e04adba7dc8390f34c85541333a650e2d0500799b3103e50b73a33c';
export const EXPECTED_V1_PARAMETERS = 4845056;
export const EXPECTED_V1_TENSORS = 69;
export const EXPECTED_V1_VOCAB_SIZE = 1024;
export const EXPECTED_V1_STEP = 150;

export enum CubiOModelV1ServiceStatus {
  UNINITIALIZED = 'UNINITIALIZED',
  HELD = 'HELD',
  LOADING = 'LOADING',
  READY = 'READY',
  ERROR = 'ERROR',
}

export interface CubiOModelV1Metadata {
  readonly modelId: string;
  readonly name: string;
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
  readonly trainingStep: number;
  readonly stateHash: string;
  readonly checkpointPath: string;
  readonly checkpointSha256: string;
  readonly status: CubiOModelV1ServiceStatus;
  readonly isActuationBlocked: boolean;
  readonly isOfflineIsolated: boolean;
  readonly totalInferences: number;
}

export class CubiOModelV1ProductionService {
  private static instance: CubiOModelV1ProductionService | null = null;

  private status: CubiOModelV1ServiceStatus = CubiOModelV1ServiceStatus.HELD;
  private model: CubiONativeModel | null = null;
  private tokenizer: NativeTokenizer | null = null;
  private inferenceEngine: NativeInferenceEngine | null = null;

  private verifiedStateHash: string | null = null;
  private totalInferences = 0;
  private lastError: string | null = null;

  private constructor() {}

  public static getInstance(): CubiOModelV1ProductionService {
    if (!CubiOModelV1ProductionService.instance) {
      CubiOModelV1ProductionService.instance = new CubiOModelV1ProductionService();
    }
    return CubiOModelV1ProductionService.instance;
  }

  public static reset(): void {
    CubiOModelV1ProductionService.instance = null;
  }

  public getStatus(): CubiOModelV1ServiceStatus {
    return this.status;
  }

  public isReady(): boolean {
    return this.status === CubiOModelV1ServiceStatus.READY && this.model !== null;
  }

  public getLastError(): string | null {
    return this.lastError;
  }

  public getTotalInferences(): number {
    return this.totalInferences;
  }

  public getVerifiedStateHash(): string | null {
    return this.verifiedStateHash;
  }

  /**
   * Helper to unflatten Float32 Little-Endian bytes into nested JS number arrays
   */
  private static unflattenTensor(payload: any): any {
    const { shape } = payload.descriptor;
    const buf = Buffer.from(payload.rawBase64, 'base64');
    const f32 = new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);

    if (shape.length === 1) {
      return Array.from(f32);
    }
    if (shape.length === 2) {
      const [rows, cols] = shape;
      const res: number[][] = new Array(rows);
      for (let r = 0; r < rows; r++) {
        const row = new Array(cols);
        const off = r * cols;
        for (let c = 0; c < cols; c++) {
          row[c] = f32[off + c];
        }
        res[r] = row;
      }
      return res;
    }
    throw new Error(`[UNSUPPORTED_SHAPE] Shape dimension [${shape}] not supported for unflattening`);
  }

  /**
   * Initializes and restores the designated CUBiO Model V1 checkpoint into memory.
   */
  public async initialize(customPath?: string): Promise<boolean> {
    const ckptPath = customPath || CUBIO_MODEL_V1_CHECKPOINT_PATH;
    this.status = CubiOModelV1ServiceStatus.LOADING;

    try {
      // 1. Guard against actuation & external models
      ExternalModelGuard.assertNativeOnly('CUBIO-NATIVE-5M-V2');
      if (!IS_ACTUATION_BLOCKED) {
        throw new ActuationBlockedError('Permanent actuation lock violated: IS_ACTUATION_BLOCKED must be true');
      }

      // 2. Forensically verify file existence and SHA-256 hash
      if (!fs.existsSync(ckptPath)) {
        throw new Error(`[CHECKPOINT_NOT_FOUND] Model V1 checkpoint missing at: ${ckptPath}`);
      }

      const fileBuf = fs.readFileSync(ckptPath);
      const actualSha256 = crypto.createHash('sha256').update(fileBuf).digest('hex');
      if (actualSha256 !== EXPECTED_V1_CHECKPOINT_SHA256) {
        throw new Error(
          `[CHECKPOINT_HASH_TAMPER] V1 SHA-256 mismatch: expected ${EXPECTED_V1_CHECKPOINT_SHA256}, found ${actualSha256}`
        );
      }

      // 3. Deserialize JSON checkpoint container
      const parsed = JSON.parse(fileBuf.toString('utf-8'));
      if (parsed.header?.containerType !== 'CUBIO_VIRTUAL_TRAINING_CHECKPOINT_V1') {
        throw new Error(`[INVALID_CONTAINER] Unexpected container type: ${parsed.header?.containerType}`);
      }

      const modelState = parsed.state?.modelState;
      if (!modelState) {
        throw new Error('[MALFORMED_CHECKPOINT] Missing modelState inside vtstate');
      }

      // Verify parameter accounting & tensor count
      const tensors = modelState.tensors;
      const tensorNames = Object.keys(tensors);
      if (tensorNames.length !== EXPECTED_V1_TENSORS) {
        throw new Error(
          `[TENSOR_COUNT_MISMATCH] Expected ${EXPECTED_V1_TENSORS} tensors, found ${tensorNames.length}`
        );
      }

      let totalParams = 0;
      for (const name of tensorNames) {
        totalParams += tensors[name].descriptor.parameterCount;
      }
      if (totalParams !== EXPECTED_V1_PARAMETERS) {
        throw new Error(
          `[PARAMETER_COUNT_MISMATCH] Expected ${EXPECTED_V1_PARAMETERS} parameters, found ${totalParams}`
        );
      }

      const stateHash = parsed.state?.integrity?.modelHash || modelState.modelStateHash;
      if (stateHash !== EXPECTED_V1_MODEL_STATE_HASH) {
        throw new Error(
          `[STATE_HASH_DRIFT] Model state hash mismatch: expected ${EXPECTED_V1_MODEL_STATE_HASH}, found ${stateHash}`
        );
      }
      this.verifiedStateHash = stateHash;

      // 4. Construct CubiONativeModel with SCALED_5M_V2_CONFIG
      const modelConfig: NativeModelConfig = {
        modelId: 'CUBIO-NATIVE-5M-V2',
        architectureId: 'CUBIO-NATIVE-TRANSFORMER-5M-V2',
        vocabSize: SCALED_5M_V2_CONFIG.vocabSize,
        embedDim: SCALED_5M_V2_CONFIG.hiddenDimension,
        numHeads: SCALED_5M_V2_CONFIG.attentionHeads,
        numLayers: SCALED_5M_V2_CONFIG.layerCount,
        maxSeqLen: SCALED_5M_V2_CONFIG.maxSequenceLength,
        numSpatialCells: SCALED_5M_V2_CONFIG.spatialCells,
        numSymbolicAnchors: 26,
        totalAddresses: 369,
        dropout: 0.0,
        masterSeed: 42,
      };

      this.model = new CubiONativeModel(modelConfig);

      // 5. Unflatten and hydrate weights into CubiONativeModel
      const tokenEmbedding = CubiOModelV1ProductionService.unflattenTensor(tensors['embeddings.token_embeddings.weight']);
      const positionalEmbedding = CubiOModelV1ProductionService.unflattenTensor(tensors['embeddings.position_embeddings.weight']);
      const spatialEmbedding = CubiOModelV1ProductionService.unflattenTensor(tensors['embeddings.spatial_hcp_lattice.weight']);

      const layers: NativeLayerWeights[] = [];
      for (let l = 0; l < 8; l++) {
        layers.push({
          qWeight: CubiOModelV1ProductionService.unflattenTensor(tensors[`layers.${l}.attention.q_proj.weight`]),
          kWeight: CubiOModelV1ProductionService.unflattenTensor(tensors[`layers.${l}.attention.k_proj.weight`]),
          vWeight: CubiOModelV1ProductionService.unflattenTensor(tensors[`layers.${l}.attention.v_proj.weight`]),
          outWeight: CubiOModelV1ProductionService.unflattenTensor(tensors[`layers.${l}.attention.out_proj.weight`]),
          ffn1Weight: CubiOModelV1ProductionService.unflattenTensor(tensors[`layers.${l}.mlp.gate_up_proj.weight`]),
          ffn2Weight: CubiOModelV1ProductionService.unflattenTensor(tensors[`layers.${l}.mlp.down_proj.weight`]),
          norm1Gamma: CubiOModelV1ProductionService.unflattenTensor(tensors[`layers.${l}.input_layernorm.weight`]),
          norm2Gamma: CubiOModelV1ProductionService.unflattenTensor(tensors[`layers.${l}.post_attention_layernorm.weight`]),
        });
      }

      const epistemicHead = CubiOModelV1ProductionService.unflattenTensor(tensors['head.epistemic_projection.weight']);
      const lmHead = CubiOModelV1ProductionService.unflattenTensor(tensors['head.lm_head.weight']);

      const hydratedWeights: NativeModelWeights = {
        tokenEmbedding,
        positionalEmbedding,
        spatialEmbedding,
        layers,
        epistemicHead,
        lmHead,
      };

      this.model.setWeights(hydratedWeights);

      // 6. Tokenizer & Inference Engine setup with 1,024 vocabulary
      const vocabCatalog = NativeVocabularyV2Builder.buildVocabulary();
      this.tokenizer = new NativeTokenizer(vocabCatalog);
      this.inferenceEngine = new NativeInferenceEngine(this.model, this.tokenizer);

      // 7. Register Model V1 in authoritative ModelRegistry alongside Phase 16
      const registry = ModelRegistry.getInstance();
      registry.registerProductionModel('cubio-model-v1', {
        parameters: EXPECTED_V1_PARAMETERS,
        layerCount: SCALED_5M_V2_CONFIG.layerCount,
        hiddenDimension: SCALED_5M_V2_CONFIG.hiddenDimension,
        checkpointId: 'MT10_FINAL_STAGE_2_STEP_0150',
        stateHash: this.verifiedStateHash,
        capability: 'LEVEL 4: CUBiO Model V1 Sovereign Transformer (8 layers, d=256, 1024 vocab, 343 spatial cells, 7 epistemic tiers)',
        productionMode: 'CUBIO_MODEL_V1_RESEARCH_RELEASE',
        metadata: {
          tierId: SCALED_5M_V2_CONFIG.tierId,
          attentionHeads: SCALED_5M_V2_CONFIG.attentionHeads,
          maxSequenceLength: SCALED_5M_V2_CONFIG.maxSequenceLength,
          vocabSize: SCALED_5M_V2_CONFIG.vocabSize,
          spatialCells: SCALED_5M_V2_CONFIG.spatialCells,
          epistemicClasses: SCALED_5M_V2_CONFIG.epistemicClasses,
          trainingStep: EXPECTED_V1_STEP,
        },
      });

      this.status = CubiOModelV1ServiceStatus.READY;
      this.lastError = null;
      return true;
    } catch (err: any) {
      this.status = CubiOModelV1ServiceStatus.ERROR;
      this.lastError = err.message || String(err);
      console.error('[CUBIO_MODEL_V1_SERVICE_ERROR]', this.lastError);
      return false;
    }
  }

  /**
   * Evaluates prompt forward pass through CUBiO Model V1
   */
  public evaluatePrompt(prompt: string, spatialCellId?: number): {
    prompt: string;
    promptTokens: number[];
    predictedNextTokenId: number;
    predictedNextTokenText: string;
    dominantEpistemic: EpistemicStatus;
    epistemicScores: Record<EpistemicStatus, number>;
    spatialCellId?: number;
    spatialAddress369?: number;
    spatialCoordinates?: { x: number; y: number; z: number };
    latencyMs: number;
  } {
    if (!this.isReady() || !this.model || !this.tokenizer) {
      throw new Error(`[SERVICE_NOT_READY] CUBiO Model V1 is not ready (status: ${this.status})`);
    }

    const t0 = performance.now();

    ExternalModelGuard.assertNativeOnly(prompt);
    ExternalModelGuard.assertActuationBlocked(prompt);

    let resolvedAddress369: number | undefined;
    let resolvedCoords: { x: number; y: number; z: number } | undefined;
    if (spatialCellId !== undefined) {
      validateCellId(spatialCellId);
      resolvedAddress369 = cellIdToAddress369(spatialCellId);
      resolvedCoords = cellIdToCoordinate(spatialCellId);
    }

    const promptTokens = this.tokenizer.encode(prompt, { addSpecialTokens: true });
    const clampedTokens = promptTokens.slice(0, SCALED_5M_V2_CONFIG.maxSequenceLength);

    const forwardOut: ModelForwardOutput = this.model.forward(clampedTokens, {
      spatialCellId,
      returnHidden: false,
    });

    const lastLogits = forwardOut.logits[forwardOut.logits.length - 1];
    let maxLogit = -Infinity;
    let predictedNextTokenId = 0;
    for (let i = 0; i < lastLogits.length; i++) {
      if (lastLogits[i] > maxLogit) {
        maxLogit = lastLogits[i];
        predictedNextTokenId = i;
      }
    }

    const predictedNextTokenText = this.tokenizer.decode([predictedNextTokenId]);
    const latencyMs = Math.round((performance.now() - t0) * 100) / 100;
    this.totalInferences++;

    return {
      prompt,
      promptTokens,
      predictedNextTokenId,
      predictedNextTokenText,
      dominantEpistemic: forwardOut.dominantEpistemicStatus,
      epistemicScores: forwardOut.epistemicScores,
      spatialCellId,
      spatialAddress369: resolvedAddress369,
      spatialCoordinates: resolvedCoords,
      latencyMs,
    };
  }

  /**
   * Generates autoregressive completion from CUBiO Model V1
   */
  public generate(
    prompt: string,
    options: NativeInferenceOptions = {},
    spatialCellId?: number
  ): NativeInferenceOutput {
    if (!this.isReady() || !this.inferenceEngine) {
      throw new Error(`[SERVICE_NOT_READY] CUBiO Model V1 is not ready (status: ${this.status})`);
    }

    ExternalModelGuard.assertNativeOnly(prompt);
    ExternalModelGuard.assertActuationBlocked(prompt);

    const out = this.inferenceEngine.generate(prompt, options, spatialCellId);
    this.totalInferences++;
    return out;
  }

  /**
   * Returns safe public metadata regarding CUBiO Model V1
   */
  public getModelMetadata(): CubiOModelV1Metadata {
    return {
      modelId: 'cubio-model-v1',
      name: 'CUBiO AI Model V1',
      version: '1.0.0-certified',
      tierId: SCALED_5M_V2_CONFIG.tierId,
      parameters: EXPECTED_V1_PARAMETERS,
      tensorCount: EXPECTED_V1_TENSORS,
      layerCount: SCALED_5M_V2_CONFIG.layerCount,
      hiddenDimension: SCALED_5M_V2_CONFIG.hiddenDimension,
      attentionHeads: SCALED_5M_V2_CONFIG.attentionHeads,
      maxSequenceLength: SCALED_5M_V2_CONFIG.maxSequenceLength,
      vocabSize: SCALED_5M_V2_CONFIG.vocabSize,
      spatialCells: SCALED_5M_V2_CONFIG.spatialCells,
      epistemicClasses: SCALED_5M_V2_CONFIG.epistemicClasses,
      trainingStep: EXPECTED_V1_STEP,
      stateHash: this.verifiedStateHash || EXPECTED_V1_MODEL_STATE_HASH,
      checkpointPath: CUBIO_MODEL_V1_CHECKPOINT_PATH,
      checkpointSha256: EXPECTED_V1_CHECKPOINT_SHA256,
      status: this.status,
      isActuationBlocked: IS_ACTUATION_BLOCKED,
      isOfflineIsolated: true,
      totalInferences: this.totalInferences,
    };
  }
}
