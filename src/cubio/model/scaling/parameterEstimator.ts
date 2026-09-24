/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 45: Parameter Estimator
 *
 * Computes exact parameter counts across embeddings, attention projections,
 * feed-forward networks, normalization layers, and multimodal heads.
 */

import {
  ScalableModelArchitectureConfig,
  ParameterBreakdown,
} from './types';

export class ParameterEstimator {
  /**
   * Computes exact mathematical parameter count for a given architecture config.
   */
  public static estimate(cfg: ScalableModelArchitectureConfig): ParameterBreakdown {
    const d = cfg.hiddenDimension;
    const ffn = cfg.ffnDimension;
    const l = cfg.layerCount;
    const v = cfg.vocabSize;

    // 1. Embeddings: Token embeddings (V * d) + Position embeddings (Seq * d)
    const embeddingParams = (v * d) + (cfg.maxSequenceLength * d);

    // 2. Attention projections per layer: Q, K, V, O projections (4 * d * d) + biases
    const attentionParamsPerLayer = 4 * d * d;

    // 3. FFN per layer: FFN1 (d * ffn) + FFN2 (ffn * d)
    const ffnParamsPerLayer = 2 * d * ffn;

    // 4. LayerNorms per layer: Pre-attn LN (2 * d) + Pre-ffn LN (2 * d)
    const layerNormParamsPerLayer = 4 * d;

    // 5. Total backbone layers
    const paramsPerLayer = attentionParamsPerLayer + ffnParamsPerLayer + layerNormParamsPerLayer;
    const totalBackboneParams = embeddingParams + (l * paramsPerLayer) + (2 * d); // Final LN

    // 6. Multimodal heads: Image head (d * 3072) + Audio head (d * 1600) + 3D head (d * 24)
    const multimodalHeadsParams = cfg.enableMultimodalHeads
      ? (d * 3072) + (d * 1600) + (d * 24)
      : 0;

    const totalParameters = totalBackboneParams + multimodalHeadsParams;

    return Object.freeze({
      embeddingParams,
      attentionParamsPerLayer,
      ffnParamsPerLayer,
      layerNormParamsPerLayer,
      totalBackboneParams,
      multimodalHeadsParams,
      totalParameters,
    });
  }
}
