/**
 * CUBiO AI — Task 172: Native Context Window Expansion
 * src/cubio/model/native_window_expansion/windowExpansionGovernor.ts
 *
 * Safety & Resource Governor for Native Context Window Expansion:
 * - Permanent hardware actuation lockout fail-closed.
 * - Static sovereignty checks against foreign attention/windowing libraries.
 * - Sequence length and working RAM limits governance.
 */

import {
  IS_ACTUATION_BLOCKED,
  PROHIBITED_WINDOW_LIBRARIES,
  WindowActuationBlockedError,
  WindowForeignFrameworkError,
  WindowOverflowError,
  WindowResourceExceededError,
  WindowExpansionProfileId,
} from './types.js';
import { getWindowProfile, MAX_SOVEREIGN_WINDOW_TOKENS } from './windowProfiles.js';

export class WindowExpansionGovernor {
  private static readonly ACTUATION_DIRECTIVE_PATTERN =
    /\b(actuate|motor|relay|solenoid|valve|gpio|hardware_override|physical_drive|stepper|arm_move|fire_thruster|switch_circuit)\b/i;

  /**
   * Asserts permanent hardware actuation lockout fail-closed.
   */
  public static assertActuationLockout(directive?: string): void {
    if (!IS_ACTUATION_BLOCKED) {
      throw new WindowActuationBlockedError('GLOBAL_LOCKOUT_DISABLED_VIOLATION');
    }

    if (directive && this.ACTUATION_DIRECTIVE_PATTERN.test(directive)) {
      throw new WindowActuationBlockedError(directive);
    }
  }

  /**
   * Asserts framework sovereignty by rejecting prohibited foreign windowing libraries.
   */
  public static assertNativeFramework(frameworkId: string): void {
    const normalized = frameworkId.toLowerCase().trim();
    for (const prohibited of PROHIBITED_WINDOW_LIBRARIES) {
      if (normalized.includes(prohibited)) {
        throw new WindowForeignFrameworkError(frameworkId);
      }
    }
  }

  /**
   * Validates token count against profile and absolute global ceiling.
   */
  public static assertTokenBudget(tokens: number, profileId: WindowExpansionProfileId): void {
    if (tokens > MAX_SOVEREIGN_WINDOW_TOKENS) {
      throw new WindowOverflowError(tokens, MAX_SOVEREIGN_WINDOW_TOKENS);
    }

    const spec = getWindowProfile(profileId);
    if (tokens > spec.maxWindowTokens) {
      throw new WindowOverflowError(tokens, spec.maxWindowTokens);
    }
  }

  /**
   * Asserts working memory remains within configured limit.
   */
  public static assertWorkingRam(bytes: number, limitBytes: number): void {
    if (bytes > limitBytes) {
      throw new WindowResourceExceededError('WORKING_RAM', bytes, limitBytes);
    }
  }
}
