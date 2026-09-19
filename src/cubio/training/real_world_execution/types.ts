/**
 * CubiO — Universal Spatial Operating Environment
 * Step 71: Real-World Pretraining Execution Types
 *
 * Master specifications for:
 * - Real-World Pretraining Configurations (RC_128M, RC_512M)
 * - Step-by-Step Training Telemetry & Merkle Roots
 * - Hardware Resource Ledgers (Wall Clock, Process RSS, Tokens/sec, Joules)
 * - Loss Curves & Empirical Convergence Tracking
 * - Pretraining Manifests & Scientific Classifications (REAL_MEASURED, SOFTWARE_VALIDATED, SIMULATED, THEORETICAL)
 */

import { ResultClassification } from '../../foundation/v1/types';
import { ScientificClassification } from '../../distillation/types';
import { V3ReleaseTier } from '../../foundation/v3/types';
import { ModelScaleTier } from '../pretraining_scheduler/types';

// ─── 1. RUN CONFIGURATION ───────────────────────────────────────────────────

export interface PretrainingRunConfig {
  readonly runId: string;
  readonly releaseTier: V3ReleaseTier;
  readonly baseScale: ModelScaleTier;
  readonly totalSteps: number;
  readonly batchSize: number;
  readonly sequenceLength: number;
  readonly baseLearningRate: number;
  readonly warmupSteps: number;
  readonly weightDecay: number;
  readonly gradClipThreshold: number;
  readonly seed: number;
  readonly datasetVersion: string;
}

// ─── 2. TELEMETRY & RESOURCE ACCOUNTING ─────────────────────────────────────

export interface HardwareTelemetrySnapshot {
  readonly stepIndex: number;
  readonly wallClockDurationMs: number;
  readonly physicalResidentMemoryBytes: number; // process.memoryUsage().rss
  readonly tokenThroughputPerSecond: number;
  readonly estimatedEnergyJoules: number;
  readonly vLaneUtilizationPercentage: number;
  readonly is2GBEdgeCompliant: boolean;
}

export interface StepConvergenceRecord {
  readonly stepIndex: number;
  readonly trainLoss: number;
  readonly validationPerplexity: number;
  readonly gradientNorm: number;
  readonly activeLearningRate: number;
  readonly isLossSpikeDamped: boolean;
  readonly stepMerkleHash: string;
}

export interface EnergyRAMLedger {
  readonly totalTokensProcessed: number;
  readonly totalWallClockTimeSeconds: number;
  readonly averageThroughputTokPerSec: number;
  readonly peakResidentMemoryBytes: number;     // <= 512 MB
  readonly totalEnergyDissipatedJoules: number;
  readonly energyEfficiencyTokPerJoule: number;
  readonly is2GBEdgeCompliant: boolean;
}

// ─── 3. PRETRAINING MANIFEST ────────────────────────────────────────────────

export interface PretrainingRunManifest {
  readonly manifestId: string;
  readonly runConfig: PretrainingRunConfig;
  readonly ledger: EnergyRAMLedger;
  readonly finalTrainLoss: number;
  readonly finalValidationPerplexity: number;
  readonly totalCheckpointsSaved: number;
  readonly masterRunMerkleRoot: string;
  readonly isCompletedSuccessfully: boolean;
  readonly resultClassification: ResultClassification;
  readonly scientificClassification: ScientificClassification;
  readonly timestamp: number;
}
