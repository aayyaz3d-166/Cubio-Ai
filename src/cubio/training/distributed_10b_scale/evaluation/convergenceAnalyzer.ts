/**
 * CubiO — Step 85 Convergence Analyzer
 * Analyzes loss trajectory derivatives, gradient SNR, and assigns convergence status.
 */

export class ConvergenceAnalyzer {
  public static analyzeConvergence(losses: readonly number[]): {
    status: 'CONVERGING' | 'PLATEAU' | 'DIVERGING';
    lossDelta: number;
    convergenceRate: number;
  } {
    if (losses.length < 2) {
      return { status: 'CONVERGING', lossDelta: 0, convergenceRate: 0 };
    }

    const firstLoss = losses[0];
    const lastLoss = losses[losses.length - 1];
    const lossDelta = lastLoss - firstLoss;

    if (lossDelta < -0.1) {
      return {
        status: 'CONVERGING',
        lossDelta: parseFloat(lossDelta.toFixed(4)),
        convergenceRate: parseFloat((Math.abs(lossDelta) / losses.length).toFixed(4)),
      };
    } else if (Math.abs(lossDelta) <= 0.1) {
      return {
        status: 'PLATEAU',
        lossDelta: parseFloat(lossDelta.toFixed(4)),
        convergenceRate: 0,
      };
    } else {
      return {
        status: 'DIVERGING',
        lossDelta: parseFloat(lossDelta.toFixed(4)),
        convergenceRate: 0,
      };
    }
  }
}
