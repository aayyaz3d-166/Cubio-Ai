/**
 * CUBiO AI — Task 160: Native Parameter Expansion
 * src/cubio/model/native_expansion/nativeParameterExpander.ts
 *
 * Core parameter expansion engine:
 * Scales the native CUBiO language model from the 219K baseline (219,264 params)
 * to the approved 1M profile (1,045,760 params) using deterministic subspace preservation.
 *
 * Guaranteed Invariants:
 * 1. ZERO external pretrained models, foreign weights, or internet downloads.
 * 2. Subspace preservation: baseline weights are preserved bit-for-bit in primary sub-matrices.
 * 3. Expansion margins deterministically initialized via sovereign PRNG (Mulberry32).
 * 4. Permanent hardware actuation lockout: IS_ACTUATION_BLOCKED === true.
 */

import * as crypto from 'crypto';
import {
  TASK_160_ID,
  BASELINE_219K_ID,
  EXPANDED_1M_ID,
  ExpansionStrategy,
  ExpandedModelWeights,
  ExpandedLayerWeights,
  ExpandedModelContainer,
  ExpansionProvenance,
  IS_ACTUATION_BLOCKED,
} from './types';
import { build1MParameterAllocationCatalog } from './tensorAllocator';
import { assertNativeSovereignty } from '../native_scaling/modelManifest';
import { canonicalStringify, calculateCanonicalChecksum } from '../../core/canonicalIdentity';
import {
  CubiONativeModel,
  NativeModelWeights,
} from '../native_foundation/native_model_architecture';
import { NativeModelConfig } from '../native_foundation/native_model_types';

export class ParameterExpansionError extends Error {
  constructor(message: string) {
    super(`[PARAMETER_EXPANSION_ERROR] ${message}`);
    this.name = 'ParameterExpansionError';
  }
}

/**
 * Deterministic pseudo-random number generator for sovereign weight margin initialization.
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

/**
 * Expands a 2D matrix by preserving the top-left submatrix and deterministically initializing margins.
 */
function expandMatrix2D(
  baseMat: number[][],
  targetRows: number,
  targetCols: number,
  prng: DeterministicPRNG,
  scale: number
): number[][] {
  const baseRows = baseMat.length;
  const baseCols = baseMat[0]?.length || 0;

  const result: number[][] = [];
  for (let r = 0; r < targetRows; r++) {
    const row: number[] = [];
    for (let c = 0; c < targetCols; c++) {
      if (r < baseRows && c < baseCols) {
        // Sub-matrix preservation
        row.push(baseMat[r][c]);
      } else {
        // Deterministic sovereign margin initialization
        row.push(prng.nextRange(-scale, scale));
      }
    }
    result.push(row);
  }
  return result;
}

/**
 * Expands a 1D vector by preserving base elements and initializing newly appended positions.
 */
function expandVector1D(
  baseVec: number[],
  targetLen: number,
  fillVal: number = 1.0
): number[] {
  const result = new Array(targetLen);
  for (let i = 0; i < targetLen; i++) {
    if (i < baseVec.length) {
      result[i] = baseVec[i];
    } else {
      result[i] = fillVal;
    }
  }
  return result;
}

export interface ExpansionOptions {
  readonly tenantId?: string;
  readonly stateVersion?: number;
  readonly expansionSeed?: number;
  readonly strategy?: ExpansionStrategy;
}

export class NativeParameterExpander {
  /**
   * Performs progressive native parameter expansion from the 219K baseline to the 1M profile.
   */
  public static expandFromBaseline(
    baseModelOrWeights: CubiONativeModel | NativeModelWeights,
    options?: ExpansionOptions
  ): ExpandedModelContainer {
    if (!IS_ACTUATION_BLOCKED) {
      throw new ParameterExpansionError('Actuation lock violated: IS_ACTUATION_BLOCKED must be true.');
    }

    const tenantId = options?.tenantId || 'root';
    const stateVersion = options?.stateVersion || 1;
    const expansionSeed = options?.expansionSeed || 369002000;
    const strategy = options?.strategy || ExpansionStrategy.SUB_MATRIX_PRESERVE;

    // Extract weights
    let baseWeights: NativeModelWeights;
    let sourceModelId = BASELINE_219K_ID;
    if (baseModelOrWeights instanceof CubiONativeModel) {
      baseWeights = (baseModelOrWeights as any).weights;
      sourceModelId = baseModelOrWeights.modelId;
    } else {
      baseWeights = baseModelOrWeights;
    }

    assertNativeSovereignty(sourceModelId);
    assertNativeSovereignty(EXPANDED_1M_ID);

    const prng = new DeterministicPRNG(expansionSeed);

    const d_new = 128;
    const V_new = 768;
    const T_new = 128;
    const S_new = 343;
    const scale = Math.sqrt(2.0 / d_new);

    // 1. Expand Embeddings
    const tokenEmbedding = expandMatrix2D(baseWeights.tokenEmbedding, V_new, d_new, prng, scale);
    const positionalEmbedding = expandMatrix2D(baseWeights.positionalEmbedding, T_new, d_new, prng, scale * 0.5);
    const spatialEmbedding = expandMatrix2D(baseWeights.spatialEmbedding, S_new, d_new, prng, scale * 0.5);

    // 2. Expand Layers (6 layers)
    const expandedLayers: ExpandedLayerWeights[] = [];

    // Layers 0..3: Expand from base layers
    for (let l = 0; l < 4; l++) {
      const baseL = baseWeights.layers[l];
      const qWeight = expandMatrix2D(baseL.qWeight, d_new, d_new, prng, scale);
      const kWeight = expandMatrix2D(baseL.kWeight, d_new, d_new, prng, scale);
      const vWeight = expandMatrix2D(baseL.vWeight, d_new, d_new, prng, scale);
      const outWeight = expandMatrix2D(baseL.outWeight, d_new, d_new, prng, scale);

      const ffn1Weight = expandMatrix2D(baseL.ffn1Weight, d_new, d_new * 2, prng, scale);
      const ffn2Weight = expandMatrix2D(baseL.ffn2Weight, d_new * 2, d_new, prng, scale);

      const norm1Gamma = expandVector1D(baseL.norm1Gamma, d_new, 1.0);
      const norm2Gamma = expandVector1D(baseL.norm2Gamma, d_new, 1.0);

      expandedLayers.push({
        layerIndex: l,
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

    // Layers 4..5: Freshly allocated layers with sovereign PRNG
    for (let l = 4; l < 6; l++) {
      const qWeight = prng.nextMatrix(d_new, d_new, scale);
      const kWeight = prng.nextMatrix(d_new, d_new, scale);
      const vWeight = prng.nextMatrix(d_new, d_new, scale);
      const outWeight = prng.nextMatrix(d_new, d_new, scale);

      const ffn1Weight = prng.nextMatrix(d_new, d_new * 2, scale);
      const ffn2Weight = prng.nextMatrix(d_new * 2, d_new, scale);

      const norm1Gamma = new Array(d_new).fill(1.0);
      const norm2Gamma = new Array(d_new).fill(1.0);

      expandedLayers.push({
        layerIndex: l,
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

    // 3. Expand Projection Heads
    const epistemicHead = expandMatrix2D(baseWeights.epistemicHead, d_new, 7, prng, scale);
    const lmHead = expandMatrix2D(baseWeights.lmHead, d_new, V_new, prng, scale);

    const weights: ExpandedModelWeights = {
      tokenEmbedding,
      positionalEmbedding,
      spatialEmbedding,
      layers: expandedLayers,
      epistemicHead,
      lmHead,
    };

    // 4. Validate exact parameter count against catalog
    const allocation = build1MParameterAllocationCatalog();
    const countedParams = this.countParameters(weights);
    if (countedParams !== allocation.targetParameters) {
      throw new ParameterExpansionError(
        `Parameter count mismatch after expansion: expected ${allocation.targetParameters}, counted ${countedParams}.`
      );
    }

    // 5. Build Cryptographic Provenance
    const sourceStateHash = crypto.createHash('sha256').update(JSON.stringify({
      sourceModelId,
      sourceParams: 219264,
    })).digest('hex');

    const provenance: ExpansionProvenance = Object.freeze({
      taskId: TASK_160_ID,
      sourceModelId,
      sourceParameters: 219264,
      sourceStateHash,
      targetModelId: EXPANDED_1M_ID,
      targetParameters: allocation.targetParameters,
      strategy,
      stateVersion,
      tenantId,
      createdAt: '2026-09-13T00:00:00.000Z',
    });

    // 6. Compute Deterministic State Hash and Canonical Checksum
    const statePayload = {
      modelId: EXPANDED_1M_ID,
      targetParameters: allocation.targetParameters,
      tensorCount: allocation.tensorCount,
      provenance,
      expansionSeed,
      isActuationBlocked: true,
    };

    const canonicalChecksum = calculateCanonicalChecksum(statePayload);
    const stateHash = crypto.createHash('sha256').update(canonicalStringify(statePayload), 'utf8').digest('hex');

    return Object.freeze({
      modelId: EXPANDED_1M_ID,
      weights,
      allocation,
      provenance,
      stateHash,
      canonicalChecksum,
      canActuate: false,
      isActuationBlocked: true,
    });
  }

  /**
   * Helper to count total parameters in expanded weights.
   */
  public static countParameters(w: ExpandedModelWeights): number {
    let total = 0;
    // Embeddings
    total += w.tokenEmbedding.length * w.tokenEmbedding[0].length;
    total += w.positionalEmbedding.length * w.positionalEmbedding[0].length;
    total += w.spatialEmbedding.length * w.spatialEmbedding[0].length;

    // Layers
    for (const l of w.layers) {
      total += l.qWeight.length * l.qWeight[0].length;
      total += l.kWeight.length * l.kWeight[0].length;
      total += l.vWeight.length * l.vWeight[0].length;
      total += l.outWeight.length * l.outWeight[0].length;
      total += l.ffn1Weight.length * l.ffn1Weight[0].length;
      total += l.ffn2Weight.length * l.ffn2Weight[0].length;
      total += l.norm1Gamma.length;
      total += l.norm2Gamma.length;
    }

    // Heads
    total += w.epistemicHead.length * w.epistemicHead[0].length;
    total += w.lmHead.length * w.lmHead[0].length;

    return total;
  }
}
