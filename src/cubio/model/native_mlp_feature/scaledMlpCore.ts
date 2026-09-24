/**
 * CUBiO AI — Task 164: Native MLP / Feature Capacity Scaling
 * src/cubio/model/native_mlp_feature/scaledMlpCore.ts
 *
 * Sovereign Multi-Layer Perceptron (MLP) feature processing engine.
 * Computes deterministic non-linear feature projections, native activations,
 * spatial HCP lattice harmonics, residual connections, and LayerNorm.
 *
 * All parameters are generated and scaled natively with zero external weights.
 */

import * as crypto from 'crypto';
import {
  IS_ACTUATION_BLOCKED,
  MlpHyperparameters,
  ScaledMlpWeights,
  MlpForwardOptions,
  MlpForwardOutput,
  NativeActivationFunction,
} from './types';
import { FeatureCapacityValidator } from './featureCapacityValidator';

/**
 * Sovereign deterministic PRNG initialized with spatial seed.
 */
class SovereignMlpPrng {
  private state: number;

  constructor(seed: number = 36912345) {
    this.state = seed >>> 0;
  }

  public nextFloat(): number {
    this.state = (Math.imul(1664525, this.state) + 1013904223) >>> 0;
    return (this.state >>> 0) / 4294967296;
  }

  public nextMatrix(rows: number, cols: number, scale: number): number[][] {
    const mat: number[][] = new Array(rows);
    for (let r = 0; r < rows; r++) {
      const row = new Array(cols);
      for (let c = 0; c < cols; c++) {
        row[c] = (this.nextFloat() * 2 - 1) * scale;
      }
      mat[r] = row;
    }
    return mat;
  }
}

export class ScaledMlpCore {
  public readonly params: MlpHyperparameters;
  public readonly weights: ScaledMlpWeights;

  constructor(params: MlpHyperparameters, customWeights?: ScaledMlpWeights) {
    FeatureCapacityValidator.validate(params);
    this.params = params;
    this.weights = customWeights || this.initializeWeights();
  }

  /**
   * Deterministically allocates and initializes native MLP weights.
   */
  private initializeWeights(): ScaledMlpWeights {
    const d = this.params.hiddenDimension;
    const ffnDim = this.params.intermediateDimension;
    const seed = this.params.seed ?? (36900000 + d * 1000 + ffnDim);
    const prng = new SovereignMlpPrng(seed);

    const scaleUp = Math.sqrt(2.0 / (d + ffnDim));
    const scaleDown = Math.sqrt(2.0 / (ffnDim + d));

    const upWeight = prng.nextMatrix(d, ffnDim, scaleUp);
    const downWeight = prng.nextMatrix(ffnDim, d, scaleDown);
    const normGamma = new Array(d).fill(1.0);

    return {
      upWeight,
      downWeight,
      normGamma,
    };
  }

  /**
   * Evaluates native non-linear activation on an intermediate activation scalar.
   */
  public static applyActivation(val: number, activation: NativeActivationFunction): number {
    switch (activation) {
      case 'NATIVE_RELU':
        return Math.max(0, val);

      case 'NATIVE_GELU': {
        // Deterministic tanh approximation of Gaussian Error Linear Unit
        const c = 0.044715;
        const sqrt2OverPi = 0.7978845608;
        const cube = val * val * val;
        const inner = sqrt2OverPi * (val + c * cube);
        const tanhVal = Math.tanh(Math.max(-10, Math.min(10, inner)));
        return 0.5 * val * (1.0 + tanhVal);
      }

      case 'NATIVE_SILU_APPROX': {
        // Sigmoid linear unit approximation
        const clamped = Math.max(-20, Math.min(20, val));
        const sigmoid = 1.0 / (1.0 + Math.exp(-clamped));
        return val * sigmoid;
      }

      case 'NATIVE_POLYNOMIAL_HCP': {
        // Native piecewise smooth polynomial with bounded slope
        if (val <= 0) {
          return 0.01 * val;
        }
        return val / (1.0 + 0.1 * val);
      }

      default:
        return Math.max(0, val);
    }
  }

  /**
   * Performs forward feature processing across input sequence vectors.
   */
  public forward(
    inputFeatures: readonly (readonly number[])[],
    options?: MlpForwardOptions
  ): MlpForwardOutput {
    if (!IS_ACTUATION_BLOCKED) {
      throw new Error('Permanent actuation lock violated: IS_ACTUATION_BLOCKED must be true.');
    }

    const tStart = Date.now();
    const seqLen = inputFeatures.length;
    if (seqLen === 0) {
      return {
        outputFeatures: [],
        meanActivationEnergy: 0,
        totalFlops: 0,
        latencyMs: 0,
        stateHash: crypto.createHash('sha256').update('EMPTY_MLP_INPUT').digest('hex'),
      };
    }

    const d = this.params.hiddenDimension;
    const ffnDim = this.params.intermediateDimension;
    const activation = this.params.activation;

    const outputFeatures: number[][] = new Array(seqLen);
    const intermediateActivations: number[][] = [];
    let totalActivationEnergy = 0;

    // Optional spatial HCP harmonic vector
    let spatialBias = 0;
    if (options?.spatialCellId !== undefined && options.spatialCellId >= 0 && options.spatialCellId < 343) {
      spatialBias = ((options.spatialCellId % 7) - 3) * 0.02;
    }

    for (let t = 0; t < seqLen; t++) {
      const x = inputFeatures[t];
      const interVec = new Array(ffnDim).fill(0);

      // 1. Up-projection: interVec = x * W_up
      for (let j = 0; j < ffnDim; j++) {
        let sum = spatialBias;
        for (let i = 0; i < d; i++) {
          sum += x[i] * this.weights.upWeight[i][j];
        }
        // Non-linear activation
        const act = ScaledMlpCore.applyActivation(sum, activation);
        interVec[j] = act;
        totalActivationEnergy += act * act;
      }

      if (options?.recordMetrics) {
        intermediateActivations.push(interVec);
      }

      // 2. Down-projection: downVec = interVec * W_down
      const downVec = new Array(d).fill(0);
      for (let i = 0; i < d; i++) {
        let sum = 0;
        for (let j = 0; j < ffnDim; j++) {
          sum += interVec[j] * this.weights.downWeight[j][i];
        }
        downVec[i] = sum;
      }

      // 3. Residual connection & LayerNorm
      const outVec = new Array(d);
      if (this.params.hasResidual) {
        for (let i = 0; i < d; i++) {
          downVec[i] += x[i];
        }
      }

      if (this.params.hasLayerNorm) {
        // Compute mean and variance
        let mean = 0;
        for (let i = 0; i < d; i++) {
          mean += downVec[i];
        }
        mean /= d;

        let variance = 0;
        for (let i = 0; i < d; i++) {
          const diff = downVec[i] - mean;
          variance += diff * diff;
        }
        variance /= d;
        const invStd = 1.0 / Math.sqrt(variance + 1e-5);

        for (let i = 0; i < d; i++) {
          outVec[i] = (downVec[i] - mean) * invStd * this.weights.normGamma[i];
        }
      } else {
        for (let i = 0; i < d; i++) {
          outVec[i] = downVec[i];
        }
      }

      outputFeatures[t] = outVec;
    }

    const tEnd = Date.now();
    const totalFlops = seqLen * (4 * d * ffnDim);
    const meanActivationEnergy = seqLen > 0 ? totalActivationEnergy / (seqLen * ffnDim) : 0;

    // Cryptographic state hash
    const hash = crypto.createHash('sha256');
    hash.update(`MLP:${this.params.profile}:${this.params.activation}:${d}:${ffnDim}`);
    for (let t = 0; t < seqLen; t++) {
      for (let i = 0; i < d; i++) {
        hash.update(outputFeatures[t][i].toFixed(6));
      }
    }
    const stateHash = hash.digest('hex');

    return {
      outputFeatures,
      intermediateActivations: options?.recordMetrics ? intermediateActivations : undefined,
      meanActivationEnergy,
      totalFlops,
      latencyMs: Math.max(0.01, tEnd - tStart),
      stateHash,
    };
  }
}
