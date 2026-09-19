/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 46: Step 45 Native Multimodal Training at Scale Types
 *
 * Master specifications for:
 * - Unified Multimodal Batches (Text, Image, Audio, 3D)
 * - Modality-Balanced Sampling & Modality Dropout
 * - Cross-Modal Pairing (Positive, Negative, Hard Negatives)
 * - Multimodal Loss Decomposition (Alignment, Contrastive, 369 Harmonic, Preservation)
 * - SFT -> DPO -> Online RL Multimodal Training Lifecycle
 * - Cross-Modal Translation Evaluation across all 7 Modality Paths
 * - 2GB Physical Working-Set Bound (<= 512 MB physical RSS)
 */

import { ModalityType, CubiOMultimodalState } from '../../multimodal/types';
import { QuantizationFormat } from '../../compute/quantization/types';
import { ScientificClassification } from '../../distillation/types';

// ─── 1. MULTIMODAL BATCH & SAMPLES ──────────────────────────────────────────

export interface NativeMultimodalSample {
  readonly sampleId: string;
  readonly promptModality: ModalityType;
  readonly targetModality: ModalityType;
  readonly rawPrompt: string;
  readonly chosenTarget: any;
  readonly rejectedTarget?: any;
  readonly digitalRoot369: number;
  readonly harmonicFluxWeight: number;
  readonly casPayloadCid: string;
  readonly checksum: string;
}

export interface UnifiedMultimodalBatch {
  readonly batchId: string;
  readonly samples: readonly NativeMultimodalSample[];
  readonly modalityCounts: Readonly<Record<ModalityType, number>>;
  readonly totalTokens: number;
  readonly totalBytes: number;
  readonly activeDropoutRatio: number;
  readonly batchChecksum: string;
}

// ─── 2. CROSS-MODAL PAIRING & ALIGNMENT ─────────────────────────────────────

export type MultimodalPairType = 'POSITIVE_MATCH' | 'NEGATIVE_UNMATCHED' | 'HARD_NEGATIVE';

export interface ScaledCrossModalPair {
  readonly pairId: string;
  readonly sourceModality: ModalityType;
  readonly targetModality: ModalityType;
  readonly pairType: MultimodalPairType;
  readonly sourceVector: readonly number[];
  readonly targetVector: readonly number[];
  readonly targetSimilarity: number; // 1.0 (pos) or 0.0 (neg)
  readonly digitalRootWeight: number;
}

// ─── 3. MULTIMODAL LOSS DECOMPOSITION ───────────────────────────────────────

export interface ScaledMultimodalLossBreakdown {
  readonly totalLoss: number;
  readonly alignmentLoss: number;
  readonly contrastiveLoss: number;
  readonly loss369: number;
  readonly modalityPreservationLoss: number;
  readonly gradientNorm: number;
  readonly activeQuantization: QuantizationFormat;
  readonly evaluatedPairsCount: number;
}

// ─── 4. TRAINING & EVALUATION TELEMETRY ─────────────────────────────────────

export type MultimodalStageType = 'SFT' | 'DPO' | 'ONLINE_RL';

export interface MultimodalEpochReport {
  readonly epoch: number;
  readonly stage: MultimodalStageType;
  readonly samplesTrained: number;
  readonly loss: number;
  readonly crossModalAccuracy: number;
  readonly throughputSamplesPerSec: number;
  readonly peakResidentMemoryBytes: number;
  readonly is2GBEdgeCompliant: boolean;
  readonly checkpointCid: string;
  readonly merkleRoot: string;
  readonly timestamp: number;
}

export interface CrossModalPathScore {
  readonly path: string; // e.g. "TEXT -> IMAGE", "3D -> TEXT"
  readonly fidelityScore: number; // 0.0 - 1.0
  readonly meanLatencyMs: number;
  readonly isConverged: boolean;
}

export interface MultimodalEvaluationReport {
  readonly evaluationId: string;
  readonly overallFidelity: number;
  readonly pathScores: readonly CrossModalPathScore[];
  readonly harmonic369AlignmentScore: number;
  readonly scientificClassification: ScientificClassification;
  readonly timestamp: number;
}
