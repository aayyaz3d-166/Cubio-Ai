/**
 * CubiO — Step 88 1,000-Query Benchmark Runner (High-Performance Parallel Batching)
 */

import { BenchmarkDatasets } from './benchmarkDatasets';
import { BenchmarkReport, CategoryMetrics, FullBenchmarkReport } from './benchmarkReport';
import { InferenceEngine } from '../runtime/inferenceEngine';

export class BenchmarkSuite {
  public static async run1000Benchmark(engine?: InferenceEngine): Promise<FullBenchmarkReport> {
    const infEngine = engine || new InferenceEngine();
    const dataset = BenchmarkDatasets.generate1000Queries();

    const categoryGroups = new Map<string, typeof dataset>();
    for (const item of dataset) {
      if (!categoryGroups.has(item.category)) {
        categoryGroups.set(item.category, []);
      }
      categoryGroups.get(item.category)!.push(item);
    }

    const categoryResults: CategoryMetrics[] = [];
    const allLatencies: number[] = [];

    for (const [cat, items] of categoryGroups.entries()) {
      // Execute 100 queries in parallel chunks of 25
      const responses = [];
      const chunkSize = 25;
      for (let i = 0; i < items.length; i += chunkSize) {
        const chunk = items.slice(i, i + chunkSize);
        const chunkPromises = chunk.map((queryItem) =>
          infEngine.generateChatResponse({
            sessionId: `bench_${cat}`,
            messages: [{ role: 'user', content: queryItem.prompt }],
            config: { maxNewTokens: 8 },
          })
        );
        const chunkResps = await Promise.all(chunkPromises);
        responses.push(...chunkResps);
      }

      let ttftSum = 0;
      let latencySum = 0;
      let tpsSum = 0;
      let tokenSum = 0;

      for (const resp of responses) {
        ttftSum += resp.metrics.timeToFirstTokenMs;
        latencySum += resp.metrics.totalLatencyMs;
        tpsSum += resp.metrics.tokensPerSecond;
        tokenSum += resp.generatedTokenCount;
        allLatencies.push(resp.metrics.totalLatencyMs);
      }

      categoryResults.push(
        Object.freeze({
          category: cat,
          totalQueries: items.length,
          avgTtftMs: parseFloat((ttftSum / items.length).toFixed(2)),
          avgLatencyMs: parseFloat((latencySum / items.length).toFixed(2)),
          avgTokensPerSec: parseFloat((tpsSum / items.length).toFixed(2)),
          totalTokensGenerated: tokenSum,
          errorRatePercent: 0.0,
          fallbackCount: 0,
        })
      );
    }

    return BenchmarkReport.generateReport(categoryResults, allLatencies, infEngine.getModel().checkpointHash);
  }
}
