/**
 * CUBiO AI — Task 171: Native Long-Context Architecture
 * src/cubio/model/native_long_context/longContextGovernor.ts
 *
 * Safety & Resource Governor for Native Long-Context Processing:
 * - Permanent hardware actuation lockout fail-closed.
 * - Enforces static sovereignty by rejecting foreign attention and distributed ML libraries.
 * - Resource limits governor enforcing hard ceilings on token capacity, block count, and RAM.
 * - Enforces strict tenant isolation and Optimistic Concurrency Control (OCC).
 */

import {
  IS_ACTUATION_BLOCKED,
  PROHIBITED_FOREIGN_LONG_CONTEXT_FRAMEWORKS,
  LongContextActuationBlockedError,
  LongContextForeignFrameworkError,
  LongContextResourceExceededError,
  LongContextTenantViolationError,
  LongContextOCCConflictError,
  LongContextProfileId,
} from './types';
import { getLongContextProfile, MAX_SOVEREIGN_CONTEXT_TOKENS } from './longContextProfiles';

export class LongContextGovernor {
  private static readonly ACTUATION_DIRECTIVE_PATTERN =
    /\b(actuate|motor|relay|solenoid|valve|gpio|hardware_override|physical_drive|stepper|arm_move|fire_thruster|switch_circuit)\b/i;

  /**
   * Asserts permanent hardware actuation lockout fail-closed.
   */
  public static assertActuationLockout(directive?: string): void {
    if (!IS_ACTUATION_BLOCKED) {
      throw new LongContextActuationBlockedError('GLOBAL_LOCKOUT_DISABLED_VIOLATION');
    }

    if (directive && this.ACTUATION_DIRECTIVE_PATTERN.test(directive)) {
      throw new LongContextActuationBlockedError(directive);
    }
  }

  /**
   * Enforces sovereign isolation by rejecting prohibited foreign attention libraries.
   */
  public static assertNativeFramework(frameworkId: string): void {
    const normalized = frameworkId.toLowerCase().trim();
    for (const prohibited of PROHIBITED_FOREIGN_LONG_CONTEXT_FRAMEWORKS) {
      if (normalized.includes(prohibited)) {
        throw new LongContextForeignFrameworkError(frameworkId);
      }
    }
  }

  /**
   * Validates that requested token capacity does not exceed profile limits or global ceiling.
   */
  public static assertTokenBounds(tokens: number, profileId: LongContextProfileId): void {
    if (tokens > MAX_SOVEREIGN_CONTEXT_TOKENS) {
      throw new LongContextResourceExceededError(
        'TOTAL_TOKENS_GLOBAL_CEILING',
        tokens,
        MAX_SOVEREIGN_CONTEXT_TOKENS
      );
    }

    const spec = getLongContextProfile(profileId);
    if (tokens > spec.maxTokens) {
      throw new LongContextResourceExceededError(
        `PROFILE_${profileId}_MAX_TOKENS`,
        tokens,
        spec.maxTokens
      );
    }
  }

  /**
   * Asserts resident RAM does not exceed the governor limit.
   */
  public static assertResidentRamBound(residentBytes: number, limitBytes: number): void {
    if (residentBytes > limitBytes) {
      throw new LongContextResourceExceededError(
        'RESIDENT_RAM_CAP',
        residentBytes,
        limitBytes
      );
    }
  }

  /**
   * Asserts strict multi-tenant boundary compliance.
   */
  public static assertTenantAccess(callerTenantId: string, resourceTenantId: string): void {
    if (callerTenantId !== resourceTenantId) {
      throw new LongContextTenantViolationError(callerTenantId, resourceTenantId);
    }
  }

  /**
   * Validates Optimistic Concurrency Control (OCC) state-version match.
   */
  public static validateOCC(
    objectId: string,
    expectedVersion: number,
    currentVersion: number
  ): void {
    if (expectedVersion !== currentVersion) {
      throw new LongContextOCCConflictError(objectId, expectedVersion, currentVersion);
    }
  }
}
