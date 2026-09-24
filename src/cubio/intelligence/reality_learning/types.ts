/**
 * CubiO — Universal Spatial Operating Environment
 * Layer 16: Post-Execution Reality Learning & Adaptive Evolution (F204–F216) 👑
 *
 * Master Type Definitions & Invariants
 */

// ─── F204: EXECUTION OUTCOME OBSERVER ─────────────────────────────────────────

export interface ExecutionTelemetryRecord {
  readonly metricKey: string;
  readonly plannedTarget: number;
  readonly actualObserved: number;
  readonly absoluteDelta: number;
  readonly variancePercentage: number;
  readonly status: 'OPTIMAL' | 'WITHIN_TOLERANCE' | 'DEVIATION_DETECTED';
}

export interface ExecutionOutcomeObservationReport {
  readonly observationReportId: string;
  readonly planReferenceId: string;
  readonly taskId: string;
  readonly telemetryRecords: readonly ExecutionTelemetryRecord[];
  readonly totalExecutionDurationMs: number;
  readonly peakThermalStressMPa: number;
  readonly maxVariancePercent: number;
  readonly observerProofSeal: string;
  readonly timestamp: number;
}

// ─── F205: REALITY-STATE VERIFICATION ─────────────────────────────────────────

export interface RealityStateAuditItem {
  readonly auditDomain: 'GEOMETRY_TOPOLOGY' | 'PHYSICAL_INTEGRITY' | 'SYSTEM_BOUNDARIES';
  readonly checkedParameter: string;
  readonly expectedInvariant: string;
  readonly verifiedActual: string;
  readonly isInvariantPreserved: boolean;
}

export interface RealityStateVerificationReport {
  readonly verificationReportId: string;
  readonly planReferenceId: string;
  readonly auditItems: readonly RealityStateAuditItem[];
  readonly eulerCharacteristic: 2; // Euler Chi = 2 strictly maintained
  readonly isWatertightManifold: true;
  readonly allInvariantsPreserved: boolean;
  readonly verificationProofSeal: string;
  readonly timestamp: number;
}

// ─── F206: OUTCOME CAUSAL ATTRIBUTION ─────────────────────────────────────────

export interface CausalContributionRecord {
  readonly contributorId: string;
  readonly contributorType: 'SOUL_SKILL' | 'EXECUTION_ENVIRONMENT' | 'GEOMETRIC_KERNEL' | 'HEURISTIC_RULE';
  readonly shapleyAttributionScore: number; // Sum across contributors = 1.0 (Mathematical Conservation)
  readonly causalImpactDirection: 'POSITIVE_UPLIFT' | 'NEGATIVE_DRAG' | 'NEUTRAL';
  readonly specificContributionSummary: string;
}

export interface OutcomeCausalAttributionReport {
  readonly attributionReportId: string;
  readonly planReferenceId: string;
  readonly causalContributions: readonly CausalContributionRecord[];
  readonly compoundDeltaCiiRealized: number;
  readonly shapleyConservationValidated: boolean; // sum === 1.0
  readonly dominantFactorId: string;
  readonly attributionProofSeal: string;
  readonly timestamp: number;
}

// ─── F207: EXECUTION FAILURE DIAGNOSIS ────────────────────────────────────────

export type DiagnosticSeverity = 'INFORMATIONAL' | 'DEGRADED_PERFORMANCE' | 'CONTAINED_FAULT' | 'CRITICAL_BLOCK';

export interface DiagnosticFinding {
  readonly findingId: string;
  readonly componentTag: string;
  readonly severity: DiagnosticSeverity;
  readonly symptomDescription: string;
  readonly rootCauseHypothesis: string;
  readonly confidenceScore: number;
  readonly isIsolatedWithoutCascade: boolean;
}

export interface ExecutionFailureDiagnosisReport {
  readonly diagnosisReportId: string;
  readonly planReferenceId: string;
  readonly findings: readonly DiagnosticFinding[];
  readonly rootCauseIdentified: boolean;
  readonly primaryRootCause: string;
  readonly falsePositiveFilteredCount: number;
  readonly cascadesBlocked: number;
  readonly diagnosisProofSeal: string;
  readonly timestamp: number;
}

// ─── F208: RECOVERY STRATEGY SYNTHESIZER ──────────────────────────────────────

export interface SynthesizedRecoveryOption {
  readonly optionId: string;
  readonly strategyType: 'PARAMETRIC_COMPENSATION' | 'GRADIENT_REPATH' | 'STAGE_DEFERRAL';
  readonly description: string;
  readonly sandboxValidationPassed: boolean;
  readonly estimatedRecoveryLatencyMs: number;
  readonly recoveryConfidence: number;
  readonly blindRetry: false; // Blind retry strictly prohibited
}

export interface RecoveryStrategySynthesizerReport {
  readonly synthesizerReportId: string;
  readonly diagnosisReferenceId: string;
  readonly synthesizedOptions: readonly SynthesizedRecoveryOption[];
  readonly winningRecoveryOptionId: string;
  readonly allOptionsValidatedInSandbox: boolean;
  readonly blindRetryProhibitedEnforced: true;
  readonly synthesizerProofSeal: string;
  readonly timestamp: number;
}

// ─── F209: POST-EXECUTION LEARNING LOOP ────────────────────────────────────────

export interface MemoryPipelinePayload {
  readonly memoryLayerTarget: 'EPISODIC_EXPERIENCE' | 'SOUL_SKILL_BENCHMARK' | 'WORLD_MODEL_CAUSAL_GRAPH';
  readonly payloadSummary: string;
  readonly governanceComplianceVerified: true;
  readonly confidenceScore: number;
}

export interface PostExecutionLearningLoopReport {
  readonly learningLoopReportId: string;
  readonly planReferenceId: string;
  readonly payloadsDispatched: readonly MemoryPipelinePayload[];
  readonly totalPayloadsCount: number;
  readonly worldModelHeuristicsUpdated: boolean;
  readonly governanceBoundariesPreserved: true;
  readonly learningLoopProofSeal: string;
  readonly timestamp: number;
}

// ─── F210: EXECUTION EXPERIENCE REGISTRY ──────────────────────────────────────

export interface ExecutionExperienceRecord {
  readonly experienceRecordId: string;
  readonly domainContext: string;
  readonly taskSignature: string;
  readonly executionPatternType: 'PARALLEL_369_COUPLED' | 'ADAPTIVE_VISCOSITY_TRIM' | 'AUTONOMOUS_AUTOCLAVE';
  readonly successRate: number;
  readonly latencyMs: number;
  readonly cryptographicProofSeal: string;
  readonly isReusableTemplate: boolean;
}

export interface ExecutionExperienceRegistryReport {
  readonly registryReportId: string;
  readonly registeredExperiences: readonly ExecutionExperienceRecord[];
  readonly totalExperiencesCataloged: number;
  readonly newlyIndexedCount: number;
  readonly registryIntegrityMerkleRoot: string;
  readonly timestamp: number;
}

// ─── F211: ADAPTIVE PLANNER ───────────────────────────────────────────────────

export interface AdaptivePlanModification {
  readonly stepIndex: number;
  readonly parameterChanged: string;
  readonly previousDefault: string;
  readonly adaptedValue: string;
  readonly rationale: string;
  readonly safetyEnvelopePreserved: boolean;
}

export interface AdaptivePlannerReport {
  readonly adaptivePlanId: string;
  readonly taskObjective: string;
  readonly experienceRecordsLeveraged: readonly string[];
  readonly adaptiveModifications: readonly AdaptivePlanModification[];
  readonly estimatedLatencyReductionPercent: number;
  readonly riskMitigationConfidence: number;
  readonly adaptivePlanProofSeal: string;
  readonly timestamp: number;
}

// ─── F212: REGRESSION BENCHMARK ───────────────────────────────────────────────

export interface RegressionBenchmarkComparison {
  readonly metricName: string;
  readonly legacyBaseline: number;
  readonly adaptiveExperienceEnhanced: number;
  readonly improvementPercent: number;
  readonly regressionDetected: boolean;
}

export interface ExecutionRegressionBenchmarkReport {
  readonly regressionReportId: string;
  readonly testWorkloadId: string;
  readonly comparisons: readonly RegressionBenchmarkComparison[];
  readonly meanImprovementPercent: number;
  readonly zeroRegressionCertified: true;
  readonly benchmarkProofSeal: string;
  readonly timestamp: number;
}

// ─── F213: REALITY FEEDBACK SAFETY GOVERNOR ───────────────────────────────────

export interface FeedbackSafetyBoundaryAudit {
  readonly safetyDimension: 'DIRECT_PRODUCTION_MUTATION' | 'GOVERNANCE_PRIVILEGE_ESCALATION' | 'EXPERIENCE_TAMPERING';
  readonly checkedParameter: string;
  readonly enforcementPolicy: string;
  readonly observedBehavior: string;
  readonly isBoundaryMaintained: boolean;
}

export interface RealityFeedbackSafetyGovernorReport {
  readonly safetyGovernorReportId: string;
  readonly planReferenceId: string;
  readonly safetyAudits: readonly FeedbackSafetyBoundaryAudit[];
  readonly directProductionMutationBlocked: true;
  readonly f200F201GovernancePreserved: true;
  readonly allFeedbackBoundariesPassed: boolean;
  readonly feedbackSafetyProofSeal: string;
  readonly timestamp: number;
}

// ─── F214: HUMAN REVIEW & PROMOTION GATE 👑 ───────────────────────────────────

export interface PromotionCandidateReview {
  readonly candidateId: string;
  readonly candidateType: 'ADAPTIVE_HEURISTIC' | 'REUSABLE_EXPERIENCE_TEMPLATE' | 'DYNAMIC_VISCOSITY_MODEL';
  readonly rationale: string;
  readonly regressionDelta: number;
  readonly riskTier: 'TIER_1_LOW_RISK' | 'TIER_2_MEDIUM_RISK' | 'TIER_3_HIGH_IMPACT';
}

export interface HumanReviewPromotionGateReport {
  readonly promotionGateReportId: string;
  readonly candidateReviews: readonly PromotionCandidateReview[];
  readonly authorizedByHumanArchitect: string;
  readonly sovereignHumanSignature: string;
  readonly explicitHumanApprovalGranted: boolean;
  readonly promotedToProductionPlanning: boolean;
  readonly promotionProofSeal: string;
  readonly timestamp: number;
}

// ─── F215: AUTONOMOUS EXECUTION EVOLUTION BENCHMARK ───────────────────────────

export interface EvolutionDimensionScore {
  readonly dimension:
    | 'ADAPTATION_LATENCY'
    | 'ERROR_RECURRENCE_MITIGATION'
    | 'RESOURCE_EFFICIENCY'
    | 'CROSS_DOMAIN_TRANSFER'
    | 'SAFETY_INVARIANT_COMPLIANCE'
    | 'CLOSED_LOOP_STABILITY';
  readonly generationZeroScore: number;
  readonly evolvedSystemScore: number;
  readonly evolutionGainDelta: number;
  readonly certifiedEvolutionaryPass: boolean;
}

export interface ExecutionEvolutionBenchmarkReport {
  readonly evolutionBenchmarkReportId: string;
  readonly benchmarkedGenerations: 'GEN_0_STATIC_PLANNING' | 'GEN_1_CLOSED_LOOP_EVOLVED';
  readonly dimensionScores: readonly EvolutionDimensionScore[];
  readonly compoundEvolutionaryGainPercent: number;
  readonly allEvolutionDimensionsPassed: boolean;
  readonly evolutionBenchmarkProofSeal: string;
  readonly timestamp: number;
}

// ─── F216: MASTER REALITY LEARNING CERTIFICATION 👑 ───────────────────────────

export interface MasterRealityLearningCertificate {
  readonly certificateId: string;
  readonly certifiedLayer: 'LAYER_16_POST_EXECUTION_REALITY_LEARNING_AND_ADAPTIVE_EVOLUTION';
  readonly funnelRange: 'F204_F216';
  readonly certifiedFunnelsCount: 13;
  readonly closedLoopValidated: true;
  readonly humanGovernanceEnforced: true;
  readonly compoundEvolutionaryGain: number;
  readonly sovereignMasterProofSeal: string;
  readonly certificationTimestamp: number;
}

