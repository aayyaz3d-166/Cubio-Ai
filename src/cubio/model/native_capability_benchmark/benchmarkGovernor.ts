/**
 * CUBiO AI — Task 169: Native Model Benchmark & Capability Evaluation
 * src/cubio/model/native_capability_benchmark/benchmarkGovernor.ts
 *
 * Safety governor for capability evaluation:
 * - Enforces permanent hardware actuation lockout (fail-closed).
 * - Enforces pure native TypeScript sovereignty (zero foreign ML frameworks).
 * - Finite number and stability validation across benchmark metrics.
 */

import {
  IS_ACTUATION_BLOCKED,
  PROHIBITED_FOREIGN_FRAMEWORKS,
  BenchmarkActuationBlockedError,
  BenchmarkForeignFrameworkError,
  CapabilityBenchmarkError,
} from './types';

export class BenchmarkGovernor {
  private static readonly ACTUATION_DIRECTIVE_PATTERN =
    /\b(actuate|motor|relay|solenoid|valve|gpio|hardware_override|physical_drive|stepper|arm_move)\b/i;

  /**
   * Enforces permanent hardware actuation lockout.
   * Rejects any actuation directive fail-closed.
   */
  public static assertActuationLockout(directive?: string): void {
    if (!IS_ACTUATION_BLOCKED) {
      throw new BenchmarkActuationBlockedError('GLOBAL_LOCKOUT_DISABLED_VIOLATION');
    }

    if (directive && this.ACTUATION_DIRECTIVE_PATTERN.test(directive)) {
      throw new BenchmarkActuationBlockedError(directive);
    }
  }

  /**
   * Validates framework sovereignty.
   * Throws if any prohibited foreign framework name is detected.
   */
  public static assertNativeFramework(frameworkId: string): void {
    const normalized = frameworkId.toLowerCase().trim();
    for (const prohibited of PROHIBITED_FOREIGN_FRAMEWORKS) {
      if (normalized.includes(prohibited)) {
        throw new BenchmarkForeignFrameworkError(frameworkId);
      }
    }
  }

  /**
   * Validates that numeric metrics are finite and not NaN.
   */
  public static assertFiniteMetric(value: number, metricName: string): void {
    if (typeof value !== 'number' || !Number.isFinite(value) || Number.isNaN(value)) {
      throw new CapabilityBenchmarkError(
        `Invalid metric "${metricName}": expected finite number, received ${value}`,
        'INVALID_NUMERIC_METRIC'
      );
    }
  }

  /**
   * Validates that memory heap stays within safe benchmark boundaries.
   */
  public static assertHeapBound(peakHeapMB: number, maxAllowedMB: number = 2048): void {
    this.assertFiniteMetric(peakHeapMB, 'peakHeapMB');
    if (peakHeapMB > maxAllowedMB) {
      throw new CapabilityBenchmarkError(
        `Peak heap limit exceeded: ${peakHeapMB.toFixed(2)} MB > allowed ${maxAllowedMB} MB`,
        'RESOURCE_LIMIT_EXCEEDED'
      );
    }
  }
}
