/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F72: Telemetry Profiler
 *
 * Tracks latency percentiles (P50, P95, P99) and heap memory deltas.
 */

export class TelemetryProfiler {
  private latencies: number[] = [];
  private initialHeapMb = 0;
  private finalHeapMb = 0;

  public startProfiling(): void {
    this.latencies = [];
    if (typeof process !== 'undefined' && process.memoryUsage) {
      this.initialHeapMb = process.memoryUsage().heapUsed / (1024 * 1024);
    }
  }

  public recordLatency(latencyMs: number): void {
    this.latencies.push(latencyMs);
  }

  public endProfiling(): {
    minLatencyMs: number;
    p50LatencyMs: number;
    p95LatencyMs: number;
    p99LatencyMs: number;
    maxLatencyMs: number;
    memoryDeltaMb: number;
  } {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      this.finalHeapMb = process.memoryUsage().heapUsed / (1024 * 1024);
    }

    if (this.latencies.length === 0) {
      return {
        minLatencyMs: 0,
        p50LatencyMs: 0,
        p95LatencyMs: 0,
        p99LatencyMs: 0,
        maxLatencyMs: 0,
        memoryDeltaMb: 0,
      };
    }

    const sorted = [...this.latencies].sort((a, b) => a - b);
    const minLatencyMs = sorted[0];
    const maxLatencyMs = sorted[sorted.length - 1];
    const p50LatencyMs = sorted[Math.floor(sorted.length * 0.5)];
    const p95LatencyMs = sorted[Math.floor(sorted.length * 0.95)];
    const p99LatencyMs = sorted[Math.floor(sorted.length * 0.99)];
    const memoryDeltaMb = Math.max(0, Math.round((this.finalHeapMb - this.initialHeapMb) * 100) / 100);

    return {
      minLatencyMs,
      p50LatencyMs,
      p95LatencyMs,
      p99LatencyMs,
      maxLatencyMs,
      memoryDeltaMb,
    };
  }
}
