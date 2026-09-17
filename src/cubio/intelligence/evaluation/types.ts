/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F21: CubiO Intelligence Evaluation Engine (Types & Contracts)
 *
 * Master specification for multi-engine benchmarks, accuracy profiling,
 * microsecond latency measurement, memory footprint analysis,
 * zero variance determinism auditing (sigma^2 = 0), and tier grading rubrics.
 */

export type EvaluationGrade = 'S_TIER' | 'A_TIER' | 'B_TIER' | 'C_TIER' | 'FAIL';

export interface EngineEvaluationMetric {
  readonly engineId: string;
  readonly accuracyScore: number; // 0.0 - 1.0
  readonly avgLatencyMs: number;
  readonly p95LatencyMs: number;
  readonly memoryUsageBytes: number;
  readonly determinismVariance: number; // 0.0 for deterministic
  readonly reasoningQualityScore: number; // 0.0 - 1.0
  readonly harmonicResonanceScore: number; // 0.0 - 100.0
  readonly passed: boolean;
  readonly details?: Readonly<Record<string, any>>;
}

export interface IntelligenceEvaluationReport {
  readonly evaluationId: string;
  readonly timestamp: number;
  readonly evaluatedEnginesCount: number;
  readonly overallAccuracy: number;
  readonly overallAvgLatencyMs: number;
  readonly overallDeterminism: number; // sigma^2
  readonly overallReasoningQuality: number;
  readonly overallResonanceScore: number;
  readonly grade: EvaluationGrade;
  readonly engineMetrics: readonly EngineEvaluationMetric[];
  readonly evaluationChecksum: string;
}
