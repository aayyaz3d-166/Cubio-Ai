/**
 * CUBiO AI — Task 165: Native Model Memory Integration
 * src/cubio/model/native_memory_integration/modelMemoryGovernor.ts
 *
 * Authoritative Governor for Model Persistent Memory:
 * - Enforces Optimistic Concurrency Control (OCC) and rejects stale writes fail-closed.
 * - Anti-pollution guard: prevents ephemeral hypotheses / ungrounded predictions
 *   from corrupting canonical persistent knowledge.
 * - Enforces strict multi-tenant isolation boundaries.
 * - Asserts permanent hardware actuation lockout fail-closed.
 */

import * as crypto from 'crypto';
import {
  IS_ACTUATION_BLOCKED,
  ModelMemoryRecord,
  ModelMemoryMutation,
  ModelMemoryOCCConflictError,
  ModelMemoryTenantViolationError,
  IllegalCanonicalKnowledgePromotionError,
  ModelMemoryActuationBlockedError,
} from './types';

export class ModelMemoryGovernor {
  private static readonly CANONICAL_EPISTEMIC_STATUSES = new Set(['FACT', 'AXIOM', 'DERIVED']);

  private static readonly ACTUATION_KEYWORDS = [
    'actuate hardware',
    'execute physical command',
    'move robotic arm',
    'switch circuit',
    'fire thruster',
    'trigger actuator',
    'control physical motors',
    'drive motor',
    'actuate motor',
    'move motor',
    'stepper_rotate',
    'gpio_write',
  ];

  /**
   * Asserts permanent hardware actuation lockout fail-closed.
   */
  public static assertActuationLockout(content: string): void {
    if (!IS_ACTUATION_BLOCKED) {
      throw new ModelMemoryActuationBlockedError('IS_ACTUATION_BLOCKED must be true.');
    }

    const lower = content.toLowerCase();
    for (const kw of this.ACTUATION_KEYWORDS) {
      if (lower.includes(kw)) {
        throw new ModelMemoryActuationBlockedError(content);
      }
    }
  }

  /**
   * Enforces strict multi-tenant isolation boundaries.
   */
  public static assertTenantAccess(callerTenant: string, recordOwnerTenant: string): void {
    if (callerTenant !== recordOwnerTenant) {
      throw new ModelMemoryTenantViolationError(
        'Unauthorized attempt to access persistent record across tenant boundary',
        callerTenant,
        recordOwnerTenant
      );
    }
  }

  /**
   * Enforces Optimistic Concurrency Control (OCC) state-version validation.
   */
  public static validateOCC(
    existing: ModelMemoryRecord | null,
    mutation: ModelMemoryMutation
  ): void {
    if (existing) {
      if (mutation.expectedVersion !== existing.reference.stateVersion) {
        throw new ModelMemoryOCCConflictError(
          mutation.objectId,
          mutation.expectedVersion,
          existing.reference.stateVersion
        );
      }
    } else {
      if (mutation.expectedVersion !== 0) {
        throw new ModelMemoryOCCConflictError(mutation.objectId, mutation.expectedVersion, 0);
      }
    }
  }

  /**
   * Enforces anti-pollution epistemic guard to preserve canonical integrity.
   */
  public static assertAntiPollution(
    epistemicStatus: string,
    isCanonicalKnowledge: boolean,
    objectId: string
  ): void {
    if (isCanonicalKnowledge && !this.CANONICAL_EPISTEMIC_STATUSES.has(epistemicStatus.toUpperCase())) {
      throw new IllegalCanonicalKnowledgePromotionError(
        objectId,
        `Status "${epistemicStatus}" is ephemeral or unverified and cannot be promoted to canonical persistent knowledge.`
      );
    }
  }

  /**
   * Computes deterministic SHA-256 checksum for canonical records.
   */
  public static computeChecksum(
    objectId: string,
    tenantId: string,
    domain: string,
    stateVersion: number,
    content: string,
    spatialCellId?: number
  ): string {
    const hash = crypto.createHash('sha256');
    hash.update(`CUBIO_VDB_MEM:${tenantId}:${domain}:${objectId}:${stateVersion}:${spatialCellId ?? 'none'}`);
    hash.update(content);
    return hash.digest('hex');
  }
}
