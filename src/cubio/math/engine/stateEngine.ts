/**
 * CUBiO AI — Task 21: Deterministic Mathematical State Engine
 * Phase 1 — Mathematical Core
 * src/cubio/math/engine/stateEngine.ts
 *
 * Lightweight, native, deterministic mathematical state engine.
 *
 * GUARANTEES:
 * 1. State as an explicit, validated, immutable mathematical value (Object.freeze).
 * 2. Pure state transitions: same (state, op) always produces bit-exact identical output.
 * 3. Cryptographic hash chain: each transition links parentChecksum to previous checksum.
 * 4. Stale state detection via explicit monotonically increasing version numbering.
 * 5. Strict fail-closed validation: NaN, Infinity, malformed inputs rejected immediately.
 * 6. Sparse, on-demand memory footprint: zero dense pre-allocation.
 * 7. Zero dependencies on external models, training loops, or duplicated spatial authorities.
 */

import { NativeMathValue } from '../types';
import { NativeMathValidationError, assertFinite } from '../validation';
import { computeMathChecksum } from '../checksum';
import { assertTritSymbol } from '../ternary';
import {
  mapCoordinateToSpatial,
  mapCellIdToSpatial,
  mapAddress369ToSpatial,
} from '../spatial';

/**
 * Asserts that a symbol string contains only valid 369 symbols ('3', '6', '9').
 */
function validate369Stream(symbols: string): void {
  if (typeof symbols !== 'string') {
    throw new NativeMathValidationError(`Symbols must be a string. Received: ${typeof symbols}`);
  }
  for (let i = 0; i < symbols.length; i++) {
    try {
      assertTritSymbol(symbols[i], `Symbol at index ${i}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new NativeMathValidationError(msg);
    }
  }
}

import {
  DeterministicState,
  StateOperation,
  TransitionOptions,
  InitialStateOptions,
  StateComparisonResult,
} from './types';

/**
 * Computes the deterministic SHA-256 integrity digest for a state payload.
 */
export function computeStateChecksum(payload: {
  readonly stateId: string;
  readonly version: number;
  readonly stepIndex: number;
  readonly values: Readonly<Record<string, NativeMathValue>>;
  readonly spatialRefChecksum?: string | null;
  readonly symbols?: string | null;
  readonly parentChecksum?: string | null;
}): string {
  // Extract sorted keys and map to child checksums for canonical determinism
  const sortedValueChecksums: Record<string, string> = {};
  const keys = Object.keys(payload.values).sort();
  for (const k of keys) {
    sortedValueChecksums[k] = payload.values[k].checksum;
  }

  const canonicalPayload = {
    mathType: 'DETERMINISTIC_STATE' as const,
    stateId: payload.stateId,
    version: payload.version,
    stepIndex: payload.stepIndex,
    values: sortedValueChecksums,
    spatialRefChecksum: payload.spatialRefChecksum ?? null,
    symbols: payload.symbols ?? null,
    parentChecksum: payload.parentChecksum ?? null,
  };

  return computeMathChecksum(canonicalPayload);
}

/**
 * Validates that a version or stepIndex number is a valid non-negative integer.
 */
function assertNonNegativeInteger(value: number, fieldName: string): void {
  assertFinite(value, fieldName);
  if (!Number.isInteger(value) || value < 0) {
    throw new NativeMathValidationError(
      `${fieldName} must be a non-negative integer (>= 0). Received: ${value}`
    );
  }
}

/**
 * Validates that state values are proper NativeMathValue instances.
 */
function validateValuesMap(values: Readonly<Record<string, NativeMathValue>>): Record<string, NativeMathValue> {
  if (!values || typeof values !== 'object') {
    throw new NativeMathValidationError('State values must be an object map');
  }
  const validated: Record<string, NativeMathValue> = {};
  for (const key of Object.keys(values)) {
    if (typeof key !== 'string' || key.trim().length === 0) {
      throw new NativeMathValidationError('State value key must be a non-empty string');
    }
    const val = values[key];
    if (!val || typeof val !== 'object' || typeof val.mathType !== 'string' || typeof val.checksum !== 'string') {
      throw new NativeMathValidationError(`Invalid NativeMathValue at key "${key}"`);
    }
    // Verify cryptographic integrity of the child value
    const recomputedChild = computeMathChecksum(val as unknown as Record<string, unknown>);
    if (recomputedChild !== val.checksum) {
      throw new NativeMathValidationError(
        `Child NativeMathValue at key "${key}" failed integrity check: checksum mismatch (expected "${val.checksum}", computed "${recomputedChild}")`
      );
    }
    validated[key] = val;
  }
  return validated;
}

/**
 * Creates an immutable initial (genesis) deterministic state.
 */
export function createInitialState(
  stateId: string,
  options?: InitialStateOptions
): DeterministicState {
  if (!stateId || typeof stateId !== 'string' || stateId.trim().length === 0) {
    throw new NativeMathValidationError('State ID must be a non-empty string');
  }

  const cleanStateId = stateId.trim();
  const version = options?.version ?? 0;
  const stepIndex = options?.stepIndex ?? 0;

  assertNonNegativeInteger(version, 'Initial state version');
  assertNonNegativeInteger(stepIndex, 'Initial state stepIndex');

  const rawValues = options?.values ?? {};
  const cleanValues = Object.freeze(validateValuesMap(rawValues));

  if (options?.symbols !== undefined) {
    validate369Stream(options.symbols);
  }

  const checksum = computeStateChecksum({
    stateId: cleanStateId,
    version,
    stepIndex,
    values: cleanValues,
    spatialRefChecksum: options?.spatialRef?.checksum,
    symbols: options?.symbols,
    parentChecksum: options?.parentChecksum,
  });

  return Object.freeze({
    mathType: 'DETERMINISTIC_STATE',
    stateId: cleanStateId,
    version,
    stepIndex,
    values: cleanValues,
    ...(options?.spatialRef ? { spatialRef: options.spatialRef } : {}),
    ...(options?.symbols !== undefined ? { symbols: options.symbols } : {}),
    ...(options?.parentChecksum ? { parentChecksum: options.parentChecksum } : {}),
    checksum,
  });
}

/**
 * Asserts that the current state matches the expected version.
 * Throws NativeMathValidationError if stale state is detected.
 */
export function assertStateFresh(current: DeterministicState, expectedVersion: number): void {
  if (current.version !== expectedVersion) {
    throw new NativeMathValidationError(
      `Stale state detected: expected version ${expectedVersion}, but state "${current.stateId}" is at version ${current.version}`
    );
  }
}

/**
 * Verifies that the internal SHA-256 checksum matches the canonical recalculation.
 */
export function verifyStateIntegrity(state: DeterministicState): boolean {
  if (!state || state.mathType !== 'DETERMINISTIC_STATE' || typeof state.checksum !== 'string') {
    return false;
  }
  const recomputed = computeStateChecksum({
    stateId: state.stateId,
    version: state.version,
    stepIndex: state.stepIndex,
    values: state.values,
    spatialRefChecksum: state.spatialRef?.checksum,
    symbols: state.symbols,
    parentChecksum: state.parentChecksum,
  });
  return recomputed === state.checksum;
}

/**
 * Pure function applying a single deterministic operation to a state snapshot.
 * Produces a brand-new frozen state with:
 * - incremented version (version + 1)
 * - incremented stepIndex (stepIndex + 1)
 * - parentChecksum bound to previous state.checksum
 * - strictly recomputed canonical checksum
 */
export function applyTransition(
  state: DeterministicState,
  op: StateOperation,
  options?: TransitionOptions
): DeterministicState {
  if (!state || state.mathType !== 'DETERMINISTIC_STATE') {
    throw new NativeMathValidationError('Invalid state provided to applyTransition');
  }

  // Enforce state integrity before transition
  if (!verifyStateIntegrity(state)) {
    throw new NativeMathValidationError(`State integrity violation on state "${state.stateId}" (v${state.version})`);
  }

  // Stale state prevention
  if (options?.expectedVersion !== undefined) {
    assertStateFresh(state, options.expectedVersion);
  }

  const nextStateId = options?.targetStateId?.trim() || state.stateId;
  const nextVersion = state.version + 1;
  const nextStepIndex = state.stepIndex + 1;
  const parentChecksum = state.checksum;

  let nextValues = { ...state.values };
  let nextSpatialRef = state.spatialRef;
  let nextSymbols = state.symbols;

  switch (op.type) {
    case 'SET_VALUE': {
      if (!op.key || typeof op.key !== 'string' || op.key.trim().length === 0) {
        throw new NativeMathValidationError('Operation SET_VALUE requires non-empty string key');
      }
      if (!op.value || typeof op.value !== 'object' || typeof op.value.mathType !== 'string') {
        throw new NativeMathValidationError(`Operation SET_VALUE requires valid NativeMathValue at key "${op.key}"`);
      }
      nextValues[op.key.trim()] = op.value;
      break;
    }

    case 'REMOVE_VALUE': {
      if (!op.key || typeof op.key !== 'string') {
        throw new NativeMathValidationError('Operation REMOVE_VALUE requires string key');
      }
      delete nextValues[op.key.trim()];
      break;
    }

    case 'SET_SPATIAL_COORDINATE': {
      nextSpatialRef = mapCoordinateToSpatial(op.x, op.y, op.z);
      break;
    }

    case 'SET_SPATIAL_CELL': {
      nextSpatialRef = mapCellIdToSpatial(op.cellId);
      break;
    }

    case 'SET_SPATIAL_ADDRESS': {
      nextSpatialRef = mapAddress369ToSpatial(op.address369);
      break;
    }

    case 'CLEAR_SPATIAL': {
      nextSpatialRef = undefined;
      break;
    }

    case 'SET_SYMBOLS': {
      validate369Stream(op.symbols);
      nextSymbols = op.symbols;
      break;
    }

    case 'APPEND_SYMBOLS': {
      validate369Stream(op.symbols);
      nextSymbols = (state.symbols ?? '') + op.symbols;
      break;
    }

    case 'BATCH': {
      return applyBatchTransitions(state, op.operations, options);
    }

    default: {
      const exhaustiveCheck: never = op;
      throw new NativeMathValidationError(`Unsupported operation type: ${JSON.stringify(exhaustiveCheck)}`);
    }
  }

  const frozenValues = Object.freeze(nextValues);
  const checksum = computeStateChecksum({
    stateId: nextStateId,
    version: nextVersion,
    stepIndex: nextStepIndex,
    values: frozenValues,
    spatialRefChecksum: nextSpatialRef?.checksum,
    symbols: nextSymbols,
    parentChecksum,
  });

  return Object.freeze({
    mathType: 'DETERMINISTIC_STATE',
    stateId: nextStateId,
    version: nextVersion,
    stepIndex: nextStepIndex,
    values: frozenValues,
    ...(nextSpatialRef ? { spatialRef: nextSpatialRef } : {}),
    ...(nextSymbols !== undefined ? { symbols: nextSymbols } : {}),
    parentChecksum,
    checksum,
  });
}

/**
 * Applies a batch of operations sequentially and deterministically.
 */
export function applyBatchTransitions(
  state: DeterministicState,
  ops: readonly StateOperation[],
  options?: TransitionOptions
): DeterministicState {
  if (!Array.isArray(ops)) {
    throw new NativeMathValidationError('Batch operations must be an array');
  }

  if (ops.length === 0) {
    return state;
  }

  let currentState = state;
  // Enforce expectedVersion on initial batch entry
  if (options?.expectedVersion !== undefined) {
    assertStateFresh(currentState, options.expectedVersion);
  }

  for (let i = 0; i < ops.length; i++) {
    const op = ops[i];
    currentState = applyTransition(currentState, op, {
      targetStateId: options?.targetStateId,
    });
  }

  return currentState;
}

/**
 * Compares two state snapshots and produces an exact differential report.
 */
export function compareStates(
  a: DeterministicState,
  b: DeterministicState
): StateComparisonResult {
  if (!a || !b || a.mathType !== 'DETERMINISTIC_STATE' || b.mathType !== 'DETERMINISTIC_STATE') {
    throw new NativeMathValidationError('Both arguments to compareStates must be valid DeterministicState objects');
  }

  const identical = a.checksum === b.checksum;
  const versionDelta = b.version - a.version;
  const stepIndexDelta = b.stepIndex - a.stepIndex;

  const isDirectSuccessor =
    b.version === a.version + 1 &&
    b.parentChecksum === a.checksum;

  const aKeyList = Object.keys(a.values);
  const bKeyList = Object.keys(b.values);
  const aKeys = new Set(aKeyList);
  const bKeys = new Set(bKeyList);

  const modifiedKeys: string[] = [];
  const addedKeys: string[] = [];
  const removedKeys: string[] = [];

  for (let i = 0; i < bKeyList.length; i++) {
    const k = bKeyList[i];
    if (!aKeys.has(k)) {
      addedKeys.push(k);
    } else if (a.values[k].checksum !== b.values[k].checksum) {
      modifiedKeys.push(k);
    }
  }

  for (let i = 0; i < aKeyList.length; i++) {
    const k = aKeyList[i];
    if (!bKeys.has(k)) {
      removedKeys.push(k);
    }
  }

  const spatialChanged = a.spatialRef?.checksum !== b.spatialRef?.checksum;
  const symbolsChanged = a.symbols !== b.symbols;

  return Object.freeze({
    identical,
    versionDelta,
    stepIndexDelta,
    modifiedKeys: Object.freeze(modifiedKeys.sort()),
    addedKeys: Object.freeze(addedKeys.sort()),
    removedKeys: Object.freeze(removedKeys.sort()),
    spatialChanged,
    symbolsChanged,
    isDirectSuccessor,
  });
}

/**
 * Serializes a DeterministicState into a canonical, deterministically ordered JSON string.
 */
export function serializeState(state: DeterministicState): string {
  if (!state || state.mathType !== 'DETERMINISTIC_STATE') {
    throw new NativeMathValidationError('Invalid state provided to serializeState');
  }
  if (!verifyStateIntegrity(state)) {
    throw new NativeMathValidationError('Cannot serialize state: integrity check failed');
  }

  const sortedValues: Record<string, NativeMathValue> = {};
  for (const k of Object.keys(state.values).sort()) {
    sortedValues[k] = state.values[k];
  }

  const dto = {
    mathType: 'DETERMINISTIC_STATE',
    stateId: state.stateId,
    version: state.version,
    stepIndex: state.stepIndex,
    values: sortedValues,
    spatialRef: state.spatialRef ?? null,
    symbols: state.symbols ?? null,
    parentChecksum: state.parentChecksum ?? null,
    checksum: state.checksum,
  };

  return JSON.stringify(dto, null, 2);
}

/**
 * Deserializes a canonical JSON string into a validated, frozen DeterministicState.
 * Validates integrity: recomputes checksum and rejects tampered payloads.
 */
export function deserializeState(serialized: string): DeterministicState {
  if (typeof serialized !== 'string' || serialized.trim().length === 0) {
    throw new NativeMathValidationError('Serialized state payload must be a non-empty string');
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(serialized);
  } catch (err) {
    throw new NativeMathValidationError(`JSON parse error during state deserialization: ${String(err)}`);
  }

  if (parsed.mathType !== 'DETERMINISTIC_STATE') {
    throw new NativeMathValidationError(`Invalid mathType for deserialized state: ${parsed.mathType}`);
  }

  const stateId = parsed.stateId as string;
  const version = parsed.version as number;
  const stepIndex = parsed.stepIndex as number;
  const rawValues = (parsed.values ?? {}) as Record<string, NativeMathValue>;
  const rawSpatial = parsed.spatialRef as DeterministicState['spatialRef'] | null;
  const rawSymbols = parsed.symbols as string | null;
  const parentChecksum = (parsed.parentChecksum as string | null) ?? undefined;
  const expectedChecksum = parsed.checksum as string;

  assertNonNegativeInteger(version, 'Deserialized state version');
  assertNonNegativeInteger(stepIndex, 'Deserialized state stepIndex');

  const cleanValues = Object.freeze(validateValuesMap(rawValues));

  if (rawSymbols !== null && rawSymbols !== undefined) {
    validate369Stream(rawSymbols);
  }

  const recomputedChecksum = computeStateChecksum({
    stateId,
    version,
    stepIndex,
    values: cleanValues,
    spatialRefChecksum: rawSpatial?.checksum,
    symbols: rawSymbols ?? undefined,
    parentChecksum,
  });

  if (recomputedChecksum !== expectedChecksum) {
    throw new NativeMathValidationError(
      `State deserialization integrity mismatch: expected checksum "${expectedChecksum}", recomputed "${recomputedChecksum}"`
    );
  }

  return Object.freeze({
    mathType: 'DETERMINISTIC_STATE',
    stateId,
    version,
    stepIndex,
    values: cleanValues,
    ...(rawSpatial ? { spatialRef: rawSpatial } : {}),
    ...(rawSymbols !== null && rawSymbols !== undefined ? { symbols: rawSymbols } : {}),
    ...(parentChecksum ? { parentChecksum } : {}),
    checksum: recomputedChecksum,
  });
}
