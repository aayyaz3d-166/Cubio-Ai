/**
 * CUBiO AI — Task 166: Native Training Compute & Efficiency
 * src/cubio/model/native_training_efficiency/trainingResourceGovernor.ts
 *
 * Resource & Safety Governor for Native Model Training:
 * - Enforces hard heap memory boundaries and prevents out-of-memory crashes.
 * - Computes L2 gradient norms, applies deterministic gradient clipping, and guards against exploding/NaN gradients.
 * - Enforces static sovereignty by rejecting foreign ML/training frameworks.
 * - Permanently blocks hardware actuation commands.
 */

import {
  IS_ACTUATION_BLOCKED,
  TrainingResourceLimits,
  PROHIBITED_FOREIGN_TRAINING_FRAMEWORKS,
  TrainingResourceExceededError,
  TrainingNumericalSafetyError,
  TrainingActuationBlockedError,
  TrainingForeignFrameworkError,
} from './types';

export class TrainingResourceGovernor {
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
  public static assertActuationLockout(text: string): void {
    if (!IS_ACTUATION_BLOCKED) {
      throw new TrainingActuationBlockedError('IS_ACTUATION_BLOCKED must be true.');
    }

    const lower = text.toLowerCase();
    for (const kw of this.ACTUATION_KEYWORDS) {
      if (lower.includes(kw)) {
        throw new TrainingActuationBlockedError(text);
      }
    }
  }

  /**
   * Enforces sovereign isolation by rejecting prohibited foreign training frameworks.
   */
  public static assertFrameworkSovereignty(frameworkIdentifier: string): void {
    const normalized = frameworkIdentifier.toLowerCase().trim();
    for (const prohibited of PROHIBITED_FOREIGN_TRAINING_FRAMEWORKS) {
      if (normalized.includes(prohibited)) {
        throw new TrainingForeignFrameworkError(frameworkIdentifier);
      }
    }
  }

  /**
   * Asserts current heap memory does not exceed configured limits.
   */
  public static assertMemoryBudget(limits: TrainingResourceLimits): number {
    const heapUsed = process.memoryUsage().heapUsed;
    if (heapUsed > limits.maxPeakMemoryBytes) {
      throw new TrainingResourceExceededError('HEAP_MEMORY', heapUsed, limits.maxPeakMemoryBytes);
    }
    return heapUsed;
  }

  /**
   * Asserts step latency does not exceed threshold.
   */
  public static assertStepLatency(latencyMs: number, limits: TrainingResourceLimits): void {
    if (latencyMs > limits.maxAllowedStepLatencyMs) {
      throw new TrainingResourceExceededError('STEP_LATENCY', latencyMs, limits.maxAllowedStepLatencyMs);
    }
  }

  /**
   * Computes L2 Frobenius norm across a 2D gradient matrix.
   * Throws NumericalSafetyError on NaN or Infinity.
   */
  public static calculateGradientNorm(
    gradients: readonly (readonly number[])[],
    step: number,
    matrixName: string
  ): number {
    let sumSq = 0;
    for (let r = 0; r < gradients.length; r++) {
      const row = gradients[r];
      for (let c = 0; c < row.length; c++) {
        const g = row[c];
        if (!Number.isFinite(g) || Number.isNaN(g)) {
          throw new TrainingNumericalSafetyError(step, `${matrixName}[${r}][${c}]`, `Encountered non-finite gradient: ${g}`);
        }
        sumSq += g * g;
      }
    }
    const norm = Math.sqrt(sumSq);
    if (!Number.isFinite(norm) || Number.isNaN(norm)) {
      throw new TrainingNumericalSafetyError(step, matrixName, `Computed L2 norm is non-finite: ${norm}`);
    }
    return norm;
  }

  /**
   * Clamps / scales gradients in-place if L2 norm exceeds clipNorm.
   */
  public static clipGradients(
    gradients: number[][],
    clipNorm: number,
    step: number,
    matrixName: string
  ): number {
    const norm = this.calculateGradientNorm(gradients, step, matrixName);
    if (norm > clipNorm && norm > 0) {
      const scale = clipNorm / norm;
      for (let r = 0; r < gradients.length; r++) {
        for (let c = 0; c < gradients[r].length; c++) {
          gradients[r][c] *= scale;
        }
      }
      return clipNorm;
    }
    return norm;
  }
}
