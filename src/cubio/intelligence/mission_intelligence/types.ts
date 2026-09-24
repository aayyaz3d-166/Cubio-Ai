/**
 * CubiO — Universal Spatial Operating Environment
 * Layer 17: Long-Horizon Mission Intelligence (F217–F230) 👑
 *
 * Master Type Definitions & Strategic Mission Invariants
 */

// ─── F217: MISSION GOAL COMPILER ──────────────────────────────────────────────

export interface MissionConstraint {
  readonly constraintId: string;
  readonly category: 'TOPOLOGICAL' | 'PHYSICAL_MATERIAL' | 'TEMPORAL_BUDGET' | 'GOVERNANCE_SAFETY';
  readonly expression: string;
  readonly isStrictlyHard: true;
}

export interface MissionSuccessCriterion {
  readonly criterionId: string;
  readonly metricName: string;
  readonly targetThreshold: string;
  readonly weight: number;
}

export interface MissionSpecificationReport {
  readonly missionSpecId: string;
  readonly missionTitle: string;
  readonly strategicObjective: string;
  readonly formalGoals: readonly string[];
  readonly hardConstraints: readonly MissionConstraint[];
  readonly successCriteria: readonly MissionSuccessCriterion[];
  readonly forbiddenMissionActions: readonly string[];
  readonly missionSpecProofSeal: string;
  readonly timestamp: number;
}

// ─── F218: MULTI-STAGE MISSION DECOMPOSER ─────────────────────────────────────

export type MissionDomainScope =
  | 'JEWELRY_AESTHETICS'
  | 'AEROSPACE_STRUCTURAL_LATTICE'
  | 'BIOMEDICAL_MICROFLUIDICS'
  | 'CROSS_DOMAIN_FUSION_INTEGRATION';

export interface SubMissionNode {
  readonly subMissionId: string;
  readonly stageIndex: number;
  readonly title: string;
  readonly domainScope: MissionDomainScope;
  readonly assignedSoul: string;
  readonly inputPrerequisites: readonly string[];
  readonly outputDeliverables: readonly string[];
  readonly maxDurationMs: number;
  readonly failureImpactSeverity: 'CONTAINED_LOCAL' | 'STAGE_BLOCKING' | 'MISSION_CRITICAL';
}

export interface MultiStageMissionDecompositionReport {
  readonly decompositionReportId: string;
  readonly missionSpecReferenceId: string;
  readonly subMissionNodes: readonly SubMissionNode[];
  readonly totalStagesCount: number;
  readonly isAcyclicDagValidated: true;
  readonly decompositionProofSeal: string;
  readonly timestamp: number;
}

// ─── F219: MISSION DEPENDENCY RESOLVER ────────────────────────────────────────

export type DependencyType = 'TEMPORAL_ORDER' | 'DATA_FLOW' | 'TOPOLOGICAL_CONTINUITY' | 'RESOURCE_LOCK';

export interface ResolvedDependencyEdge {
  readonly sourceSubMissionId: string;
  readonly targetSubMissionId: string;
  readonly dependencyType: DependencyType;
  readonly resolutionStatus: 'SATISFIED' | 'CONDITIONAL_ON_PREVIOUS_STAGE';
  readonly isBlocking: boolean;
}

export interface MissionDependencyResolutionReport {
  readonly resolutionReportId: string;
  readonly missionSpecReferenceId: string;
  readonly dependencyEdges: readonly ResolvedDependencyEdge[];
  readonly cyclicDependenciesDetectedCount: 0; // Zero cycles permitted
  readonly criticalPathSubMissionIds: readonly string[];
  readonly totalEstimatedCriticalPathMs: number;
  readonly resolutionProofSeal: string;
  readonly timestamp: number;
}

// ─── F220: LONG-HORIZON PLANNER ───────────────────────────────────────────────

export interface PlannedMissionStage {
  readonly stageIndex: number;
  readonly subMissionId: string;
  readonly stageName: string;
  readonly scheduledStartOffsetMs: number;
  readonly scheduledDurationMs: number;
  readonly scheduledEndOffsetMs: number;
  readonly concurrencyGroup: number;
  readonly expectedEnergyJoules: number;
  readonly expectedThermalStressMPa: number;
}

export interface LongHorizonPlanReport {
  readonly longHorizonPlanId: string;
  readonly missionSpecReferenceId: string;
  readonly plannedStages: readonly PlannedMissionStage[];
  readonly totalPlannedDurationMs: number;
  readonly totalEnergyJoules: number;
  readonly peakThermalStressMPa: number;
  readonly paretoEfficiencyScore: number;
  readonly longHorizonPlanProofSeal: string;
  readonly timestamp: number;
}

// ─── F221: RESOURCE ALLOCATION ENGINE ─────────────────────────────────────────

export interface StageResourceAllocation {
  readonly stageIndex: number;
  readonly subMissionId: string;
  readonly allocatedGpuVramMb: number;
  readonly allocatedWasmKernelInstances: number;
  readonly assignedTools: readonly string[];
  readonly titaniumBudgetGrams: number;
  readonly memoryQuarantineLevel: 'STRICTLY_AIR_GAPPED' | 'ISOLATED_CLUSTER';
  readonly resourceLimitsPreserved: boolean;
}

export interface ResourceAllocationReport {
  readonly allocationReportId: string;
  readonly longHorizonPlanReferenceId: string;
  readonly stageAllocations: readonly StageResourceAllocation[];
  readonly totalGpuVramRequiredMb: number;
  readonly peakGpuVramBudgetMb: 8192;
  readonly totalTitaniumGrams: number;
  readonly allResourceConstraintsSatisfied: true;
  readonly candidateMissionPlanReady: true;
  readonly allocationProofSeal: string;
  readonly timestamp: number;
}

// ─── F222: UNCERTAINTY & RISK ENGINE ──────────────────────────────────────────

export interface StageUncertaintyRiskAudit {
  readonly subMissionId: string;
  readonly epistemicUncertaintyPercent: number; // Model/parameter knowledge gaps
  readonly aleatoricUncertaintyPercent: number; // Stochastic environmental variance
  readonly compoundRiskScore: number; // 0.0 to 1.0
  readonly confidenceScore: number;
  readonly isQuarantinedInSandbox: boolean; // True if confidence < 90%
}

export interface UncertaintyRiskAssessmentReport {
  readonly assessmentReportId: string;
  readonly missionSpecReferenceId: string;
  readonly stageAudits: readonly StageUncertaintyRiskAudit[];
  readonly overallMissionConfidence: number;
  readonly quarantinedBranchesCount: number;
  readonly uncertainAssumptionsBlockedFromDirectExec: true;
  readonly assessmentProofSeal: string;
  readonly timestamp: number;
}

// ─── F223: MULTI-SOUL MISSION ORCHESTRATOR ────────────────────────────────────

export interface SoulOrchestrationBinding {
  readonly soulId: string;
  readonly domainScope: string;
  readonly assignedSubMissionId: string;
  readonly contractSignatures: readonly string[];
  readonly memoryIsolationLevel: 'AIR_GAPPED_SECTOR' | 'STRICTLY_ISOLATED';
  readonly crossSoulPrivilegeEscalationBlocked: true;
}

export interface MultiSoulMissionOrchestrationReport {
  readonly orchestrationReportId: string;
  readonly missionSpecReferenceId: string;
  readonly soulBindings: readonly SoulOrchestrationBinding[];
  readonly totalParticipatingSouls: number;
  readonly crossSoulCommunicationContractBound: true;
  readonly domainBoundariesStrictlyMaintained: true;
  readonly orchestrationProofSeal: string;
  readonly timestamp: number;
}

// ─── F224: MISSION STATE TRACKER ──────────────────────────────────────────────

export type SubMissionState = 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'FAILED_CONTAINED' | 'CHECKPOINT_RESTORED';

export interface TrackedSubMissionState {
  readonly subMissionId: string;
  readonly stageIndex: number;
  readonly currentState: SubMissionState;
  readonly preStateChecksum: string;
  readonly postStateChecksum: string;
  readonly isCheckpointSaved: boolean;
  readonly timestamp: number;
}

export interface MissionStateTrackingReport {
  readonly trackingReportId: string;
  readonly missionSpecReferenceId: string;
  readonly trackedStates: readonly TrackedSubMissionState[];
  readonly activeCheckpointId: string;
  readonly completedSubMissionsCount: number;
  readonly overallMissionState: 'HEALTHY_ACTIVE' | 'FAILED_RECOVERING' | 'MISSION_COMPLETE';
  readonly trackingProofSeal: string;
  readonly timestamp: number;
}

// ─── F225: CONTINGENCY BRANCH ENGINE ──────────────────────────────────────────

export interface ContingencyMissionBranch {
  readonly branchId: string;
  readonly triggerCondition: string;
  readonly fallbackSubMissionId: string;
  readonly alternativeStrategyDescription: string;
  readonly sandboxValidationPassed: boolean;
  readonly blindRetry: false; // Blind retry strictly prohibited
  readonly confidenceScore: number;
}

export interface ContingencyBranchReport {
  readonly contingencyReportId: string;
  readonly missionSpecReferenceId: string;
  readonly contingencyBranches: readonly ContingencyMissionBranch[];
  readonly allBranchesSandboxValidated: boolean;
  readonly blindRetryProhibitedEnforced: true;
  readonly directUnverifiedExecutionBlocked: true;
  readonly contingencyProofSeal: string;
  readonly timestamp: number;
}

// ─── F226: MISSION SELF-HEALING ENGINE ────────────────────────────────────────

export interface SelfHealingStitchRecord {
  readonly failedSubMissionId: string;
  readonly diagnosedRootCause: string;
  readonly appliedRecoveryBranchId: string;
  readonly dagStitchSuccessful: boolean;
  readonly automaticAuthorityEscalated: false; // Sovereign authority NEVER auto-escalated
  readonly remainingDagRevalidated: boolean;
}

export interface MissionSelfHealingReport {
  readonly selfHealingReportId: string;
  readonly missionSpecReferenceId: string;
  readonly healingRecords: readonly SelfHealingStitchRecord[];
  readonly totalFaultsHealed: number;
  readonly overallMissionResilienceScore: number;
  readonly missionStateRestoredToHealthy: boolean;
  readonly selfHealingProofSeal: string;
  readonly timestamp: number;
}

// ─── F227: STRATEGIC MISSION OPTIMIZER ────────────────────────────────────────

export interface DownstreamStageOptimization {
  readonly stageIndex: number;
  readonly subMissionId: string;
  readonly optimizationApplied: string;
  readonly latencyReductionMs: number;
  readonly thermalStressReductionMPa: number;
  readonly safetyEnvelopePreserved: boolean;
}

export interface StrategicMissionOptimizerReport {
  readonly optimizerReportId: string;
  readonly missionSpecReferenceId: string;
  readonly downstreamOptimizations: readonly DownstreamStageOptimization[];
  readonly totalLatencySavedMs: number;
  readonly cumulativeThermalMarginUpliftPercent: number;
  readonly reOptimizationSandboxValidated: boolean;
  readonly authorityEnvelopeUnmodified: true;
  readonly optimizerProofSeal: string;
  readonly timestamp: number;
}

// ─── F228: MISSION GOVERNANCE GOVERNOR 🛡️ ──────────────────────────────────────

export interface MissionGovernanceAuditItem {
  readonly governanceRuleId: string;
  readonly enforcedInvariant: 'F200_PHYSICAL_SAFETY' | 'F201_SOVEREIGN_HUMAN_GATE' | 'F213_NON_MUTATING_LEARNING' | 'F214_PROMOTION_GATE';
  readonly checkedParameter: string;
  readonly observedStatus: string;
  readonly isStrictlyCompliant: boolean;
}

export interface MissionGovernanceGovernorReport {
  readonly governanceReportId: string;
  readonly missionSpecReferenceId: string;
  readonly governanceAudits: readonly MissionGovernanceAuditItem[];
  readonly missionIntelligenceExecutionAuthorityBlocked: true;
  readonly allGovernanceInvariantsLocked: boolean;
  readonly humanAuthorizationRequiredForHighImpact: true;
  readonly governanceProofSeal: string;
  readonly timestamp: number;
}

// ─── F229: MISSION BENCHMARK ENGINE 📊 ─────────────────────────────────────────

export interface MissionBenchmarkMetricComparison {
  readonly metricName: string;
  readonly singleTaskBaselineScore: number;
  readonly longHorizonOrchestratedScore: number;
  readonly deltaImprovement: number;
  readonly benchmarkPassCertified: boolean;
}

export interface MissionBenchmarkReport {
  readonly benchmarkReportId: string;
  readonly missionSpecReferenceId: string;
  readonly metricComparisons: readonly MissionBenchmarkMetricComparison[];
  readonly overallMissionSuccessRatePercent: number;
  readonly compoundMissionEvolutionGainPercent: number;
  readonly allDimensionsCertifiedPass: boolean;
  readonly benchmarkProofSeal: string;
  readonly timestamp: number;
}

// ─── F230: MASTER MISSION INTELLIGENCE CERTIFICATION 👑 ────────────────────────

export interface MasterMissionIntelligenceCertificate {
  readonly certificateId: string;
  readonly certifiedLayer: 'LAYER_17_LONG_HORIZON_MISSION_INTELLIGENCE';
  readonly funnelRange: 'F217_F230';
  readonly certifiedFunnelsCount: 14;
  readonly strategicOrchestrationValidated: true;
  readonly sovereignGovernanceLocked: true;
  readonly compoundMissionGain: number;
  readonly sovereignMasterMissionProofSeal: string;
  readonly certificationTimestamp: number;
}

