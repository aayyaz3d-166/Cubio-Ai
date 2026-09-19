/**
 * CubiO — Step 86 Convergence Analyzer
 */

export class ConvergenceAnalyzer {
  public static analyzeConvergence(losses: readonly number[]): {
    isConverging: boolean;
    initialLoss: number;
    finalLoss: number;
    lossReductionPercentage: number;
  } {
    if (losses.length < 2) {
      return { isConverging: true, initialLoss: losses[0] || 0, finalLoss: losses[0] || 0, lossReductionPercentage: 0 };
    }
    const initialLoss = losses[0];
    const finalLoss = losses[losses.length - 1];
    const isConverging = finalLoss < initialLoss;
    const lossReductionPercentage = parseFloat((((initialLoss - finalLoss) / initialLoss) * 100).toFixed(2));

    return {
      isConverging,
      initialLoss,
      finalLoss,
      lossReductionPercentage,
    };
  }
}
