/**
 * CubiO — Universal Spatial Operating Environment
 * Layer 18: Adaptive Strategic Autonomy & System Coordination (F231–F244) 👑
 *
 * Master Type Definitions & Strategic Multi-Mission Invariants
 */

// ─── F231: SYSTEM STATE SYNTHESIZER ───────────────────────────────────────────

export interface ActiveMissionSnapshot {
  readonly missionId: string;
  readonly missionTitle: string;
  readonly activeStage: number;
  readonly status: 'PLANNING' | 'ACTIVE_ORCHESTRATING' | 'RECOVERING' | 'WAITING_RESOURCE';
  readonly assignedSouls: readonly string[];
  readonly resourceConsumption: {
    readonly gpuVramMb: number;
    readonly wasmInstances: number;
    readonly titaniumGrams: number;
  };
}

export interface SystemResourceState {
  readonly totalGpuVramAllocatedMb: number;
  readonly totalGpuVramCapacityMb: 8192;
  readonly activeWasmKernels: number;
  readonly maxWasmKernels: 16;
  readonly materialBudgetAllocatedGrams: number;
  readonly memoryQuarantineIntegrityVerified: true;
}

export interface UnifiedSystemStateReport {
  readonly systemStateId: string;
  readonly timestamp: number;
  readonly activeMissionsCount: number;
  readonly activeMissions: readonly ActiveMissionSnapshot[];
  readonly worldStateHash: string;
  readonly resourceState: SystemResourceState;
  readonly soulAvailability: Readonly<Record<string, 'AVAILABLE' | 'ENGAGED_BUSY' | 'QUARANTINED'>>;
  readonly globalRiskScore: number;
  readonly governanceLocksActive: true;
  readonly zeroMemoryBleedPreserved: true;
  readonly systemStateProofSeal: string;
}

// ─── F232: MISSION PRIORITY ENGINE ────────────────────────────────────────────

export interface EvaluatedMissionPriority {
  readonly missionId: string;
  readonly urgencyScore: number; // 0..1
  readonly strategicValueScore: number; // 0..1
  readonly dependencyWeight: number; // 0..1
  readonly calculatedPriority: number; // 0..1 (weighted compound)
  readonly priorityRank: number; // 1 = highest
  readonly priorityRationale: string;
  readonly executionAuthorityGranted: false; // Invariant: Priority != Authorization
}

export interface MissionPriorityRankingReport {
  readonly priorityReportId: string;
  readonly systemStateReferenceId: string;
  readonly priorityRankings: readonly EvaluatedMissionPriority[];
  readonly topPriorityMissionId: string;
  readonly priorityDoesNotConferExecutionAuthority: true;
  readonly priorityProofSeal: string;
  readonly timestamp: number;
}

// ─── F233: CROSS-MISSION DEPENDENCY GRAPH ──────────────────────────────────────

export type CrossMissionDependencyType =
  | 'SHARED_HARDWARE_RESOURCE'
  | 'SPATIAL_COORDINATE_COLLISION'
  | 'INTER_MISSION_DELIVERABLE_FLOW'
  | 'GOVERNANCE_ORDERING_LOCK';

export interface CrossMissionDependencyEdge {
  readonly edgeId: string;
  readonly sourceMissionId: string;
  readonly targetMissionId: string;
  readonly dependencyType: CrossMissionDependencyType;
  readonly isBottleneck: boolean;
  readonly conflictResolvedInSandbox: boolean;
}

export interface CrossMissionDependencyGraphReport {
  readonly dependencyReportId: string;
  readonly systemStateReferenceId: string;
  readonly dependencyEdges: readonly CrossMissionDependencyEdge[];
  readonly detectedBottlenecksCount: number;
  readonly cyclicInterMissionDependenciesCount: 0; // Invariant: 0 cycles permitted
  readonly crossMissionDataBleedBlocked: true;
  readonly dependencyGraphProofSeal: string;
  readonly timestamp: number;
}

// ─── F234: GLOBAL RESOURCE OPTIMIZER ──────────────────────────────────────────

export interface MissionResourceAllocationSchedule {
  readonly missionId: string;
  readonly allocatedGpuVramMb: number;
  readonly allocatedWasmKernels: number;
  readonly allocatedTitaniumGrams: number;
  readonly executionSlotIndex: number;
  readonly assignedTools: readonly string[];
}

export interface GlobalResourceOptimizationReport {
  readonly optimizationReportId: string;
  readonly systemStateReferenceId: string;
  readonly allocations: readonly MissionResourceAllocationSchedule[];
  readonly totalGpuVramAllocatedMb: number;
  readonly totalGpuVramCapacityMb: 8192;
  readonly totalWasmKernelsAllocated: number;
  readonly maxWasmKernelsCapacity: 16;
  readonly paretoResourceEfficiencyScore: number;
  readonly allResourceConstraintsSatisfied: true;
  readonly optimizationProofSeal: string;
  readonly timestamp: number;
}

// ─── F235: STRATEGIC FORECAST ENGINE ──────────────────────────────────────────

export interface StrategicForecastBranch {
  readonly forecastBranchId: string;
  readonly horizonSteps: number;
  readonly projectedStateDescription: string;
  readonly estimatedProbability: number; // 0..1
  readonly anticipatedResourceStressPercent: number;
  readonly forecastNotTreatedAsFact: true; // Invariant: prediction != empirical fact
}

export interface StrategicForecastReport {
  readonly forecastReportId: string;
  readonly systemStateReferenceId: string;
  readonly forecastBranches: readonly StrategicForecastBranch[];
  readonly dominantProjectedBranchId: string;
  readonly maxForecastHorizonSteps: number;
  readonly forecastProofSeal: string;
  readonly timestamp: number;
}

// ─── F236: COMPETING FUTURE SCENARIOS ─────────────────────────────────────────

export interface EvaluatedFutureScenario {
  readonly scenarioId: string;
  readonly scenarioName: string;
  readonly efficiencyScore: number; // 0..1
  readonly riskScore: number; // 0..1
  readonly uncertaintyPercent: number;
  readonly sandboxValidationPassed: boolean;
  readonly isQuarantinedFromActiveExecution: boolean; // Invariant: low confidence quarantined
  readonly scenarioRationale: string;
}

export interface CompetingFutureScenariosReport {
  readonly scenarioReportId: string;
  readonly systemStateReferenceId: string;
  readonly scenarios: readonly EvaluatedFutureScenario[];
  readonly winningScenarioId: string;
  readonly quarantinedScenariosCount: number;
  readonly automaticActiveExecutionBlocked: true;
  readonly scenarioProofSeal: string;
  readonly timestamp: number;
}

// ─── F237: POLICY / OPTION ENGINE ─────────────────────────────────────────────

export interface CandidateStrategicPolicy {
  readonly policyId: string;
  readonly policyName: string;
  readonly expectedUtilityScore: number; // 0..1
  readonly riskScore: number; // 0..1
  readonly resourceCostScore: number; // 0..1
  readonly confidenceScore: number; // 0..1
  readonly safetyConstraintsPreserved: boolean;
  readonly isApprovedPolicy: false; // Invariant: Candidate policy != Approved policy
}

export interface StrategicPolicyReport {
  readonly policyReportId: string;
  readonly systemStateReferenceId: string;
  readonly candidatePolicies: readonly CandidateStrategicPolicy[];
  readonly recommendedCandidatePolicyId: string;
  readonly requiresHumanGovernanceAuthorization: true;
  readonly policyProofSeal: string;
  readonly timestamp: number;
}

// ─── F238: MULTI-MISSION ORCHESTRATOR ─────────────────────────────────────────

export interface OrchestratedMissionExecutionNode {
  readonly missionId: string;
  readonly assignedSouls: readonly string[];
  readonly executionSlot: number;
  readonly memoryIsolationLevel: 'AIR_GAPPED_SECTOR' | 'STRICTLY_ISOLATED';
  readonly contractBoundCommunication: true;
  readonly status: 'ACTIVE_RUNNING' | 'STAGED_READY' | 'QUEUED';
}

export interface MultiMissionOrchestrationReport {
  readonly orchestrationReportId: string;
  readonly systemStateReferenceId: string;
  readonly orchestratedMissions: readonly OrchestratedMissionExecutionNode[];
  readonly totalConcurrentMissions: number;
  readonly crossSoulPrivilegeEscalationBlocked: true;
  readonly domainBoundariesStrictlyMaintained: true;
  readonly orchestrationProofSeal: string;
  readonly timestamp: number;
}

// ─── F239: DYNAMIC RE-PLANNING ENGINE ─────────────────────────────────────────

export interface DynamicRePlanAdjustment {
  readonly missionId: string;
  readonly previousStageSchedule: string;
  readonly updatedStageSchedule: string;
  readonly triggerReason: string;
  readonly sandboxValidationPassed: boolean;
}

export interface DynamicRePlanningReport {
  readonly rePlanningReportId: string;
  readonly systemStateReferenceId: string;
  readonly adjustments: readonly DynamicRePlanAdjustment[];
  readonly rePlanningSandboxOnly: true; // Invariant: Re-planning resides in sandbox until human authorization
  readonly requiresGovernanceApproval: true;
  readonly rePlanningProofSeal: string;
  readonly timestamp: number;
}

// ─── F240: SYSTEM RESILIENCE ENGINE ───────────────────────────────────────────

export interface ContainedMissionFaultRecord {
  readonly failedMissionId: string;
  readonly faultDiagnosis: string;
  readonly isolationBoundary: string;
  readonly unaffectedMissionsContinued: readonly string[];
  readonly systemCascadePrevented: true; // Invariant: 1 mission failure != system-wide cascade
}

export interface SystemResilienceReport {
  readonly resilienceReportId: string;
  readonly systemStateReferenceId: string;
  readonly containedFaults: readonly ContainedMissionFaultRecord[];
  readonly totalFaultsIsolated: number;
  readonly zeroCascadesCertified: true;
  readonly systemHealthStatus: 'HEALTHY_CONTAINED' | 'NORMAL_OPERATIONAL';
  readonly resilienceProofSeal: string;
  readonly timestamp: number;
}

// ─── F241: GLOBAL SAFETY GOVERNOR 🛡️ ───────────────────────────────────────────

export interface GlobalGovernanceAuditRecord {
  readonly governorTier: 'F200_PHYSICAL_SAFETY' | 'F201_SOVEREIGN_HUMAN_GATE' | 'F213_NON_MUTATING_LEARNING' | 'F214_PROMOTION_GATE' | 'F228_MISSION_GOVERNOR' | 'F241_GLOBAL_STRATEGIC_GOVERNOR';
  readonly auditedParameter: string;
  readonly enforcedRule: string;
  readonly isStrictlyCompliant: boolean;
}

export interface GlobalSafetyGovernorReport {
  readonly governorReportId: string;
  readonly systemStateReferenceId: string;
  readonly auditRecords: readonly GlobalGovernanceAuditRecord[];
  readonly allLowerTierGovernorsPreserved: true; // Invariant: Layer 18 cannot weaken lower restrictions
  readonly autonomyDoesNotConferExecutionAuthority: true; // Invariant: World Model != Intelligence != Authority
  readonly governanceProofSeal: string;
  readonly timestamp: number;
}

// ─── F242: HUMAN STRATEGIC APPROVAL GATE 👑 ───────────────────────────────────

export type StrategicChangeScope =
  | 'MISSION_PORTFOLIO_MODIFICATION'
  | 'HIGH_IMPACT_RESOURCE_REALLOCATION'
  | 'PRODUCTION_POLICY_PROMOTION'
  | 'EXECUTION_SCOPE_EXPANSION'
  | 'SAFETY_ENVELOPE_RECONFIGURATION';

export interface HumanStrategicApprovalReport {
  readonly approvalReportId: string;
  readonly systemStateReferenceId: string;
  readonly strategicChangeScope: StrategicChangeScope;
  readonly sovereignHumanSignerId: string;
  readonly ed25519CryptographicSignature: string;
  readonly isExplicitlyAuthorized: boolean;
  readonly authorizationLineageRoot: string;
  readonly promotionGranted: boolean;
  readonly approvalProofSeal: string;
  readonly timestamp: number;
}

// ─── F243: SYSTEM EVOLUTION BENCHMARK 📊 ──────────────────────────────────────

export interface SystemEvolutionBenchmarkDimension {
  readonly dimensionName: string;
  readonly targetThreshold: string;
  readonly singleMissionBaselineScore: number;
  readonly multiMissionStrategicScore: number;
  readonly deltaGainPercent: number;
  readonly isPassed: boolean;
}

export interface SystemEvolutionBenchmarkReport {
  readonly benchmarkReportId: string;
  readonly systemStateReferenceId: string;
  readonly dimensions: readonly SystemEvolutionBenchmarkDimension[];
  readonly overallSystemScore: number;
  readonly compositeEvolutionGainPercent: number;
  readonly allDimensionsPassed: boolean;
  readonly benchmarkProofSeal: string;
  readonly timestamp: number;
}

// ─── F244: MASTER LAYER 18 CERTIFICATION 👑 ───────────────────────────────────

export interface MasterLayer18StrategicCertificate {
  readonly certificateId: string;
  readonly certifiedLayer: 'LAYER_18_ADAPTIVE_STRATEGIC_AUTONOMY';
  readonly funnelRange: 'F231_F244';
  readonly certifiedFunnelsCount: 14;
  readonly coreCapability: 'MULTI_MISSION_SYSTEM_COORDINATION';
  readonly authorityModel: 'HUMAN_META_GOVERNANCE';
  readonly automaticAuthorityGranted: false; // Permanent Invariant: FALSE
  readonly privilegeEscalationCount: 0; // Permanent Invariant: 0
  readonly safetyBoundaryMutationBlocked: true; // Permanent Invariant: BLOCKED
  readonly compositeStrategicGainPercent: number;
  readonly sovereignMasterStrategicProofSeal: string;
  readonly certificationTimestamp: number;
}
