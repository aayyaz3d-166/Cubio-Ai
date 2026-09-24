/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F102: Intelligence Scoring Engine Types
 *
 * Contracts for multi-pillar weighted evaluation and separate dimensional scoring:
 * Accuracy, Reasoning Quality, Robustness, Latency, Cost, Tool Success, and Agent Continuity.
 */

export type IntelligencePillarId =
  | 'REASONING_AND_DETERMINISM'
  | 'CODE_INTELLIGENCE_AND_AST'
  | 'VISION_AND_OPTICAL_PHYSICS'
  | 'MULTILINGUAL_VOICE_AND_ACOUSTICS'
  | 'UNIVERSAL_TOOLS_AND_SAFETY'
  | 'MULTI_AGENT_SWARM_SOLVING'
  | 'AUTONOMOUS_WORKFLOWS_AND_STATE';

export interface PillarWeightConfig {
  readonly pillarId: IntelligencePillarId;
  readonly displayName: string;
  readonly weight: number; // 0.0 .. 1.0 (Sum must equal 1.0)
  readonly description: string;
}

export interface PillarScoreBreakdown {
  readonly pillarId: IntelligencePillarId;
  readonly displayName: string;
  readonly weight: number;
  readonly rawAccuracyScore: number; // 0.0 .. 100.0
  readonly latencyScore: number; // 0.0 .. 100.0
  readonly determinismBonus: number; // 0.0 .. 5.0
  readonly normalizedPillarScore: number; // 0.0 .. 100.0
  readonly weightedContribution: number; // weight * normalizedPillarScore
  readonly executionLatencyMs: number;
}

export interface SeparateDimensionalScores {
  readonly accuracyScore: number; // 0.0 .. 100.0 (Ground-truth verification)
  readonly reasoningQualityScore: number; // 0.0 .. 100.0 (Euler chi=2, 3-6-9 proofs)
  readonly robustnessScore: number; // 0.0 .. 100.0 (Fault recovery, sigma^2=0, guardrails)
  readonly latencyEfficiencyScore: number; // 0.0 .. 100.0 (Sub-20ms SLA)
  readonly economicCostScore: number; // 0.0 .. 100.0 (Sovereign local zero-cost)
  readonly toolSuccessScore: number; // 0.0 .. 100.0 (7-category execution & tokens)
  readonly agentContinuityScore: number; // 0.0 .. 100.0 (Master DAG & state tree recovery)
}

export interface CompositeIntelligenceScoreReport {
  readonly scoringRunId: string;
  readonly totalPillarsEvaluated: number;
  readonly totalWeight: number; // Must be 1.0
  readonly compositeCiiScore: number; // 0 .. 1000
  readonly compositePercentage: number; // 0.0 .. 100.0%
  readonly pillarBreakdowns: readonly PillarScoreBreakdown[];
  readonly separateDimensionalScores: SeparateDimensionalScores;
  readonly intelligenceGrade: 'S_TIER_SUPREME' | 'A_TIER_EXEMPLARY' | 'B_TIER_ACCEPTABLE' | 'C_TIER_DEGRADED';
  readonly scoreChecksum: string;
  readonly timestamp: number;
}

export interface IIntelligenceScoringEngine {
  evaluateIntelligenceScores(customWeights?: readonly PillarWeightConfig[]): Promise<CompositeIntelligenceScoreReport>;
}
