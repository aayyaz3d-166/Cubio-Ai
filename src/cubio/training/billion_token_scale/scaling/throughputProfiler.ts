/**
 * CubiO — Universal Spatial Operating Environment
 * Step 84: Throughput Profiler
 *
 * Tracks throughput metrics (tokens/sec, steps/sec).
 *
 * Classification: REAL_MEASURED
 */

export class ThroughputProfiler {
  public static computeMetrics(tokens: number, durationMs: number): {
    tokensPerSecond: number;
    stepsPerSecond: number;
  } {
    const sec = Math.max(0.001, durationMs / 1000);
    return {
      tokensPerSecond: parseFloat((tokens / sec).toFixed(1)),
      stepsPerSecond: parseFloat((1 / sec).toFixed(1)),
    };
  }
}
