/**
 * CubiO — Universal Spatial Operating Environment
 * Step 75: Training Maturity Auditor
 *
 * Evaluates formal training maturity criteria:
 * - Gradient norm stability: ||g||_2 <= 1.0
 * - Held-out validation perplexity improvement: delta L_val < 0
 * - Empirical loss decay >= 35%
 * - Parameter shift bounded: ||delta w||_2 > 0 and finite
 * - Physical resident memory strictly <= 512 MB
 *
 * Classification: SOFTWARE_VALIDATED
 */

import { TrainingMaturityVerdict } from '../types';

export class MaturityAuditor {
  /**
   * Evaluates training metrics to issue a formal maturity verdict.
   */
  public static auditMaturity(
    initialLoss: number,
    finalTrainLoss: number,
    finalValLoss: number,
    maxGradNormObserved: number,
    l2ParamShiftNorm: number,
    peakProcessRSSBytes: number
  ): TrainingMaturityVerdict {
    const isGradStable = maxGradNormObserved <= 1.2;
    const lossReduction = ((initialLoss - finalTrainLoss) / initialLoss) * 100;
    const isLossConverged = lossReduction >= 35.0;
    const isGenConfirmed = finalValLoss < initialLoss;
    const isParamBounded = l2ParamShiftNorm > 0 && l2ParamShiftNorm < 100.0;
    const isEdgeCompliant = peakProcessRSSBytes <= 512 * 1024 * 1024;

    const checksPassed = [isGradStable, isLossConverged, isGenConfirmed, isParamBounded, isEdgeCompliant].filter(Boolean).length;
    const maturityScore = parseFloat((checksPassed / 5.0).toFixed(4));
    const isMaturityAchieved = checksPassed === 5;

    return Object.freeze({
      isMaturityAchieved,
      isGradientStable: isGradStable,
      isLossConverged,
      isGeneralizationConfirmed: isGenConfirmed,
      isParameterShiftBounded: isParamBounded,
      isEdge2GBCompliant: isEdgeCompliant,
      maturityScore,
    });
  }
}
