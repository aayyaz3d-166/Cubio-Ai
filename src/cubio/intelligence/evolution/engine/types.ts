/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F105: Intelligence Evolution Engine Types & Contracts
 *
 * Types for closed-loop self-evolution:
 * Benchmark Failures -> Diagnosis -> Improvement Proposal -> Regression Test -> Upgraded System.
 */

export type EvolutionFailureDomain =
  | 'SPATIAL_TOPOLOGY'
  | 'DETERMINISTIC_REASONING'
  | 'CODE_SYNTHESIS'
  | 'TOOL_SAFETY'
  | 'VOICE_ACOUSTICS'
  | 'STATE_CONTINUITY'
  | 'LATENCY_SLA';

export type EvolutionSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface BenchmarkFailureEvent {
  readonly failureId: string;
  readonly domain: EvolutionFailureDomain;
  readonly taskPrompt: string;
  readonly errorSignature: string;
  readonly observedOutput: unknown;
  readonly expectedInvariant: string;
  readonly severity: EvolutionSeverity;
  readonly timestamp: number;
}

export interface FailureDiagnosis {
  readonly diagnosisId: string;
  readonly failureId: string;
  readonly domain: EvolutionFailureDomain;
  readonly rootCauseSummary: string;
  readonly responsibleSubsystem: string;
  readonly severity: EvolutionSeverity;
  readonly confidenceScore: number;
  readonly diagnosisChecksum: string;
}

export type ProposalType =
  | 'CODE_AST_PATCH'
  | 'HEURISTIC_INJECTION'
  | 'ROUTER_CALIBRATION'
  | 'SAFETY_CONSTRAINT_UPDATE';

export interface ImprovementProposal {
  readonly proposalId: string;
  readonly diagnosisId: string;
  readonly proposalType: ProposalType;
  readonly title: string;
  readonly description: string;
  readonly patchPayload: string;
  readonly expectedImprovementDeltaPercent: number;
  readonly estimatedRiskScore: number; // 0.0 .. 1.0 (lower is safer)
  readonly proposalChecksum: string;
}

export interface CanaryRegressionResult {
  readonly regressionRunId: string;
  readonly proposalId: string;
  readonly testCasesExecuted: number;
  readonly passedCount: number;
  readonly failedCount: number;
  readonly newRegressionsDetected: number; // Must be 0
  readonly isCleanZeroRegression: boolean;
  readonly executionDurationMs: number;
}

export interface SystemGenerationMetadata {
  readonly generationNumber: number;
  readonly generationCode: string; // e.g. "CUBIO_GEN_2"
  readonly upgradedAt: number;
  readonly totalPatchesIntegrated: number;
  readonly previousGenerationChecksum: string;
  readonly currentGenerationChecksum: string;
}

export interface EvolutionRunReport {
  readonly evolutionRunId: string;
  readonly failuresIngested: number;
  readonly diagnosesGenerated: readonly FailureDiagnosis[];
  readonly proposalsSynthesized: readonly ImprovementProposal[];
  readonly regressionValidation: CanaryRegressionResult;
  readonly upgradedSystemGeneration: SystemGenerationMetadata;
  readonly evolutionSuccess: boolean;
  readonly evolutionSealHash: string;
  readonly timestamp: number;
}

export interface IIntelligenceEvolutionEngine {
  ingestBenchmarkFailures(failures: readonly BenchmarkFailureEvent[]): Promise<EvolutionRunReport>;
  getCurrentSystemGeneration(): SystemGenerationMetadata;
}
