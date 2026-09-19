/**
 * CubiO — Universal Spatial Operating Environment
 * Step 81: Throughput Profiler
 *
 * Tracks tokens per second and step execution speeds.
 *
 * Classification: REAL_MEASURED
 */

export class ThroughputProfiler {
  public static computeThroughput(tokens: number, durationMs: number): number {
    const sec = Math.max(0.001, durationMs / 1000);
    return parseFloat((tokens / sec).toFixed(1));
  }
}
