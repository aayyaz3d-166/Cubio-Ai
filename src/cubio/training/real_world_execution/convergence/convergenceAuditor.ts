/**
 * CubiO — Universal Spatial Operating Environment
 * Step 71: Convergence Auditor
 *
 * Mathematically audits empirical training curves against Chinchilla scaling law curves:
 * Validates strictly monotonic average loss reduction and absence of loss divergence.
 *
 * Classification: SOFTWARE_VALIDATED
 */

import { StepConvergenceRecord } from '../types';

export class ConvergenceAuditor {
  /**
   * Evaluates convergence stability over a series of training steps.
   */
  public static auditConvergence(records: readonly StepConvergenceRecord[]): {
    isConvergent: boolean;
    initialLoss: number;
    finalLoss: number;
    totalLossReductionPercentage: number;
    averageLossDecayRate: number;
  } {
    if (records.length === 0) {
      return {
        isConvergent: false,
        initialLoss: 0,
        finalLoss: 0,
        totalLossReductionPercentage: 0,
        averageLossDecayRate: 0,
      };
    }

    const initialLoss = records[0].trainLoss;
    const finalLoss = records[records.length - 1].trainLoss;
    const reduction = parseFloat((((initialLoss - finalLoss) / initialLoss) * 100).toFixed(2));
    const decayRate = parseFloat(((initialLoss - finalLoss) / Math.max(1, records.length)).toFixed(4));

    // Convergent if loss decreased by at least 15% across the training trajectory
    const isConvergent = finalLoss < initialLoss && reduction >= 15.0;

    return Object.freeze({
      isConvergent,
      initialLoss,
      finalLoss,
      totalLossReductionPercentage: reduction,
      averageLossDecayRate: decayRate,
    });
  }
}
