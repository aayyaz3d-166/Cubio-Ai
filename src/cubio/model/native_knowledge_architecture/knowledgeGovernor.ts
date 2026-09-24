/**
 * CUBiO AI — Task 184: Native Knowledge Architecture
 * src/cubio/model/native_knowledge_architecture/knowledgeGovernor.ts
 *
 * Safety Governor enforcing:
 * - Permanent Hardware Actuation Lockout (IS_ACTUATION_BLOCKED === true)
 * - Strict Multi-Tenant Isolation (fail-closed cross-tenant access)
 * - Optimistic Concurrency Control (OCC version monotonicity)
 * - Epistemic Anti-Pollution & Anti-Downgrade guards
 * - Cryptographic Checksum Integrity validation
 */

import {
  IS_ACTUATION_BLOCKED,
  KnowledgeEpistemicStatus,
  EPISTEMIC_WEIGHTS,
  KnowledgeActuationBlockedError,
  KnowledgeTenantViolationError,
  KnowledgeOCCCollisionError,
  KnowledgeEpistemicDowngradeError,
  KnowledgeIntegrityError,
} from './types';

export class KnowledgeGovernor {
  private static readonly FORBIDDEN_ACTUATION_TERMS: readonly string[] = Object.freeze([
    'ACTUATE',
    'DISPATCH_FORCE',
    'PHYSICAL_OVERRIDE',
    'ARM_MOTOR',
    'TRIGGER_RELAY',
    'HARDWARE_PULSE',
    'EXECUTE PHYSICAL COMMAND',
    'MOVE ROBOTIC ARM',
  ]);

  /**
   * Enforces permanent hardware actuation lockout.
   */
  public static assertActuationBlocked(directive?: string): void {
    if (!IS_ACTUATION_BLOCKED) {
      throw new KnowledgeActuationBlockedError(directive ?? 'GLOBAL_LOCKOUT_VIOLATION');
    }

    if (directive) {
      const upper = directive.toUpperCase();
      for (const term of this.FORBIDDEN_ACTUATION_TERMS) {
        if (upper.includes(term)) {
          throw new KnowledgeActuationBlockedError(directive);
        }
      }
    }
  }

  /**
   * Enforces strict multi-tenant isolation.
   */
  public static assertTenantIntegrity(callerTenantId: string, targetTenantId: string): void {
    if (!callerTenantId || callerTenantId.trim().length === 0) {
      throw new Error('[KnowledgeGovernor] Caller tenant ID must not be empty.');
    }
    if (!targetTenantId || targetTenantId.trim().length === 0) {
      throw new Error('[KnowledgeGovernor] Target tenant ID must not be empty.');
    }
    if (callerTenantId !== targetTenantId) {
      throw new KnowledgeTenantViolationError(callerTenantId, targetTenantId);
    }
  }

  /**
   * Enforces Optimistic Concurrency Control (OCC).
   * For new object: expectedVersion must be 0, currentVersion must be undefined.
   * For existing object: expectedVersion must equal currentVersion.
   */
  public static validateOCC(
    objectId: string,
    expectedVersion: number,
    currentVersion?: number
  ): void {
    if (currentVersion === undefined) {
      // Creating a new object
      if (expectedVersion !== 0) {
        throw new KnowledgeOCCCollisionError(objectId, expectedVersion, 0);
      }
      return;
    }

    // Updating existing object
    if (expectedVersion !== currentVersion) {
      throw new KnowledgeOCCCollisionError(objectId, expectedVersion, currentVersion);
    }
  }

  /**
   * Enforces epistemic hierarchy rules and prevents illegal demotions.
   */
  public static assertNoEpistemicDowngrade(
    objectId: string,
    currentStatus: KnowledgeEpistemicStatus,
    newStatus: KnowledgeEpistemicStatus
  ): void {
    const currentWeight = EPISTEMIC_WEIGHTS[currentStatus];
    const newWeight = EPISTEMIC_WEIGHTS[newStatus];

    // Canonical AXIOM or FACT cannot be demoted to speculative THEORY, OBSERVATION, or HYPOTHESIS
    if ((currentStatus === 'AXIOM' || currentStatus === 'FACT') && newWeight < EPISTEMIC_WEIGHTS.FACT) {
      throw new KnowledgeEpistemicDowngradeError(objectId, currentStatus, newStatus);
    }

    // General prevention of significant epistemic demotion without formal deprecation
    if (newWeight < currentWeight && currentStatus === 'AXIOM') {
      throw new KnowledgeEpistemicDowngradeError(objectId, currentStatus, newStatus);
    }
  }

  /**
   * Prevents speculative hypotheses from being promoted to AXIOM without verified derivation or evidence.
   */
  public static assertValidPromotion(
    objectId: string,
    fromStatus: KnowledgeEpistemicStatus,
    toStatus: KnowledgeEpistemicStatus,
    evidenceCount: number,
    hasProvenance: boolean
  ): void {
    if (toStatus === 'AXIOM' && fromStatus !== 'AXIOM') {
      if (evidenceCount === 0 || !hasProvenance) {
        throw new Error(
          `[KnowledgeGovernor] Promotion of object "${objectId}" to AXIOM requires verified evidence and provenance.`
        );
      }
    }

    if (toStatus === 'FACT' && (fromStatus === 'HYPOTHESIS' || fromStatus === 'OBSERVATION')) {
      if (evidenceCount === 0) {
        throw new Error(
          `[KnowledgeGovernor] Promotion of object "${objectId}" to FACT requires at least 1 verified evidence record.`
        );
      }
    }
  }

  /**
   * Enforces checksum integrity.
   */
  public static assertChecksumIntegrity(
    objectId: string,
    expectedChecksum: string,
    actualChecksum: string
  ): void {
    if (expectedChecksum !== actualChecksum) {
      throw new KnowledgeIntegrityError(objectId, expectedChecksum, actualChecksum);
    }
  }
}
