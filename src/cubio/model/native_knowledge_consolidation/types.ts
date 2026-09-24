/**
 * CUBiO AI — Task 191: Native Knowledge Consolidation
 * src/cubio/model/native_knowledge_consolidation/types.ts
 *
 * Types, interfaces, summary records, and error classes for
 * native knowledge consolidation, contradiction detection, and lineage union.
 *
 * STRICT INVARIANTS:
 * 1. Hardware Actuation Lockout: IS_ACTUATION_BLOCKED === true permanently.
 * 2. Pre-Consolidation Contradiction Detection: Conflicts reject fail-closed.
 * 3. Lineage Preservation: Merges must union constituent IDs, lineage, and evidence.
 * 4. Epistemic Anti-Promotion: No ungrounded elevations to AXIOM.
 * 5. OCC Monotonicity: stateVersion increments monotonically on merge.
 * 6. VDB Primacy: VDB is sole persistent authority; .3dmemory is transport only.
 */

import {
  KnowledgeEpistemicStatus,
  KnowledgeEntity,
  Concept,
  KnowledgeFact,
  Relationship,
} from '../native_knowledge_architecture/types';

export const TASK_191_ID = 'CUBIO-TASK-191-KNOWLEDGE-CONSOLIDATION';
export const IS_ACTUATION_BLOCKED = true;
export const MAX_CONSOLIDATION_BATCH_SIZE = 100;

export type KnowledgeConsolidationType =
  | 'ENTITY'
  | 'CONCEPT'
  | 'FACT'
  | 'RELATIONSHIP';

/**
 * Contradiction detection result.
 */
export interface ContradictionDetectionResult {
  readonly hasContradiction: boolean;
  readonly conflictType?:
    | 'DIRECT_VALUE_CONFLICT'
    | 'EPISTEMIC_CONFLICT'
    | 'PREDICATE_INVERSION';
  readonly conflictingIds: readonly string[];
  readonly reason?: string;
}

/**
 * Result of a successful consolidation merge.
 */
export interface ConsolidatedKnowledgeRecord {
  readonly canonicalId: string;
  readonly objectType: KnowledgeConsolidationType;
  readonly consolidatedData: Record<string, unknown>;
  readonly mergedCount: number;
  readonly constituentIds: readonly string[];
  readonly lineageSourceIds: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly finalEpistemicStatus: KnowledgeEpistemicStatus;
  readonly stateVersion: number;
  readonly checksum: string;
  readonly tenantId: string;
  readonly consolidatedAt: number;
}

/**
 * Comprehensive report generated after consolidation execution.
 */
export interface ConsolidationReport {
  readonly tenantId: string;
  readonly inputCount: number;
  readonly consolidatedCount: number;
  readonly duplicatesMerged: number;
  readonly fragmentsMerged: number;
  readonly contradictionsDetected: number;
  readonly unmergedCount: number;
  readonly executionTimeMs: number;
  readonly digest: string;
}

/**
 * Error classes for Knowledge Consolidation.
 */
export class KnowledgeContradictionError extends Error {
  constructor(conflictingIds: readonly string[], reason: string) {
    super(
      `[KnowledgeContradictionError] Irreconcilable contradiction detected between records [${conflictingIds.join(
        ', '
      )}]: ${reason}. Consolidation aborted fail-closed.`
    );
    this.name = 'KnowledgeContradictionError';
  }
}

export class KnowledgeUnsafePromotionError extends Error {
  constructor(targetId: string, attemptedStatus: string, reason: string) {
    super(
      `[KnowledgeUnsafePromotionError] Unsafe epistemic promotion for "${targetId}" to ${attemptedStatus}: ${reason}.`
    );
    this.name = 'KnowledgeUnsafePromotionError';
  }
}

export class KnowledgeConsolidationOCCError extends Error {
  constructor(objectId: string, expectedVersion: number, actualVersion: number) {
    super(
      `[KnowledgeConsolidationOCCError] OCC state version collision on "${objectId}": expected ${expectedVersion}, found ${actualVersion}.`
    );
    this.name = 'KnowledgeConsolidationOCCError';
  }
}

export class KnowledgeConsolidationTenantViolationError extends Error {
  constructor(callerTenant: string, targetTenant: string) {
    super(
      `[KnowledgeConsolidationTenantViolationError] Cross-tenant consolidation rejected: caller "${callerTenant}" cannot mutate target "${targetTenant}".`
    );
    this.name = 'KnowledgeConsolidationTenantViolationError';
  }
}

export class KnowledgeConsolidationActuationBlockedError extends Error {
  constructor(directive: string) {
    super(
      `[KnowledgeConsolidationActuationBlockedError] Hardware actuation directive "${directive}" detected. Permanently rejected fail-closed.`
    );
    this.name = 'KnowledgeConsolidationActuationBlockedError';
  }
}
