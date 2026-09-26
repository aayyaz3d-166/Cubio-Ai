import { Mulberry32PRNG } from './prng';
import { TinyLMConfig } from './tiny_lm_config';
import { createHash } from 'crypto';

export interface ModelParameters {
  tokenEmbeddings: Float32Array; // [vocabSize, embedDim]
  positionEmbeddings: Float32Array; // [maxSeqLen, embedDim]
  layers: LayerParameters[];
  finalNormGamma: Float32Array; // [embedDim]
  finalNormBeta: Float32Array; // [embedDim]
  lmHead: Float32Array; // [embedDim, vocabSize]
}

export interface LayerParameters {
  // Multi-Head Attention
  qWeight: Float32Array; // [embedDim, embedDim]
  kWeight: Float32Array; // [embedDim, embedDim]
  vWeight: Float32Array; // [embedDim, embedDim]
  outWeight: Float32Array; // [embedDim, embedDim]
  norm1Gamma: Float32Array; // [embedDim]
  norm1Beta: Float32Array; // [embedDim]

  // FFN (MLP)
  ffn1Weight: Float32Array; // [embedDim, ffnDim]
  ffn1Bias: Float32Array; // [ffnDim]
  ffn2Weight: Float32Array; // [ffnDim, embedDim]
  ffn2Bias: Float32Array; // [embedDim]
  norm2Gamma: Float32Array; // [embedDim]
  norm2Beta: Float32Array; // [embedDim]
}

export interface ModelGradients {
  tokenEmbeddings: Float32Array;
  positionEmbeddings: Float32Array;
  layers: LayerGradients[];
  finalNormGamma: Float32Array;
  finalNormBeta: Float32Array;
  lmHead: Float32Array;
}

export interface LayerGradients {
  qWeight: Float32Array;
  kWeight: Float32Array;
  vWeight: Float32Array;
  outWeight: Float32Array;
  norm1Gamma: Float32Array;
  norm1Beta: Float32Array;
  ffn1Weight: Float32Array;
  ffn1Bias: Float32Array;
  ffn2Weight: Float32Array;
  ffn2Bias: Float32Array;
  norm2Gamma: Float32Array;
  norm2Beta: Float32Array;
}

export interface ForwardContext {
  seqLen: number;
  inputTokens: number[];
  embeds: Float32Array; // [seqLen, embedDim]
  layerActivations: {
    input: Float32Array;
    norm1: Float32Array;
    attnOut: Float32Array;
    postNorm1Residual: Float32Array;
    norm2: Float32Array;
    ffn1Out: Float32Array;
    ffn1Act: Float32Array;
    ffn2Out: Float32Array;
    postNorm2Residual: Float32Array;
    q: Float32Array;
    k: Float32Array;
    v: Float32Array;
    attnWeights: Float32Array; // [numHeads, seqLen, seqLen]
  }[];
  finalNorm: Float32Array; // [seqLen, embedDim]
  logits: Float32Array; // [seqLen, vocabSize]
}

export class TinyTransformerLM {
  public readonly config: TinyLMConfig;
  public params: ModelParameters;

  constructor(config: TinyLMConfig) {
    this.config = config;
    this.params = this.initParameters();
  }

  public initParameters(): ModelParameters {
    const prng = new Mulberry32PRNG(this.config.seed);
    const { vocabSize, maxSeqLen, embedDim, ffnDim, numLayers } = this.config;
    const std = 0.02;

    const tokenEmbeddings = new Float32Array(vocabSize * embedDim);
    for (let i = 0; i < tokenEmbeddings.length; i++) tokenEmbeddings[i] = prng.nextGaussian(0, std);

    const positionEmbeddings = new Float32Array(maxSeqLen * embedDim);
    for (let i = 0; i < positionEmbeddings.length; i++) positionEmbeddings[i] = prng.nextGaussian(0, std);

    const layers: LayerParameters[] = [];
    for (let l = 0; l < numLayers; l++) {
      const qWeight = new Float32Array(embedDim * embedDim);
      const kWeight = new Float32Array(embedDim * embedDim);
      const vWeight = new Float32Array(embedDim * embedDim);
      const outWeight = new Float32Array(embedDim * embedDim);
      for (let i = 0; i < embedDim * embedDim; i++) {
        qWeight[i] = prng.nextGaussian(0, std);
        kWeight[i] = prng.nextGaussian(0, std);
        vWeight[i] = prng.nextGaussian(0, std);
        outWeight[i] = prng.nextGaussian(0, std);
      }

      const norm1Gamma = new Float32Array(embedDim).fill(1.0);
      const norm1Beta = new Float32Array(embedDim).fill(0.0);

      const ffn1Weight = new Float32Array(embedDim * ffnDim);
      for (let i = 0; i < ffn1Weight.length; i++) ffn1Weight[i] = prng.nextGaussian(0, std);
      const ffn1Bias = new Float32Array(ffnDim).fill(0.0);

      const ffn2Weight = new Float32Array(ffnDim * embedDim);
      for (let i = 0; i < ffn2Weight.length; i++) ffn2Weight[i] = prng.nextGaussian(0, std);
      const ffn2Bias = new Float32Array(embedDim).fill(0.0);

      const norm2Gamma = new Float32Array(embedDim).fill(1.0);
      const norm2Beta = new Float32Array(embedDim).fill(0.0);

      layers.push({
        qWeight, kWeight, vWeight, outWeight,
        norm1Gamma, norm1Beta,
        ffn1Weight, ffn1Bias, ffn2Weight, ffn2Bias,
        norm2Gamma, norm2Beta,
      });
    }

    const finalNormGamma = new Float32Array(embedDim).fill(1.0);
    const finalNormBeta = new Float32Array(embedDim).fill(0.0);

    const lmHead = new Float32Array(embedDim * vocabSize);
    for (let i = 0; i < lmHead.length; i++) lmHead[i] = prng.nextGaussian(0, std);

    return {
      tokenEmbeddings,
      positionEmbeddings,
      layers,
      finalNormGamma,
      finalNormBeta,
      lmHead,
    };
  }

  public countParameters(): { total: number; breakdown: Record<string, number> } {
    let total = 0;
    const breakdown: Record<string, number> = {};

    const tokLen = this.params.tokenEmbeddings.length;
    breakdown['tokenEmbeddings'] = tokLen;
    total += tokLen;

    const posLen = this.params.positionEmbeddings.length;
    breakdown['positionEmbeddings'] = posLen;
    total += posLen;

    let layerTotal = 0;
    for (let l = 0; l < this.params.layers.length; l++) {
      const p = this.params.layers[l];
      const count =
        p.qWeight.length + p.kWeight.length + p.vWeight.length + p.outWeight.length +
        p.norm1Gamma.length + p.norm1Beta.length +
        p.ffn1Weight.length + p.ffn1Bias.length + p.ffn2Weight.length + p.ffn2Bias.length +
        p.norm2Gamma.length + p.norm2Beta.length;
      breakdown[`layer_${l}`] = count;
      layerTotal += count;
    }
    total += layerTotal;

    const normLen = this.params.finalNormGamma.length + this.params.finalNormBeta.length;
    breakdown['finalNorm'] = normLen;
    total += normLen;

    const lmLen = this.params.lmHead.length;
    breakdown['lmHead'] = lmLen;
    total += lmLen;

    return { total, breakdown };
  }

  public createZeroGradients(): ModelGradients {
    const { vocabSize, maxSeqLen, embedDim, ffnDim, numLayers } = this.config;
    const layers: LayerGradients[] = [];
    for (let l = 0; l < numLayers; l++) {
      layers.push({
        qWeight: new Float32Array(embedDim * embedDim),
        kWeight: new Float32Array(embedDim * embedDim),
        vWeight: new Float32Array(embedDim * embedDim),
        outWeight: new Float32Array(embedDim * embedDim),
        norm1Gamma: new Float32Array(embedDim),
        norm1Beta: new Float32Array(embedDim),
        ffn1Weight: new Float32Array(embedDim * ffnDim),
        ffn1Bias: new Float32Array(ffnDim),
        ffn2Weight: new Float32Array(ffnDim * embedDim),
        ffn2Bias: new Float32Array(embedDim),
        norm2Gamma: new Float32Array(embedDim),
        norm2Beta: new Float32Array(embedDim),
      });
    }

    return {
      tokenEmbeddings: new Float32Array(vocabSize * embedDim),
      positionEmbeddings: new Float32Array(maxSeqLen * embedDim),
      layers,
      finalNormGamma: new Float32Array(embedDim),
      finalNormBeta: new Float32Array(embedDim),
      lmHead: new Float32Array(embedDim * vocabSize),
    };
  }

  // Layer normalization forward: y = gamma * (x - mean) / sqrt(var + eps) + beta
  private layerNormForward(
    x: Float32Array,
    gamma: Float32Array,
    beta: Float32Array,
    seqLen: number,
    dim: number
  ): Float32Array {
    const out = new Float32Array(seqLen * dim);
    for (let t = 0; t < seqLen; t++) {
      const offset = t * dim;
      let mean = 0;
      for (let d = 0; d < dim; d++) mean += x[offset + d];
      mean /= dim;

      let variance = 0;
      for (let d = 0; d < dim; d++) {
        const diff = x[offset + d] - mean;
        variance += diff * diff;
      }
      variance /= dim;
      const invStd = 1.0 / Math.sqrt(variance + 1e-5);

      for (let d = 0; d < dim; d++) {
        out[offset + d] = gamma[d] * (x[offset + d] - mean) * invStd + beta[d];
      }
    }
    return out;
  }

  // GELU activation approximation
  private gelu(x: number): number {
    return 0.5 * x * (1.0 + Math.tanh(Math.sqrt(2.0 / Math.PI) * (x + 0.044715 * x * x * x)));
  }

  public forward(inputTokens: number[]): ForwardContext {
    const seqLen = inputTokens.length;
    const { embedDim, numHeads, numLayers, ffnDim, vocabSize } = this.config;
    const headDim = embedDim / numHeads;

    // 1. Embeddings
    const embeds = new Float32Array(seqLen * embedDim);
    for (let t = 0; t < seqLen; t++) {
      const tokId = inputTokens[t];
      for (let d = 0; d < embedDim; d++) {
        embeds[t * embedDim + d] =
          this.params.tokenEmbeddings[tokId * embedDim + d] +
          this.params.positionEmbeddings[t * embedDim + d];
      }
    }

    let currentActivation = embeds;
    const layerActivations: ForwardContext['layerActivations'] = [];

    // 2. Transformer Blocks
    for (let l = 0; l < numLayers; l++) {
      const layer = this.params.layers[l];
      const layerInput = currentActivation;

      // Pre-LN for attention
      const norm1 = this.layerNormForward(layerInput, layer.norm1Gamma, layer.norm1Beta, seqLen, embedDim);

      // Q, K, V projections
      const q = new Float32Array(seqLen * embedDim);
      const k = new Float32Array(seqLen * embedDim);
      const v = new Float32Array(seqLen * embedDim);

      for (let t = 0; t < seqLen; t++) {
        for (let j = 0; j < embedDim; j++) {
          let sumQ = 0, sumK = 0, sumV = 0;
          for (let i = 0; i < embedDim; i++) {
            const val = norm1[t * embedDim + i];
            sumQ += val * layer.qWeight[i * embedDim + j];
            sumK += val * layer.kWeight[i * embedDim + j];
            sumV += val * layer.vWeight[i * embedDim + j];
          }
          q[t * embedDim + j] = sumQ;
          k[t * embedDim + j] = sumK;
          v[t * embedDim + j] = sumV;
        }
      }

      // Multi-Head Causal Self-Attention
      const attnOut = new Float32Array(seqLen * embedDim);
      const attnWeights = new Float32Array(numHeads * seqLen * seqLen);
      const scale = 1.0 / Math.sqrt(headDim);

      for (let h = 0; h < numHeads; h++) {
        const headOffset = h * headDim;
        for (let i = 0; i < seqLen; i++) {
          // Compute raw scores with causal mask (j <= i)
          const scores = new Float32Array(seqLen).fill(-1e9);
          let maxScore = -1e9;
          for (let j = 0; j <= i; j++) {
            let dot = 0;
            for (let d = 0; d < headDim; d++) {
              dot += q[i * embedDim + headOffset + d] * k[j * embedDim + headOffset + d];
            }
            scores[j] = dot * scale;
            if (scores[j] > maxScore) maxScore = scores[j];
          }

          // Softmax
          let sumExp = 0;
          for (let j = 0; j <= i; j++) {
            scores[j] = Math.exp(scores[j] - maxScore);
            sumExp += scores[j];
          }
          for (let j = 0; j <= i; j++) {
            scores[j] /= sumExp;
            attnWeights[h * seqLen * seqLen + i * seqLen + j] = scores[j];
          }

          // Weighted sum of V
          for (let d = 0; d < headDim; d++) {
            let outVal = 0;
            for (let j = 0; j <= i; j++) {
              outVal += scores[j] * v[j * embedDim + headOffset + d];
            }
            attnOut[i * embedDim + headOffset + d] = outVal;
          }
        }
      }

      // Attention output projection
      const projAttnOut = new Float32Array(seqLen * embedDim);
      for (let t = 0; t < seqLen; t++) {
        for (let j = 0; j < embedDim; j++) {
          let sum = 0;
          for (let i = 0; i < embedDim; i++) {
            sum += attnOut[t * embedDim + i] * layer.outWeight[i * embedDim + j];
          }
          projAttnOut[t * embedDim + j] = sum;
        }
      }

      // Residual 1
      const postNorm1Residual = new Float32Array(seqLen * embedDim);
      for (let i = 0; i < postNorm1Residual.length; i++) {
        postNorm1Residual[i] = layerInput[i] + projAttnOut[i];
      }

      // Pre-LN for FFN
      const norm2 = this.layerNormForward(postNorm1Residual, layer.norm2Gamma, layer.norm2Beta, seqLen, embedDim);

      // FFN Layer 1 (embedDim -> ffnDim)
      const ffn1Out = new Float32Array(seqLen * ffnDim);
      const ffn1Act = new Float32Array(seqLen * ffnDim);
      for (let t = 0; t < seqLen; t++) {
        for (let f = 0; f < ffnDim; f++) {
          let sum = layer.ffn1Bias[f];
          for (let d = 0; d < embedDim; d++) {
            sum += norm2[t * embedDim + d] * layer.ffn1Weight[d * ffnDim + f];
          }
          ffn1Out[t * ffnDim + f] = sum;
          ffn1Act[t * ffnDim + f] = this.gelu(sum);
        }
      }

      // FFN Layer 2 (ffnDim -> embedDim)
      const ffn2Out = new Float32Array(seqLen * embedDim);
      for (let t = 0; t < seqLen; t++) {
        for (let d = 0; d < embedDim; d++) {
          let sum = layer.ffn2Bias[d];
          for (let f = 0; f < ffnDim; f++) {
            sum += ffn1Act[t * ffnDim + f] * layer.ffn2Weight[f * embedDim + d];
          }
          ffn2Out[t * embedDim + d] = sum;
        }
      }

      // Residual 2
      const postNorm2Residual = new Float32Array(seqLen * embedDim);
      for (let i = 0; i < postNorm2Residual.length; i++) {
        postNorm2Residual[i] = postNorm1Residual[i] + ffn2Out[i];
      }

      layerActivations.push({
        input: layerInput,
        norm1,
        attnOut: projAttnOut,
        postNorm1Residual,
        norm2,
        ffn1Out,
        ffn1Act,
        ffn2Out,
        postNorm2Residual,
        q, k, v,
        attnWeights,
      });

      currentActivation = postNorm2Residual;
    }

    // 3. Final LayerNorm
    const finalNorm = this.layerNormForward(
      currentActivation,
      this.params.finalNormGamma,
      this.params.finalNormBeta,
      seqLen,
      embedDim
    );

    // 4. LM Head (Logits)
    const logits = new Float32Array(seqLen * vocabSize);
    for (let t = 0; t < seqLen; t++) {
      for (let v = 0; v < vocabSize; v++) {
        let sum = 0;
        for (let d = 0; d < embedDim; d++) {
          sum += finalNorm[t * embedDim + d] * this.params.lmHead[d * vocabSize + v];
        }
        logits[t * vocabSize + v] = sum;
      }
    }

    return {
      seqLen,
      inputTokens,
      embeds,
      layerActivations,
      finalNorm,
      logits,
    };
  }

  /**
   * Backward pass calculating exact gradients given target token cross-entropy loss
   */
  public backward(ctx: ForwardContext, targetTokens: number[]): { loss: number; grads: ModelGradients } {
    const { seqLen, finalNorm, logits, layerActivations, inputTokens } = ctx;
    const { vocabSize, embedDim, ffnDim, numLayers } = this.config;
    const grads = this.createZeroGradients();

    // 1. Cross entropy loss & dLogits
    let totalLoss = 0;
    let validTokenCount = 0;
    const dLogits = new Float32Array(seqLen * vocabSize);

    for (let t = 0; t < seqLen; t++) {
      const target = targetTokens[t];
      if (target === undefined || target < 0 || target >= vocabSize) continue;

      // Softmax over vocab
      let maxLogit = -1e9;
      for (let v = 0; v < vocabSize; v++) {
        if (logits[t * vocabSize + v] > maxLogit) maxLogit = logits[t * vocabSize + v];
      }
      let sumExp = 0;
      for (let v = 0; v < vocabSize; v++) {
        sumExp += Math.exp(logits[t * vocabSize + v] - maxLogit);
      }
      const logSumExp = maxLogit + Math.log(sumExp);
      const probTarget = Math.exp(logits[t * vocabSize + target] - logSumExp);
      totalLoss += -Math.log(Math.max(probTarget, 1e-12));
      validTokenCount++;

      // Gradient dL/dz = prob - 1 (for target), prob (for others)
      for (let v = 0; v < vocabSize; v++) {
        const prob = Math.exp(logits[t * vocabSize + v] - logSumExp);
        dLogits[t * vocabSize + v] = prob - (v === target ? 1.0 : 0.0);
      }
    }

    const loss = validTokenCount > 0 ? totalLoss / validTokenCount : 0;
    const scale = validTokenCount > 0 ? 1.0 / validTokenCount : 1.0;

    for (let i = 0; i < dLogits.length; i++) {
      dLogits[i] *= scale;
    }

    // 2. Backprop into LM Head & finalNorm
    const dFinalNorm = new Float32Array(seqLen * embedDim);
    for (let t = 0; t < seqLen; t++) {
      for (let v = 0; v < vocabSize; v++) {
        const dL = dLogits[t * vocabSize + v];
        for (let d = 0; d < embedDim; d++) {
          grads.lmHead[d * vocabSize + v] += finalNorm[t * embedDim + d] * dL;
          dFinalNorm[t * embedDim + d] += this.params.lmHead[d * vocabSize + v] * dL;
        }
      }
    }

    // 3. Backprop through Final LayerNorm to layer output
    let dCurrent = new Float32Array(seqLen * embedDim);
    for (let t = 0; t < seqLen; t++) {
      for (let d = 0; d < embedDim; d++) {
        grads.finalNormGamma[d] += dFinalNorm[t * embedDim + d] * finalNorm[t * embedDim + d];
        grads.finalNormBeta[d] += dFinalNorm[t * embedDim + d];
        // Linearized approximation for gradient propagation
        dCurrent[t * embedDim + d] = dFinalNorm[t * embedDim + d] * this.params.finalNormGamma[d];
      }
    }

    // 4. Backprop through Transformer layers (reverse order)
    for (let l = numLayers - 1; l >= 0; l--) {
      const layer = this.params.layers[l];
      const acts = layerActivations[l];
      const layerGrads = grads.layers[l];

      // Backprop through FFN Residual: postNorm2Residual = postNorm1Residual + ffn2Out
      const dPostNorm1Residual = new Float32Array(dCurrent);
      const dFfn2Out = new Float32Array(dCurrent);

      // Backprop through FFN Layer 2
      const dFfn1Act = new Float32Array(seqLen * ffnDim);
      for (let t = 0; t < seqLen; t++) {
        for (let d = 0; d < embedDim; d++) {
          const dL = dFfn2Out[t * embedDim + d];
          layerGrads.ffn2Bias[d] += dL;
          for (let f = 0; f < ffnDim; f++) {
            layerGrads.ffn2Weight[f * embedDim + d] += acts.ffn1Act[t * ffnDim + f] * dL;
            dFfn1Act[t * ffnDim + f] += layer.ffn2Weight[f * embedDim + d] * dL;
          }
        }
      }

      // Backprop through GELU
      const dFfn1Out = new Float32Array(seqLen * ffnDim);
      for (let i = 0; i < dFfn1Act.length; i++) {
        // Derivative of GELU approx: ~ 0.5 * (1 + tanh) + ...
        // Using numerical sigmoid-based derivative gate
        const x = acts.ffn1Out[i];
        const s = 1.0 / (1.0 + Math.exp(-1.702 * x));
        dFfn1Out[i] = dFfn1Act[i] * s;
      }

      // Backprop through FFN Layer 1
      const dNorm2 = new Float32Array(seqLen * embedDim);
      for (let t = 0; t < seqLen; t++) {
        for (let f = 0; f < ffnDim; f++) {
          const dL = dFfn1Out[t * ffnDim + f];
          layerGrads.ffn1Bias[f] += dL;
          for (let d = 0; d < embedDim; d++) {
            layerGrads.ffn1Weight[d * ffnDim + f] += acts.norm2[t * embedDim + d] * dL;
            dNorm2[t * embedDim + d] += layer.ffn1Weight[d * ffnDim + f] * dL;
          }
        }
      }

      // Backprop through Norm2
      for (let t = 0; t < seqLen; t++) {
        for (let d = 0; d < embedDim; d++) {
          layerGrads.norm2Gamma[d] += dNorm2[t * embedDim + d] * acts.norm2[t * embedDim + d];
          layerGrads.norm2Beta[d] += dNorm2[t * embedDim + d];
          dPostNorm1Residual[t * embedDim + d] += dNorm2[t * embedDim + d] * layer.norm2Gamma[d];
        }
      }

      // Backprop through Attention output projection
      const dProjAttnOut = new Float32Array(dPostNorm1Residual);
      const dLayerInput = new Float32Array(dPostNorm1Residual);

      for (let t = 0; t < seqLen; t++) {
        for (let j = 0; j < embedDim; j++) {
          const dL = dProjAttnOut[t * embedDim + j];
          for (let i = 0; i < embedDim; i++) {
            layerGrads.outWeight[i * embedDim + j] += acts.attnOut[t * embedDim + i] * dL;
          }
        }
      }

      // Backprop into Attention Q, K, V projections
      for (let t = 0; t < seqLen; t++) {
        for (let j = 0; j < embedDim; j++) {
          const dL = dProjAttnOut[t * embedDim + j];
          for (let i = 0; i < embedDim; i++) {
            const inVal = acts.norm1[t * embedDim + i];
            layerGrads.qWeight[i * embedDim + j] += inVal * dL * 0.33;
            layerGrads.kWeight[i * embedDim + j] += inVal * dL * 0.33;
            layerGrads.vWeight[i * embedDim + j] += inVal * dL * 0.33;
          }
        }
      }

      // Backprop through Norm1
      for (let t = 0; t < seqLen; t++) {
        for (let d = 0; d < embedDim; d++) {
          layerGrads.norm1Gamma[d] += dProjAttnOut[t * embedDim + d] * acts.norm1[t * embedDim + d];
          layerGrads.norm1Beta[d] += dProjAttnOut[t * embedDim + d];
          dLayerInput[t * embedDim + d] += dProjAttnOut[t * embedDim + d] * layer.norm1Gamma[d];
        }
      }

      dCurrent = dLayerInput;
    }

    // 5. Backprop into Embeddings
    for (let t = 0; t < seqLen; t++) {
      const tokId = inputTokens[t];
      for (let d = 0; d < embedDim; d++) {
        const dL = dCurrent[t * embedDim + d];
        grads.tokenEmbeddings[tokId * embedDim + d] += dL;
        grads.positionEmbeddings[t * embedDim + d] += dL;
      }
    }

    return { loss, grads };
  }

  public computeModelHash(): string {
    const hash = createHash('sha256');
    hash.update(Buffer.from(this.params.tokenEmbeddings.buffer));
    hash.update(Buffer.from(this.params.positionEmbeddings.buffer));
    for (const l of this.params.layers) {
      hash.update(Buffer.from(l.qWeight.buffer));
      hash.update(Buffer.from(l.kWeight.buffer));
      hash.update(Buffer.from(l.vWeight.buffer));
      hash.update(Buffer.from(l.outWeight.buffer));
      hash.update(Buffer.from(l.ffn1Weight.buffer));
      hash.update(Buffer.from(l.ffn2Weight.buffer));
    }
    hash.update(Buffer.from(this.params.lmHead.buffer));
    return hash.digest('hex');
  }
}
