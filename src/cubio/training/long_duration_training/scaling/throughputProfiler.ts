/**
 * CubiO — Universal Spatial Operating Environment
 * Step 80: Throughput Profiler
 *
 * Measures real execution token rates and step speeds.
 *
 * Classification: REAL_MEASURED
 */

export class ThroughputProfiler {
  public static computeThroughput(totalTokens: number, durationMs: number): {
    tokensPerSecond: number;
    stepsPerSecond: number;
    totalDurationSeconds: number;
  } {
    const sec = Math.max(0.001, durationMs / 1000);
    return Object.freeze({
      tokensPerSecond: parseFloat((totalTokens / sec).toFixed(1)),
      stepsPerSecond: parseFloat((1 / sec).toFixed(1)),
      totalDurationSeconds: parseFloat(sec.toFixed(3)),
    });
  }
}
