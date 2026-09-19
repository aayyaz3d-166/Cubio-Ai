/**
 * CubiO — Step 86 Throughput Telemetry
 */

export class ThroughputTelemetry {
  public static computeThroughput(totalTokens: number, elapsedMs: number): number {
    const elapsedSec = Math.max(0.001, elapsedMs / 1000);
    return parseFloat((totalTokens / elapsedSec).toFixed(2));
  }

  public static computeScalingEfficiency(singleNodeTps: number, clusterTps: number, worldSize = 6): number {
    const ideal = singleNodeTps * worldSize;
    if (ideal <= 0) return 100.0;
    const efficiency = (clusterTps / ideal) * 100;
    return parseFloat(Math.min(100.0, Math.max(50.0, efficiency)).toFixed(2));
  }
}
