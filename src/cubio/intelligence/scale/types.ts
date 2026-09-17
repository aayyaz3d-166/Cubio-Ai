/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F20: CubiO Intelligence Scale Infrastructure Engine (Types & Contracts)
 *
 * Master specification for consistent hash tenant shard routing,
 * dynamic micro-batching, multi-tier scale caching, backpressure rate limiting,
 * and high-concurrency 1M-user stress benchmarking.
 */

import { EngineExecutionResult, IntelligenceContextEnvelope } from '../core/types';

export interface ShardNode {
  readonly shardId: string;
  readonly shardIndex: number;
  readonly virtualTokens: readonly number[];
  readonly assignedTenantIds: readonly string[];
  readonly activeLoad: number;
  readonly maxCapacity: number;
  readonly status: 'ACTIVE' | 'DRAINING' | 'REBALANCING';
}

export interface BatchingConfig {
  readonly maxBatchSize: number; // e.g. 64
  readonly maxWaitWindowMs: number; // e.g. 5ms
  readonly concurrencyLimit: number; // e.g. 1000
}

export interface ScaleCacheEntry {
  readonly cacheKey: string;
  readonly result: EngineExecutionResult;
  readonly hitCount: number;
  readonly insertedAt: number;
  readonly lastAccessedAt: number;
  readonly sizeBytes: number;
}

export interface ScaleCacheStats {
  readonly totalEntries: number;
  readonly totalHits: number;
  readonly totalMisses: number;
  readonly hitRatioPercent: number;
  readonly cacheMemoryBytes: number;
}

export interface ScaleThroughputTelemetry {
  readonly timestamp: number;
  readonly activeShardsCount: number;
  readonly simulatedConcurrentUsers: number;
  readonly requestsPerSecond: number;
  readonly p50LatencyMs: number;
  readonly p95LatencyMs: number;
  readonly p99LatencyMs: number;
  readonly cacheHitRatio: number;
  readonly backpressureEventsCount: number;
  readonly telemetryChecksum: string;
}

export interface ScaleStressReport {
  readonly reportId: string;
  readonly totalRequestsSimulated: number;
  readonly simulatedUserBase: number;
  readonly successRate: number;
  readonly totalDurationMs: number;
  readonly averageThroughputQps: number;
  readonly p50LatencyMs: number;
  readonly p95LatencyMs: number;
  readonly p99LatencyMs: number;
  readonly slaMet: boolean; // P99 < 15ms
  readonly reportChecksum: string;
}
