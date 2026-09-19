/**
 * CubiO — Universal Spatial Operating Environment
 * Step 74: CubiO Production Foundation Model Training Launch Types
 *
 * Master specifications for:
 * - Production Training Run Configurations (RC_128M, RC_512M)
 * - Parameter Delta Proofs (Delta w != 0, optimizerUpdateCount > 0)
 * - Real AdamW Optimizer State & Momentum Tensors
 * - Real Curated Multimodal Dataset Streams
 * - Hardware Telemetry & 2GB Edge Working Set Ledgers (RSS <= 512 MB)
 * - Before/After Checkpoint Verification & Deterministic Resume (sigma^2 = 0.0)
 * - Scientific Classifications (REAL_MEASURED, SOFTWARE_VALIDATED, SIMULATED, THEORETICAL)
 */

import { ResultClassification } from '../../foundation/v1/types';
import { ScientificClassification } from '../../distillation/types';
import { V3ReleaseTier } from '../../foundation/v3/types';
import { ModelScaleTier } from '../pretraining_scheduler/types';

// ─── 1. RUN CONFIGURATION ───────────────────────────────────────────────────

export interface ProductionTrainingConfig {
  readonly runId: string;
  readonly releaseTier: V3ReleaseTier;
  readonly baseScale: ModelScaleTier;
  readonly targetTotalSteps: number;
  readonly batchSize: number;
  readonly sequenceLength: number;
  readonly learningRate: number;
  readonly minLearningRate: number;
  readonly warmupSteps: number;
  readonly beta1: number;                      // 0.9
  readonly beta2: number;                      // 0.95
  readonly epsilon: number;                    // 1e-8
  readonly weightDecay: number;                // 0.1
  readonly maxGradNorm: number;                // 1.0
  readonly seed: number;
  readonly datasetVersion: string;
}

// ─── 2. PARAMETER DELTA & OPTIMIZER PROOF ───────────────────────────────────

export interface ParameterDeltaProof {
  readonly initialParamChecksum: string;
  readonly finalParamChecksum: string;
  readonly areParametersUpdated: boolean;       // delta w != 0
  readonly totalParametersTracked: number;
  readonly l2ParameterDeltaNorm: number;        // ||w_final - w_initial||_2 > 0
  readonly totalOptimizerUpdatesApplied: number;// optimizerUpdateCount > 0
  readonly maxSingleWeightShift: number;
}

// ─── 3. STEP TELEMETRY & CONVERGENCE ────────────────────────────────────────

export interface ProductionStepTelemetry {
  readonly stepIndex: number;
  readonly loss: number;
  readonly perplexity: number;
  readonly gradientNorm: number;
  readonly activeLearningRate: number;
  readonly wallClockStepMs: number;
  readonly physicalResidentBytes: number;       // process.memoryUsage().rss
  readonly tokenThroughputTokPerSec: number;
  readonly is2GBEdgeCompliant: boolean;
  readonly stepMerkleHash: string;
}

// ─── 4. CHECKPOINT PAIR & RESUME PROOF ──────────────────────────────────────

export interface ProductionCheckpointPair {
  readonly initialCheckpointCID: string;
  readonly trainedCheckpointCID: string;
  readonly initialLoss: number;
  readonly finalLoss: number;
  readonly isLossStrictlyDecreased: boolean;
  readonly isResumeBitForBitDeterministic: boolean; // sigma^2 = 0.0
}

// ─── 5. MASTER PRODUCTION LAUNCH MANIFEST ───────────────────────────────────

export interface ProductionTrainingManifest {
  readonly manifestId: string;
  readonly runConfig: ProductionTrainingConfig;
  readonly parameterProof: ParameterDeltaProof;
  readonly checkpointPair: ProductionCheckpointPair;
  readonly totalTokensTrained: number;
  readonly totalWallClockDurationSeconds: number;
  readonly averageThroughputTokPerSec: number;
  readonly peakProcessRSSBytes: number;         // <= 512 MB
  readonly initialLoss: number;
  readonly finalLoss: number;
  readonly finalValidationPerplexity: number;
  readonly masterLaunchMerkleRoot: string;
  readonly isOfficiallyProductionTrained: boolean;
  readonly resultClassification: ResultClassification;
  readonly scientificClassification: ScientificClassification;
  readonly timestamp: number;
}
