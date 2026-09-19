/**
 * CubiO — Universal Spatial Operating Environment
 * Step 79: Capability Evaluator
 *
 * Aggregates benchmark results and audits capability maturity gates.
 *
 * Classification: SOFTWARE_VALIDATED
 */

import { CapabilityBenchmarkResult } from '../types';

export class CapabilityEvaluator {
  /**
   * Computes capability score summary.
   */
  public static evaluateMaturity(results: readonly CapabilityBenchmarkResult[]): {
    totalEvaluated: number;
    allPillarsPassed: boolean;
    averageDeltaOverBaseline: number;
  } {
    const executed = results.filter((r) => r.executionStatus === 'EXECUTED');
    let deltaSum = 0;

    for (const r of executed) {
      if (r.modelScore !== null) {
        const isLowerBetter = r.pillarId === 'LANGUAGE_MODELING';
        const delta = isLowerBetter ? r.baselineScore - r.modelScore : r.modelScore - r.baselineScore;
        deltaSum += delta;
      }
    }

    const avgDelta = parseFloat((deltaSum / Math.max(1, executed.length)).toFixed(2));
    const allPassed =
      executed.length === 10 &&
      executed.every((r) => {
        if (r.modelScore === null) return false;
        return r.pillarId === 'LANGUAGE_MODELING'
          ? r.modelScore <= r.baselineScore
          : r.modelScore >= r.baselineScore;
      });

    return Object.freeze({
      totalEvaluated: executed.length,
      allPillarsPassed: allPassed,
      averageDeltaOverBaseline: avgDelta,
    });
  }
}
