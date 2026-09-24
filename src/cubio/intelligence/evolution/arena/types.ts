/**
 * CubiO — Universal Spatial Operating Environment
 * Layer 6: Real-World Empirical Intelligence Arena Types
 *
 * Grounded definitions for measuring Quality (Accuracy, Invariants, Hallucination-Free)
 * and Efficiency (Latency, Cost) to compute the unified CII SCORE / 100 across models.
 */

import { ModelCandidateId } from '../comparative/types';

export type RealTaskCategory =
  | 'SPATIAL_CAD_ENGINEERING'
  | 'MULTIMODAL_OPTICAL_PHYSICS'
  | 'MULTILINGUAL_528HZ_VOICE'
  | 'SANDBOXED_CODE_AST_SAFETY'
  | 'LONG_HORIZON_STATE_CONTINUITY'
  | 'MULTI_AGENT_SWARM_SYNTHESIS';

export interface RealWorldTaskDefinition {
  readonly taskId: string;
  readonly category: RealTaskCategory;
  readonly title: string;
  readonly prompt: string;
  readonly inputPayload: unknown;
  readonly groundTruthOracle: (output: unknown) => {
    readonly passed: boolean;
    readonly accuracyScore: number; // 0.0 .. 1.0
    readonly topologicalOrPhysicalInvariantSatisfied: boolean;
    readonly hallucinationDetected: boolean;
    readonly feedback: string;
  };
}

export interface ModelTaskExecutionResult {
  readonly taskId: string;
  readonly modelId: ModelCandidateId;
  readonly displayName: string;
  readonly rawOutput: unknown;
  readonly executionLatencyMs: number;
  readonly accuracyScore: number; // 0.0 .. 100.0
  readonly invariantScore: number; // 0.0 .. 100.0
  readonly hallucinationRatePercent: number; // 0.0 .. 100.0
  readonly qualityScore: number; // 0.0 .. 100.0
  readonly efficiencyScore: number; // 0.0 .. 100.0
  readonly ciiScoreTask: number; // 0.0 .. 100.0
}

export interface ModelArenaAggregateSummary {
  readonly rank: number;
  readonly modelId: ModelCandidateId;
  readonly displayName: string;
  readonly avgQualityScore: number; // 0.0 .. 100.0
  readonly avgEfficiencyScore: number; // 0.0 .. 100.0
  readonly avgAccuracyPercent: number;
  readonly avgLatencyMs: number;
  readonly overallHallucinationRatePercent: number;
  readonly ciiScoreOutOf100: number; // 0.0 .. 100.0
  readonly taskResults: readonly ModelTaskExecutionResult[];
}

export interface ComparativeArenaReport {
  readonly arenaRunId: string;
  readonly totalRealTasksEvaluated: number;
  readonly leaderboard: readonly ModelArenaAggregateSummary[];
  readonly winnerModelId: ModelCandidateId;
  readonly winnerDisplayName: string;
  readonly cubioAdvantageFactors: {
    readonly qualitySuperiorityFactor: number;
    readonly latencySpeedupFactor: number;
    readonly hallucinationReductionFactor: number;
  };
  readonly arenaSealHash: string;
  readonly timestamp: number;
}

export interface IEmpiricalEvaluationArena {
  runRealWorldArena(): Promise<ComparativeArenaReport>;
}
