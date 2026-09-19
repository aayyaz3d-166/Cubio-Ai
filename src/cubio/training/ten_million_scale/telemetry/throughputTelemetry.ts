/**
 * CubiO — Universal Spatial Operating Environment
 * Step 82: Throughput Telemetry
 *
 * Tracks live token processing velocity and latency per batch.
 *
 * Classification: REAL_MEASURED
 */

export class ThroughputTelemetry {
  public static calculateTokensPerSec(tokens: number, durationMs: number): number {
    const sec = Math.max(0.001, durationMs / 1000);
    return parseFloat((tokens / sec).toFixed(1));
  }
}
