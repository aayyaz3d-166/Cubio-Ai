/**
 * CUBiO AI — Phase 6: Task 76
 * Context Window & Sequence Learning Layer
 * src/cubio/language/native/contextTypes.ts
 *
 * Universal type contracts, configurations, and errors for native context windows,
 * out-of-window sparse memory referrals, and sequence state learning.
 */

import { CanonicalDomain, DEFAULT_TENANT_ID } from '../../core/canonicalIdentity';
import { EpistemicStatus } from '../../epistemic/native/epistemicTypes';
import { NativeToken, LanguageRepresentationError } from './languageTypes';

// =============================================================================
// STRUCTURED ERRORS
// =============================================================================

export class ContextOverflowBudgetError extends LanguageRepresentationError {
  constructor(message: string) {
    super(message, 'CONTEXT_OVERFLOW_BUDGET_EXCEEDED');
    this.name = 'ContextOverflowBudgetError';
  }
}

export class ContextRetentionError extends LanguageRepresentationError {
  constructor(message: string) {
    super(message, 'CONTEXT_RETENTION_FAILURE');
    this.name = 'ContextRetentionError';
  }
}

export class ContextCheckpointError extends LanguageRepresentationError {
  constructor(message: string) {
    super(message, 'CONTEXT_CHECKPOINT_INTEGRITY_ERROR');
    this.name = 'ContextCheckpointError';
  }
}

export class TenantContextMismatchError extends LanguageRepresentationError {
  constructor(message: string) {
    super(message, 'TENANT_CONTEXT_MISMATCH');
    this.name = 'TenantContextMismatchError';
  }
}

// =============================================================================
// CONTEXT WINDOW & MEMORY REFERRAL CONTRACTS
// =============================================================================

export type ContextTier = 'ACTIVE_WINDOW' | 'EXTENDED_REFERRAL' | 'SPARSE_PERSISTENT';

export interface ContextMemoryReference {
  readonly referenceId: string;
  readonly objectId: string;
  readonly tenantId: string;
  readonly tokenRange: {
    readonly start: number;
    readonly end: number;
  };
  readonly tokenCount: number;
  readonly summaryEmbedding: Float32Array;
  readonly spatialCellIds: readonly number[];
  readonly checksum: string;
  readonly timestamp: number;
}

export interface ContextMemoryBlock {
  readonly blockId: string;
  readonly tenantId: string;
  readonly domain: CanonicalDomain;
  readonly tokens: readonly NativeToken[];
  readonly rawText: string;
  readonly tokenRange: {
    readonly start: number;
    readonly end: number;
  };
  readonly summaryEmbedding: Float32Array;
  readonly checksum: string;
  readonly timestamp: number;
}

export interface ContextWindowConfig {
  /** Size of active in-memory token buffer */
  readonly maxActiveTokens: number;
  /** Maximum allowable virtual context across memory referrals */
  readonly maxExtendedTokens: number;
  /** Granularity of chunking for overflow block referral */
  readonly chunkSize: number;
  /** Hard cap on context memory allocation in bytes */
  readonly maxHeapBytes: number;
  /** Enable automatic referral to Sparse Memory */
  readonly allowMemoryReferral: boolean;
}

export const DEFAULT_CONTEXT_CONFIG: ContextWindowConfig = Object.freeze({
  maxActiveTokens: 512, // Baseline context length
  maxExtendedTokens: 8192,
  chunkSize: 256,
  maxHeapBytes: 16 * 1024 * 1024,
  allowMemoryReferral: true,
});

export interface SequenceStateSnapshot {
  readonly snapshotId: string;
  readonly tenantId: string;
  readonly activeTokens: readonly NativeToken[];
  readonly hiddenState: Float32Array;
  readonly references: readonly ContextMemoryReference[];
  readonly totalTokensProcessed: number;
  readonly stateVersion: number;
  readonly checksum: string;
  readonly timestamp: number;
}

export interface SequenceRetentionProfile {
  readonly earlyRetentionScore: number;
  readonly middleRetentionScore: number;
  readonly lateRetentionScore: number;
  readonly overallScore: number;
  readonly sequenceLength: number;
  readonly probedFactsCount: number;
  readonly passed: boolean;
}
