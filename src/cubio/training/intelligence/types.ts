/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 54: Step 53 Autonomous Training Intelligence Types
 *
 * Master specifications for:
 * - Real-Time Loss, Gradient Norm, RAM & Throughput Telemetry Monitoring
 * - Autonomous Anomaly Detection (Loss Divergence, Gradient Explosion, RAM Spike, Stall)
 * - Dynamic Hyperparameter Adaptation (Batch Size, Learning Rate, Quantization Precision)
 * - Automated Merkle-Checkpointing & Instant Divergence Rollback
 * - Strict 2GB Edge Memory-Bounded Processing (<= 512 MB physical RSS)
 */

import { QuantizationFormat } from '../../compute/quantization/types';
import { ScientificClassification } from '../../distillation/types';

// ─── 1. ANOMALIES & ACTIONS ─────────────────────────────────────────────────

export type TrainingAnomalyType =
  | 'HEALTHY'
  | 'LOSS_DIVERGENCE'
  | 'GRADIENT_EXPLOSION'
  | 'RAM_PRESSURE_WARNING'
  | 'THROUGHPUT_STALL';

export type AutonomousTrainingAction =
  | 'NO_ACTION'
  | 'INCREASE_BATCH_SIZE'
  | 'DECREASE_BATCH_SIZE'
  | 'REDUCE_LEARNING_RATE'
  | 'TRIGGER_EARLY_CHECKPOINT'
  | 'SWITCH_PRECISION_INT4'
  | 'SWITCH_PRECISION_INT8'
  | 'RESTART_LAST_STABLE_CHECKPOINT';

export interface TrainingHealthTelemetry {
  readonly step: number;
  readonly loss: number;
  readonly gradNorm: number;
  readonly residentRAMBytes: number;
  readonly tokensPerSecond: number;
  readonly isLossDecreasing: boolean;
}

export interface AutonomousPolicyDecision {
  readonly decisionId: string;
  readonly step: number;
  readonly detectedAnomaly: TrainingAnomalyType;
  readonly actionTaken: AutonomousTrainingAction;
  readonly reason: string;
  readonly adjustedLearningRate: number;
  readonly adjustedBatchSize: number;
  readonly adjustedPrecision: QuantizationFormat;
  readonly restoredCheckpointCid?: string;
  readonly is2GBEdgeCompliant: boolean;
  readonly timestamp: number;
}

// ─── 2. AUTONOMOUS INTELLIGENCE REPORT ──────────────────────────────────────

export interface AutonomousTrainingReport {
  readonly reportId: string;
  readonly totalStepsMonitored: number;
  readonly anomaliesDetectedCount: number;
  readonly actionsTriggeredCount: number;
  readonly currentStatus: TrainingAnomalyType;
  readonly lastStableCheckpointCid: string;
  readonly is2GBEdgeCompliant: boolean;
  readonly scientificClassification: ScientificClassification;
  readonly timestamp: number;
}
