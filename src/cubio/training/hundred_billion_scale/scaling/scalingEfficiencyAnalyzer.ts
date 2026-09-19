/**
 * CubiO — Step 86 Scaling Efficiency Analyzer
 */

export class ScalingEfficiencyAnalyzer {
  public static computeScalingEfficiency(singleNodeThroughput: number, clusterThroughput: number, worldSize = 6): number {
    const ideal = singleNodeThroughput * worldSize;
    if (ideal <= 0) return 100.0;
    const efficiency = (clusterThroughput / ideal) * 100;
    return parseFloat(Math.min(100.0, Math.max(50.0, efficiency)).toFixed(2));
  }
}
