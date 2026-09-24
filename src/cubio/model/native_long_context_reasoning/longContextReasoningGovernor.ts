/**
 * CUBiO AI — Task 179: Long-Context Reasoning Integration
 * src/cubio/model/native_long_context_reasoning/longContextReasoningGovernor.ts
 *
 * Safety governor enforcing hardware actuation lockout, tenant isolation,
 * and strict budget bounds across reasoning premises and inference steps.
 *
 * STRICT INVARIANTS:
 * 1. Hardware Actuation Lockout: Permanent physical lockout, IS_ACTUATION_BLOCKED === true.
 * 2. Strict premise bound (<= 32) and step depth ceiling (<= 16).
 * 3. Token budget ceiling (<= 8192).
 */

import {
  IS_ACTUATION_BLOCKED,
  MAX_REASONING_PREMISES,
  MAX_REASONING_STEPS,
  MAX_REASONING_TOKEN_BUDGET,
  LongContextReasoningQuery,
  ReasoningActuationBlockedError,
  ReasoningBudgetExceededError,
  ReasoningDepthExceededError,
  ReasoningTenantViolationError,
} from './types.js';

export class LongContextReasoningGovernor {
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
      throw new ReasoningActuationBlockedError(directive ?? 'UNKNOWN_DIRECTIVE');
    }

    if (directive) {
      const upper = directive.toUpperCase();
      for (const token of LongContextReasoningGovernor.FORBIDDEN_ACTUATION_TOKENS) {
        if (upper.includes(token)) {
          throw new ReasoningActuationBlockedError(directive);
        }
      }
    }
  }

  /**
   * Validate reasoning query bounds and tenant integrity.
   */
  public validateQuery(query: LongContextReasoningQuery): void {
    this.assertActuationBlocked(query.query);
    this.assertActuationBlocked(query.targetProposition);

    if (!query.tenantId || query.tenantId.trim().length === 0) {
      throw new ReasoningTenantViolationError('UNKNOWN', 'EMPTY');
    }

    if (query.contextItems.length > MAX_REASONING_PREMISES) {
      throw new ReasoningBudgetExceededError(
        query.contextItems.length,
        MAX_REASONING_PREMISES,
        'context premises'
      );
    }

    if (query.maxSteps !== undefined && query.maxSteps > MAX_REASONING_STEPS) {
      throw new ReasoningDepthExceededError(query.maxSteps, MAX_REASONING_STEPS);
    }

    if (query.tokenBudget !== undefined && query.tokenBudget > MAX_REASONING_TOKEN_BUDGET) {
      throw new ReasoningBudgetExceededError(
        query.tokenBudget,
        MAX_REASONING_TOKEN_BUDGET,
        'tokens'
      );
    }
  }

  /**
   * Validate step count against maximum allowed depth.
   */
  public assertStepDepth(currentStep: number, maxSteps: number = MAX_REASONING_STEPS): void {
    if (currentStep > maxSteps) {
      throw new ReasoningDepthExceededError(currentStep, maxSteps);
    }
  }
}
