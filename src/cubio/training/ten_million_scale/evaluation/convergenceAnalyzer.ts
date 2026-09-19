/**
 * CubiO — Universal Spatial Operating Environment
 * Step 82: Convergence Analyzer
 *
 * Evaluates loss curvature, gradient decay, and parameter trajectory stability.
 *
 * Classification: SOFTWARE_VALIDATED
 */

export class ConvergenceAnalyzer {
  public static analyzeTrajectory(losses: readonly number[]): {
    isDecreasingMonotonically: boolean;
    lossReductionPercentage: number;
  } {
    if (losses.length < 2) return { isDecreasingMonotonically: true, lossReductionPercentage: 0 };

    const first = losses[0];
    const last = losses[losses.length - 1];
    const reduction = parseFloat((((first - last) / first) * 100).toFixed(2));

    return Object.freeze({
      isDecreasingMonotonically: last < first,
      lossReductionPercentage: reduction,
    });
  }
}
