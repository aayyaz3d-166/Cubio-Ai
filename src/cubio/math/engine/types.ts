/**
 * CUBiO AI — Task 21: Deterministic Mathematical State Engine
 * Phase 1 — Mathematical Core
 * src/cubio/math/engine/types.ts
 *
 * Types and interfaces for the Deterministic Mathematical State Engine.
 * 
 * CORE PRINCIPLES:
 * 1. State as an explicit, immutable, validated mathematical value.
 * 2. Pure deterministic state transitions with cryptographic hash chaining.
 * 3. Strict fail-closed validation rejecting NaN, Infinity, and malformed inputs.
 * 4. Explicit versioning for stale state detection in future memory/model layers.
 * 5. Lightweight sparse storage: zero dense pre-allocation.
 */

import { NativeMathValue } from '../types';
import { Spatial343Mapping } from '../spatial/types';

/**
 * Immutable container representing an explicit mathematical state snapshot.
 */
export interface DeterministicState {
  readonly mathType: 'DETERMINISTIC_STATE';
  /** Unique state identifier */
  readonly stateId: string;
  /** Monotonically increasing non-negative integer version */
  readonly version: number;
  /** Transition step counter (0 for genesis/initial state) */
  readonly stepIndex: number;
  /** Sparse dictionary of explicit, validated NativeMathValue primitives */
  readonly values: Readonly<Record<string, NativeMathValue>>;
  /** Optional spatial position bound to canonical 343 lattice and 369 address space */
  readonly spatialRef?: Spatial343Mapping;
  /** Optional validated 369 ternary symbol stream */
  readonly symbols?: string;
  /** Cryptographic hash chain: SHA-256 of predecessor state (undefined for genesis) */
  readonly parentChecksum?: string;
  /** Canonical deterministic SHA-256 digest of this exact state */
  readonly checksum: string;
}

/** Operation to insert or replace a validated NativeMathValue */
export interface SetValueOp {
  readonly type: 'SET_VALUE';
  readonly key: string;
  readonly value: NativeMathValue;
}

/** Operation to remove a value by key */
export interface RemoveValueOp {
  readonly type: 'REMOVE_VALUE';
  readonly key: string;
}

/** Operation to bind spatial location via 3D coordinates (x, y, z) in [0..6] */
export interface SetSpatialCoordinateOp {
  readonly type: 'SET_SPATIAL_COORDINATE';
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

/** Operation to bind spatial location via linear cell ID in [0..342] */
export interface SetSpatialCellOp {
  readonly type: 'SET_SPATIAL_CELL';
  readonly cellId: number;
}

/** Operation to bind spatial location via 369 spatial address in [26..368] */
export interface SetSpatialAddressOp {
  readonly type: 'SET_SPATIAL_ADDRESS';
  readonly address369: number;
}

/** Operation to clear the spatial binding */
export interface ClearSpatialOp {
  readonly type: 'CLEAR_SPATIAL';
}

/** Operation to set the 369 ternary symbol stream */
export interface SetSymbolsOp {
  readonly type: 'SET_SYMBOLS';
  readonly symbols: string;
}

/** Operation to append to the 369 ternary symbol stream */
export interface AppendSymbolsOp {
  readonly type: 'APPEND_SYMBOLS';
  readonly symbols: string;
}

/** Atomic batch of operations applied in strict order */
export interface BatchOp {
  readonly type: 'BATCH';
  readonly operations: readonly StateOperation[];
}

/** Discriminated union of all deterministic state operations */
export type StateOperation =
  | SetValueOp
  | RemoveValueOp
  | SetSpatialCoordinateOp
  | SetSpatialCellOp
  | SetSpatialAddressOp
  | ClearSpatialOp
  | SetSymbolsOp
  | AppendSymbolsOp
  | BatchOp;

/** Configuration options for applying transitions */
export interface TransitionOptions {
  /** Enforces that state.version === expectedVersion. If mismatched, throws stale error */
  readonly expectedVersion?: number;
  /** Allows transitioning state to a new stateId if desired */
  readonly targetStateId?: string;
}

/** Configuration options when instantiating initial state */
export interface InitialStateOptions {
  readonly version?: number;
  readonly stepIndex?: number;
  readonly values?: Readonly<Record<string, NativeMathValue>>;
  readonly spatialRef?: Spatial343Mapping;
  readonly symbols?: string;
  readonly parentChecksum?: string;
}

/** Structured comparison report between two states */
export interface StateComparisonResult {
  /** True if both states share the identical SHA-256 checksum */
  readonly identical: boolean;
  /** Numerical version difference: b.version - a.version */
  readonly versionDelta: number;
  /** Numerical step counter difference: b.stepIndex - a.stepIndex */
  readonly stepIndexDelta: number;
  /** Keys present in both states with differing checksums */
  readonly modifiedKeys: readonly string[];
  /** Keys present in b but absent in a */
  readonly addedKeys: readonly string[];
  /** Keys present in a but absent in b */
  readonly removedKeys: readonly string[];
  /** True if spatialRef changed between a and b */
  readonly spatialChanged: boolean;
  /** True if symbols changed between a and b */
  readonly symbolsChanged: boolean;
  /** True if b is a cryptographic direct successor of a */
  readonly isDirectSuccessor: boolean;
}
