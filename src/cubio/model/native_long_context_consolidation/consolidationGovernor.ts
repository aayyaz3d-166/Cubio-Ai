/**
 * CUBiO AI — Task 180: Long-Context Memory Consolidation
 * src/cubio/model/native_long_context_consolidation/consolidationGovernor.ts
 *
 * Safety governor enforcing hardware actuation lockout, tenant isolation,
 * bounded queue/batch sizes, and canonical knowledge overwrite protection.
 *
 * STRICT INVARIANTS:
 * 1. Hardware Actuation Lockout: Permanent physical lockout, IS_ACTUATION_BLOCKED === true.
 * 2. Cross-tenant candidate contamination rejected fail-closed.
 * 3. Queue size (<= 500) and batch size (<= 100) strictly bounded.
 * 4. Canonical axioms and facts can never be overwritten or downgraded by lower-tier candidates.
 */

import {
  CanonicalOverwriteProhibitedError,
  ConsolidationActuationBlockedError,
  ConsolidationBatchOverflowError,
  ConsolidationQueueOverflowError,
  ConsolidationTenantViolationError,
  EpistemicStatus,
  IS_ACTUATION_BLOCKED,
  MAX_CONSOLIDATION_BATCH_SIZE,
  MAX_CONSOLIDATION_QUEUE_SIZE,
} from './types.js';

export class ConsolidationGovernor {
  private static readonly FORBIDDEN_ACTUATION_TOKENS: readonly string[] = Object.freeze([
    'ACTUATE',
    'DISPATCH_FORCE',
    'PHYSICAL_OVERRIDE',
    'ARM_MOTOR',
    'TRIGGER_RELAY',
    'HARDWARE_PULSE',
  ]);

  private static readonly EPISTEMIC_RANKS: Readonly<Record<EpistemicStatus, number>> = Object.freeze({
    AXIOM: 6,
    FACT: 5,
    DERIVED: 4,
    THEORY: 3,
    OBSERVATION: 2,
    HYPOTHESIS: 1,
  });

  /**
   * Enforce permanent hardware actuation lockout.
   */
  public assertActuationBlocked(directive?: string): void {
    if (!IS_ACTUATION_BLOCKED) {
      throw new ConsolidationActuationBlockedError(directive ?? 'UNKNOWN_DIRECTIVE');
    }

    if (directive) {
      const upper = directive.toUpperCase();
      for (const token of ConsolidationGovernor.FORBIDDEN_ACTUATION_TOKENS) {
        if (upper.includes(token)) {
          throw new ConsolidationActuationBlockedError(directive);
        }
      }
    }
  }

  /**
   * Enforce multi-tenant isolation.
   */
  public assertTenantIntegrity(callerTenant: string, candidateTenant: string): void {
    if (!callerTenant || !candidateTenant || callerTenant !== candidateTenant) {
      throw new ConsolidationTenantViolationError(callerTenant, candidateTenant);
    }
  }

  /**
   * Enforce batch size ceilings (<= MAX_CONSOLIDATION_BATCH_SIZE).
   */
  public assertBatchBounds(batchSize: number): void {
    if (batchSize > MAX_CONSOLIDATION_BATCH_SIZE) {
      throw new ConsolidationBatchOverflowError(batchSize, MAX_CONSOLIDATION_BATCH_SIZE);
    }
  }

  /**
   * Enforce queue size ceilings (<= MAX_CONSOLIDATION_QUEUE_SIZE).
   */
  public assertQueueBounds(queueSize: number): void {
    if (queueSize >= MAX_CONSOLIDATION_QUEUE_SIZE) {
      throw new ConsolidationQueueOverflowError(queueSize, MAX_CONSOLIDATION_QUEUE_SIZE);
    }
  }

  /**
   * Enforce canonical overwrite protection: lower-tier candidates cannot downgrade higher-tier canonical knowledge.
   */
  public assertNoCanonicalDowngrade(
    objectId: string,
    existingStatus: EpistemicStatus,
    candidateStatus: EpistemicStatus
  ): void {
    const existingRank = ConsolidationGovernor.EPISTEMIC_RANKS[existingStatus] ?? 0;
    const candidateRank = ConsolidationGovernor.EPISTEMIC_RANKS[candidateStatus] ?? 0;

    if (candidateRank < existingRank) {
      throw new CanonicalOverwriteProhibitedError(objectId, candidateStatus, existingStatus);
    }
  }
}
