/**
 * CUBiO AI — Task 190: Native Long-Term Knowledge Memory
 * src/cubio/model/native_long_term_knowledge_memory/types.ts
 *
 * Types, tier definitions, reference interfaces, and error classes
 * for Native Long-Term Knowledge Memory spanning L1 to L4.
 *
 * STRICT INVARIANTS:
 * 1. Hardware Actuation Lockout: IS_ACTUATION_BLOCKED === true permanently.
 * 2. VDB Primacy: VDB is sole persistent authority; .3dmemory is transport only.
 * 3. Zero Redundant Payloads: Canonical knowledge stored once in L4 VDB.
 * 4. Deterministic Epistemic Eviction: Logical ticks, epistemic preservation, pinned immunity.
 * 5. Determinism: Zero foreign libraries, zero non-deterministic timestamps in hash digests.
 */

import {
  KnowledgeEpistemicStatus,
} from '../native_knowledge_architecture/types';

export const TASK_190_ID = 'CUBIO-TASK-190-LONG-TERM-KNOWLEDGE-MEMORY';
export const IS_ACTUATION_BLOCKED = true;

/**
 * Hierarchical memory tiers for knowledge.
 */
export const KnowledgeMemoryTier = {
  L1_LOCAL: 'L1_LOCAL',                 // Active materialized token payload in RAM
  L2_SESSION: 'L2_SESSION',             // Session reference working set
  L3_LONG_TERM: 'L3_LONG_TERM',         // Cross-session persistent thematic references
  L4_CANONICAL_VDB: 'L4_CANONICAL_VDB', // Primary VDB authoritative persistence
} as const;

export type KnowledgeMemoryTier = (typeof KnowledgeMemoryTier)[keyof typeof KnowledgeMemoryTier];

/**
 * Lightweight cross-tier knowledge reference descriptor.
 */
export interface KnowledgeMemoryReference {
  readonly referenceId: string;
  readonly objectId: string;
  readonly objectType: 'ENTITY' | 'CONCEPT' | 'FACT' | 'RELATIONSHIP' | 'EVIDENCE';
  readonly tier: KnowledgeMemoryTier;
  readonly tenantId: string;
  readonly label: string;
  readonly address369: number;
  readonly cellId343?: number;
  readonly checksum: string;             // Canonical SHA-256
  readonly stateVersion: number;         // OCC version
  readonly epistemicStatus: KnowledgeEpistemicStatus;
  readonly accessCount: number;
  readonly lastAccessTick: number;       // Deterministic logical sequence counter
  readonly isPinned: boolean;            // Pinned items immune from eviction
  readonly provenanceSummary: string;
}

/**
 * Materialized entry in L1 Local cache.
 */
export interface L1MaterializedPayload {
  readonly referenceId: string;
  readonly objectId: string;
  readonly tenantId: string;
  readonly payload: Record<string, unknown>;
  readonly materializedTick: number;
  readonly checksumValid: boolean;
  readonly occVerified: boolean;
}

/**
 * Tier capacity limits to prevent memory exhaustion.
 */
export interface TierCapacityConfig {
  readonly l1Capacity?: number;          // Default 16, max 64
  readonly l2Capacity?: number;          // Default 64, max 256
  readonly l3Capacity?: number;          // Default 128, max 512
}

/**
 * Real-time memory tier statistics.
 */
export interface KnowledgeTierStats {
  readonly tenantId: string;
  readonly l1Count: number;
  readonly l2Count: number;
  readonly l3Count: number;
  readonly l4VdbCount: number;
  readonly totalCacheHits: number;
  readonly totalCacheMisses: number;
  readonly totalEvictions: number;
}

/**
 * Error classes for Long-Term Knowledge Memory.
 */
export class KnowledgeTierCapacityError extends Error {
  constructor(tier: KnowledgeMemoryTier, count: number, maxCapacity: number) {
    super(
      `[KnowledgeTierCapacityError] Capacity limit exceeded in tier ${tier}: attempted ${count}, maximum capacity is ${maxCapacity}.`
    );
    this.name = 'KnowledgeTierCapacityError';
  }
}

export class KnowledgeMemoryTenantViolationError extends Error {
  constructor(callerTenant: string, targetTenant: string) {
    super(
      `[KnowledgeMemoryTenantViolationError] Cross-tenant long-term memory access rejected: caller "${callerTenant}" cannot access target "${targetTenant}".`
    );
    this.name = 'KnowledgeMemoryTenantViolationError';
  }
}

export class KnowledgeMemoryActuationBlockedError extends Error {
  constructor(directive: string) {
    super(
      `[KnowledgeMemoryActuationBlockedError] Hardware actuation directive "${directive}" detected. Permanently rejected fail-closed.`
    );
    this.name = 'KnowledgeMemoryActuationBlockedError';
  }
}
