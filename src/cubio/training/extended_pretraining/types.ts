/**
 * CubiO — Universal Spatial Operating Environment
 * Step 75: Extended Real Pretraining & Training Maturity Types
 *
 * Master specifications for:
 * - Extended Pretraining Configuration (RC_128M / RC_512M)
 * - Resumption from Step 74 Checkpoint & Cumulative Parameter Evolution Proofs
 * - Millions+ Real Curated Token Streaming (Text, Vision, Audio, 3D Spatial)
 * - Held-Out Validation & Empirical Generalization (Delta L_val < 0)
 * - Hardware Telemetry & 2GB Edge Working Set Accounting (RSS <= 512 MB)
 * - Training Maturity Gating & Scientific Certification (REAL_MEASURED, SOFTWARE_VALIDATED, SIMULATED, THEORETICAL)
 */

import { ResultClassification } from '../../foundation/v1/types';
import { ScientificClassification } from '../../distillation/types';
import { V3ReleaseTier } from '../../foundation/v3/types';
import { ModelScaleTier } from '../pretraining_scheduler/types';
import { ParameterDeltaProof } from '../production_launch/types';

// ─── 1. RUN CONFIGURATION ───────────────────────────────────────────────────

export interface ExtendedPretrainingConfig {
  readonly runId: string;
  readonly releaseTier: V3ReleaseTier;
  readonly baseScale: ModelScaleTier;
  readonly resumedFromCheckpointCID: string;
  readonly totalExtendedSteps: number;
  readonly batchSize: number;
  readonly sequenceLength: number;
  readonly baseLearningRate: number;
  readonly minLearningRate: number;
  readonly totalTokensTarget: number;          // Millions+ tokens
  readonly validationIntervalSteps: number;
  readonly seed: number;
  readonly datasetVersion: string;
}

// ─── 2. HELD-OUT VALIDATION METRICS ─────────────────────────────────────────

export interface HeldOutValidationMetrics {
  readonly stepIndex: number;
  readonly validationLoss: number;
  readonly validationPerplexity: number;
  readonly deltaValidationLossPercentage: number; // relative to step 0
  readonly isGeneralizationHealthy: boolean;    // no overfitting
  readonly validationMerkleHash: string;
}

// ─── 3. EXTENDED STEP TELEMETRY ─────────────────────────────────────────────

export interface ExtendedStepTelemetry {
  readonly stepIndex: number;
  readonly trainLoss: number;
  readonly validationLoss: number;
  readonly validationPerplexity: number;
  readonly gradientNorm: number;
  readonly activeLearningRate: number;
  readonly wallClockStepMs: number;
  readonly physicalResidentBytes: number;       // process.memoryUsage().rss
  readonly tokenThroughputTokPerSec: number;
  readonly cumulativeTokensProcessed: number;
  readonly is2GBEdgeCompliant: boolean;
  readonly stepMerkleHash: string;
}

// ─── 4. TRAINING MATURITY VERDICT ───────────────────────────────────────────

export interface TrainingMaturityVerdict {
  readonly isMaturityAchieved: boolean;
  readonly isGradientStable: boolean;          // ||g||_2 <= 1.0
  readonly isLossConverged: boolean;           // > 35% cumulative loss decay
  readonly isGeneralizationConfirmed: boolean; // held-out perplexity improved
  readonly isParameterShiftBounded: boolean;   // ||delta w||_2 > 0 and finite
  readonly isEdge2GBCompliant: boolean;        // RSS <= 512 MB
  readonly maturityScore: number;              // [0.0, 1.0]
}

// ─── 5. MASTER EXTENDED MANIFEST ────────────────────────────────────────────

export interface ExtendedPretrainingManifest {
  readonly manifestId: string;
  readonly runConfig: ExtendedPretrainingConfig;
  readonly parameterProof: ParameterDeltaProof;
  readonly cumulativeParameterShiftNorm: number;// ||w_75 - w_init||_2
  readonly totalTokensTrained: number;         // Millions+
  readonly totalOptimizerUpdatesApplied: number;
  readonly initialLoss: number;
  readonly finalTrainLoss: number;
  readonly finalValidationLoss: number;
  readonly finalValidationPerplexity: number;
  readonly peakProcessRSSBytes: number;        // <= 512 MB
  readonly totalWallClockDurationSeconds: number;
  readonly averageThroughputTokPerSec: number;
  readonly maturityVerdict: TrainingMaturityVerdict;
  readonly finalCheckpointCID: string;
  readonly masterExtendedMerkleRoot: string;
  readonly isOfficiallyMature: boolean;
  readonly resultClassification: ResultClassification;
  readonly scientificClassification: ScientificClassification;
  readonly timestamp: number;
}
