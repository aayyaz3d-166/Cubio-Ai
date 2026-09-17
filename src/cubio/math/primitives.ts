/**
 * CUBiO AI — Task 17: Native Mathematical Representation Layer
 * Phase 1 — Mathematical Core
 * src/cubio/math/primitives.ts
 *
 * Sovereign, immutable factory primitives for deterministic mathematical values.
 * Every created object is deeply validated, assigned a deterministic SHA-256
 * checksum, and permanently frozen with Object.freeze().
 */

import { computeMathChecksum } from './checksum';
import {
  CoordinateDomain,
  CoordinateDomainBounds,
  DEFAULT_PROBABILITY_TOLERANCE,
  MAX_VECTOR_LENGTH,
  NativeMathCoordinate,
  NativeMathDistribution,
  NativeMathInteger,
  NativeMathMatrixMeta,
  NativeMathNormalized,
  NativeMathScalar,
  NativeMathState,
  NativeMathValue,
  NativeMathVector,
} from './types';
import {
  assertCoordinate,
  assertFinite,
  assertInteger,
  assertNormalized,
  assertProbabilityDistribution,
  assertVector,
  NativeMathValidationError,
} from './validation';

/**
 * Creates a validated, immutable NativeMathScalar.
 */
export function createScalar(value: number): NativeMathScalar {
  assertFinite(value, 'Scalar value');
  const normalizedVal = Object.is(value, -0) ? 0 : value;
  const payload = {
    mathType: 'SCALAR' as const,
    value: normalizedVal,
  };
  const checksum = computeMathChecksum(payload);
  return Object.freeze({
    ...payload,
    checksum,
  });
}

/**
 * Creates a validated, immutable NativeMathInteger.
 */
export function createInteger(value: number): NativeMathInteger {
  assertInteger(value, 'Integer value');
  const normalizedVal = Object.is(value, -0) ? 0 : value;
  const payload = {
    mathType: 'INTEGER' as const,
    value: normalizedVal,
  };
  const checksum = computeMathChecksum(payload);
  return Object.freeze({
    ...payload,
    checksum,
  });
}

/**
 * Creates a validated, immutable NativeMathNormalized scalar in [0.0, 1.0].
 */
export function createNormalized(
  value: number,
  rawValue?: number,
  scaleDomain?: number
): NativeMathNormalized {
  assertNormalized(value, 'Normalized value');
  if (rawValue !== undefined) {
    assertFinite(rawValue, 'Raw value');
  }
  if (scaleDomain !== undefined) {
    assertFinite(scaleDomain, 'Scale domain');
    if (scaleDomain <= 0) {
      throw new NativeMathValidationError(`Scale domain must be strictly positive. Received: ${scaleDomain}`);
    }
  }

  const payload: Record<string, unknown> = {
    mathType: 'NORMALIZED' as const,
    value: Object.is(value, -0) ? 0 : value,
  };
  if (rawValue !== undefined) payload.rawValue = rawValue;
  if (scaleDomain !== undefined) payload.scaleDomain = scaleDomain;

  const checksum = computeMathChecksum(payload);
  return Object.freeze({
    mathType: 'NORMALIZED',
    value: payload.value as number,
    ...(rawValue !== undefined ? { rawValue } : {}),
    ...(scaleDomain !== undefined ? { scaleDomain } : {}),
    checksum,
  });
}

/**
 * Normalizes a raw coordinate or value into [0.0, 1.0] using an explicit domain scale (e.g. 999).
 * Preserves the raw value and scale domain metadata without claiming universal mathematical significance.
 */
export function normalizeValue(rawValue: number, maxRange = 999): NativeMathNormalized {
  assertFinite(rawValue, 'Raw value to normalize');
  assertFinite(maxRange, 'Max range');
  if (maxRange <= 0) {
    throw new NativeMathValidationError(`Normalization maxRange must be positive. Received: ${maxRange}`);
  }
  if (rawValue < 0 || rawValue > maxRange) {
    throw new NativeMathValidationError(
      `Raw value ${rawValue} is outside the normalization range [0..${maxRange}]`
    );
  }
  const normalized = rawValue / maxRange;
  return createNormalized(normalized, rawValue, maxRange);
}

/**
 * Creates a validated, immutable NativeMathVector.
 * Makes a defensive frozen copy of the input array.
 */
export function createVector(
  values: readonly number[],
  maxLength = MAX_VECTOR_LENGTH
): NativeMathVector {
  assertVector(values, maxLength);
  const frozenValues = Object.freeze(values.map((v) => (Object.is(v, -0) ? 0 : v)));
  const payload = {
    mathType: 'VECTOR' as const,
    values: frozenValues,
    length: frozenValues.length,
  };
  const checksum = computeMathChecksum(payload);
  return Object.freeze({
    ...payload,
    checksum,
  });
}

/**
 * Creates a validated, immutable NativeMathCoordinate.
 * Domain 'CANONICAL_SPATIAL_343' enforces [0..6] on X, Y, Z via src/core/address369.ts.
 */
export function createCoordinate(
  x: number,
  y: number,
  z: number,
  domain: CoordinateDomain = 'CANONICAL_SPATIAL_343',
  customBounds?: CoordinateDomainBounds
): NativeMathCoordinate {
  assertCoordinate(x, y, z, domain, customBounds);
  const payload = {
    mathType: 'COORDINATE' as const,
    x: Object.is(x, -0) ? 0 : x,
    y: Object.is(y, -0) ? 0 : y,
    z: Object.is(z, -0) ? 0 : z,
    domain,
  };
  const checksum = computeMathChecksum(payload);
  return Object.freeze({
    ...payload,
    checksum,
  });
}

/**
 * Creates a validated, immutable NativeMathDistribution.
 */
export function createProbabilityDistribution(
  probabilities: readonly number[],
  tolerance = DEFAULT_PROBABILITY_TOLERANCE
): NativeMathDistribution {
  const sum = assertProbabilityDistribution(probabilities, tolerance);
  const frozenProbabilities = Object.freeze(
    probabilities.map((p) => (Object.is(p, -0) ? 0 : p))
  );
  const payload = {
    mathType: 'PROBABILITY_DISTRIBUTION' as const,
    probabilities: frozenProbabilities,
    sum: parseFloat(sum.toFixed(10)),
    tolerance,
  };
  const checksum = computeMathChecksum(payload);
  return Object.freeze({
    ...payload,
    checksum,
  });
}

/**
 * Creates a validated, immutable NativeMathMatrixMeta descriptor.
 */
export function createMatrixMetadata(
  rows: number,
  cols: number,
  format = 'FLOAT32'
): NativeMathMatrixMeta {
  assertInteger(rows, 'Matrix rows');
  assertInteger(cols, 'Matrix cols');
  if (rows <= 0 || cols <= 0) {
    throw new NativeMathValidationError(`Matrix dimensions must be strictly positive. Got: ${rows}x${cols}`);
  }
  const payload = {
    mathType: 'MATRIX_METADATA' as const,
    rows,
    cols,
    elementCount: rows * cols,
    isSquare: rows === cols,
    format,
  };
  const checksum = computeMathChecksum(payload);
  return Object.freeze({
    ...payload,
    checksum,
  });
}

/**
 * Creates an immutable, composite NativeMathState.
 */
export function createMathState(
  stateId: string,
  values: Readonly<Record<string, NativeMathValue>>
): NativeMathState {
  if (!stateId || typeof stateId !== 'string' || stateId.trim().length === 0) {
    throw new NativeMathValidationError('State ID must be a non-empty string');
  }
  if (!values || typeof values !== 'object') {
    throw new NativeMathValidationError('State values must be an object');
  }

  // Defensively copy and freeze child values
  const frozenValues: Record<string, NativeMathValue> = {};
  for (const key of Object.keys(values)) {
    const val = values[key];
    if (!val || typeof val !== 'object' || !('mathType' in val)) {
      throw new NativeMathValidationError(`Invalid NativeMathValue at key: ${key}`);
    }
    frozenValues[key] = val;
  }
  Object.freeze(frozenValues);

  const payload = {
    mathType: 'MATH_STATE' as const,
    stateId: stateId.trim(),
    values: frozenValues,
  };
  const checksum = computeMathChecksum(payload);
  return Object.freeze({
    ...payload,
    checksum,
  });
}
