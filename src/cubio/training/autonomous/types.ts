/**
 * CubiO — Universal Spatial Operating Environment
 * Step 59: Autonomous Continuous Training Types
 *
 * Master specifications for:
 * - 14-Metric Training Telemetry (loss, val loss, grad norm, lr, throughput, RAM, VRAM, CPU, GPU, network, CAS latency, worker health, convergence, data quality)
 * - 12 Autonomous Decision Actions
 * - Tamper-Evident Merkle Decision Logging
 * - Deterministic Replay & Experiment Reproducibility
 */

import { QuantizationFormat } from '../../compute/quantization/types';
import { ResultClassification } from '../../foundation/v1/types';
import { ScientificClassification } from '../../distillation/types';

// ─── 1. 14-METRIC COMPREHENSIVE TELEMETRY ───────────────────────────────────

export interface AutonomousTelemetryMetrics {
  readonly step: number;
  readonly trainingLoss: number;
  readonly validationLoss: number;
  readonly gradientNorm: number;
  readonly learningRate: number;
  readonly throughputTokensPerSec: number;
  readonly residentRAMBytes: number;
  readonly residentVRAMBytes: number;
  readonly cpuUtilizationPercentage: number;
  readonly gpuUtilizationPercentage: number;
  readonly networkBandwidthMbps: number;
  readonly casAccessLatencyMs: number;
  readonly activeWorkerHealthScore: number; // 0.0 - 1.0
  readonly convergenceRate: number;         // Negative gradient of loss curve
  readonly dataQualityScore: number;        // 0.0 - 1.0
  readonly timestamp: number;
}

// ─── 2. AUTONOMOUS ACTIONS ──────────────────────────────────────────────────

export type AutonomousActionType =
  | 'ADJUST_BATCH_SIZE'
  | 'ADJUST_GRADIENT_ACCUMULATION'
  | 'CHANGE_PRECISION'
  | 'ADJUST_VLANE_ALLOCATION'
  | 'ALLOCATE_WORKERS'
  | 'SCHEDULE_LEARNING_RATE'
  | 'TRIGGER_CHECKPOINT'
  | 'RESAMPLE_DATASET'
  | 'BALANCE_MODALITIES'
  | 'EXECUTE_RETRY_RECOVERY'
  | 'PAUSE_RESUME_TRAINING'
  | 'TRIGGER_EARLY_STOPPING'
  | 'MAINTAIN_NOMINAL';

export interface AutonomousDecisionRecord {
  readonly decisionId: string;
  readonly step: number;
  readonly action: AutonomousActionType;
  readonly reason: string;
  readonly previousState: {
    readonly batchSize: number;
    readonly gradAccumSteps: number;
    readonly precision: QuantizationFormat;
    readonly activeVLanes: number;
    readonly activeWorkers: number;
    readonly learningRate: number;
  };
  readonly newState: {
    readonly batchSize: number;
    readonly gradAccumSteps: number;
    readonly precision: QuantizationFormat;
    readonly activeVLanes: number;
    readonly activeWorkers: number;
    readonly learningRate: number;
  };
  readonly telemetrySnapshot: AutonomousTelemetryMetrics;
  readonly is2GBEdgeCompliant: boolean;
  readonly decisionChecksum: string;
  readonly previousDecisionChecksum: string; // Merkle log chain
  readonly timestamp: number;
}

// ─── 3. DETERMINISTIC REPLAY ────────────────────────────────────────────────

export interface DecisionReplayResult {
  readonly totalDecisionsReplayed: number;
  readonly isBitForBitConsistent: boolean;
  readonly finalStateChecksum: string;
  readonly replayLatencyMs: number;
  readonly verificationStatus: 'REPLAY_VERIFIED' | 'DIVERGENCE_DETECTED';
}

// ─── 4. CONTINUOUS TRAINING REPORT ──────────────────────────────────────────

export interface ContinuousTrainingReport {
  readonly reportId: string;
  readonly totalStepsMonitored: number;
  readonly totalDecisionsLogged: number;
  readonly currentTrainingState: {
    readonly batchSize: number;
    readonly gradAccumSteps: number;
    readonly precision: QuantizationFormat;
    readonly activeVLanes: number;
    readonly activeWorkers: number;
    readonly learningRate: number;
  };
  readonly decisionLogMerkleRoot: string;
  readonly is2GBEdgeCompliant: boolean;
  readonly resultClassification: ResultClassification;
  readonly scientificClassification: ScientificClassification;
  readonly timestamp: number;
}
