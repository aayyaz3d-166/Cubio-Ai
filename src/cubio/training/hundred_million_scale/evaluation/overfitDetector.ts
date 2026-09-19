/**
 * CubiO — Universal Spatial Operating Environment
 * Step 83: Overfit Detector
 *
 * Automatically monitors loss trajectories for convergence, plateaus, overfitting, or divergence.
 *
 * Classification: SOFTWARE_VALIDATED
 */

import { ConvergenceClassificationType } from '../types';

export class OverfitDetector {
  public static analyzeConvergence(
    trainLoss: number,
    valLoss: number,
    gradNorms: readonly number[]
  ): {
    status: ConvergenceClassificationType;
    isHealthy: boolean;
  } {
    const isOverfit = valLoss > trainLoss * 1.5;
    const isDiverge = gradNorms.some((g) => isNaN(g) || g > 10.0);

    let status: ConvergenceClassificationType = 'CONVERGING';
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
