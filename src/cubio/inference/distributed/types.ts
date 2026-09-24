/**
 * CubiO — Universal Spatial Operating Environment
 * Step 89: Distributed Production Inference & 1T Token Frontier Types
 */

import { ResultClassification } from '../../foundation/v1/types';
import { ChatMessage, InferenceGenerationConfig, InferenceMetrics } from '../types';

export interface InferenceWorkerNode {
  readonly nodeId: string;
  readonly rank: number;
  readonly host: string;
  readonly port: number;
  readonly totalMemoryMB: number;
  readonly usedMemoryMB: number;
  readonly activeRequests: number;
  readonly status: 'ONLINE' | 'BUSY' | 'DEGRADED' | 'OFFLINE';
  readonly lastHeartbeat: number;
}

export interface DistributedBatchRequest {
  readonly requestId: string;
  readonly sessionId: string;
  readonly messages: readonly ChatMessage[];
  readonly config?: InferenceGenerationConfig;
  readonly arrivalTime: number;
  readonly promptTokens: readonly number[];
  readonly generatedTokens: number[];
  isCompleted: boolean;
}

export interface PagedKvBlock {
  readonly blockId: string;
  readonly sessionId: string;
  readonly tokenStartOffset: number;
  readonly tokenLength: number;
  readonly keys: readonly number[];
  readonly values: readonly number[];
  lastAccessed: number;
}

export interface CacheTelemetry {
  readonly totalBlocks: number;
  readonly usedBlocks: number;
  readonly cacheHits: number;
  readonly cacheMisses: number;
  readonly hitRatePercent: number;
  readonly memoryAllocatedMB: number;
}

export interface ConcurrencyTierMetric {
  readonly concurrencyLevel: number;
  readonly totalRequests: number;
  readonly successfulRequests: number;
  readonly droppedRequests: number;
  readonly avgTtftMs: number;
  readonly avgTokensPerSec: number;
  readonly p50LatencyMs: number;
  readonly p95LatencyMs: number;
  readonly p99LatencyMs: number;
  readonly peakMemoryRssBytes: number;
  readonly errorRatePercent: number;
}

export interface OneTrillionCapacitySpec {
  readonly targetTokenScale: number;
  readonly parameterScale: number;
  readonly requiredFlops: number;
  readonly minimumNodesRequired: number;
  readonly memoryPerNodeGB: number;
  readonly networkBandwidthRequiredGbps: number;
  readonly capacityProven: boolean;
  readonly classification: 'CAPACITY_PROVEN' | 'SOFTWARE_VALIDATED' | 'THEORETICAL';
}
