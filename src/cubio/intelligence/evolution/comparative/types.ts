/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F101: LLM Comparative Benchmark Types
 *
 * Contracts for multi-model candidate evaluation (CubiO vs GPT-4o, Claude 3.7, Gemini 2.0, DeepSeek-R1),
 * spatial accuracy, hallucination rates, latency, and composite intelligence ratios.
 */

export type ModelCandidateId =
  | 'CUBIO_SOVEREIGN_ENSEMBLE'
  | 'OPENAI_GPT_4O'
  | 'ANTHROPIC_CLAUDE_3_7_SONNET'
  | 'GOOGLE_GEMINI_2_0_PRO'
  | 'DEEPSEEK_R1';

export type ComparativeDimension =
  | 'SPATIAL_3D_TOPOLOGY'
  | 'DETERMINISTIC_HARMONIC_REASONING'
  | 'SANDBOX_TOOL_POLICY_SAFETY'
  | 'LONG_HORIZON_STATE_CONTINUITY'
  | 'MULTILINGUAL_528HZ_VOICE'
  | 'LATENCY_THROUGHPUT_EFFICIENCY';

export interface ModelProfile {
  readonly modelId: ModelCandidateId;
  readonly displayName: string;
  readonly provider: string;
  readonly architecture: string;
  readonly isSovereignLocal: boolean;
  readonly contextWindowTokens: number;
  readonly typicalLatencyMs: number;
  readonly nativeVoiceSupport: boolean;
  readonly native3DManifoldSupport: boolean;
}

export interface ComparativeScenario {
  readonly scenarioId: string;
  readonly dimension: ComparativeDimension;
  readonly prompt: string;
  readonly complexity: 'STANDARD' | 'HARD' | 'EXTREME';
  readonly groundTruthVerifier: (modelOutput: unknown) => {
    readonly passed: boolean;
    readonly hallucinationDetected: boolean;
    readonly accuracyScore: number; // 0.0 .. 1.0
    readonly notes?: string;
  };
}

export interface ModelDimensionScore {
  readonly dimension: ComparativeDimension;
  readonly accuracyPercent: number;
  readonly hallucinationRatePercent: number;
  readonly avgLatencyMs: number;
  readonly passedCount: number;
  readonly totalCount: number;
  readonly score: number; // 0 .. 100
}

export interface ModelComparativeSummary {
  readonly modelId: ModelCandidateId;
  readonly displayName: string;
  readonly overallAccuracyPercent: number;
  readonly overallHallucinationRatePercent: number;
  readonly avgLatencyMs: number;
  readonly spatialTopologyScore: number;
  readonly compositeIntelligenceScore: number; // 0 .. 1000
  readonly dimensionScores: readonly ModelDimensionScore[];
  readonly rank: number;
}

export interface ComparativeEvaluationReport {
  readonly benchmarkId: string;
  readonly totalScenarios: number;
  readonly evaluatedModels: readonly ModelComparativeSummary[];
  readonly winnerModelId: ModelCandidateId;
  readonly cubioAdvantageSummary: {
    readonly spatialSuperiorityFactor: number;
    readonly latencySpeedupFactor: number;
    readonly hallucinationReductionFactor: number;
    readonly zeroVarianceVerified: boolean;
  };
  readonly reportChecksum: string;
  readonly timestamp: number;
}

export interface IComparativeBenchmarkEngine {
  runComparativeBenchmark(scenariosCount?: number): Promise<ComparativeEvaluationReport>;
}
