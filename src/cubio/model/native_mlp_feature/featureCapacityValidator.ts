/**
 * CUBiO AI — Task 164: Native MLP / Feature Capacity Scaling
 * src/cubio/model/native_mlp_feature/featureCapacityValidator.ts
 *
 * Hard configuration and capacity validator for native MLP feature processing.
 * Rejects invalid dimensions, unapproved expansion ratios, foreign architectures,
 * and external pretrained structures fail-closed.
 */

import {
  MlpHyperparameters,
  PROHIBITED_FOREIGN_MLP_ARCHITECTURES,
  NativeActivationFunction,
} from './types';

export class FeatureCapacityValidationError extends Error {
  public readonly code: string;
  public readonly details?: Record<string, unknown>;

  constructor(message: string, code = 'FEATURE_CAPACITY_VALIDATION_ERROR', details?: Record<string, unknown>) {
    super(`[FeatureCapacityValidator] ${message}`);
    this.name = 'FeatureCapacityValidationError';
    this.code = code;
    this.details = details;
  }
}

export class FeatureCapacityValidator {
  /**
   * Hard limits for native MLP feature scaling.
   */
  public static readonly MIN_HIDDEN_DIM = 64;
  public static readonly MAX_HIDDEN_DIM = 640;
  public static readonly MIN_INTERMEDIATE_DIM = 128;
  public static readonly MAX_INTERMEDIATE_DIM = 3840;
  public static readonly MIN_EXPANSION_RATIO = 1.0;
  public static readonly MAX_EXPANSION_RATIO = 6.0;

  public static readonly APPROVED_ACTIVATIONS: readonly NativeActivationFunction[] = Object.freeze([
    'NATIVE_RELU',
    'NATIVE_GELU',
    'NATIVE_SILU_APPROX',
    'NATIVE_POLYNOMIAL_HCP',
  ]);

  /**
   * Validates MLP hyperparameters against native bounds and consistency rules.
   */
  public static validate(params: MlpHyperparameters): void {
    if (!params) {
      throw new FeatureCapacityValidationError('MLP hyperparameters cannot be null or undefined.');
    }

    // 1. Hidden Dimension Bounds
    if (
      typeof params.hiddenDimension !== 'number' ||
      params.hiddenDimension < this.MIN_HIDDEN_DIM ||
      params.hiddenDimension > this.MAX_HIDDEN_DIM ||
      !Number.isInteger(params.hiddenDimension)
    ) {
      throw new FeatureCapacityValidationError(
        `Hidden dimension ${params.hiddenDimension} out of permitted native range [${this.MIN_HIDDEN_DIM}..${this.MAX_HIDDEN_DIM}].`,
        'INVALID_HIDDEN_DIMENSION',
        { hiddenDimension: params.hiddenDimension }
      );
    }

    // 2. Intermediate Feature Dimension Bounds
    if (
      typeof params.intermediateDimension !== 'number' ||
      params.intermediateDimension < this.MIN_INTERMEDIATE_DIM ||
      params.intermediateDimension > this.MAX_INTERMEDIATE_DIM ||
      !Number.isInteger(params.intermediateDimension)
    ) {
      throw new FeatureCapacityValidationError(
        `Intermediate feature dimension ${params.intermediateDimension} out of permitted range [${this.MIN_INTERMEDIATE_DIM}..${this.MAX_INTERMEDIATE_DIM}].`,
        'INVALID_INTERMEDIATE_DIMENSION',
        { intermediateDimension: params.intermediateDimension }
      );
    }

    // 3. Expansion Ratio Bounds
    const computedRatio = params.intermediateDimension / params.hiddenDimension;
    if (
      computedRatio < this.MIN_EXPANSION_RATIO ||
      computedRatio > this.MAX_EXPANSION_RATIO
    ) {
      throw new FeatureCapacityValidationError(
        `Feature expansion ratio ${computedRatio.toFixed(2)}x out of permitted native range [${this.MIN_EXPANSION_RATIO}x..${this.MAX_EXPANSION_RATIO}x].`,
        'INVALID_EXPANSION_RATIO',
        { computedRatio, intermediateDimension: params.intermediateDimension, hiddenDimension: params.hiddenDimension }
      );
    }

    // 4. Activation Function Validation
    if (!this.APPROVED_ACTIVATIONS.includes(params.activation)) {
      throw new FeatureCapacityValidationError(
        `Unsupported or non-native activation function: "${params.activation}". Must be one of: ${this.APPROVED_ACTIVATIONS.join(', ')}.`,
        'UNSUPPORTED_ACTIVATION',
        { activation: params.activation }
      );
    }
  }

  /**
   * Enforces strict sovereign isolation by rejecting prohibited foreign MLP architectures.
   */
  public static assertArchitectureSovereignty(architectureIdentifier: string): void {
    const normalized = architectureIdentifier.toLowerCase().trim();
    for (const prohibited of PROHIBITED_FOREIGN_MLP_ARCHITECTURES) {
      if (normalized.includes(prohibited)) {
        throw new FeatureCapacityValidationError(
          `Foreign MLP architecture rejected fail-closed: "${architectureIdentifier}". Only sovereign native CUBiO feature processing is authorized.`,
          'SOVEREIGN_ARCHITECTURE_VIOLATION',
          { prohibitedFound: prohibited, architectureIdentifier }
        );
      }
    }
  }
}
