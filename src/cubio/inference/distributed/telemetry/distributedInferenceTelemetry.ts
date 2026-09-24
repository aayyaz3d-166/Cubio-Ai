/**
 * CubiO — Step 89 Distributed Inference Telemetry
 */

import { ConcurrencyTierMetric } from '../types';

export class DistributedInferenceTelemetry {
  public static simulateConcurrencyTiers(): readonly ConcurrencyTierMetric[] {
    const tiers = [50, 100, 250, 500, 1000];
    const metrics: ConcurrencyTierMetric[] = [];

    for (const level of tiers) {
      const avgTtft = 12.0 + (level / 1000) * 15.0;
      const tps = 95.0 - (level / 1000) * 10.0;
      const p50 = 25.0 + (level / 1000) * 40.0;
      const p95 = 45.0 + (level / 1000) * 75.0;
      const p99 = 65.0 + (level / 1000) * 110.0;
      const rss = (64 + (level / 1000) * 128) * 1024 * 1024;

      metrics.push(
        Object.freeze({
          concurrencyLevel: level,
          totalRequests: level,
          successfulRequests: level,
          droppedRequests: 0,
          avgTtftMs: parseFloat(avgTtft.toFixed(2)),
          avgTokensPerSec: parseFloat(tps.toFixed(2)),
          p50LatencyMs: parseFloat(p50.toFixed(2)),
          p95LatencyMs: parseFloat(p95.toFixed(2)),
          p99LatencyMs: parseFloat(p99.toFixed(2)),
          peakMemoryRssBytes: Math.floor(rss),
          errorRatePercent: 0.0,
        })
      );
    }

    return Object.freeze(metrics);
  }
}
