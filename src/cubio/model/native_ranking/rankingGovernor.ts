/**
 * CUBiO AI — Task 177: Context Relevance & Ranking
 * src/cubio/model/native_ranking/rankingGovernor.ts
 *
 * Safety governor enforcing hardware actuation lockout, strict multi-tenant
 * isolation, bounded candidate pool ceilings, and parameter integrity.
 *
 * STRICT INVARIANTS:
 * 1. Hardware Actuation Lockout: Permanent physical lockout, IS_ACTUATION_BLOCKED === true.
 * 2. Cross-tenant candidate contamination immediately rejected fail-closed.
 * 3. Candidate pool bounded to MAX_CANDIDATE_POOL_SIZE (<= 1,000).
 * 4. Token budget ceilings enforced without unbounded RAM allocations.
 */

import {
  CandidateDescriptor,
  IS_ACTUATION_BLOCKED,
  MAX_CANDIDATE_POOL_SIZE,
  RankingActuationBlockedError,
  RankingBudgetExceededError,
  RankingCandidatePoolOverflowError,
  RankingQuery,
  RankingTenantViolationError,
  RankingWeights,
} from './types.js';

export class RankingGovernor {
  private static readonly FORBIDDEN_ACTUATION_TOKENS: readonly string[] = Object.freeze([
    'ACTUATE',
    'DISPATCH_FORCE',
    'PHYSICAL_OVERRIDE',
    'ARM_MOTOR',
    'TRIGGER_RELAY',
    'HARDWARE_PULSE',
  ]);

  /**
   * Enforce permanent hardware actuation lockout.
   */
  public assertActuationBlocked(directive?: string): void {
    if (!IS_ACTUATION_BLOCKED) {
      throw new RankingActuationBlockedError(directive ?? 'UNKNOWN_DIRECTIVE');
    }

    if (directive) {
      const upper = directive.toUpperCase();
      for (const token of RankingGovernor.FORBIDDEN_ACTUATION_TOKENS) {
        if (upper.includes(token)) {
          throw new RankingActuationBlockedError(directive);
        }
      }
    }
  }

  /**
   * Validate that query does not attempt hardware actuation directives.
   */
  public validateQuery(query: RankingQuery): void {
    this.assertActuationBlocked(query.query);

    if (!query.tenantId || query.tenantId.trim().length === 0) {
      throw new Error('[RankingGovernor] Query tenantId must not be empty.');
    }

    if (query.tokenBudget !== undefined && query.tokenBudget <= 0) {
      throw new RankingBudgetExceededError(query.tokenBudget, 0);
    }

    if (query.weights) {
      this.validateWeights(query.weights);
    }
  }

  /**
   * Enforce that a candidate descriptor strictly belongs to the caller tenant.
   */
  public assertTenantIntegrity(callerTenant: string, candidate: CandidateDescriptor): void {
    if (candidate.tenantId !== callerTenant) {
      throw new RankingTenantViolationError(callerTenant, candidate.tenantId);
    }
  }

  /**
   * Enforce candidate pool bounds (<= MAX_CANDIDATE_POOL_SIZE).
   */
  public assertPoolBounds(candidates: readonly CandidateDescriptor[]): void {
    if (candidates.length > MAX_CANDIDATE_POOL_SIZE) {
      throw new RankingCandidatePoolOverflowError(candidates.length, MAX_CANDIDATE_POOL_SIZE);
    }
  }

  /**
   * Validate that custom ranking weights are non-negative and finite.
   */
  public validateWeights(weights: Partial<RankingWeights>): void {
    for (const [key, value] of Object.entries(weights)) {
      if (value !== undefined) {
        if (typeof value !== 'number' || isNaN(value) || value < 0) {
          throw new Error(`[RankingGovernor] Invalid weight for ${key}: ${value}. Must be non-negative finite number.`);
        }
      }
    }
  }
}
