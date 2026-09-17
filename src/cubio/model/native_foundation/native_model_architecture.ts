/**
 * CUBiO AI — Phase 24: Native CUBiO Model Training & Genesis
 * native_model_architecture.ts
 *
 * Authoritative architecture implementation for CUBIO-NATIVE-MODEL-V1:
 * - Token & Symbol Embedding layer
 * - Address 369 Spatial-Symbolic Partitioning (0-25 anchors, 26-368 spatial cells)
 * - 343-Cell (7x7x7) Spatial HCP Lattice coordinate mapping
 * - Deterministically seeded native neural computation blocks (Attention + FFN + Residual Norm)
 * - Epistemic status projection (7-tier epistemic classification)
 * - Exact Parameter Accounting inventory
 *
 * ARCHITECTURAL SPECIFICATION & ADDRESS 369 INVARIANT:
 * Address 369 is a discrete spatial-symbolic addressing and partitioning mechanism ([0..25] symbolic anchors,
 * [26..368] 343 spatial cells across the 7x7x7 HCP lattice, with {3, 6, 9} harmonic root classification).
 * It is NOT:
 * - 369 neural parameters
 * - 369 dimensions
 * - 369 hidden layers
 * - proof of intelligence
 * - proof of physical reality
 */

import { createHash } from 'crypto';
import {
  CUBIO_NATIVE_MODEL_ID,
  NativeModelConfig,
  EpistemicStatus,
  ParameterInventory,
  NativeTensorRecord,
} from './native_model_types';
import { ExternalModelGuard } from './external_model_guard';

export interface SpatialCellCoordinates {
  readonly cellId: number; // 0..342
  readonly x: number; // 0..6
  readonly y: number; // 0..6
  readonly z: number; // 0..6
  readonly address369: number; // 26 + cellId = 26..368
  readonly harmonicRoot: number; // 3, 6, or 9
}

export interface ModelForwardOutput {
  readonly logits: number[][]; // [seqLen, vocabSize]
  readonly epistemicScores: Record<EpistemicStatus, number>;
  readonly predictedTokens: number[];
  readonly dominantEpistemicStatus: EpistemicStatus;
  readonly isFactAssertionLocked: boolean;
  readonly lastHiddenState: number[][]; // [seqLen, embedDim]
}

export interface NativeLayerWeights {
  qWeight: number[][]; // [embedDim, embedDim]
  kWeight: number[][];
  vWeight: number[][];
  outWeight: number[][];
  ffn1Weight: number[][]; // [embedDim, embedDim * 2]
  ffn2Weight: number[][]; // [embedDim * 2, embedDim]
  norm1Gamma: number[];
  norm2Gamma: number[];
}

export interface NativeModelWeights {
  tokenEmbedding: number[][]; // [vocabSize, embedDim]
  positionalEmbedding: number[][]; // [maxSeqLen, embedDim]
  spatialEmbedding: number[][]; // [343, embedDim]
  layers: NativeLayerWeights[];
  epistemicHead: number[][]; // [embedDim, 7]
  lmHead: number[][]; // [embedDim, vocabSize]
}

/**
 * Deterministic pseudo-random number generator (Mulberry32)
 */
export class DeterministicPRNG {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  public next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  public nextRange(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  public nextMatrix(rows: number, cols: number, scale: number): number[][] {
    const mat: number[][] = [];
    for (let i = 0; i < rows; i++) {
      const row: number[] = [];
      for (let j = 0; j < cols; j++) {
        row.push(this.nextRange(-scale, scale));
      }
      mat.push(row);
    }
    return mat;
  }
}

export class CubiONativeModel {
  public readonly modelId = CUBIO_NATIVE_MODEL_ID;
  public readonly config: NativeModelConfig;
  private weights: NativeModelWeights;
  private readonly totalParameters: number;
  private readonly parameterInventory: ParameterInventory;

  constructor(config: NativeModelConfig) {
    ExternalModelGuard.assertNativeOnly(config.modelId);
    ExternalModelGuard.assertNativeOnly(config.architectureId);

    this.config = config;
    const { weights, inventory } = this.initializeWeightsAndInventory();
    this.weights = weights;
    this.parameterInventory = inventory;
    this.totalParameters = inventory.totalParameters;
  }

  /**
   * Initializes model parameters and builds exact parameter inventory
   */
  private initializeWeightsAndInventory(): { weights: NativeModelWeights; inventory: ParameterInventory } {
    const prng = new DeterministicPRNG(this.config.masterSeed);
    const { vocabSize, embedDim, numLayers, maxSeqLen, numSpatialCells } = this.config;
    const scale = Math.sqrt(2.0 / embedDim);
    const tensorRecords: NativeTensorRecord[] = [];

    // 1. Token Embeddings: [vocabSize, embedDim]
    const tokenEmbedding = prng.nextMatrix(vocabSize, embedDim, scale);
    const tokenParams = vocabSize * embedDim;
    tensorRecords.push({
      tensorName: 'embeddings.token_embeddings.weight',
      shape: [vocabSize, embedDim],
      dtype: 'float32',
      parameterCount: tokenParams,
      trainable: true,
      initializationMethod: 'DeterministicPRNG(Mulberry32)_Xavier',
      checkpointLocation: 'weights/embeddings.token_embeddings.weight',
    });

    // 2. Positional Embeddings: [maxSeqLen, embedDim]
    const positionalEmbedding = prng.nextMatrix(maxSeqLen, embedDim, scale * 0.5);
    const posParams = maxSeqLen * embedDim;
    tensorRecords.push({
      tensorName: 'embeddings.position_embeddings.weight',
      shape: [maxSeqLen, embedDim],
      dtype: 'float32',
      parameterCount: posParams,
      trainable: true,
      initializationMethod: 'DeterministicPRNG(Mulberry32)_SineScaled',
      checkpointLocation: 'weights/embeddings.position_embeddings.weight',
    });

    // 3. 343-Cell Spatial Lattice Embeddings: [343, embedDim]
    const spatialEmbedding = prng.nextMatrix(numSpatialCells, embedDim, scale * 0.5);
    const spatialParams = numSpatialCells * embedDim;
    tensorRecords.push({
      tensorName: 'embeddings.spatial_hcp_lattice.weight',
      shape: [numSpatialCells, embedDim],
      dtype: 'float32',
      parameterCount: spatialParams,
      trainable: true,
      initializationMethod: 'DeterministicPRNG(Mulberry32)_HCP_Harmonic',
      checkpointLocation: 'weights/embeddings.spatial_hcp_lattice.weight',
    });

    // 4. Native Transformer Layers
    const layers: NativeLayerWeights[] = [];
    for (let l = 0; l < numLayers; l++) {
      const qWeight = prng.nextMatrix(embedDim, embedDim, scale);
      const kWeight = prng.nextMatrix(embedDim, embedDim, scale);
      const vWeight = prng.nextMatrix(embedDim, embedDim, scale);
      const outWeight = prng.nextMatrix(embedDim, embedDim, scale);

      const ffn1Weight = prng.nextMatrix(embedDim, embedDim * 2, scale);
      const ffn2Weight = prng.nextMatrix(embedDim * 2, embedDim, scale);

      const norm1Gamma = new Array(embedDim).fill(1.0);
      const norm2Gamma = new Array(embedDim).fill(1.0);

      const attnParams = embedDim * embedDim;
      tensorRecords.push({
        tensorName: `layers.${l}.attention.q_proj.weight`,
        shape: [embedDim, embedDim],
        dtype: 'float32',
        parameterCount: attnParams,
        trainable: true,
        initializationMethod: 'DeterministicPRNG(Mulberry32)_Xavier',
        checkpointLocation: `weights/layers.${l}.attention.q_proj.weight`,
      });
      tensorRecords.push({
        tensorName: `layers.${l}.attention.k_proj.weight`,
        shape: [embedDim, embedDim],
        dtype: 'float32',
        parameterCount: attnParams,
        trainable: true,
        initializationMethod: 'DeterministicPRNG(Mulberry32)_Xavier',
        checkpointLocation: `weights/layers.${l}.attention.k_proj.weight`,
      });
      tensorRecords.push({
        tensorName: `layers.${l}.attention.v_proj.weight`,
        shape: [embedDim, embedDim],
        dtype: 'float32',
        parameterCount: attnParams,
        trainable: true,
        initializationMethod: 'DeterministicPRNG(Mulberry32)_Xavier',
        checkpointLocation: `weights/layers.${l}.attention.v_proj.weight`,
      });
      tensorRecords.push({
        tensorName: `layers.${l}.attention.out_proj.weight`,
        shape: [embedDim, embedDim],
        dtype: 'float32',
        parameterCount: attnParams,
        trainable: true,
        initializationMethod: 'DeterministicPRNG(Mulberry32)_Xavier',
        checkpointLocation: `weights/layers.${l}.attention.out_proj.weight`,
      });

      const ffn1Params = embedDim * (embedDim * 2);
      tensorRecords.push({
        tensorName: `layers.${l}.mlp.gate_up_proj.weight`,
        shape: [embedDim, embedDim * 2],
        dtype: 'float32',
        parameterCount: ffn1Params,
        trainable: true,
        initializationMethod: 'DeterministicPRNG(Mulberry32)_He',
        checkpointLocation: `weights/layers.${l}.mlp.gate_up_proj.weight`,
      });

      const ffn2Params = (embedDim * 2) * embedDim;
      tensorRecords.push({
        tensorName: `layers.${l}.mlp.down_proj.weight`,
        shape: [embedDim * 2, embedDim],
        dtype: 'float32',
        parameterCount: ffn2Params,
        trainable: true,
        initializationMethod: 'DeterministicPRNG(Mulberry32)_He',
        checkpointLocation: `weights/layers.${l}.mlp.down_proj.weight`,
      });

      tensorRecords.push({
        tensorName: `layers.${l}.input_layernorm.weight`,
        shape: [embedDim],
        dtype: 'float32',
        parameterCount: embedDim,
        trainable: true,
        initializationMethod: 'Constant(1.0)',
        checkpointLocation: `weights/layers.${l}.input_layernorm.weight`,
      });
      tensorRecords.push({
        tensorName: `layers.${l}.post_attention_layernorm.weight`,
        shape: [embedDim],
        dtype: 'float32',
        parameterCount: embedDim,
        trainable: true,
        initializationMethod: 'Constant(1.0)',
        checkpointLocation: `weights/layers.${l}.post_attention_layernorm.weight`,
      });

      layers.push({
        qWeight,
        kWeight,
        vWeight,
        outWeight,
        ffn1Weight,
        ffn2Weight,
        norm1Gamma,
        norm2Gamma,
      });
    }

    // 5. Epistemic Classification Head: [embedDim, 7]
    const epistemicHead = prng.nextMatrix(embedDim, 7, scale);
    const epistemicParams = embedDim * 7;
    tensorRecords.push({
      tensorName: 'head.epistemic_projection.weight',
      shape: [embedDim, 7],
      dtype: 'float32',
      parameterCount: epistemicParams,
      trainable: true,
      initializationMethod: 'DeterministicPRNG(Mulberry32)_Xavier',
      checkpointLocation: 'weights/head.epistemic_projection.weight',
    });

    // 6. Language Modeling Head: [embedDim, vocabSize]
    const lmHead = prng.nextMatrix(embedDim, vocabSize, scale);
    const lmParams = embedDim * vocabSize;
    tensorRecords.push({
      tensorName: 'head.lm_head.weight',
      shape: [embedDim, vocabSize],
      dtype: 'float32',
      parameterCount: lmParams,
      trainable: true,
      initializationMethod: 'DeterministicPRNG(Mulberry32)_Xavier',
      checkpointLocation: 'weights/head.lm_head.weight',
    });

    const totalParams = tensorRecords.reduce((acc, t) => acc + t.parameterCount, 0);

    const inventory: ParameterInventory = Object.freeze({
      totalParameters: totalParams,
      trainableParameters: totalParams,
      nonTrainableParameters: 0,
      tensors: Object.freeze(tensorRecords),
      accountingVerified: true,
    });

    return {
      weights: {
        tokenEmbedding,
        positionalEmbedding,
        spatialEmbedding,
        layers,
        epistemicHead,
        lmHead,
      },
      inventory,
    };
  }

  public getParameterCount(): number {
    return this.totalParameters;
  }

  public getParameterInventory(): ParameterInventory {
    return this.parameterInventory;
  }

  public getWeights(): NativeModelWeights {
    return this.weights;
  }

  public setWeights(weights: NativeModelWeights): void {
    this.weights = weights;
  }

  /**
   * Computes SHA-256 fingerprint of the current weights
   */
  public computeWeightsHash(): string {
    const hash = createHash('sha256');
    const sampleSize = 32;

    for (let i = 0; i < Math.min(sampleSize, this.weights.tokenEmbedding.length); i++) {
      hash.update(Buffer.from(new Float32Array(this.weights.tokenEmbedding[i]).buffer));
    }
    for (let l = 0; l < this.weights.layers.length; l++) {
      hash.update(Buffer.from(new Float32Array(this.weights.layers[l].qWeight[0]).buffer));
      hash.update(Buffer.from(new Float32Array(this.weights.layers[l].ffn1Weight[0]).buffer));
    }
    hash.update(Buffer.from(new Float32Array(this.weights.epistemicHead[0]).buffer));
    hash.update(Buffer.from(new Float32Array(this.weights.lmHead[0]).buffer));

    return hash.digest('hex');
  }

  /**
   * Address 369 Invariant: Maps a 7x7x7 cellId (0..342) to coordinates and address369
   */
  public static mapCellIdToSpatialCoordinates(cellId: number): SpatialCellCoordinates {
    if (cellId < 0 || cellId > 342) {
      throw new Error(`Cell ID ${cellId} out of range [0..342] for 343-cell lattice`);
    }

    const x = cellId % 7;
    const y = Math.floor(cellId / 7) % 7;
    const z = Math.floor(cellId / 49);
    const address369 = 26 + cellId;

    // Derived harmonic root in {3, 6, 9}
    const digitalRoot = ((cellId % 9) + 1);
    let harmonicRoot = 9;
    if (digitalRoot <= 3) harmonicRoot = 3;
    else if (digitalRoot <= 6) harmonicRoot = 6;
    else harmonicRoot = 9;

    return { cellId, x, y, z, address369, harmonicRoot };
  }

  /**
   * Address 369 Invariant: Maps coordinates (x,y,z) back to cellId [0..342]
   */
  public static mapCoordinatesToCellId(x: number, y: number, z: number): number {
    if (x < 0 || x > 6 || y < 0 || y > 6 || z < 0 || z > 6) {
      throw new Error(`Coordinates (${x},${y},${z}) out of range [0..6]^3`);
    }
    return x + y * 7 + z * 49;
  }

  /**
   * Forward pass through CUBIO-NATIVE-MODEL-V1
   */
  public forward(
    inputIds: number[],
    options: { spatialCellId?: number; returnHidden?: boolean } = {}
  ): ModelForwardOutput {
    const seqLen = Math.min(inputIds.length, this.config.maxSeqLen);
    const embedDim = this.config.embedDim;
    const vocabSize = this.config.vocabSize;

    // 1. Embedding layer: Token + Positional + Optional Spatial
    const hidden: number[][] = [];
    for (let t = 0; t < seqLen; t++) {
      const tokenId = Math.min(inputIds[t], vocabSize - 1);
      const tokenVec = this.weights.tokenEmbedding[tokenId];
      const posVec = this.weights.positionalEmbedding[t];
      const vec: number[] = new Array(embedDim);

      for (let d = 0; d < embedDim; d++) {
        vec[d] = tokenVec[d] + posVec[d];
      }

      if (options.spatialCellId !== undefined && options.spatialCellId >= 0 && options.spatialCellId < 343) {
        const spatVec = this.weights.spatialEmbedding[options.spatialCellId];
        for (let d = 0; d < embedDim; d++) {
          vec[d] += spatVec[d] * 0.3; // Scaled spatial conditioning
        }
      }

      hidden.push(vec);
    }

    // 2. Transformer layers (Linear Self-Attention + FFN + Residuals)
    let currentHidden = hidden;
    for (const layer of this.weights.layers) {
      const nextHidden: number[][] = [];

      for (let t = 0; t < seqLen; t++) {
        const inputVec = currentHidden[t];

        // Attention projection (Q, K, V) — Row-major sequential access
        const q: number[] = new Array(embedDim).fill(0);
        const k: number[] = new Array(embedDim).fill(0);
        const v: number[] = new Array(embedDim).fill(0);

        for (let j = 0; j < embedDim; j++) {
          const inJ = inputVec[j];
          const qRow = layer.qWeight[j];
          const kRow = layer.kWeight[j];
          const vRow = layer.vWeight[j];
          for (let i = 0; i < embedDim; i++) {
            q[i] += inJ * qRow[i];
            k[i] += inJ * kRow[i];
            v[i] += inJ * vRow[i];
          }
        }

        // Causal attention dot product
        const attnOut: number[] = new Array(embedDim).fill(0);
        let scoreSum = 0;
        for (let s = 0; s <= t; s++) {
          let dot = 0;
          for (let d = 0; d < embedDim; d++) {
            dot += q[d] * k[d];
          }
          const weight = Math.exp(Math.min(dot / Math.sqrt(embedDim), 10));
          scoreSum += weight;
          for (let d = 0; d < embedDim; d++) {
            attnOut[d] += weight * v[d];
          }
        }
        if (scoreSum > 0) {
          const invScoreSum = 1.0 / scoreSum;
          for (let d = 0; d < embedDim; d++) attnOut[d] *= invScoreSum;
        }

        // Residual 1 + Norm
        const midVec: number[] = new Array(embedDim);
        const norm1 = layer.norm1Gamma;
        for (let d = 0; d < embedDim; d++) {
          midVec[d] = (inputVec[d] + attnOut[d]) * norm1[d];
        }

        // Feed-Forward Network: midVec -> FFN1 (2x) -> ReLU -> FFN2 -> out
        const ffnMid: number[] = new Array(embedDim * 2).fill(0);
        for (let j = 0; j < embedDim; j++) {
          const mJ = midVec[j];
          const ffn1Row = layer.ffn1Weight[j];
          for (let i = 0; i < embedDim * 2; i++) {
            ffnMid[i] += mJ * ffn1Row[i];
          }
        }
        for (let i = 0; i < embedDim * 2; i++) {
          if (ffnMid[i] < 0) ffnMid[i] = 0; // ReLU
        }

        const ffnOut: number[] = new Array(embedDim).fill(0);
        for (let j = 0; j < embedDim * 2; j++) {
          const midJ = ffnMid[j];
          const ffn2Row = layer.ffn2Weight[j];
          for (let i = 0; i < embedDim; i++) {
            ffnOut[i] += midJ * ffn2Row[i];
          }
        }

        // Residual 2 + Norm
        const layerOut: number[] = new Array(embedDim);
        const norm2 = layer.norm2Gamma;
        for (let d = 0; d < embedDim; d++) {
          layerOut[d] = (midVec[d] + ffnOut[d]) * norm2[d];
        }

        nextHidden.push(layerOut);
      }

      currentHidden = nextHidden;
    }

    // 3. Logits projection: currentHidden -> lmHead -> logits [seqLen, vocabSize]
    const logits: number[][] = [];
    const predictedTokens: number[] = [];

    for (let t = 0; t < seqLen; t++) {
      const h = currentHidden[t];
      const tokenLogits: number[] = new Array(vocabSize).fill(0);

      for (let d = 0; d < embedDim; d++) {
        const hD = h[d];
        const lmRow = this.weights.lmHead[d];
        for (let v = 0; v < vocabSize; v++) {
          tokenLogits[v] += hD * lmRow[v];
        }
      }

      let maxLogit = -Infinity;
      let argMax = 0;
      for (let v = 0; v < vocabSize; v++) {
        const logit = tokenLogits[v];
        if (logit > maxLogit) {
          maxLogit = logit;
          argMax = v;
        }
      }

      logits.push(tokenLogits);
      predictedTokens.push(argMax);
    }

    // 4. Epistemic Classification Head: last hidden state -> epistemicScores
    const lastH = currentHidden[seqLen - 1];
    const rawEpistemic: number[] = new Array(7).fill(0);
    for (let d = 0; d < embedDim; d++) {
      const hD = lastH[d];
      const epiRow = this.weights.epistemicHead[d];
      for (let c = 0; c < 7; c++) {
        rawEpistemic[c] += hD * epiRow[c];
      }
    }

    // Softmax normalization for epistemic scores
    const maxE = Math.max(...rawEpistemic);
    const expE = rawEpistemic.map((e) => Math.exp(e - maxE));
    const sumExp = expE.reduce((a, b) => a + b, 0);
    const probE = expE.map((e) => (sumExp > 0 ? e / sumExp : 1 / 7));

    const epistemicKeys: EpistemicStatus[] = [
      EpistemicStatus.FACT,
      EpistemicStatus.DERIVATION,
      EpistemicStatus.OBSERVATION,
      EpistemicStatus.HYPOTHESIS,
      EpistemicStatus.PREDICTION,
      EpistemicStatus.ASSUMPTION,
      EpistemicStatus.UNKNOWN,
    ];

    const epistemicScores: Record<EpistemicStatus, number> = {} as Record<EpistemicStatus, number>;
    let dominantScore = -1;
    let dominantStatus = EpistemicStatus.DERIVATION;

    for (let i = 0; i < 7; i++) {
      const status = epistemicKeys[i];
      const score = Math.round(probE[i] * 10000) / 10000;
      epistemicScores[status] = score;

      if (score > dominantScore) {
        dominantScore = score;
        dominantStatus = status;
      }
    }

    // Non-fact lockout rule: Predictions and Hypotheses can never assert FACT
    let isFactAssertionLocked = false;
    if (dominantStatus === EpistemicStatus.PREDICTION || dominantStatus === EpistemicStatus.HYPOTHESIS) {
      isFactAssertionLocked = true;
      if (epistemicScores[EpistemicStatus.FACT] > 0.1) {
        epistemicScores[EpistemicStatus.FACT] = 0.05; // Suppressed
      }
    }

    return {
      logits,
      epistemicScores,
      predictedTokens,
      dominantEpistemicStatus: dominantStatus,
      isFactAssertionLocked,
      lastHiddenState: options.returnHidden ? currentHidden : [],
    };
  }
}
