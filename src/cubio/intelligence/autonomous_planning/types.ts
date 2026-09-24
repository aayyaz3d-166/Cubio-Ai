/**
 * CubiO — Universal Spatial Operating Environment
 * Layer 15: Autonomous Task Planning & Execution Types (F190–F193+)
 */

import { SectorDomainType } from '../soul_engine/types';
import { CubiODimension } from '../../types';

// ─── F190: GOAL & INTENT ENGINE ───────────────────────────────────────────────

export interface TaskConstraint {
  readonly constraintId: string;
  readonly description: string;
  readonly constraintType: 'GEOMETRIC_INVARIANT' | 'MATERIAL_LIMIT' | 'MANUFACTURING_TOLERANCE' | 'COMPLIANCE_STANDARD';
  readonly isStrict: boolean;
}

export interface ForbiddenAction {
  readonly actionId: string;
  readonly description: string;
  readonly violationRisk: 'HIGH_RISK_MANIFOLD_TEAR' | 'PRIVILEGE_ESCALATION' | 'UNCONTROLLED_DEFORMATION' | 'THERMAL_FAILURE';
}

export interface SuccessCriterion {
  readonly criterionId: string;
  readonly metricName: string;
  readonly targetThreshold: number;
  readonly comparisonOperator: '>=' | '<=' | '==';
}

export interface FormalTaskSpecificationReport {
  readonly specificationId: string;
  readonly rawUserPrompt: string;
  readonly resolvedPrimaryGoal: string;
  readonly targetSector: SectorDomainType;
  readonly targetDimension: CubiODimension;
  readonly explicitConstraints: readonly TaskConstraint[];
  readonly forbiddenActions: readonly ForbiddenAction[];
  readonly successCriteria: readonly SuccessCriterion[];
  readonly specificationChecksum: string;
  readonly timestamp: number;
}

// ─── F191: ACTION PLANNING ENGINE ─────────────────────────────────────────────

export interface PlanStep {
  readonly stepIndex: number;
  readonly actionName: string;
  readonly designatedSoulId: string;
  readonly targetSkillId: string;
  readonly inputParameters: Readonly<Record<string, any>>;
  readonly estimatedDurationMs: number;
  readonly expectedOutputContract: string;
}

export interface ExecutablePlanCandidate {
  readonly planId: string;
  readonly planName: string;
  readonly steps: readonly PlanStep[];
  readonly totalEstimatedLatencyMs: number;
  readonly estimatedComputeCostGflops: number;
  readonly riskScore: number;
  readonly expectedOutcomeDeltaCii: number;
  readonly dependencyAcyclicityVerified: boolean;
  readonly isParetoOptimal: boolean;
}

export interface ActionPlanningReport {
  readonly planningReportId: string;
  readonly specificationReferenceId: string;
  readonly generatedPlansCount: number;
  readonly candidatePlans: readonly ExecutablePlanCandidate[];
  readonly selectedBestPlanId: string;
  readonly planningProofSeal: string;
  readonly timestamp: number;
}

// ─── F192: COUNTERFACTUAL PLANNER ─────────────────────────────────────────────

export interface CounterfactualBranchSimulation {
  readonly branchId: string;
  readonly hypothesisAction: string;
  readonly simulatedOutcomeSummary: string;
  readonly simulatedGeometricWatertightness: boolean;
  readonly simulatedThermalStressMPa: number;
  readonly confidenceScore: number; // 0..1
  readonly branchVerdict: 'APPROVED_SAFE_BRANCH' | 'REJECTED_UNSAFE_STRESS' | 'REJECTED_LOW_CONFIDENCE';
}

export interface CounterfactualPlanningReport {
  readonly counterfactualReportId: string;
  readonly basePlanReferenceId: string;
  readonly simulatedBranchesCount: number;
  readonly branches: readonly CounterfactualBranchSimulation[];
  readonly winningSafeBranchId: string;
  readonly unsafeBranchesPrunedCount: number;
  readonly counterfactualProofSeal: string;
  readonly timestamp: number;
}

// ─── F193: TOOL & ENVIRONMENT SELECTION ───────────────────────────────────────

export type ExecutionEnvironmentType =
  | 'LOCAL_WASM_GEOMETRY_KERNEL'
  | 'GPU_FEA_SIMULATION_SANDBOX'
  | 'ISOLATED_SOUL_RUNTIME'
  | 'CROSS_DOMAIN_FEDERATION_CLUSTER';

export interface ToolEnvironmentAssignment {
  readonly stepIndex: number;
  readonly requiredSkillOrTool: string;
  readonly designatedSoulId: string;
  readonly assignedEnvironment: ExecutionEnvironmentType;
  readonly memoryQuarantineLevel: 'AIR_GAPPED' | 'STRICTLY_ISOLATED';
  readonly permissionGranted: boolean;
  readonly permissionAuditSignature: string;
}

export interface ToolEnvironmentSelectionReport {
  readonly selectionReportId: string;
  readonly planReferenceId: string;
  readonly assignmentsCount: number;
  readonly assignments: readonly ToolEnvironmentAssignment[];
  readonly allPermissionsIndependentlyVerified: true;
  readonly selectionProofSeal: string;
  readonly timestamp: number;
}

// ─── F194: ACTION SANDBOX ─────────────────────────────────────────────────────

export interface SandboxStepExecutionRecord {
  readonly stepIndex: number;
  readonly actionName: string;
  readonly executionStatus: 'COMPLETED_SUCCESS' | 'COMPLETED_WITH_WARNING' | 'FAILED_ROLLBACK';
  readonly stateChangesSummary: string;
  readonly unexpectedSideEffectsDetected: boolean;
  readonly rollbackAvailable: true;
  readonly executionTimeMs: number;
}

export interface ActionSandboxReport {
  readonly sandboxReportId: string;
  readonly planReferenceId: string;
  readonly sandboxIsolationLevel: 'AIR_GAPPED_EPHEMERAL';
  readonly stepRecords: readonly SandboxStepExecutionRecord[];
  readonly totalSandboxLatencyMs: number;
  readonly allStepsPassedCleanly: boolean;
  readonly productionStateUnmodified: true;
  readonly sandboxProofSeal: string;
  readonly timestamp: number;
}

// ─── F195: PREDICTIVE EXECUTION VALIDATOR ─────────────────────────────────────

export interface PredictedVsActualComparison {
  readonly metricName: string;
  readonly predictedValue: number;
  readonly sandboxActualValue: number;
  readonly absoluteDeviation: number;
  readonly deviationPercent: number;
  readonly withinAcceptableThreshold: boolean; // true if deviation < 5%
}

export interface PredictiveExecutionValidatorReport {
  readonly validatorReportId: string;
  readonly planReferenceId: string;
  readonly comparisons: readonly PredictedVsActualComparison[];
  readonly maxDeviationPercent: number;
  readonly significantDeviationDetected: boolean;
  readonly executionVerdict: 'PROCEED_TO_PRODUCTION' | 'HALT_AND_REPLAN';
  readonly validatorProofSeal: string;
  readonly timestamp: number;
}

// ─── F196: HIERARCHICAL ACTION EXECUTOR ───────────────────────────────────────

export type AtomicActionStatus =
  | 'EXECUTED_SUCCESS'
  | 'EXECUTED_WITH_STATE_VERIFIED'
  | 'FAILED_CONTAINED'
  | 'SKIPPED_DEPENDENCY_FAILED';

export interface AtomicActionRecord {
  readonly stepIndex: number;
  readonly actionName: string;
  readonly status: AtomicActionStatus;
  readonly preStateHash: string;
  readonly postStateHash: string;
  readonly stateTransitionVerified: boolean;
  readonly cascadeBlocked: boolean;
  readonly executionTimeMs: number;
}

export interface HierarchicalActionExecutorReport {
  readonly executorReportId: string;
  readonly planReferenceId: string;
  readonly atomicActions: readonly AtomicActionRecord[];
  readonly totalActionsExecuted: number;
  readonly failedActionsContained: number;
  readonly uncontrolledCascadesTriggered: 0;
  readonly allStateTransitionsVerified: boolean;
  readonly executorProofSeal: string;
  readonly timestamp: number;
}

// ─── F197: REAL-TIME STATE FEEDBACK LOOP ──────────────────────────────────────

export interface PlanningEnvironmentObservation {
  readonly observationIndex: number;
  readonly observedMetric: string;
  readonly previousValue: number;
  readonly currentValue: number;
  readonly changePercent: number;
  readonly worldModelUpdated: boolean;
  readonly planAdjustmentRequired: boolean;
}

export interface RealTimeStateFeedbackReport {
  readonly feedbackReportId: string;
  readonly planReferenceId: string;
  readonly observationCycleCount: number;
  readonly observations: readonly PlanningEnvironmentObservation[];
  readonly worldModelPatchesApplied: number;
  readonly closedLoopActive: true;
  readonly staticPlanOverridden: boolean;
  readonly feedbackProofSeal: string;
  readonly timestamp: number;
}

// ─── F198: ERROR RECOVERY & REPLANNING ────────────────────────────────────────

export type FailureRootCause =
  | 'GEOMETRY_CONSTRAINT_VIOLATION'
  | 'RESOURCE_EXHAUSTION'
  | 'DEPENDENCY_TIMEOUT'
  | 'SAFETY_BOUNDARY_BREACH'
  | 'UNKNOWN_TRANSIENT';

export interface RecoveryPlanCandidate {
  readonly recoveryPlanId: string;
  readonly rootCause: FailureRootCause;
  readonly strategyDescription: string;
  readonly estimatedRecoveryTimeMs: number;
  readonly confidenceScore: number;
  readonly blindRetry: false;
}

export interface ErrorRecoveryReplanningReport {
  readonly recoveryReportId: string;
  readonly failedStepIndex: number;
  readonly classifiedRootCause: FailureRootCause;
  readonly blindRetryAttempted: false;
  readonly candidateRecoveryPlans: readonly RecoveryPlanCandidate[];
  readonly selectedRecoveryPlanId: string;
  readonly recoveryValidated: boolean;
  readonly recoveryProofSeal: string;
  readonly timestamp: number;
}

// ─── F199: ACTION OUTCOME LEARNING ───────────────────────────────────────────

export type OutcomeVerdict = 'SUCCESS_VERIFIED' | 'PARTIAL_SUCCESS' | 'FAILURE_ANALYZED';

export interface ActionOutcomeRecord {
  readonly actionName: string;
  readonly outcomeVerdict: OutcomeVerdict;
  readonly predictedMetric: number;
  readonly actualMetric: number;
  readonly deviationPercent: number;
  readonly lessonExtracted: string;
}

export interface ActionOutcomeLearningReport {
  readonly learningReportId: string;
  readonly planReferenceId: string;
  readonly outcomeRecords: readonly ActionOutcomeRecord[];
  readonly totalLessonsExtracted: number;
  readonly feedbackTargets: readonly ('FUTURE_PLANNING' | 'SOUL_SKILL_BENCHMARK' | 'WORLD_MODEL_UPDATE')[];
  readonly learningProofSeal: string;
  readonly timestamp: number;
}

// ─── F200: EXECUTION SAFETY GOVERNOR ──────────────────────────────────────────

export interface BoundaryEnforcementAudit {
  readonly boundaryType: 'PHYSICAL_LIMIT' | 'DIGITAL_SANDBOX' | 'DOMAIN_GOVERNANCE';
  readonly checkedParameter: string;
  readonly thresholdLimit: string;
  readonly observedValue: string;
  readonly withinSafetyEnvelope: boolean;
  readonly automaticAuthorityGranted: false; // World Model knowledge DOES NOT grant execution authority
}

export interface ExecutionSafetyGovernorReport {
  readonly governorReportId: string;
  readonly planReferenceId: string;
  readonly boundaryAudits: readonly BoundaryEnforcementAudit[];
  readonly totalBoundariesEnforced: number;
  readonly allBoundariesPassed: boolean;
  readonly worldModelAuthorityBlocked: true;
  readonly executionSafetyProofSeal: string;
  readonly timestamp: number;
}

// ─── F201: HUMAN ACTION AUTHORIZATION GATE 👑 ──────────────────────────────────

export interface HumanActionAuthorizationRecord {
  readonly authorizationTokenId: string;
  readonly taskId: string;
  readonly impactLevel: 'HIGH_IMPACT_PRODUCTION_EXECUTION';
  readonly scopeOfAction: string;
  readonly authorizedByUser: string;
  readonly cryptographicSignature: string;
  readonly authorizationTimestamp: number;
  readonly isValidAndVerified: boolean;
}

export interface HumanActionAuthorizationReport {
  readonly gateReportId: string;
  readonly planReferenceId: string;
  readonly authorizationRecord: HumanActionAuthorizationRecord;
  readonly taskSpecificScopedApproval: true;
  readonly cryptographicAuditTrailPreserved: true;
  readonly humanAuthorizationProofSeal: string;
  readonly timestamp: number;
}

// ─── F202: AUTONOMOUS TASK BENCHMARK ──────────────────────────────────────────

export interface BenchmarkDimensionEvaluation {
  readonly dimension:
    | 'PLANNING_EFFICIENCY'
    | 'SUCCESS_RATE'
    | 'ERROR_RECOVERY'
    | 'GENERALIZATION'
    | 'EXECUTION_LATENCY'
    | 'SAFETY_COMPLIANCE';
  readonly baselineScore: number;
  readonly autonomousPlanningScore: number;
  readonly deltaImprovement: number;
  readonly certifiedPass: boolean;
}

export interface AutonomousTaskBenchmarkReport {
  readonly benchmarkReportId: string;
  readonly planReferenceId: string;
  readonly evaluations: readonly BenchmarkDimensionEvaluation[];
  readonly overallSuccessRatePercent: number;
  readonly compoundDeltaCiiUplift: number;
  readonly allDimensionsPassed: boolean;
  readonly benchmarkProofSeal: string;
  readonly timestamp: number;
}

// ─── F203: REALITY EXECUTION CERTIFICATION 👑 ─────────────────────────────────

export interface RealityExecutionCertificate {
  readonly certificateId: string;
  readonly certifiedLayer: 'LAYER_15_AUTONOMOUS_TASK_PLANNING_AND_EXECUTION';
  readonly funnelRange: 'F190_F203';
  readonly certifiedFunnelsCount: 14;
  readonly worldRepresentationCertified: true;
  readonly boundedExecutionValidated: true;
  readonly compoundCiiGain: number;
  readonly sovereignMasterProofSeal: string;
  readonly certificationTimestamp: number;
}

