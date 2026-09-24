/**
 * CUBiO AI — Task 186: Native Knowledge Normalization & Canonicalization
 * src/cubio/model/native_knowledge_normalization/types.ts
 *
 * Canonical data structures and interfaces for:
 * - Normalized entities, facts, and concepts
 * - Content fingerprints & deterministic canonical IDs
 * - Non-destructive deduplication with lineage preservation
 * - Ingestion batch canonicalization metrics
 *
 * STRICT INVARIANTS:
 * 1. Hardware Actuation Lockout: IS_ACTUATION_BLOCKED === true permanently.
 * 2. VDB Primacy: VDB is sole persistent authority; .3dmemory is transport only.
 * 3. Determinism: 100% native string normalization; zero external embeddings or LLMs.
 * 4. Tenant Isolation & OCC: Monotonic versioning and strict cross-tenant rejection.
 */

import {
  KnowledgeEpistemicStatus,
  KnowledgeRelationType,
} from '../native_knowledge_architecture/types';

export const TASK_186_ID = 'CUBIO-TASK-186-KNOWLEDGE-NORMALIZATION-CANONICALIZATION';
export const IS_ACTUATION_BLOCKED = true;

/**
 * Normalized Entity structure with canonical identity and aliases.
 */
export interface NormalizedEntity {
  readonly canonicalId: string;
  readonly primaryName: string;
  readonly normalizedName: string;
  readonly aliases: readonly string[];
  readonly category: string;
  readonly address369: number;
  readonly tenantId: string;
  readonly stateVersion: number;
  readonly canonicalChecksum: string;
  readonly epistemicStatus: KnowledgeEpistemicStatus;
  readonly lineageSourceIds: readonly string[];
  readonly properties?: Readonly<Record<string, unknown>>;
  readonly createdAt: number;
  readonly updatedAt: number;
}

/**
 * Normalized Fact structure referencing canonical entity IDs and standardized predicates.
 */
export interface NormalizedFact {
  readonly canonicalId: string;
  readonly subjectCanonicalId: string;
  readonly predicate: string;
  readonly objectCanonicalId: string;
  readonly confidence: number;
  readonly address369: number;
  readonly tenantId: string;
  readonly stateVersion: number;
  readonly canonicalChecksum: string;
  readonly epistemicStatus: KnowledgeEpistemicStatus;
  readonly evidenceIds: readonly string[];
  readonly lineageSourceIds: readonly string[];
  readonly provenanceId?: string;
  readonly createdAt: number;
  readonly updatedAt: number;
}

/**
 * Deterministic Content Fingerprint.
 */
export interface CanonicalFingerprint {
  readonly targetId: string;
  readonly fingerprintHash: string;
  readonly canonicalRepresentation: string;
  readonly timestamp: number;
}

/**
 * Deduplication summary report.
 */
export interface DeduplicationSummary {
  readonly tenantId: string;
  readonly inputEntitiesCount: number;
  readonly canonicalEntitiesCount: number;
  readonly inputFactsCount: number;
  readonly canonicalFactsCount: number;
  readonly duplicatesMergedCount: number;
  readonly lineagePreservedCount: number;
  readonly executionTimeMs: number;
}

/**
 * Error classes for normalization and canonicalization.
 */
export class NormalizationActuationBlockedError extends Error {
  constructor(directive: string) {
    super(`[NormalizationActuationBlockedError] Hardware actuation directive "${directive}" detected. Permanently rejected fail-closed.`);
    this.name = 'NormalizationActuationBlockedError';
  }
}

export class NormalizationTenantViolationError extends Error {
  constructor(callerTenant: string, targetTenant: string) {
    super(`[NormalizationTenantViolationError] Cross-tenant normalization attempted: caller "${callerTenant}" cannot mutate target "${targetTenant}".`);
    this.name = 'NormalizationTenantViolationError';
  }
}

export class NormalizationOCCCollisionError extends Error {
  constructor(canonicalId: string, expectedVersion: number, actualVersion: number) {
    super(`[NormalizationOCCCollisionError] OCC version collision on canonical record "${canonicalId}": expected ${expectedVersion}, found ${actualVersion}.`);
    this.name = 'NormalizationOCCCollisionError';
  }
}
