/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 55: Convergence Validator
 *
 * Validates smooth, monotonic loss reduction curves across epochs.
 */

import {
  ValidationScaleProfile,
  ConvergenceValidationReport,
} from './types';
import { deterministicHash } from '../../state/determinism';

export class ConvergenceValidator {
  /**
   * Evaluates a series of loss values across training epochs.
   */
  public static validateLossCurve(
    profile: ValidationScaleProfile,
    lossTrajectory: readonly number[]
  ): ConvergenceValidationReport {
    if (lossTrajectory.length < 2) {
      throw new Error('Loss trajectory must contain at least 2 steps');
    }

    const initialLoss = lossTrajectory[0];
    const finalLoss = lossTrajectory[lossTrajectory.length - 1];

    let isMonotonic = true;
    for (let i = 1; i < lossTrajectory.length; i++) {
      if (lossTrajectory[i] > lossTrajectory[i - 1]) {
        isMonotonic = false;
        break;
      }
    }

    const reductionPct = parseFloat((((initialLoss - finalLoss) / initialLoss) * 100).toFixed(2));
    const perplexity = parseFloat(Math.exp(finalLoss).toFixed(4));
    const convScore = parseFloat((Math.min(1.0, reductionPct / 100) * 0.95 + 0.05).toFixed(4));

    const vHash = deterministicHash(`CONV:${profile}:${initialLoss}:${finalLoss}:${reductionPct}`);

    return Object.freeze({
      validationId: `CONV_${vHash.slice(2, 10)}`,
      profile,
      initialLoss,
      finalLoss,
      lossReductionPercentage: reductionPct,
      isMonotonicallyDecreasing: isMonotonic,
      perplexity,
      convergenceScore: convScore,
    });
  }
}
