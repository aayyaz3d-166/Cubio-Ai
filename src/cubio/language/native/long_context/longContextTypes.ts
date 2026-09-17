/**
 * CUBiO AI — Phase 6: Task 79
 * Long-Context Memory Integration Layer
 * src/cubio/language/native/long_context/longContextTypes.ts
 *
 * Universal type contracts, configurations, domain errors, and interfaces
 * for sovereign reference-based long-term memory retrieval, selective caching,
 * and bounded context injection.
 */

import { CanonicalDomain, DEFAULT_TENANT_ID } from '../../../core/canonicalIdentity';
import { EpistemicStatus } from '../../../epistemic/native/epistemicTypes';
import { LanguageRepresentationError } from '../languageTypes';

// =============================================================================
// DOMAIN ERRORS
// =============================================================================

export class LongContextError extends LanguageRepresentationError {
  constructor(message: string, code = 'LONG_CONTEXT_ERROR') {
    super(message, code);
    this.name = 'LongContextError';
  }
}

export class StaleMemoryReferenceError extends LongContextError {
  public readonly objectId: string;
  public readonly expectedVersion: number;
  public readonly actualVersion: number;

  constructor(objectId: string, expectedVersion: number, actualVersion: number) {
    super(
      `Stale memory reference detected for objectId "${objectId}": reference version ${expectedVersion} vs store version ${actualVersion}`,
      'STALE_MEMORY_REFERENCE'
    );
    this.name = 'StaleMemoryReferenceError';
    this.objectId = objectId;
    this.expectedVersion = expectedVersion;
    this.actualVersion = actualVersion;
  }
}

export class UnauthorizedMemoryAccessError extends LongContextError {
  public readonly objectId: string;
  public readonly requestedTenant: string;
  public readonly ownerTenant: string;

  constructor(objectId: string, requestedTenant: string, ownerTenant: string) {
    super(
      `Cross-tenant memory access rejected for objectId "${objectId}". Owner tenant: "${ownerTenant}", Requested tenant: "${requestedTenant}"`,
      'UNAUTHORIZED_MEMORY_ACCESS'
    );
    this.name = 'UnauthorizedMemoryAccessError';
    this.objectId = objectId;
    this.requestedTenant = requestedTenant;
    this.ownerTenant = ownerTenant;
  }
}

export class ConflictingMemoryReferenceError extends LongContextError {
  public readonly conflictDetails: readonly MemoryConflictDetail[];

  constructor(details: readonly MemoryConflictDetail[]) {
    const summary = details.map((d) => `[${d.refA.objectId} vs ${d.refB.objectId}]: ${d.reason}`).join('; ');
    super(
      `Conflicting memory references detected without resolution: ${summary}`,
      'CONFLICTING_MEMORY_REFERENCES'
    );
    this.name = 'ConflictingMemoryReferenceError';
    this.conflictDetails = details;
  }
}

export class LongContextBudgetExceededError extends LongContextError {
  constructor(message: string) {
    super(message, 'LONG_CONTEXT_BUDGET_EXCEEDED');
    this.name = 'LongContextBudgetExceededError';
  }
}

// =============================================================================
// CONFIGURATION CONTRACTS
// =============================================================================

export interface LongContextMemoryConfig {
  /** Maximum number of memory references injected into active window (strictly bounded) */
  readonly maxInjectedReferences: number;
  /** Maximum allowable byte size of injected memory references block */
  readonly maxReferenceBytes: number;
  /** Minimum relevance score threshold to qualify for context injection [0.0..1.0] */
  readonly relevanceThreshold: number;
  /** Bounded capacity for selective LRU materialized cache */
  readonly cacheCapacity: number;
  /** Eviction policy for materialized cache */
  readonly evictionPolicy: 'LRU';
  /** Whether out-of-window referrals are enabled */
  readonly allowMemoryReferral: boolean;
}

export const DEFAULT_LONG_CONTEXT_CONFIG: LongContextMemoryConfig = Object.freeze({
  maxInjectedReferences: 8,
  maxReferenceBytes: 4096,
  relevanceThreshold: 0.40,
  cacheCapacity: 16,
  evictionPolicy: 'LRU',
  allowMemoryReferral: true,
});

// =============================================================================
// MEMORY REFERENCE & RELEVANCE CONTRACTS
// =============================================================================

export interface InjectedMemoryReference {
  readonly referenceId: string;
  readonly objectId: string;
  readonly tenantId: string;
  readonly domain: CanonicalDomain;
  readonly checksum: string;
  readonly stateVersion: number;
  readonly epistemicStatus: EpistemicStatus;
  readonly relevanceScore: number;
  readonly isRememberedFact: boolean;
  readonly isInferredContent: boolean;
  readonly provenanceId?: string;
  readonly summaryText: string;
  readonly spatialCellId?: number;
  readonly subject?: string;
  readonly assertionValue?: string;
  readonly timestamp: number;
}

export interface MemoryConflictDetail {
  readonly refA: InjectedMemoryReference;
  readonly refB: InjectedMemoryReference;
  readonly subject: string;
  readonly reason: string;
}

export interface LongContextSearchResult {
  readonly queryText: string;
  readonly tenantId: string;
  readonly rankedReferences: readonly InjectedMemoryReference[];
  readonly injectedTokenCount: number;
  readonly retrievalLatencyMs: number;
  readonly conflictsDetected: readonly MemoryConflictDetail[];
  readonly staleReferencesDetected: readonly InjectedMemoryReference[];
}

export interface LongContextSnapshot {
  readonly snapshotId: string;
  readonly tenantId: string;
  readonly injectedReferences: readonly InjectedMemoryReference[];
  readonly cacheKeys: readonly string[];
  readonly stateVersion: number;
  readonly checksum: string;
  readonly timestamp: number;
}

export interface LRUCacheStats {
  readonly size: number;
  readonly capacity: number;
  readonly hits: number;
  readonly misses: number;
  readonly evictions: number;
}
