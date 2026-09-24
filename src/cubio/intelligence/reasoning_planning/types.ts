/**
 * CubiO — Universal Spatial Operating Environment
 * Step 73: Advanced Reasoning & Planning Laboratory Types
 *
 * Master specifications for:
 * - Multi-Step Goal Decomposition & Tree Search Planners
 * - Tool-Use Trajectories & Sandboxed Execution Schemas
 * - Invariant Self-Verification & Dynamic Error Correction
 * - VCF Speculative Reasoning & Long-Context Retrieval
 * - Reasoning Quality Benchmarks & Latency/Memory Telemetry
 * - Cryptographic Trajectory Provenance (sigma^2 <= 1e-6)
 * - Scientific Classification Invariants (REAL_MEASURED, SOFTWARE_VALIDATED, SIMULATED, THEORETICAL)
 */

import { ResultClassification } from '../../foundation/v1/types';
import { ScientificClassification } from '../../distillation/types';
import { ModelScaleTier } from '../../training/pretraining_scheduler/types';

// ─── 1. GOAL DECOMPOSITION & PLANNING TYPES ─────────────────────────────────

export interface ReasoningGoal {
  readonly goalId: string;
  readonly description: string;
  readonly targetDomain: 'SPATIAL_GEOMETRY' | 'MATHEMATICAL_DEDUCTION' | 'SYSTEM_ORCHESTRATION' | 'CROSS_MODAL_RETRIEVAL';
  readonly maxDepth: number;
  readonly require369Invariance: boolean;
}

export interface PlanStep {
  readonly stepIndex: number;
  readonly stepName: string;
  readonly subGoal: string;
  readonly requiredToolName?: string;
  readonly inputParameters: Record<string, unknown>;
  readonly expectedInvariant: string;
}

export interface ReasoningPlan {
  readonly planId: string;
  readonly rootGoal: ReasoningGoal;
  readonly steps: readonly PlanStep[];
  readonly totalEstimatedTokens: number;
  readonly isDecompositionValid: boolean;
  readonly planHash: string;
}

// ─── 2. TOOL DEFINITIONS & TRAJECTORIES ──────────────────────────────────────

export interface ToolDefinition {
  readonly toolName: string;
  readonly description: string;
  readonly schema: Record<string, string>;
  readonly isSandboxed: boolean;
  readonly executionTimeoutMs: number;
}

export interface ToolInvocationRecord {
  readonly stepIndex: number;
  readonly toolName: string;
  readonly inputArgs: Record<string, unknown>;
  readonly outputResult: unknown;
  readonly executionDurationMs: number;
  readonly isSuccessful: boolean;
  readonly invocationMerkleHash: string;
}

// ─── 3. SELF-VERIFICATION & ERROR CORRECTION ────────────────────────────────

export interface VerificationVerdict {
  readonly stepIndex: number;
  readonly isStepValid: boolean;
  readonly reflectionScore: number;            // [0.0, 1.0]
  readonly invariantSatisfactionRate: number;  // [0.0, 1.0]
  readonly contradictionDetected: boolean;
  readonly suggestedCorrection?: string;
}

export interface ErrorRecoveryRecord {
  readonly stepIndex: number;
  readonly originalError: string;
  readonly backtrackStepIndex: number;
  readonly alternativeBranchTaken: string;
  readonly isRecoverySuccessful: boolean;
}

// ─── 4. VCF SPECULATIVE REASONING ───────────────────────────────────────────

export interface VCFSpeculativeBranch {
  readonly branchId: string;
  readonly speculativeSteps: readonly PlanStep[];
  readonly vcfResonanceScore: number;          // [0.0, 1.0]
  readonly coherenceConfidence: number;
  readonly isSelectedPath: boolean;
}

// ─── 5. TRAJECTORY LOGS & QUALITY BENCHMARKS ────────────────────────────────

export interface TrajectoryLog {
  readonly trajectoryId: string;
  readonly goal: ReasoningGoal;
  readonly executedSteps: readonly PlanStep[];
  readonly toolInvocations: readonly ToolInvocationRecord[];
  readonly verifications: readonly VerificationVerdict[];
  readonly recoveries: readonly ErrorRecoveryRecord[];
  readonly totalWallClockDurationMs: number;
  readonly totalTokensConsumed: number;
  readonly peakResidentMemoryBytes: number;    // <= 512 MB
  readonly trajectoryMerkleRoot: string;
  readonly isBitForBitDeterministic: boolean;
}

export interface ReasoningBenchmarkMetrics {
  readonly totalTasksEvaluated: number;
  readonly taskCompletionAccuracyPercentage: number;
  readonly planningSuccessRatePercentage: number;
  readonly toolCallPrecisionPercentage: number;
  readonly selfVerificationF1Score: number;
  readonly errorRecoverySuccessPercentage: number;
  readonly averageLatencyPerStepMs: number;
  readonly averageTokensPerTask: number;
  readonly peakProcessRSSBytes: number;
  readonly isEdge2GBCompliant: boolean;
}

// ─── 6. MASTER MANIFEST ─────────────────────────────────────────────────────

export interface ReasoningPlanningManifest {
  readonly manifestId: string;
  readonly benchmarkMetrics: ReasoningBenchmarkMetrics;
  readonly sampleTrajectoriesCount: number;
  readonly masterReasoningMerkleRoot: string;
  readonly isProductionReady: boolean;
  readonly isEdge2GBCompliant: boolean;
  readonly resultClassification: ResultClassification;
  readonly scientificClassification: ScientificClassification;
  readonly timestamp: number;
}
