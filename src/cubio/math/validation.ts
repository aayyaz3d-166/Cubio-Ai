/**
 * CUBiO AI — Task 17: Native Mathematical Representation Layer
 * Phase 1 — Mathematical Core
 * src/cubio/math/validation.ts
 *
 * Strict numerical safety validation rules for native mathematical representations:
 * - Reject NaN, +Infinity, and -Infinity
 * - Enforce finite scalar and integer contracts
 * - Enforce strictly bounded normalization ranges [0.0, 1.0]
 * - Enforce vector length bounds (1..1024)
 * - Delegate canonical spatial coordinate bounds [0..6] to src/core/address369.ts
 * - Validate discrete probability distribution invariants (p_i >= 0, sum(p) ≈ 1)
 *
 * NO SILENT COERCION. NO SILENT ROUNDING. NO HIDDEN PRECISION LOSS.
 */

import { validateCoordinate } from '../../core/address369';
import {
  CoordinateDomain,
  CoordinateDomainBounds,
  DEFAULT_PROBABILITY_TOLERANCE,
  MAX_VECTOR_LENGTH,
} from './types';

export class NativeMathValidationError extends Error {
  constructor(message: string) {
    super(`[NATIVE_MATH_VALIDATION_ERROR] ${message}`);
    this.name = 'NativeMathValidationError';
  }
}

/**
 * Asserts that a value is a strictly finite number.
 * Rejects NaN, +Infinity, and -Infinity fail-closed.
 */
export function assertFinite(val: number, name = 'Value'): void {
  if (typeof val !== 'number') {
    throw new NativeMathValidationError(`${name} must be of type number. Received: ${typeof val}`);
  }
  if (Number.isNaN(val)) {
    throw new NativeMathValidationError(`${name} must be finite. Received: NaN`);
  }
  if (!Number.isFinite(val)) {
    throw new NativeMathValidationError(`${name} must be finite. Received: ${val > 0 ? '+Infinity' : '-Infinity'}`);
  }
}

/**
 * Asserts that a value is a finite discrete integer.
 */
export function assertInteger(val: number, name = 'Value'): void {
  assertFinite(val, name);
  if (!Number.isInteger(val)) {
    throw new NativeMathValidationError(`${name} must be an integer. Received non-integer float: ${val}`);
  }
}

/**
 * Asserts that a value is a normalized scalar strictly within [0.0, 1.0].
 */
export function assertNormalized(val: number, name = 'Normalized value'): void {
  assertFinite(val, name);
  if (val < 0.0 || val > 1.0) {
    throw new NativeMathValidationError(
      `${name} must be within the normalized unit interval [0.0, 1.0]. Received: ${val}`
    );
  }
}

/**
 * Validates vector length and verifies that every element is strictly finite.
 */
export function assertVector(values: readonly number[], maxLength = MAX_VECTOR_LENGTH): void {
  if (!Array.isArray(values)) {
    throw new NativeMathValidationError(`Vector values must be an array. Received: ${typeof values}`);
  }
  if (values.length === 0) {
    throw new NativeMathValidationError('Vector length must be greater than 0.');
  }
  if (values.length > maxLength) {
    throw new NativeMathValidationError(
      `Vector length exceeds configured maximum bound of ${maxLength}. Received: ${values.length}`
    );
  }
  for (let i = 0; i < values.length; i++) {
    assertFinite(values[i], `Vector element at index ${i}`);
  }
}

/**
 * Validates 3D coordinate components according to the specified domain.
 * CANONICAL_SPATIAL_343 delegates strictly to src/core/address369.ts.
 */
export function assertCoordinate(
  x: number,
  y: number,
  z: number,
  domain: CoordinateDomain,
  customBounds?: CoordinateDomainBounds
): void {
  assertFinite(x, 'Coordinate X');
  assertFinite(y, 'Coordinate Y');
  assertFinite(z, 'Coordinate Z');

  if (domain === 'CANONICAL_SPATIAL_343') {
    // Delegate spatial coordinate bounds strictly to canonical spatial authority
    try {
      validateCoordinate(x, y, z);
    } catch (err) {
      throw new NativeMathValidationError(
        `Canonical 343 spatial coordinate out of bounds [0..6]: (${x}, ${y}, ${z})`
      );
    }
  } else if (domain === 'NORMALIZED_UNIT') {
    assertNormalized(x, 'Coordinate X');
    assertNormalized(y, 'Coordinate Y');
    assertNormalized(z, 'Coordinate Z');
  } else if (domain === 'BOUNDED_CARTESIAN') {
    if (!customBounds) {
      throw new NativeMathValidationError('BOUNDED_CARTESIAN domain requires explicit customBounds');
    }
    if (x < customBounds.minX || x > customBounds.maxX) {
      throw new NativeMathValidationError(
        `Coordinate X out of bounded domain [${customBounds.minX}..${customBounds.maxX}]: ${x}`
      );
    }
    if (y < customBounds.minY || y > customBounds.maxY) {
      throw new NativeMathValidationError(
        `Coordinate Y out of bounded domain [${customBounds.minY}..${customBounds.maxY}]: ${y}`
      );
    }
    if (z < customBounds.minZ || z > customBounds.maxZ) {
      throw new NativeMathValidationError(
        `Coordinate Z out of bounded domain [${customBounds.minZ}..${customBounds.maxZ}]: ${z}`
      );
    }
  }
}

/**
 * Validates probability distribution vector:
 * 1. Each probability p_i >= 0.0
 * 2. Total sum sum(p_i) ≈ 1.0 within numerical tolerance
 */
export function assertProbabilityDistribution(
  probabilities: readonly number[],
  tolerance = DEFAULT_PROBABILITY_TOLERANCE
): number {
  if (!Array.isArray(probabilities) || probabilities.length === 0) {
    throw new NativeMathValidationError('Probability distribution must be a non-empty array.');
  }

  let sum = 0;
  for (let i = 0; i < probabilities.length; i++) {
    const p = probabilities[i];
    assertFinite(p, `Probability element at index ${i}`);
    if (p < 0.0) {
      throw new NativeMathValidationError(
        `Probability at index ${i} must be non-negative. Received: ${p}`
      );
    }
    sum += p;
  }

  if (Math.abs(sum - 1.0) > tolerance) {
    throw new NativeMathValidationError(
      `Probability distribution must sum to 1.0 within tolerance ${tolerance}. Actual sum: ${sum}`
    );
  }

  return sum;
}
