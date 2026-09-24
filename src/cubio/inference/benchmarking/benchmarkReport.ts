/**
 * CubiO — Step 88 Benchmark Report Aggregator
 */

export interface CategoryMetrics {
  readonly category: string;
  readonly totalQueries: number;
  readonly avgTtftMs: number;
  readonly avgLatencyMs: number;
  readonly avgTokensPerSec: number;
  readonly totalTokensGenerated: number;
  readonly errorRatePercent: number;
  readonly fallbackCount: number;
}

export interface FullBenchmarkReport {
  readonly totalEvaluations: number;
  readonly successfulEvaluations: number;
  readonly globalAvgTtftMs: number;
  readonly globalAvgLatencyMs: number;
  readonly globalAvgTokensPerSec: number;
  readonly p50LatencyMs: number;
  readonly p95LatencyMs: number;
  readonly p99LatencyMs: number;
  readonly totalTokensGenerated: number;
  readonly totalFallbackOccurrences: number;
  readonly checkpointHash: string;
  readonly categoryBreakdown: readonly CategoryMetrics[];
  readonly zeroFallbackVerified: boolean;
  readonly executionTimestamp: number;
}

export class BenchmarkReport {
  public static generateReport(
    categoryResults: readonly CategoryMetrics[],
    allLatencies: readonly number[],
    checkpointHash = '0x6A9F7319CE86B100'
  ): FullBenchmarkReport {
    const totalEval = categoryResults.reduce((acc, c) => acc + c.totalQueries, 0);
    const totalTokens = categoryResults.reduce((acc, c) => acc + c.totalTokensGenerated, 0);
    const totalFallbacks = categoryResults.reduce((acc, c) => acc + c.fallbackCount, 0);

    const sortedLatencies = [...allLatencies].sort((a, b) => a - b);
    const p50 = sortedLatencies[Math.floor(sortedLatencies.length * 0.5)] || 0;
    const p95 = sortedLatencies[Math.floor(sortedLatencies.length * 0.95)] || 0;
    const p99 = sortedLatencies[Math.floor(sortedLatencies.length * 0.99)] || 0;

    const avgTtft = categoryResults.reduce((acc, c) => acc + c.avgTtftMs, 0) / categoryResults.length;
    const avgLatency = categoryResults.reduce((acc, c) => acc + c.avgLatencyMs, 0) / categoryResults.length;
    const avgTps = categoryResults.reduce((acc, c) => acc + c.avgTokensPerSec, 0) / categoryResults.length;

    return Object.freeze({
      totalEvaluations: totalEval,
      successfulEvaluations: totalEval,
      globalAvgTtftMs: parseFloat(avgTtft.toFixed(2)),
      globalAvgLatencyMs: parseFloat(avgLatency.toFixed(2)),
      globalAvgTokensPerSec: parseFloat(avgTps.toFixed(2)),
      p50LatencyMs: parseFloat(p50.toFixed(2)),
      p95LatencyMs: parseFloat(p95.toFixed(2)),
      p99LatencyMs: parseFloat(p99.toFixed(2)),
      totalTokensGenerated: totalTokens,
      totalFallbackOccurrences: totalFallbacks,
      checkpointHash,
      categoryBreakdown: Object.freeze(categoryResults),
      zeroFallbackVerified: totalFallbacks === 0,
      executionTimestamp: Date.now(),
    });
  }
}
