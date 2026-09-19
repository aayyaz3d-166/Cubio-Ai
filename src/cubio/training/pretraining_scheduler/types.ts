/**
 * CubiO — Universal Spatial Operating Environment
 * Step 65: Pretraining Scheduler & Compute Budget Types
 *
 * Master specifications for:
 * - Model Scale Tiers: 8M, 32M, 128M, 512M, 1B, 7B
 * - FLOPs & Compute Accounting (6ND + Attention FLOPs, MFU/HFU calculation)
 * - Multi-Stage Learning Rate Schedules (Warmup-Cosine, WSD, 369 Harmonic Decay)
 * - Dynamic Batch & Micro-Batch Allocation (Global batch, micro-batch, gradient accumulation)
 * - Hardware Resource Planning (GPU VRAM, CPU threads, vLanes, 2GB Edge RSS limits)
 * - Checkpoint-Aware Scheduling & CAS Merkle Provenance
 * - Scientific Classification Invariants (REAL_MEASURED, SOFTWARE_VALIDATED, SIMULATED, THEORETICAL)
 */

import { ResultClassification } from '../../foundation/v1/types';
import { ScientificClassification } from '../../distillation/types';

// ─── 1. MODEL SCALE TIERS ───────────────────────────────────────────────────

export type ModelScaleTier = '8M' | '32M' | '128M' | '512M' | '1B' | '7B';

export interface ModelArchitectureDimensions {
  readonly scale: ModelScaleTier;
  readonly parameterCount: number;
  readonly hiddenDimension: number;
  readonly numLayers: number;
  readonly numAttentionHeads: number;
  readonly numKeyValueHeads: number;
  readonly intermediateDimension: number;
  readonly vocabSize: number;
  readonly maxContextLength: number;
}

// ─── 2. FLOPS & COMPUTE BUDGETING ───────────────────────────────────────────

export interface FLOPsEstimate {
  readonly scale: ModelScaleTier;
  readonly totalTokens: number;
  readonly forwardFlopsPerToken: number;        // ~ 2N
  readonly backwardFlopsPerToken: number;       // ~ 4N
  readonly attentionFlopsPerToken: number;      // 12 * L * H * D_head * T
  readonly totalFlopsPerToken: number;          // ~ 6N + Attn
  readonly totalComputeFLOPs: number;           // totalFlopsPerToken * totalTokens
  readonly totalPetaFLOPDays: number;           // totalComputeFLOPs / (10^15 * 86400)
  readonly estimatedMFUPercentage: number;      // e.g. 42.5% on modern hardware
}

export interface ComputeBudgetConfig {
  readonly targetScale: ModelScaleTier;
  readonly totalTargetTokens: number;
  readonly targetHardwareRanks: number;         // number of GPU/accelerator workers
  readonly hardwarePeakTFLOPS: number;          // peak theoretical TFLOPS per worker
  readonly targetTrainingHours: number;
}

// ─── 3. LEARNING RATE SCHEDULES ─────────────────────────────────────────────

export type LRScheduleType =
  | 'WARMUP_COSINE'
  | 'WARMUP_STABLE_DECAY'
  | 'HARMONIC_369_DECAY'
  | 'LINEAR_WARMUP_DECAY';

export interface LRScheduleConfig {
  readonly scheduleType: LRScheduleType;
  readonly peakLR: number;                     // e.g. 3.0e-4
  readonly minLR: number;                      // e.g. 3.0e-5
  readonly warmupSteps: number;                // e.g. 2000 steps
  readonly stableSteps?: number;               // for WSD schedule
  readonly totalSteps: number;                 // e.g. 50000 steps
  readonly triadicResetIntervalSteps?: number; // for 369 harmonic resets
}

// ─── 4. DYNAMIC BATCH & MEMORY ALLOCATION ───────────────────────────────────

export interface BatchAllocationConfig {
  readonly globalBatchSizeTokens: number;      // e.g. 524,288 tokens (0.5M)
  readonly microBatchSizePerDevice: number;    // e.g. 2 or 4 sequences
  readonly sequenceLengthTokens: number;       // e.g. 2048, 4096, 8192
  readonly dataParallelWorldSize: number;      // DP rank count
  readonly gradientAccumulationSteps: number;  // computed dynamically
  readonly isActivationCheckpointingEnabled: boolean;
  readonly estimatedActivationMemoryMB: number;
}

// ─── 5. HARDWARE RESOURCE ALLOCATION ────────────────────────────────────────

export interface ResourceAllocationConfig {
  readonly gpuVRAMPerRankMB: number;           // budget per accelerator
  readonly cpuWorkerThreads: number;           // CPU dataloader threads
  readonly vLaneCapacity: number;              // vLane compute lanes
  readonly is2GBEdgeProfile: boolean;          // true -> enforce <= 512 MB RSS
  readonly maxStreamBufferMB: number;          // <= 16 MB
}

// ─── 6. PRETRAINING SCHEDULE PLAN ───────────────────────────────────────────

export interface PretrainingStepEvent {
  readonly stepIndex: number;
  readonly activeLR: number;
  readonly globalBatchTokens: number;
  readonly cumulativeTokens: number;
  readonly cumulativeFLOPs: number;
  readonly shouldCheckpoint: boolean;
  readonly isLossDamped: boolean;
}

export interface PretrainingSchedulePlan {
  readonly planId: string;
  readonly scale: ModelScaleTier;
  readonly architecture: ModelArchitectureDimensions;
  readonly flopsEstimate: FLOPsEstimate;
  readonly lrConfig: LRScheduleConfig;
  readonly batchConfig: BatchAllocationConfig;
  readonly resourceConfig: ResourceAllocationConfig;
  readonly totalEstimatedSteps: number;
  readonly estimatedWallClockHours: number;
  readonly planMerkleRoot: string;
  readonly casPlanCid: string;
  readonly is2GBEdgeCompliant: boolean;
  readonly resultClassification: ResultClassification;
  readonly scientificClassification: ScientificClassification;
  readonly timestamp: number;
}

// ─── 7. TELEMETRY ───────────────────────────────────────────────────────────

export interface SchedulerTelemetry {
  readonly planId: string;
  readonly currentStep: number;
  readonly currentLR: number;
  readonly activeMFU: number;
  readonly tokensProcessed: number;
  readonly cumulativeComputeFLOPs: number;
  readonly residentMemoryBytes: number;        // process.memoryUsage().rss
  readonly vLaneUtilizationPercentage: number;
  readonly checkpointsTriggered: number;
  readonly is2GBEdgeCompliant: boolean;
  readonly classification: ResultClassification;
}
