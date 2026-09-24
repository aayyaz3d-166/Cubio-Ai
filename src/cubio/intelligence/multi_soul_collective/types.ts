/**
 * CubiO — Universal Spatial Operating Environment
 * Layer 13: Multi-SOUL Collective Intelligence Types (F161–F174)
 */

import { SectorDomainType } from '../soul_engine/types';

// ─── F161: CROSS-SOUL KNOWLEDGE EXCHANGE ──────────────────────────────────────

export type KnowledgeEntityType =
  | 'VALIDATED_SKILL_CONTRACT'
  | 'TOPOLOGICAL_INVARIANT_RULE'
  | '369_HARMONIC_TEMPLATE'
  | 'GEOMETRIC_ALGORITHM_MODULE';

export interface ExchangeableKnowledgeEntity {
  readonly entityId: string;
  readonly entityType: KnowledgeEntityType;
  readonly originSoulId: string;
  readonly originSector: SectorDomainType;
  readonly domainAgnosticPayloadDigest: string;
  readonly empiricalEffectSizeDeltaCii: number;
  readonly safetyApprovalProof: string;
  readonly isProprietaryDataFiltered: true;
}

export interface CrossSoulExchangeReceipt {
  readonly exchangeId: string;
  readonly sourceSoulId: string;
  readonly targetSoulId: string;
  readonly transferredEntities: readonly ExchangeableKnowledgeEntity[];
  readonly rawMemoryLeakageDetected: false;
  readonly complianceVerified: boolean;
  readonly exchangeProofSeal: string;
  readonly timestamp: number;
}

// ─── F162: CROSS-SOUL TASK DECOMPOSITION ──────────────────────────────────────

export interface DomainSubtask {
  readonly subtaskId: string;
  readonly title: string;
  readonly targetSector: SectorDomainType;
  readonly assignedSoulId: string;
  readonly inputParameters: Readonly<Record<string, any>>;
  readonly requiredCapabilities: readonly string[];
  readonly dependencySubtaskIds: readonly string[];
  readonly estimatedExecutionTimeMs: number;
}

export interface TaskDecompositionReport {
  readonly decompositionId: string;
  readonly rootPrompt: string;
  readonly totalSubtasksCount: number;
  readonly subtaskDag: readonly DomainSubtask[];
  readonly maxDagDepth: number;
  readonly isAcyclicVerified: boolean;
  readonly provenanceRoot: string;
  readonly timestamp: number;
}

// ─── F163: COLLABORATIVE WORKFLOW ENGINE ──────────────────────────────────────

export interface CrossSoulWorkflowNode {
  readonly nodeId: string;
  readonly soulId: string;
  readonly sector: SectorDomainType;
  readonly skillId: string;
  readonly inputContract: string;
  readonly outputContract: string;
}

export interface CrossSoulWorkflowEdge {
  readonly edgeId: string;
  readonly sourceNodeId: string;
  readonly targetNodeId: string;
  readonly contractCompatibilityVerified: boolean;
}

export interface CollaborativeWorkflowResult {
  readonly workflowId: string;
  readonly workflowName: string;
  readonly nodes: readonly CrossSoulWorkflowNode[];
  readonly edges: readonly CrossSoulWorkflowEdge[];
  readonly topologicalExecutionOrder: readonly string[];
  readonly totalEstimatedLatencyMs: number;
  readonly allContractsCompatible: boolean;
  readonly workflowDigest: string;
  readonly timestamp: number;
}

// ─── F164: CROSS-SOUL HYPOTHESIS ENGINE ───────────────────────────────────────

export interface SoulHypothesisProposal {
  readonly hypothesisId: string;
  readonly proposingSoulId: string;
  readonly sector: SectorDomainType;
  readonly hypothesisStatement: string;
  readonly theoreticalMechanism: string;
  readonly sandboxExperimentDesign: string;
}

export interface HypothesisExperimentResult {
  readonly hypothesisId: string;
  readonly proposingSoulId: string;
  readonly trialsCount: number;
  readonly empiricalDeltaCii: number;
  readonly pValue: number;
  readonly passRatePercent: number;
  readonly isStatisticallySignificant: boolean;
}

export interface CrossSoulConsensusReport {
  readonly consensusId: string;
  readonly problemStatement: string;
  readonly competingHypotheses: readonly SoulHypothesisProposal[];
  readonly experimentalResults: readonly HypothesisExperimentResult[];
  readonly winningHypothesisId: string;
  readonly consensusFormationType: 'EVIDENCE_BASED_EMPIRICAL_CONVERGENCE';
  readonly consensusProofSeal: string;
  readonly timestamp: number;
}

// ─── F165: COLLECTIVE INFORMATION GAIN OPTIMIZER ──────────────────────────────

export interface FederationCandidateExperiment {
  readonly experimentId: string;
  readonly targetSector: SectorDomainType;
  readonly designatedSoulId: string;
  readonly hypothesisReference: string;
  readonly priorUncertaintyEntropy: number;
  readonly expectedInformationGainBits: number;
  readonly expectedDeltaCii: number;
  readonly computeCostGflops: number;
  readonly redundancyPenalty: number;
  readonly priorityScore: number;
}

export interface CollectiveOptimizationReport {
  readonly optimizationId: string;
  readonly totalCandidatesEvaluated: number;
  readonly candidateQueue: readonly FederationCandidateExperiment[];
  readonly selectedOptimalExperimentId: string;
  readonly duplicationMinimizationScore: number; // 0..1 (1.0 = zero duplicate work)
  readonly collectiveExpectedInfoGain: number;
  readonly optimizationProofSeal: string;
  readonly timestamp: number;
}

// ─── F166: CROSS-SOUL CAUSAL ATTRIBUTION ──────────────────────────────────────

export interface SoulContributionAttribution {
  readonly contributorId: string;
  readonly contributorType: 'SOUL_NODE' | 'SKILL_MODULE' | 'REPRESENTATION_369' | 'WORKFLOW_DAG';
  readonly assignedSector: SectorDomainType;
  readonly shapleyValueFraction: number; // e.g. 0.42 (sum = 1.0)
  readonly marginalDeltaCiiContribution: number; // e.g. +7.20 ΔCII
  readonly ablationProofChecksum: string;
}

export interface CrossSoulCausalAttributionReport {
  readonly attributionReportId: string;
  readonly targetOutcomeMetric: string;
  readonly totalCompoundDeltaCii: number;
  readonly attributions: readonly SoulContributionAttribution[];
  readonly mathematicalConservationVerified: boolean; // sum of Shapley = 1.0
  readonly attributionAuditProofSeal: string;
  readonly timestamp: number;
}

// ─── F167: KNOWLEDGE CONFLICT RESOLVER ────────────────────────────────────────

export interface CompetingKnowledgeClaim {
  readonly claimId: string;
  readonly proposingSoulId: string;
  readonly sector: SectorDomainType;
  readonly ruleStatement: string;
  readonly empiricalConfidence: number; // 0..1
  readonly sampleSizeTrials: number;
  readonly provenanceDigest: string;
}

export interface ConflictResolutionReport {
  readonly conflictResolutionId: string;
  readonly conflictingTopic: string;
  readonly competingClaims: readonly CompetingKnowledgeClaim[];
  readonly winningClaimId: string;
  readonly resolutionStrategy: 'EMPIRICAL_BENCHMARK_PROVENANCE_ARBITRATION';
  readonly resolutionRationale: string;
  readonly blindMergeRejected: true;
  readonly arbitrationProofSeal: string;
  readonly timestamp: number;
}

// ─── F168: FEDERATED MEMORY & KNOWLEDGE GRAPH ─────────────────────────────────

export interface FederatedGraphNode {
  readonly nodeId: string;
  readonly nodeType: 'FEDERATED_INVARIANT' | 'CROSS_SECTOR_SKILL' | 'HARMONIC_TEMPLATE';
  readonly label: string;
  readonly invariantDigest: string;
  readonly contributingSoulIds: readonly string[];
  readonly isDomainSpecificIsolated: true;
}

export interface FederatedGraphEdge {
  readonly edgeId: string;
  readonly sourceNodeId: string;
  readonly targetNodeId: string;
  readonly relationship: 'INVARIANT_DERIVATION' | 'CROSS_SECTOR_GENERALIZATION' | 'HARMONIC_COUPLING';
  readonly confidenceWeight: number;
}

export interface FederatedMemoryGraphReport {
  readonly graphReportId: string;
  readonly totalFederatedNodesCount: number;
  readonly totalFederatedEdgesCount: number;
  readonly nodes: readonly FederatedGraphNode[];
  readonly edges: readonly FederatedGraphEdge[];
  readonly privateMemoryPartitionsIsolated: true;
  readonly federatedGraphMerkleRoot: string;
  readonly timestamp: number;
}

// ─── F169: COLLECTIVE LEARNING LOOP ───────────────────────────────────────────

export interface CollectiveLearningCycleStage {
  readonly stageIndex: number;
  readonly stageName: string;
  readonly participatingSoulsCount: number;
  readonly executionTimeMs: number;
  readonly stageStatus: 'COMPLETED_SUCCESS';
}

export interface CollectiveLearningLoopReport {
  readonly collectiveLoopId: string;
  readonly participatingSoulIds: readonly string[];
  readonly cycleStages: readonly CollectiveLearningCycleStage[];
  readonly totalLoopLatencyMs: number;
  readonly federationDeltaCiiUplift: number;
  readonly governanceInvariancePreserved: true;
  readonly collectiveLoopProofSeal: string;
  readonly timestamp: number;
}

// ─── F170: FEDERATION SELF-OPTIMIZATION ───────────────────────────────────────

export interface FederationOptimizationProposal {
  readonly proposalId: string;
  readonly targetSubsystem: 'TASK_ROUTING' | 'KNOWLEDGE_TRANSFER_CACHE' | 'COLLABORATIVE_DAG_TOPOLOGY';
  readonly proposedMutationSummary: string;
  readonly simulatedEfficiencyGainPercent: number;
  readonly simulatedLatencyReductionMs: number;
  readonly airGappedValidationStatus: 'VALIDATED_IN_SANDBOX';
}

export interface FederationSelfOptimizationReport {
  readonly selfOptimizationId: string;
  readonly proposalsEvaluated: readonly FederationOptimizationProposal[];
  readonly winningProposalId: string;
  readonly directProductionModificationBlocked: true;
  readonly humanApprovalGateRequired: true;
  readonly selfOptimizationProofSeal: string;
  readonly timestamp: number;
}

// ─── F171: MULTI-SOUL SAFETY GOVERNOR ─────────────────────────────────────────

export interface CrossSoulInteractionSecurityAudit {
  readonly sourceSoulId: string;
  readonly targetSoulId: string;
  readonly interactionType: 'KNOWLEDGE_TRANSFER' | 'SUBTASK_DELEGATION' | 'WORKFLOW_INVOCATION';
  readonly privilegeEscalationAttempted: false;
  readonly permissionInheritanceBlocked: true;
  readonly boundaryIsolationMaintained: true;
  readonly safetyVerdict: 'FEDERATION_SECURITY_COMPLIANT';
}

export interface MultiSoulSafetyGovernorReport {
  readonly governorReportId: string;
  readonly auditedInteractionsCount: number;
  readonly securityAudits: readonly CrossSoulInteractionSecurityAudit[];
  readonly zeroPermissionBleedVerified: true;
  readonly nonEscalationEnforced: true;
  readonly governorProofSeal: string;
  readonly timestamp: number;
}

// ─── F172: FEDERATION GOVERNANCE GATE ─────────────────────────────────────────

export interface FederationGovernanceApprovalToken {
  readonly tokenId: string;
  readonly operatorId: string;
  readonly ed25519Signature: string;
  readonly authorizedMutationDigest: string;
  readonly expirationTimestamp: number;
  readonly isValid: true;
}

export interface FederationGovernanceGateReport {
  readonly gateReportId: string;
  readonly proposedFederationMutation: string;
  readonly token: FederationGovernanceApprovalToken;
  readonly humanSovereignAuthorizationVerified: true;
  readonly auditChainMerkleRoot: string;
  readonly gateStatus: 'FEDERATION_PROMOTION_AUTHORIZED';
  readonly timestamp: number;
}

// ─── F173: COLLECTIVE INTELLIGENCE BENCHMARK ──────────────────────────────────

export interface CollectiveBenchmarkComparisonMetrics {
  readonly accuracyPercent: { readonly singleSoulBaseline: number; readonly federatedCollective: number; readonly delta: number };
  readonly generalizationPercent: { readonly singleSoulBaseline: number; readonly federatedCollective: number; readonly delta: number };
  readonly averageLatencyMs: { readonly singleSoulBaseline: number; readonly federatedCollective: number; readonly speedup: number };
  readonly crossDomainTransferPercent: { readonly singleSoulBaseline: number; readonly federatedCollective: number; readonly delta: number };
  readonly reliabilityPercent: { readonly singleSoulBaseline: number; readonly federatedCollective: number; readonly delta: number };
  readonly safetyCompliancePercent: { readonly singleSoulBaseline: number; readonly federatedCollective: number; readonly delta: number };
  readonly compoundDeltaCii: number;
}

export interface CollectiveIntelligenceBenchmarkReport {
  readonly benchmarkReportId: string;
  readonly batteryTasksCount: number; // 100 tasks
  readonly metrics: CollectiveBenchmarkComparisonMetrics;
  readonly collectiveSuperiorityConfirmed: true;
  readonly benchmarkProofSeal: string;
  readonly timestamp: number;
}

// ─── F174: MASTER COLLECTIVE INTELLIGENCE CERTIFICATION 👑 ─────────────────────

export interface MasterCollectiveCertificationReport {
  readonly certificateId: string;
  readonly certifiedLayer: 'LAYER_13_MULTI_SOUL_COLLECTIVE_INTELLIGENCE';
  readonly certifiedFunnels: readonly string[]; // F161–F173
  readonly federationNodesCount: number;
  readonly compositeCollectiveScore: number; // e.g. 99.98 / 100.0
  readonly masterCollectiveCryptographicSeal: string;
  readonly sovereignSignOffAuthority: 'HUMAN_META_GOVERNANCE';
  readonly formalCertificationVerdict: 'LAYER_13_MULTI_SOUL_COLLECTIVE_CERTIFIED';
  readonly timestamp: number;
}
