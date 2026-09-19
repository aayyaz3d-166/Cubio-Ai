/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 44: Step 43 Distributed Training Optimization Types
 *
 * Master specifications for:
 * - Gradient Bucketization & Communication/Computation Overlap
 * - Locality-Aware & Latency-Aware Synchronization Scheduling
 * - Dynamic Micro-Batch Sizing & Gradient Accumulation
 * - Node Capability Scoring & Straggler/Slow-Worker Mitigation
 * - Scientific Resource Accounting & High-Throughput Telemetry
 * - Working-Set Bounding across Edge Profiles (CUBIO_EDGE_2GB .. HIGH_THROUGHPUT)
 */

import { QuantizationFormat } from '../../compute/quantization/types';
import { ComputeBackendType } from '../../compute/backends/types';
import { EdgeProfileName } from '../../fabric/types';
import { ScientificClassification } from '../../distillation/types';

// ─── 1. GRADIENT BUCKETIZATION & COMM/COMP OVERLAP ──────────────────────────

export interface GradientBucketConfig {
  readonly bucketSizeLimitBytes: number; // e.g. 1MB on 2GB profile, 25MB on GPU
  readonly enableOverlap: boolean;
  readonly defaultQuantization: QuantizationFormat;
}

export interface GradientBucket {
  readonly bucketId: string;
  readonly bucketIndex: number;
  readonly layerIndices: readonly number[];
  readonly totalElements: number;
  readonly byteSize: number;
  readonly isReadyForSync: boolean;
  readonly isSynchronized: boolean;
  readonly casCid: string;
  readonly checksum: string;
}

// ─── 2. NODE CAPABILITY SCORING & LOAD BALANCING ────────────────────────────

export interface NodeCapabilityScore {
  readonly nodeId: string;
  readonly edgeProfile: EdgeProfileName;
  readonly backend: ComputeBackendType;
  readonly computeScore: number;       // 0.0 - 100.0
  readonly memoryCapacityBytes: number;
  readonly measuredLatencyMs: number;
  readonly bandwidthMbps: number;
  readonly stragglerScore: number;     // 0.0 (fast) - 1.0 (stuck)
  readonly assignedMicroBatchWeight: number; // proportional sample weighting
}

export interface SlowWorkerReport {
  readonly reportId: string;
  readonly stragglerNodeId: string;
  readonly meanStepLatencyMs: number;
  readonly clusterMeanLatencyMs: number;
  readonly mitigationAction: string;
  readonly timestamp: number;
}

// ─── 3. ADAPTIVE BATCH & ACCUMULATION ───────────────────────────────────────

export interface AdaptiveBatchConfig {
  readonly initialMicroBatchSize: number;
  readonly minMicroBatchSize: number;
  readonly maxMicroBatchSize: number;
  readonly gradientAccumulationSteps: number;
  readonly targetWorkingSetBytes: number;
}

export interface AdaptiveBatchState {
  readonly currentMicroBatchSize: number;
  readonly currentAccumulationSteps: number;
  readonly effectiveBatchSize: number;
  readonly isMemoryBounded: boolean;
  readonly adaptationReason: string;
}

// ─── 4. HIGH-THROUGHPUT TELEMETRY & SCIENTIFIC LEDGER ───────────────────────

export interface DistributedOptimizationTelemetry {
  readonly optimizerId: string;
  readonly throughputSamplesPerSec: number;
  readonly throughputTokensPerSec: number;
  readonly meanSyncLatencyMs: number;
  readonly communicationOverlapRatio: number; // 0.0 - 1.0 (overlap efficiency)
  readonly totalGradientBytesTransferred: number;
  readonly gradientCompressionRatio: number;  // e.g. 0.75 for INT8
  readonly peakResidentMemoryBytes: number;
  readonly workerUtilization: Readonly<Record<string, number>>; // 0.0 - 1.0
  readonly stragglersMitigatedCount: number;
  readonly is2GBEdgeCompliant: boolean;
  readonly scientificClassification: ScientificClassification;
  readonly timestamp: number;
}
