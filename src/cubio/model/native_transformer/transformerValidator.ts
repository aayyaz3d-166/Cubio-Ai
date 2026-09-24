/**
 * CUBiO AI — Task 162: Native Transformer / Sequence Capacity Scaling
 * src/cubio/model/native_transformer/transformerValidator.ts
 *
 * Hard configuration validator enforcing strict bounds on transformer depth,
 * width, attention heads, sequence length, and sovereign non-foreign execution.
 */

import {
  ScaledTransformerHyperparameters,
  IS_ACTUATION_BLOCKED,
} from './types';
import { assertNativeSovereignty } from '../native_scaling/modelManifest';

export class TransformerConfigurationError extends Error {
  constructor(message: string) {
    super(`[TRANSFORMER_CONFIGURATION_ERROR] ${message}`);
    this.name = 'TransformerConfigurationError';
  }
}

export const HARD_TRANSFORMER_BOUNDS = Object.freeze({
  minLayers: 4,
  maxLayers: 26,
  minHiddenDim: 64,
  maxHiddenDim: 640,
  minHeads: 4,
  maxHeads: 20,
  minSeqLen: 64,
  maxSeqLen: 2048,
  exactSpatialCells: 343,
  exactEpistemicClasses: 7,
});

/**
 * Validates that transformer hyperparameters satisfy all architectural and safety bounds.
 */
export function validateTransformerHyperparameters(
  params: ScaledTransformerHyperparameters
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!IS_ACTUATION_BLOCKED) {
    errors.push('Actuation safety violated: IS_ACTUATION_BLOCKED must be true.');
  }

  // 1. Foreign model sovereignty assertion
  try {
    assertNativeSovereignty(params.modelId);
    assertNativeSovereignty(params.profileId);
  } catch (err: any) {
    errors.push(err.message);
  }

  // 2. Layer bounds
  if (params.layerCount < HARD_TRANSFORMER_BOUNDS.minLayers || params.layerCount > HARD_TRANSFORMER_BOUNDS.maxLayers) {
    errors.push(`layerCount (${params.layerCount}) out of bounds [${HARD_TRANSFORMER_BOUNDS.minLayers}..${HARD_TRANSFORMER_BOUNDS.maxLayers}].`);
  }

  // 3. Hidden dimension bounds
  if (params.hiddenDimension < HARD_TRANSFORMER_BOUNDS.minHiddenDim || params.hiddenDimension > HARD_TRANSFORMER_BOUNDS.maxHiddenDim) {
    errors.push(`hiddenDimension (${params.hiddenDimension}) out of bounds [${HARD_TRANSFORMER_BOUNDS.minHiddenDim}..${HARD_TRANSFORMER_BOUNDS.maxHiddenDim}].`);
  }

  // 4. Attention heads and divisibility
  if (params.attentionHeads < HARD_TRANSFORMER_BOUNDS.minHeads || params.attentionHeads > HARD_TRANSFORMER_BOUNDS.maxHeads) {
    errors.push(`attentionHeads (${params.attentionHeads}) out of bounds [${HARD_TRANSFORMER_BOUNDS.minHeads}..${HARD_TRANSFORMER_BOUNDS.maxHeads}].`);
  }

  if (params.hiddenDimension % params.attentionHeads !== 0) {
    errors.push(`hiddenDimension (${params.hiddenDimension}) must be cleanly divisible by attentionHeads (${params.attentionHeads}).`);
  }

  const calculatedHeadDim = params.hiddenDimension / params.attentionHeads;
  if (params.headDimension !== calculatedHeadDim) {
    errors.push(`headDimension specified (${params.headDimension}) does not match calculated (${calculatedHeadDim}).`);
  }

  // 5. Sequence length bounds
  if (params.maxSequenceLength < HARD_TRANSFORMER_BOUNDS.minSeqLen || params.maxSequenceLength > HARD_TRANSFORMER_BOUNDS.maxSeqLen) {
    errors.push(`maxSequenceLength (${params.maxSequenceLength}) out of bounds [${HARD_TRANSFORMER_BOUNDS.minSeqLen}..${HARD_TRANSFORMER_BOUNDS.maxSeqLen}].`);
  }

  // 6. Spatial lattice and Epistemic invariant
  if (params.spatialCells !== HARD_TRANSFORMER_BOUNDS.exactSpatialCells) {
    errors.push(`spatialCells (${params.spatialCells}) must equal exactly 343 for HCP lattice authority.`);
  }

  if (params.epistemicClasses !== HARD_TRANSFORMER_BOUNDS.exactEpistemicClasses) {
    errors.push(`epistemicClasses (${params.epistemicClasses}) must equal exactly 7.`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Asserts valid hyperparameters or throws TransformerConfigurationError fail-closed.
 */
export function assertValidTransformerHyperparameters(params: ScaledTransformerHyperparameters): void {
  const result = validateTransformerHyperparameters(params);
  if (!result.isValid) {
    throw new TransformerConfigurationError(`Invalid transformer configuration: ${result.errors.join('; ')}`);
  }
}
