/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 55: Step 54 Large-Scale Training Validation Types
 *
 * Master specifications for:
 * - 128M / 512M / 1B Parameter Multi-Node Scaling Validation
 * - Scaling Efficiency, Tokens/Sec Throughput & Memory per Parameter
 * - Communication Overhead (AllReduce Gradient Sync Latency)
 * - Convergence Loss Curve Validation
 * - Bit-for-Bit Deterministic Reproducibility Proofs (sigma^2 = 0.0)
 * - Strict 2GB Edge Working-Set Enforcement (<= 512 MB physical RSS)
 */

import { FoundationScaleTier } from '../../foundation/scaling/types';
import { ScientificClassification } from '../../distillation/types';

// ─── 1. BENCHMARK & SCALING METRICS ─────────────────────────────────────────

export type ValidationScaleProfile = 'VAL_128M' | 'VAL_512M' | 'VAL_1B';

export interface MultiNodeBenchmarkResult {
  readonly benchmarkId: string;
  readonly profile: ValidationScaleProfile;
  readonly totalParameters: number;
  readonly activeClusterNodes: number;
  readonly throughputTokensPerSec: number;
  readonly scalingEfficiencyPercentage: number; // Target > 85%
  readonly memoryPerParameterBytes: number; // Quantized INT8: ~1-2 bytes
  readonly allreduceLatencyMs: number;
  readonly is2GBEdgeCompliant: boolean;
  readonly benchmarkChecksum: string;
}

// ─── 2. CONVERGENCE & REPRODUCIBILITY ───────────────────────────────────────

export interface ConvergenceValidationReport {
  readonly validationId: string;
  readonly profile: ValidationScaleProfile;
  readonly initialLoss: number;
  readonly finalLoss: number;
  readonly lossReductionPercentage: number;
  readonly isMonotonicallyDecreasing: boolean;
  readonly perplexity: number;
  readonly convergenceScore: number; // 0.0 - 1.0
}

export interface ReproducibilityProof {
  readonly proofId: string;
  readonly profile: ValidationScaleProfile;
  readonly runAHash: string;
  readonly runBHash: string;
  readonly parameterVarianceSigmaSq: number; // Must be exactly 0.0
  readonly isBitForBitIdentical: boolean;
  readonly merkleProvenanceCid: string;
  readonly timestamp: number;
}

// ─── 3. LARGE-SCALE VALIDATION CERTIFICATE ──────────────────────────────────

export interface LargeScaleValidationCertificate {
  readonly certificateId: string;
  readonly certifiedScaleProfiles: readonly ValidationScaleProfile[];
  readonly benchmarks: readonly MultiNodeBenchmarkResult[];
  readonly convergenceReports: readonly ConvergenceValidationReport[];
  readonly reproducibilityProofs: readonly ReproducibilityProof[];
  readonly overallValidationStatus: 'VERIFIED_PRODUCTION_GRADE' | 'FAILED';
  readonly is2GBEdgeCompliant: boolean;
  readonly scientificClassification: ScientificClassification;
  readonly timestamp: number;
}
