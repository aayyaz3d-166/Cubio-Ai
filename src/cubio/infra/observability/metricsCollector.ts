/**
 * CUBiO AI — Phase 13: Production Observability & Metrics Engine
 * src/cubio/infra/observability/metricsCollector.ts
 *
 * Collects runtime performance metrics, error rates, latencies (P50/P95/P99),
 * and system resources without recording private message contents.
 */

import { Request, Response, NextFunction } from 'express';

export interface LatencyPercentiles {
  readonly p50Ms: number;
  readonly p95Ms: number;
  readonly p99Ms: number;
}

export interface SystemMetricsSnapshot {
  readonly totalRequests: number;
  readonly statusCodes: Record<string, number>;
  readonly errorRatePercent: number;
  readonly latencies: LatencyPercentiles;
  readonly activeConcurrency: number;
  readonly memoryRssMb: number;
  readonly memoryHeapUsedMb: number;
  readonly uptimeSeconds: number;
}

export class MetricsCollector {
  private static instance: MetricsCollector;
  private totalRequests = 0;
  private readonly statusCodes: Record<string, number> = {};
  private readonly latencies: number[] = [];
  private activeConcurrency = 0;

  private constructor() {}

  public static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }

  public middleware() {
    return (req: Request, res: Response, next: NextFunction): void => {
      this.totalRequests++;
      this.activeConcurrency++;
      const startTime = performance.now();

      res.on('finish', () => {
        this.activeConcurrency = Math.max(0, this.activeConcurrency - 1);
        const duration = performance.now() - startTime;

        const codeGroup = `${Math.floor(res.statusCode / 100)}xx`;
        this.statusCodes[codeGroup] = (this.statusCodes[codeGroup] || 0) + 1;

        this.latencies.push(duration);
        // Keep window bounded to latest 1,000 samples
        if (this.latencies.length > 1000) {
          this.latencies.shift();
        }
      });

      next();
    };
  }

  public recordCustomLatency(durationMs: number): void {
    this.latencies.push(durationMs);
    if (this.latencies.length > 1000) {
      this.latencies.shift();
    }
  }

  public getPercentiles(): LatencyPercentiles {
    if (this.latencies.length === 0) {
      return { p50Ms: 0, p95Ms: 0, p99Ms: 0 };
    }

    const sorted = [...this.latencies].sort((a, b) => a - b);
    const p50 = sorted[Math.floor(sorted.length * 0.5)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];

    return {
      p50Ms: parseFloat(p50.toFixed(2)),
      p95Ms: parseFloat(p95.toFixed(2)),
      p99Ms: parseFloat(p99.toFixed(2)),
    };
  }

  public getSnapshot(): SystemMetricsSnapshot {
    const memory = process.memoryUsage();
    const errorCount = (this.statusCodes['4xx'] || 0) + (this.statusCodes['5xx'] || 0);
    const errorRate = this.totalRequests > 0 ? (errorCount / this.totalRequests) * 100 : 0;

    return {
      totalRequests: this.totalRequests,
      statusCodes: { ...this.statusCodes },
      errorRatePercent: parseFloat(errorRate.toFixed(2)),
      latencies: this.getPercentiles(),
      activeConcurrency: this.activeConcurrency,
      memoryRssMb: Math.round(memory.rss / (1024 * 1024)),
      memoryHeapUsedMb: Math.round(memory.heapUsed / (1024 * 1024)),
      uptimeSeconds: Math.floor(process.uptime()),
    };
  }

  public resetForTesting(): void {
    this.totalRequests = 0;
    this.activeConcurrency = 0;
    Object.keys(this.statusCodes).forEach((k) => delete this.statusCodes[k]);
    this.latencies.length = 0;
  }
}
