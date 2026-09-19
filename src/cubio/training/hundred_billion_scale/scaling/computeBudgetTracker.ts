/**
 * CubiO — Step 86 Compute Budget Tracker
 */

export class ComputeBudgetTracker {
  public static computeTotalFlops(paramCount: number, totalTokens: number): {
    totalFlops: number;
    petaFlopDays: number;
  } {
    // 6 * N * D FLOPs for transformer training forward+backward
    const totalFlops = 6 * paramCount * totalTokens;
    const petaFlopDays = parseFloat((totalFlops / (1e15 * 86400)).toFixed(4));

    return {
      totalFlops,
      petaFlopDays,
    };
  }
}
