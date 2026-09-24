/**
 * CUBiO AI — Task 160: Native Parameter Expansion
 * src/cubio/model/native_expansion/tensorAllocator.ts
 *
 * Deterministic parameter allocation across embeddings, attention, MLP,
 * normalization, and output projection heads for the 1M expanded CUBiO model.
 */

import {
  EXPANDED_1M_ID,
  ExpandedTensorSpec,
  ParameterAllocationCatalog,
} from './types';

/**
 * Builds the exhaustive 53-tensor allocation catalog for the 1M profile (1,045,760 parameters).
 */
export function build1MParameterAllocationCatalog(): ParameterAllocationCatalog {
  const tensors: ExpandedTensorSpec[] = [];

  const d = 128;
  const V = 768;
  const T = 128;
  const S = 343;
  const E = 7;
  const numLayers = 6;
  const ffnDim = 256;

  let embeddingParams = 0;
  let attentionParams = 0;
  let mlpParams = 0;
  let normParams = 0;
  let headParams = 0;

  // 1. EMBEDDINGS (3 tensors)
  // Token Embeddings
  const tokenParams = V * d; // 768 * 128 = 98,304
  tensors.push({
    tensorName: 'embeddings.token_embeddings.weight',
    group: 'EMBEDDING',
    shape: [V, d],
    parameterCount: tokenParams,
    dtype: 'float32',
    isExpandedFromBaseline: true,
    baseTensorShape: [478, 64],
    baseParameterCount: 478 * 64, // 30,592
  });
  embeddingParams += tokenParams;

  // Positional Embeddings
  const posParams = T * d; // 128 * 128 = 16,384
  tensors.push({
    tensorName: 'embeddings.position_embeddings.weight',
    group: 'EMBEDDING',
    shape: [T, d],
    parameterCount: posParams,
    dtype: 'float32',
    isExpandedFromBaseline: true,
    baseTensorShape: [64, 64],
    baseParameterCount: 64 * 64, // 4,096
  });
  embeddingParams += posParams;

  // Spatial HCP Lattice Embeddings
  const spatialParams = S * d; // 343 * 128 = 43,904
  tensors.push({
    tensorName: 'embeddings.spatial_hcp_lattice.weight',
    group: 'EMBEDDING',
    shape: [S, d],
    parameterCount: spatialParams,
    dtype: 'float32',
    isExpandedFromBaseline: true,
    baseTensorShape: [343, 64],
    baseParameterCount: 343 * 64, // 21,952
  });
  embeddingParams += spatialParams;

  // 2. TRANSFORMER LAYERS (6 layers * 8 tensors = 48 tensors)
  for (let l = 0; l < numLayers; l++) {
    const isFromBase = l < 4;

    // Attention Projections: Q, K, V, Out
    const attnProjParams = d * d; // 128 * 128 = 16,384 each
    const attnNames = [
      { name: `layers.${l}.attention.q_proj.weight`, baseName: `layers.${l}.attention.q_proj.weight` },
      { name: `layers.${l}.attention.k_proj.weight`, baseName: `layers.${l}.attention.k_proj.weight` },
      { name: `layers.${l}.attention.v_proj.weight`, baseName: `layers.${l}.attention.v_proj.weight` },
      { name: `layers.${l}.attention.out_proj.weight`, baseName: `layers.${l}.attention.out_proj.weight` },
    ];

    for (const proj of attnNames) {
      tensors.push({
        tensorName: proj.name,
        group: 'ATTENTION',
        shape: [d, d],
        parameterCount: attnProjParams,
        dtype: 'float32',
        isExpandedFromBaseline: isFromBase,
        baseTensorShape: isFromBase ? [64, 64] : undefined,
        baseParameterCount: isFromBase ? 64 * 64 : undefined,
      });
      attentionParams += attnProjParams;
    }

    // MLP Projections: Gate/Up & Down
    const ffn1Params = d * ffnDim; // 128 * 256 = 32,768
    tensors.push({
      tensorName: `layers.${l}.mlp.gate_up_proj.weight`,
      group: 'MLP',
      shape: [d, ffnDim],
      parameterCount: ffn1Params,
      dtype: 'float32',
      isExpandedFromBaseline: isFromBase,
      baseTensorShape: isFromBase ? [64, 128] : undefined,
      baseParameterCount: isFromBase ? 64 * 128 : undefined,
    });
    mlpParams += ffn1Params;

    const ffn2Params = ffnDim * d; // 256 * 128 = 32,768
    tensors.push({
      tensorName: `layers.${l}.mlp.down_proj.weight`,
      group: 'MLP',
      shape: [ffnDim, d],
      parameterCount: ffn2Params,
      dtype: 'float32',
      isExpandedFromBaseline: isFromBase,
      baseTensorShape: isFromBase ? [128, 64] : undefined,
      baseParameterCount: isFromBase ? 128 * 64 : undefined,
    });
    mlpParams += ffn2Params;

    // LayerNorms
    tensors.push({
      tensorName: `layers.${l}.input_layernorm.weight`,
      group: 'NORM',
      shape: [d],
      parameterCount: d,
      dtype: 'float32',
      isExpandedFromBaseline: isFromBase,
      baseTensorShape: isFromBase ? [64] : undefined,
      baseParameterCount: isFromBase ? 64 : undefined,
    });
    normParams += d;

    tensors.push({
      tensorName: `layers.${l}.post_attention_layernorm.weight`,
      group: 'NORM',
      shape: [d],
      parameterCount: d,
      dtype: 'float32',
      isExpandedFromBaseline: isFromBase,
      baseTensorShape: isFromBase ? [64] : undefined,
      baseParameterCount: isFromBase ? 64 : undefined,
    });
    normParams += d;
  }

  // 3. PROJECTION HEADS (2 tensors)
  // Epistemic Head
  const epistemicParams = d * E; // 128 * 7 = 896
  tensors.push({
    tensorName: 'head.epistemic_projection.weight',
    group: 'HEAD',
    shape: [d, E],
    parameterCount: epistemicParams,
    dtype: 'float32',
    isExpandedFromBaseline: true,
    baseTensorShape: [64, 7],
    baseParameterCount: 64 * 7, // 448
  });
  headParams += epistemicParams;

  // Language Modeling Head
  const lmParams = d * V; // 128 * 768 = 98,304
  tensors.push({
    tensorName: 'head.lm_head.weight',
    group: 'HEAD',
    shape: [d, V],
    parameterCount: lmParams,
    dtype: 'float32',
    isExpandedFromBaseline: true,
    baseTensorShape: [64, 478],
    baseParameterCount: 64 * 478, // 30,592
  });
  headParams += lmParams;

  const targetParameters =
    embeddingParams + attentionParams + mlpParams + normParams + headParams;

  return Object.freeze({
    modelId: EXPANDED_1M_ID,
    targetParameters,
    tensorCount: tensors.length,
    tensors: Object.freeze(tensors),
    embeddingParams,
    attentionParams,
    mlpParams,
    normParams,
    headParams,
  });
}
