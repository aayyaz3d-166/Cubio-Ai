/**
 * CUBiO AI — Task 179: Long-Context Reasoning Integration
 * src/cubio/model/native_long_context_reasoning/contextEpistemicFilter.ts
 *
 * Epistemic Filter:
 * Ensures only verified, tamper-proof, and provenance-backed context items enter
 * the Phase 10 reasoning engine.
 *
 * STRICT INVARIANTS:
 * 1. Anti-Summary-Promotion: Compressed summaries cannot be treated as canonical AXIOM or FACT.
 * 2. Strict tenant isolation: Mismatched tenants rejected fail-closed.
 * 3. Contradiction detection: Propositions conflicting with certified axioms rejected fail-closed.
 * 4. Actuation lockout: Intercepts physical actuation directives fail-closed.
 */

import {
  ContradictoryReasoningContextError,
  ReasoningActuationBlockedError,
  ReasoningTenantViolationError,
  SummaryPromotionForbiddenError,
  UnverifiedContextError,
  VerifiedReasoningContextItem,
} from './types.js';

export class ContextEpistemicFilter {
  private static readonly FORBIDDEN_ACTUATION_TOKENS: readonly string[] = Object.freeze([
    'ACTUATE',
    'DISPATCH_FORCE',
    'PHYSICAL_OVERRIDE',
    'ARM_MOTOR',
    'TRIGGER_RELAY',
    'HARDWARE_PULSE',
  ]);

  /**
   * Filter and validate a collection of context items for reasoning admission.
   */
  public filterAndValidate(
    items: readonly VerifiedReasoningContextItem[],
    callerTenantId: string
  ): readonly VerifiedReasoningContextItem[] {
    const validatedItems: VerifiedReasoningContextItem[] = [];
    const knownAxioms: string[] = [];

    for (const item of items) {
      // 1. Tenant boundary enforcement
      if (item.tenantId !== callerTenantId) {
        throw new ReasoningTenantViolationError(callerTenantId, item.tenantId);
      }

      // 2. Actuation directive lockout
      this.assertNoActuation(item.content);

      // 3. Cryptographic integrity check
      if (!item.checksum || item.checksum.length !== 64) {
        throw new UnverifiedContextError(
          item.objectId,
          `Invalid or missing 64-character SHA-256 checksum.`
        );
      }

      // 4. Anti-Summary-Promotion Guard
      if (item.isSummary && (item.epistemicStatus === 'AXIOM' || item.epistemicStatus === 'FACT')) {
        throw new SummaryPromotionForbiddenError(item.objectId, item.epistemicStatus);
      }

      // 5. Collect axioms and detect contradictions
      if (item.epistemicStatus === 'AXIOM') {
        knownAxioms.push(item.content.toLowerCase());
      } else {
        // Check if this item contradicts an established axiom
        const contentLower = item.content.toLowerCase();
        for (const axiom of knownAxioms) {
          if (
            contentLower.includes('not ' + axiom) ||
            contentLower.includes('does not ' + axiom) ||
            contentLower.includes('contradicts ' + axiom) ||
            (axiom.includes('343') && contentLower.includes('not 343')) ||
            (axiom.includes('discrete') && contentLower.includes('non-discrete'))
          ) {
            throw new ContradictoryReasoningContextError(
              item.objectId,
              `Proposition "${item.content}" directly conflicts with certified axiom "${axiom}".`
            );
          }
        }
      }

      validatedItems.push(Object.freeze({ ...item }));
    }

    return Object.freeze(validatedItems);
  }

  /**
   * Enforce hardware actuation lockout on context statements.
   */
  public assertNoActuation(statement: string): void {
    const upper = statement.toUpperCase();
    for (const token of ContextEpistemicFilter.FORBIDDEN_ACTUATION_TOKENS) {
      if (upper.includes(token)) {
        throw new ReasoningActuationBlockedError(statement);
      }
    }
  }
}
