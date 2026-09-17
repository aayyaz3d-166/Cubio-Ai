/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F46: Dimensional State Model
 *
 * Formal dimensional state transformations across levels D0 through D8+.
 * Computational / state abstraction levels with explicit bidirectional transforms.
 */

import { deterministicHash } from '../../state/determinism';
import {
  DimensionalState,
  DimensionalStateLevel,
  DimensionalTransformation,
} from './universalTypes';

export const DIMENSION_ORDER: readonly DimensionalStateLevel[] = Object.freeze([
  'D0_RAW_INPUT',
  'D1_TOKEN_SIGNAL',
  'D2_STRUCTURED_DATA',
  'D3_SEMANTIC_SPATIAL',
  'D4_RELATIONSHIP',
  'D5_REASONING',
  'D6_WORKFLOW_AGENT',
  'D7_PROJECT',
  'D8_META_CROSS_DOMAIN',
]);

/**
 * Encodes arbitrary data to a specific dimensional state level.
 */
export function encodeToDimension(
  data: Readonly<Record<string, unknown>>,
  targetLevel: DimensionalStateLevel
): DimensionalState {
  const jsonStr = JSON.stringify(data);
  const checksum = deterministicHash(`${targetLevel}:${jsonStr}`);
  const stateId = `DSTATE_${targetLevel}_${checksum.slice(2, 12)}`;

  return Object.freeze({
    stateId,
    level: targetLevel,
    data: Object.freeze({ ...data }),
    timestamp: Date.now(),
    checksum,
  });
}

/**
 * Projects a dimensional state down to a target level.
 */
export function projectFromDimension(
  state: DimensionalState,
  targetLevel: DimensionalStateLevel
): DimensionalState {
  return encodeToDimension(state.data, targetLevel);
}

/**
 * Lifts a dimensional state by one level.
 */
export function liftState(state: DimensionalState): DimensionalState {
  const idx = DIMENSION_ORDER.indexOf(state.level);
  if (idx < 0) throw new Error(`Invalid dimension level: ${state.level}`);
  if (idx === DIMENSION_ORDER.length - 1) return state;

  const nextLevel = DIMENSION_ORDER[idx + 1];
  return encodeToDimension(state.data, nextLevel);
}

/**
 * Reduces a dimensional state by one level.
 */
export function reduceState(state: DimensionalState): DimensionalState {
  const idx = DIMENSION_ORDER.indexOf(state.level);
  if (idx < 0) throw new Error(`Invalid dimension level: ${state.level}`);
  if (idx === 0) return state;

  const prevLevel = DIMENSION_ORDER[idx - 1];
  return encodeToDimension(state.data, prevLevel);
}

/**
 * Explicit state transformation with formal schema and verification.
 */
export function transformState(
  state: DimensionalState,
  sourceDim: DimensionalStateLevel,
  targetDim: DimensionalStateLevel
): DimensionalTransformation & { readonly result: DimensionalState } {
  if (state.level !== sourceDim) {
    throw new Error(`State level ${state.level} does not match source dimension ${sourceDim}`);
  }

  const isValid = verifyState(state);
  const result = encodeToDimension(state.data, targetDim);
  const transformId = `TX_${sourceDim}_${targetDim}_${state.checksum.slice(2, 10)}`;

  const transformation: DimensionalTransformation = Object.freeze({
    transformId,
    sourceDimension: sourceDim,
    targetDimension: targetDim,
    inputSchema: `schema:${sourceDim}`,
    outputSchema: `schema:${targetDim}`,
    transformationIdentity: `transform:${sourceDim}->${targetDim}`,
    verificationStatus: isValid ? ('VERIFIED' as const) : ('FAILED' as const),
  });

  return Object.freeze({
    ...transformation,
    result,
  });
}

/**
 * Verifies the integrity of a dimensional state.
 */
export function verifyState(state: DimensionalState): boolean {
  const jsonStr = JSON.stringify(state.data);
  const expectedChecksum = deterministicHash(`${state.level}:${jsonStr}`);
  return state.checksum === expectedChecksum;
}
