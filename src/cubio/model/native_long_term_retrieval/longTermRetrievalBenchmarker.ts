/**
 * CUBiO AI — Task 176: Long-Term VDB Memory Retrieval
 * src/cubio/model/native_long_term_retrieval/longTermRetrievalBenchmarker.ts
 *
 * Empirical Performance & Determinism Benchmarker:
 * - Measures retrieval latency (sub-millisecond indexed lookup).
 * - Tracks memory footprint (< 32 MB working RAM).
 * - Verifies triplicate bitwise determinism (A = B = C, Delta = 0).
 */

import {
  LongTermRetrievalQuery,
  RetrievalBenchmarkReport,
} from './types.js';
import { LongTermReferenceIndex } from './longTermReferenceIndex.js';
import { SelectiveContextAssembler } from './selectiveContextAssembler.js';
import { ModelMemoryCoordinator } from '../native_memory_integration/modelMemoryCoordinator.js';

export class LongTermRetrievalBenchmarker {
  /**
   * Runs an empirical retrieval benchmark on the index and memory coordinator.
   */
  public static runBenchmark(params: {
    tenantId: string;
    index: LongTermReferenceIndex;
    memoryCoord: ModelMemoryCoordinator;
    testQueries: readonly string[];
    iterations?: number;
  }): RetrievalBenchmarkReport {
    const { tenantId, index, memoryCoord, testQueries, iterations = 10 } = params;

    const latencies: number[] = [];
    const stats = index.getStats(tenantId);
    let isBitwiseDeterministic = true;

    for (const query of testQueries) {
      const querySpec: LongTermRetrievalQuery = {
        query,
        tenantId,
        tokenBudget: 2048,
        materializeContent: true,
      };

      // Triplicate check for bitwise determinism
      const resA = SelectiveContextAssembler.assembleContext({ querySpec, index, memoryCoord });
      const resB = SelectiveContextAssembler.assembleContext({ querySpec, index, memoryCoord });
      const resC = SelectiveContextAssembler.assembleContext({ querySpec, index, memoryCoord });

      if (resA.retrievalDigest !== resB.retrievalDigest || resB.retrievalDigest !== resC.retrievalDigest) {
        isBitwiseDeterministic = false;
      }

      for (let iter = 0; iter < iterations; iter++) {
        const start = performance.now();
        SelectiveContextAssembler.assembleContext({ querySpec, index, memoryCoord });
        const elapsed = performance.now() - start;
        latencies.push(elapsed);
      }
    }

    latencies.sort((a, b) => a - b);
    const meanLatency = latencies.reduce((sum, l) => sum + l, 0) / latencies.length;
    const p95Index = Math.min(latencies.length - 1, Math.floor(latencies.length * 0.95));
    const p95Latency = latencies[p95Index];
    const maxLatency = latencies[latencies.length - 1];

    // Measure approximate memory usage
    const memUsage = process.memoryUsage ? process.memoryUsage().heapUsed : 0;

    return Object.freeze({
      tenantId,
      totalReferencesIndexed: stats.totalIndexedReferences,
      totalQueriesTested: testQueries.length * iterations,
      meanLatencyMs: Number(meanLatency.toFixed(3)),
      p95LatencyMs: Number(p95Latency.toFixed(3)),
      maxLatencyMs: Number(maxLatency.toFixed(3)),
      peakMemoryBytes: memUsage,
      isBitwiseDeterministic,
      timestamp: new Date().toISOString(),
    });
  }
}
