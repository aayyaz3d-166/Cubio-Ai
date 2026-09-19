/**
 * CubiO — Universal Spatial Operating Environment
 * Step 79: Throughput Tracker
 *
 * Tracks tokens per second and step execution wall-clock durations.
 *
 * Classification: REAL_MEASURED
 */

export class ThroughputTracker {
  public static calculateThroughput(totalTokens: number, totalDurationMs: number): number {
    const sec = Math.max(0.001, totalDurationMs / 1000);
    return parseFloat((totalTokens / sec).toFixed(1));
  }
}
