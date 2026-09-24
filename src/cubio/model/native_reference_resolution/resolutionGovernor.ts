/**
 * CUBiO AI — Task 178: Cross-Context Reference Resolution
 * src/cubio/model/native_reference_resolution/resolutionGovernor.ts
 *
 * Safety governor enforcing hardware actuation lockout, tenant isolation boundaries,
 * reference chain depth ceilings, and circular cycle interception.
 *
 * STRICT INVARIANTS:
 * 1. Hardware Actuation Lockout: Permanent physical lockout, IS_ACTUATION_BLOCKED === true.
 * 2. Cross-tenant reference access blocked fail-closed.
 * 3. Reference chain depth strictly bounded (<= MAX_REFERENCE_CHAIN_DEPTH).
 * 4. Circular reference loops detected and halted immediately.
 */

import {
  ChainDepthExceededError,
  CircularReferenceError,
  CrossTenantReferenceError,
  IS_ACTUATION_BLOCKED,
  MAX_REFERENCE_CHAIN_DEPTH,
  ResolutionActuationBlockedError,
} from './types.js';

export class ResolutionGovernor {
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
      throw new ResolutionActuationBlockedError(directive ?? 'UNKNOWN_DIRECTIVE');
    }

    if (directive) {
      const upper = directive.toUpperCase();
      for (const token of ResolutionGovernor.FORBIDDEN_ACTUATION_TOKENS) {
        if (upper.includes(token)) {
          throw new ResolutionActuationBlockedError(directive);
        }
      }
    }
  }

  /**
   * Enforce strict tenant isolation between caller and target resource.
   */
  public assertTenantIntegrity(callerTenant: string, targetTenant: string): void {
    if (!callerTenant || !targetTenant || callerTenant !== targetTenant) {
      throw new CrossTenantReferenceError(callerTenant, targetTenant);
    }
  }

  /**
   * Enforce maximum allowable chain depth to prevent call-stack exhaustion.
   */
  public assertChainDepth(currentDepth: number, maxDepth: number = MAX_REFERENCE_CHAIN_DEPTH): void {
    if (currentDepth > maxDepth) {
      throw new ChainDepthExceededError(currentDepth, maxDepth);
    }
  }

  /**
   * Enforce cycle detection across active resolution lineage.
   */
  public assertNoCycle(objectId: string, visitedChain: readonly string[]): void {
    if (visitedChain.includes(objectId)) {
      const cyclePath = [...visitedChain, objectId];
      throw new CircularReferenceError(objectId, cyclePath);
    }
  }
}
