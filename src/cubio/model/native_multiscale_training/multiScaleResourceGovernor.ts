/**
 * CUBiO AI — Task 168: Multi-Scale Native Model Training
 * src/cubio/model/native_multiscale_training/multiScaleResourceGovernor.ts
 *
 * Resource Governor & Safety Enforcer for Multi-Scale Training:
 * - Validates scale architecture parameters against strict physical bounds.
 * - Enforces heap memory and step latency thresholds per model scale.
 * - Rejects non-finite numbers and foreign ML frameworks fail-closed.
 * - Asserts permanent hardware actuation lockout (IS_ACTUATION_BLOCKED === true).
 */

import {
  IS_ACTUATION_BLOCKED,
  ScaleArchitectureProfile,
  PROHIBITED_FOREIGN_FRAMEWORKS,
  MultiScaleResourceExceededError,
  MultiScaleActuationBlockedError,
  MultiScaleForeignFrameworkError,
  MultiScaleTrainingError,
} from './types';

export class MultiScaleResourceGovernor {
  /**
   * Asserts permanent hardware actuation lockout.
   */
  public static assertActuationLockout(directive?: string): void {
    if (!IS_ACTUATION_BLOCKED) {
      throw new MultiScaleActuationBlockedError('Safety lock violated: IS_ACTUATION_BLOCKED is false');
    }

    if (directive) {
      const lower = directive.toLowerCase();
      const forbidden = [
        'actuate',
        'motor',
        'servo',
        'robot',
        'relay',
        'solenoid',
        'pneumatic',
        'arm',
        'gripper',
        'hardware_execute',
        'gpio',
      ];
      for (const term of forbidden) {
        if (lower.includes(term)) {
          throw new MultiScaleActuationBlockedError(directive);
        }
      }
    }
  }

  /**
   * Verifies that no foreign ML framework is active.
   */
  public static assertNativeFramework(frameworkId: string): void {
    const lower = frameworkId.toLowerCase().trim();
    for (const prohibited of PROHIBITED_FOREIGN_FRAMEWORKS) {
      if (lower.includes(prohibited)) {
        throw new MultiScaleForeignFrameworkError(frameworkId);
      }
    }
  }

  /**
   * Validates architectural parameters for a scale profile.
   */
  public static validateArchitecture(profile: ScaleArchitectureProfile): void {
    if (profile.layerCount < 1 || profile.layerCount > 64) {
      throw new MultiScaleTrainingError(
        `Invalid layer count ${profile.layerCount}. Must be between 1 and 64.`
      );
    }

    if (profile.hiddenDimension < 32 || profile.hiddenDimension % 16 !== 0) {
      throw new MultiScaleTrainingError(
        `Invalid hidden dimension ${profile.hiddenDimension}. Must be >= 32 and multiple of 16.`
      );
    }

    if (profile.hiddenDimension % profile.attentionHeads !== 0) {
      throw new MultiScaleTrainingError(
        `Hidden dimension ${profile.hiddenDimension} not divisible by head count ${profile.attentionHeads}.`
      );
    }

    if (profile.vocabSize !== 478) {
      throw new MultiScaleTrainingError(
        `Incompatible vocabulary size ${profile.vocabSize}. Must match canonical NativeTokenizer (478).`
      );
    }

    if (profile.parameterCount <= 0 || !Number.isFinite(profile.parameterCount)) {
      throw new MultiScaleTrainingError(
        `Invalid parameter count ${profile.parameterCount}.`
      );
    }
  }

  /**
   * Validates heap memory budget.
   */
  public static assertMemoryBudget(currentBytes: number, limitBytes: number): void {
    if (currentBytes > limitBytes) {
      throw new MultiScaleResourceExceededError('HEAP_MEMORY', currentBytes, limitBytes);
    }
  }

  /**
   * Validates step latency budget.
   */
  public static assertStepLatency(latencyMs: number, limitMs: number): void {
    if (latencyMs > limitMs) {
      throw new MultiScaleResourceExceededError('STEP_LATENCY', latencyMs, limitMs);
    }
  }

  /**
   * Verifies number is finite and non-NaN.
   */
  public static assertFinite(val: number, label: string): void {
    if (!Number.isFinite(val) || Number.isNaN(val)) {
      throw new MultiScaleTrainingError(
        `Non-finite numerical value in ${label}: ${val}`,
        'NUMERICAL_SAFETY_VIOLATION'
      );
    }
  }
}
