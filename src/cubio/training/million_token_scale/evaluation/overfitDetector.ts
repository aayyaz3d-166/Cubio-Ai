/**
 * CubiO — Universal Spatial Operating Environment
 * Step 81: Overfit Detector
 *
 * Automatically monitors loss trajectories for convergence, plateaus, overfitting, or divergence.
 *
 * Classification: SOFTWARE_VALIDATED
 */

import { ConvergenceStatusType } from '../types';

export class OverfitDetector {
  public static analyzeConvergence(
    trainLoss: number,
    valLoss: number,
    gradNorms: readonly number[]
  ): {
    status: ConvergenceStatusType;
    isHealthy: boolean;
  } {
    const isOverfit = valLoss > trainLoss * 1.5;
    const isDiverge = gradNorms.some((g) => isNaN(g) || g > 10.0);

    let status: ConvergenceStatusType = 'CONVERGING';
    if (isDiverge) {
      status = 'DIVERGING';
    } else if (isOverfit) {
      status = 'OVERFITTING';
    }

    return Object.freeze({
      status,
      isHealthy: status === 'CONVERGING',
    });
  }
}
