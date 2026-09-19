/**
 * CubiO — Universal Spatial Operating Environment
 * Step 80: Training Progress Auditor
 *
 * Automatically detects convergence, plateaus, overfitting, or divergence.
 *
 * Classification: SOFTWARE_VALIDATED
 */

import { ConvergenceClassification } from '../types';

export class TrainingProgressAuditor {
  public static auditProgress(
    initialLoss: number,
    finalLoss: number,
    valLoss: number,
    gradNorms: readonly number[]
  ): {
    convergenceStatus: ConvergenceClassification;
    isOverfitting: boolean;
    isDiverging: boolean;
  } {
    const isDecreasing = finalLoss < initialLoss;
    const isOverfit = valLoss > finalLoss * 1.5;
    const isDiverge = finalLoss > initialLoss * 1.2 || gradNorms.some((g) => isNaN(g) || g > 10.0);

    let status: ConvergenceClassification = 'INSUFFICIENT_DATA';
    if (isDiverge) {
      status = 'DIVERGING';
    } else if (isOverfit) {
      status = 'OVERFITTING';
    } else if (isDecreasing) {
      status = 'CONVERGING';
    } else {
      status = 'PLATEAU';
    }

    return Object.freeze({
      convergenceStatus: status,
      isOverfitting: isOverfit,
      isDiverging: isDiverge,
    });
  }
}
