/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 31: Step 30 CubiO Native Training Engine Types
 *
 * Master specifications for:
 * - Multi-Mode Unified Training Pipeline (SFT, Online RL, DPO, Self-Play)
 * - 369 Harmonic Dataset Encoding & Gradient Computation
 * - Tile-Based Quantized Backpropagation (INT8/FP16 Selective Updates)
 * - 2GB Physical Working-Set Bound on Training (<= 512 MB physical RSS)
 * - Comparative Benchmark: Normal RAM Training vs CubiO Virtualized Training
 * - Checkpoint Packaging & Deterministic Model Distillation
 */

import { QuantizationFormat } from '../compute/quantization/types';
import { ComputeBackendType } from '../compute/backends/types';
import { MemoryPressureState, WorkingSetTier } from '../compute/memory/types';
import { EdgeProfileName } from '../fabric/types';
import { ScientificClassification } from '../distillation/types';
import { EnvAction, EnvObservation } from '../learning/env/types';

// ─── 1. TRAINING MODES & DATASET SCHEMAS ────────────────────────────────────

export type TrainingMode = 'SFT' | 'RL' | 'DPO' | 'SELF_PLAY_DISTILLATION';

export interface SFTDatasetItem {
  readonly itemId: string;
  readonly promptText: string;
  readonly targetOutputText: string;
  readonly harmonicWeight: number; // 369 flux weight
}

export interface DPODatasetItem {
  readonly itemId: string;
  readonly promptText: string;
  readonly preferredResponse: string;
  readonly rejectedResponse: string;
  readonly preferenceMargin: number; // > 0.0
}

export interface RLTrainingEpisode {
  readonly episodeId: string;
  readonly initialObservation: EnvObservation;
  readonly actions: readonly EnvAction[];
  readonly cumulativeReward: number;
  readonly terminalSuccess: boolean;
}

// ─── 2. TILE-BASED GRADIENT BACKPROPAGATION ─────────────────────────────────

export interface TileGradientRecord {
  readonly tileId: string;
  readonly layerIndex: number;
  readonly parameterCount: number;
  readonly gradientNorm: number;
  readonly learningRate: number;
  readonly memoryAllocatedBytes: number;
  readonly isUpdated: boolean;
  readonly checksum: string;
}

export interface TrainingStepTelemetry {
  readonly stepIndex: number;
  readonly mode: TrainingMode;
  readonly loss: number;
  readonly reward?: number;
  readonly dpoMarginLoss?: number;
  readonly activeTileCount: number;
  readonly residentWorkingSetBytes: number;
  readonly maxWorkingSetLimitBytes: number;
  readonly isMemoryCompliant: boolean;
  readonly stepDurationMs: number;
  readonly activeQuantization: QuantizationFormat;
  readonly provenanceHash: string;
}

// ─── 3. COMPARATIVE BENCHMARK: NORMAL VS CUBIO VIRTUALIZED TRAINING ────────

export interface TrainingComparisonReport {
  readonly benchmarkId: string;
  readonly modelParameterCount: number;
  readonly normalApproach: {
    readonly requiredPhysicalRamBytes: number;
    readonly wouldOOMOn2GB: boolean;
    readonly peakResidentRamBytes: number;
    readonly status: 'OOM_CRASH' | 'SWAP_THRASHING' | 'EXECUTED_HEAVY';
  };
  readonly cubioApproach: {
    readonly physicalWorkingSetLimitBytes: number;
    readonly peakResidentRamBytes: number;
    readonly isWorkingSetCompliant: boolean;
    readonly status: 'SUCCESS_BOUNDED_EXECUTION';
    readonly memorySavingsRatio: number;
  };
  readonly throughputSamplesPerSec: number;
  readonly finalLoss: number;
  readonly scientificClassification: ScientificClassification;
  readonly provenanceHash: string;
}

// ─── 4. TRAINING ENGINE CONFIG ──────────────────────────────────────────────

export interface TrainingEngineConfig {
  readonly modelId: string;
  readonly totalLayers: number;
  readonly hiddenDimension: number;
  readonly defaultQuantization: QuantizationFormat;
  readonly edgeProfile: EdgeProfileName;
  readonly maxWorkingSetBytes: number;
  readonly learningRate: number;
  readonly batchSize: number;
  readonly masterSeed: number;
}
