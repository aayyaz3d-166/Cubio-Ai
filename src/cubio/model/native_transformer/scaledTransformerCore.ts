/**
 * CUBiO AI — Task 162: Native Transformer / Sequence Capacity Scaling
 * src/cubio/model/native_transformer/scaledTransformerCore.ts
 *
 * Sovereign Native Scaled Transformer Core implementing:
 * - Scaled Causal Multi-Head Self-Attention with causal mask
 * - Spatial HCP Lattice conditioning (343 cells)
 * - FFN with ReLU non-linearity and residual LayerNorms
 * - Epistemic classification projection (7 classes)
 * - LM Head vocabulary projection with stable softmax
 * - Exact bitwise reproducibility across cold and warm runs
 */

import {
  ScaledTransformerHyperparameters,
  TransformerForwardOptions,
  TransformerForwardOutput,
  EpistemicStatus,
  IS_ACTUATION_BLOCKED,
} from './types';
import { assertValidTransformerHyperparameters } from './transformerValidator';

export interface ScaledLayerWeights {
  qWeight: number[][];    // [hiddenDimension, hiddenDimension]
  kWeight: number[][];    // [hiddenDimension, hiddenDimension]
  vWeight: number[][];    // [hiddenDimension, hiddenDimension]
  outWeight: number[][];  // [hiddenDimension, hiddenDimension]
  ffn1Weight: number[][]; // [hiddenDimension, ffnDimension]
  ffn2Weight: number[][]; // [ffnDimension, hiddenDimension]
  norm1Gamma: number[];   // [hiddenDimension]
  norm2Gamma: number[];   // [hiddenDimension]
}

export interface ScaledTransformerWeights {
  tokenEmbedding: number[][];      // [vocabSize, hiddenDimension]
  positionalEmbedding: number[][]; // [maxSequenceLength, hiddenDimension]
  spatialEmbedding: number[][];    // [343, hiddenDimension]
  layers: ScaledLayerWeights[];    // L layers
  epistemicHead: number[][];       // [hiddenDimension, 7]
  lmHead: number[][];              // [hiddenDimension, vocabSize]
}

/**
 * Deterministic pseudo-random number generator (Mulberry32).
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

export class ScaledTransformerCore {
  public readonly params: ScaledTransformerHyperparameters;
  private weights: ScaledTransformerWeights;

  constructor(params: ScaledTransformerHyperparameters) {
    assertValidTransformerHyperparameters(params);
    this.params = params;
    this.weights = this.initializeWeights();
  }

  /**
   * Deterministically initializes weights for all layers and heads.
   */
  private initializeWeights(): ScaledTransformerWeights {
    const prng = new DeterministicPRNG(this.params.masterSeed);
    const d = this.params.hiddenDimension;
    const V = this.params.vocabSize;
    const T = this.params.maxSequenceLength;
    const S = this.params.spatialCells;
    const L = this.params.layerCount;
    const ffnDim = this.params.ffnDimension;
    const scale = Math.sqrt(2.0 / d);

    // Embeddings
    const tokenEmbedding = prng.nextMatrix(V, d, scale);
    const positionalEmbedding = prng.nextMatrix(T, d, scale * 0.5);
    const spatialEmbedding = prng.nextMatrix(S, d, scale * 0.5);

    // Transformer Layers
    const layers: ScaledLayerWeights[] = [];
    for (let l = 0; l < L; l++) {
      layers.push({
        qWeight: prng.nextMatrix(d, d, scale),
        kWeight: prng.nextMatrix(d, d, scale),
        vWeight: prng.nextMatrix(d, d, scale),
        outWeight: prng.nextMatrix(d, d, scale),
        ffn1Weight: prng.nextMatrix(d, ffnDim, scale),
        ffn2Weight: prng.nextMatrix(ffnDim, d, scale),
        norm1Gamma: new Array(d).fill(1.0),
        norm2Gamma: new Array(d).fill(1.0),
      });
    }

    // Heads
    const epistemicHead = prng.nextMatrix(d, 7, scale);
    const lmHead = prng.nextMatrix(d, V, scale);

    return {
      tokenEmbedding,
      positionalEmbedding,
      spatialEmbedding,
      layers,
      epistemicHead,
      lmHead,
    };
  }

  /**
   * Forward inference pass over token sequences.
   */
  public forward(
    inputIds: readonly number[],
    options?: TransformerForwardOptions
  ): TransformerForwardOutput {
    if (!IS_ACTUATION_BLOCKED) {
      throw new Error('Safety lock violated: IS_ACTUATION_BLOCKED must be true.');
    }

    const tStart = Date.now();
    const seqLen = Math.min(inputIds.length, this.params.maxSequenceLength);
    const d = this.params.hiddenDimension;
    const V = this.params.vocabSize;
    const numHeads = this.params.attentionHeads;
    const headDim = this.params.headDimension;

    // 1. Embedding Layer: Token + Position + Optional Spatial
    const hidden: number[][] = [];
    for (let t = 0; t < seqLen; t++) {
      const tokenId = Math.min(inputIds[t], V - 1);
      const tokenVec = this.weights.tokenEmbedding[tokenId];
      const posVec = this.weights.positionalEmbedding[t];
      const vec: number[] = new Array(d);

      for (let i = 0; i < d; i++) {
        vec[i] = tokenVec[i] + posVec[i];
      }

      if (options?.spatialCellId !== undefined && options.spatialCellId >= 0 && options.spatialCellId < 343) {
        const spatVec = this.weights.spatialEmbedding[options.spatialCellId];
        for (let i = 0; i < d; i++) {
          vec[i] += spatVec[i] * 0.25;
        }
      }

      hidden.push(vec);
    }

    let currentHidden = hidden;
    let totalAttentionEntropy = 0;

    // 2. Transformer Backbone: Multi-Head Causal Attention + FFN
    for (const layer of this.weights.layers) {
      const nextHidden: number[][] = [];

      for (let t = 0; t < seqLen; t++) {
        const inputVec = currentHidden[t];

        // Linear projections for Q, K, V
        const qProj: number[] = new Array(d).fill(0);
        const kProj: number[] = new Array(d).fill(0);
        const vProj: number[] = new Array(d).fill(0);

        for (let i = 0; i < d; i++) {
          for (let j = 0; j < d; j++) {
            qProj[i] += inputVec[j] * layer.qWeight[j][i];
            kProj[i] += inputVec[j] * layer.kWeight[j][i];
            vProj[i] += inputVec[j] * layer.vWeight[j][i];
          }
        }

        // Causal multi-head attention across heads
        const multiHeadOut: number[] = new Array(d).fill(0);

        for (let h = 0; h < numHeads; h++) {
          const hOffset = h * headDim;

          // Compute causal attention weights over prior positions 0..t
          const rawWeights: number[] = [];
          let maxLogit = -Infinity;

          for (let s = 0; s <= t; s++) {
            let dot = 0;
            for (let i = 0; i < headDim; i++) {
              dot += qProj[hOffset + i] * kProj[hOffset + i];
            }
            const logit = dot / Math.sqrt(headDim);
            rawWeights.push(logit);
            if (logit > maxLogit) maxLogit = logit;
          }

          // Stable Softmax
          let sumExp = 0;
          const expWeights: number[] = [];
          for (let s = 0; s <= t; s++) {
            const val = Math.exp(rawWeights[s] - maxLogit);
            expWeights.push(val);
            sumExp += val;
          }

          // Attention weighted sum of V
          for (let s = 0; s <= t; s++) {
            const prob = sumExp > 0 ? expWeights[s] / sumExp : 0;
            if (prob > 1e-6) {
              totalAttentionEntropy -= prob * Math.log(prob);
            }
            for (let i = 0; i < headDim; i++) {
              multiHeadOut[hOffset + i] += prob * vProj[hOffset + i];
            }
          }
        }

        // Out projection
        const attnOut: number[] = new Array(d).fill(0);
        for (let i = 0; i < d; i++) {
          for (let j = 0; j < d; j++) {
            attnOut[i] += multiHeadOut[j] * layer.outWeight[j][i];
          }
        }

        // Residual 1 + LayerNorm 1
        const midVec: number[] = new Array(d);
        for (let i = 0; i < d; i++) {
          midVec[i] = (inputVec[i] + attnOut[i]) * layer.norm1Gamma[i];
        }

        // FFN: midVec -> FFN1 (2x) -> ReLU -> FFN2 -> out
        const ffnMid: number[] = new Array(this.params.ffnDimension).fill(0);
        for (let i = 0; i < this.params.ffnDimension; i++) {
          for (let j = 0; j < d; j++) {
            ffnMid[i] += midVec[j] * layer.ffn1Weight[j][i];
          }
          ffnMid[i] = Math.max(0, ffnMid[i]); // ReLU
        }

        const ffnOut: number[] = new Array(d).fill(0);
        for (let i = 0; i < d; i++) {
          for (let j = 0; j < this.params.ffnDimension; j++) {
            ffnOut[i] += ffnMid[j] * layer.ffn2Weight[j][i];
          }
        }

        // Residual 2 + LayerNorm 2
        const outVec: number[] = new Array(d);
        for (let i = 0; i < d; i++) {
          outVec[i] = (midVec[i] + ffnOut[i]) * layer.norm2Gamma[i];
        }

        nextHidden.push(outVec);
      }

      currentHidden = nextHidden;
    }

    // 3. Epistemic Classification Head (from pooled final state)
    const finalState = currentHidden[seqLen - 1];
    const epistemicRaw: number[] = new Array(7).fill(0);
    for (let e = 0; e < 7; e++) {
      for (let i = 0; i < d; i++) {
        epistemicRaw[e] += finalState[i] * this.weights.epistemicHead[i][e];
      }
    }

    // Softmax epistemic scores
    let epMax = -Infinity;
    for (let e = 0; e < 7; e++) if (epistemicRaw[e] > epMax) epMax = epistemicRaw[e];
    let epSum = 0;
    const epProb: number[] = [];
    for (let e = 0; e < 7; e++) {
      const v = Math.exp(epistemicRaw[e] - epMax);
      epProb.push(v);
      epSum += v;
    }
    for (let e = 0; e < 7; e++) epProb[e] /= epSum;

    const epistemicScores: Record<EpistemicStatus, number> = {
      [EpistemicStatus.FACT]: epProb[0],
      [EpistemicStatus.OBSERVATION]: epProb[1],
      [EpistemicStatus.DERIVATION]: epProb[2],
      [EpistemicStatus.HYPOTHESIS]: epProb[3],
      [EpistemicStatus.PREDICTION]: epProb[4],
      [EpistemicStatus.ASSUMPTION]: epProb[5],
      [EpistemicStatus.UNKNOWN]: epProb[6],
    };

    let dominantStatus: EpistemicStatus = EpistemicStatus.FACT;
    let maxEpVal = -1;
    for (const [status, val] of Object.entries(epistemicScores) as [EpistemicStatus, number][]) {
      if (val > maxEpVal) {
        maxEpVal = val;
        dominantStatus = status;
      }
    }

    // 4. LM Head (Predict next token logits for final position)
    const logits: number[][] = [];
    const predictedTokens: number[] = [];

    const finalLogits: number[] = new Array(V).fill(0);
    let bestToken = 0;
    let bestLogit = -Infinity;

    for (let v = 0; v < V; v++) {
      for (let i = 0; i < d; i++) {
        finalLogits[v] += finalState[i] * this.weights.lmHead[i][v];
      }
      if (finalLogits[v] > bestLogit) {
        bestLogit = finalLogits[v];
        bestToken = v;
      }
    }

    logits.push(finalLogits);
    predictedTokens.push(bestToken);

    const executionTimeMs = Math.max(1, Date.now() - tStart);

    return Object.freeze({
      logits,
      lastHiddenState: currentHidden,
      epistemicScores,
      dominantEpistemicStatus: dominantStatus,
      predictedTokens,
      attentionEntropy: totalAttentionEntropy,
      executionTimeMs,
    });
  }
}
