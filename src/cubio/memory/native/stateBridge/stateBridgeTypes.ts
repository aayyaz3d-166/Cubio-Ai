/**
 * CUBiO AI — Task 30: Native Memory ↔ Mathematical State Integration
 * Phase 2 — Native Memory
 * src/cubio/memory/native/stateBridge/stateBridgeTypes.ts
 *
 * Types, interfaces, and data structures bridging Phase 1 Deterministic
 * Mathematical State Engine with Phase 2 Native Sparse Memory.
 *
 * CORE PRINCIPLES:
 * 1. Single State Authority: Directly references DeterministicState without duplication.
 * 2. Exact Round-Trip Fidelity: state -> memory -> state preservation.
 * 3. Dual-Layer Lineage: Tracks state hash chain and memory record hash chain in lockstep.
 * 4. Stale State & Concurrency Defense: Detects mismatched versions on restoration and mutation.
 * 5. Fail-Closed Integrity: Corrupted mathematical states rejected immediately.
 * 6. Sparse On-Demand: Zero dense allocation of state or spatial space.
 * 7. Zero Foreign ML Dependencies: Strictly zero external model imports; zero model training.
 */

import { CanonicalDomain } from '../../../core/canonicalIdentity';
import { DeterministicState } from '../../../math/engine/types';
import { NativeMemoryRecord } from '../types';

/**
 * Immutable bidirectional binding linking a canonical memory record
 * with its underlying deterministic mathematical state.
 */
export interface StateMemoryBinding {
  readonly mathType: 'STATE_MEMORY_BINDING';
  /** Canonical entity objectId in sparse memory store */
  readonly objectId: string;
  /** Tenant isolation scope */
  readonly tenantId: string;
  /** Unique mathematical state identifier */
  readonly stateId: string;
  /** Monotonic state version (synchronized between state and memory record) */
  readonly stateVersion: number;
  /** Mathematical state step index counter */
  readonly stepIndex: number;
  /** Cryptographic SHA-256 digest of the mathematical state */
  readonly stateChecksum: string;
  /** Cryptographic SHA-256 digest of the enclosing memory record */
  readonly recordChecksum: string;
  /** Optional spatial lattice cell ID [0..342] */
  readonly cellId?: number;
  /** Optional spatial 369 address [26..368] derived strictly via address369.ts */
  readonly address369?: number;
  /** Binding creation timestamp */
  readonly timestamp: number;
}

/**
 * Configuration options for storing a deterministic state into native memory.
 */
export interface StateStoreOptions {
  /** Target tenant isolation scope (defaults to 'root') */
  readonly tenantId?: string;
  /** Architectural domain (defaults to 'SPATIAL_MEMORY') */
  readonly domain?: CanonicalDomain;
  /** Optional override for spatial cell ID [0..342], or null to unbind spatial reference */
  readonly cellId?: number | null;
  /** Content metadata tags */
  readonly tags?: readonly string[];
  /** Structured custom attributes */
  readonly attributes?: Readonly<Record<string, string | number | boolean>>;
  /** Descriptive human-readable label */
  readonly label?: string;
  /** Human-readable description */
  readonly description?: string;
}

/**
 * Options for restoring a deterministic mathematical state from native memory.
 */
export interface StateRestoreOptions {
  /** If true (default), cryptographically verifies record and state checksums */
  readonly verifyIntegrity?: boolean;
  /** Expected state version for optimistic concurrency / stale state detection */
  readonly expectedVersion?: number;
  /** Expected mathematical state checksum for tamper verification */
  readonly expectedChecksum?: string;
}

/**
 * Result of restoring a deterministic mathematical state from native memory.
 */
export interface StateRestoreResult {
  readonly success: boolean;
  /** Pristine, immutable Phase 1 DeterministicState snapshot */
  readonly state: DeterministicState;
  /** Bidirectional binding metadata */
  readonly binding: StateMemoryBinding;
  /** Underlying canonical NativeMemoryRecord */
  readonly record: NativeMemoryRecord;
  /** Whether the cryptographic state checksum and lineage are valid */
  readonly lineageValid: boolean;
}
