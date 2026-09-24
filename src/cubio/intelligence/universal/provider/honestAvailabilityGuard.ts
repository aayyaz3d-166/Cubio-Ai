/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F71: Honest Availability Guard
 *
 * Enforces the core invariant:
 * "Provider unavailable ho to honest UNAVAILABLE, fabricated output nahi."
 */

import { ProviderScoredCandidate, ProviderSelectionCriteria } from './types';

export class HonestAvailabilityGuard {
  public verifyAvailability(
    candidates: readonly ProviderScoredCandidate[],
    criteria: ProviderSelectionCriteria
  ): { isAvailable: boolean; selected?: ProviderScoredCandidate; reason?: string } {
    if (candidates.length === 0) {
      return {
        isAvailable: false,
        reason: `HONEST UNAVAILABLE: No healthy providers registered or currently online for class "${criteria.providerClass}". Zero fabrication permitted.`,
      };
    }

    return {
      isAvailable: true,
      selected: candidates[0],
    };
  }
}
