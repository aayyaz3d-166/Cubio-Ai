/**
 * CubiO — Universal Spatial Operating Environment
 * Layer 14: Universal World Model & Cross-Domain Intelligence Types (F175–F189)
 */

import { SectorDomainType } from '../soul_engine/types';
import { CubiODimension } from '../../types';

// ─── F175: UNIVERSAL REPRESENTATION ENGINE ────────────────────────────────────

export interface DomainCoordinateEmbedding {
  readonly originSector: SectorDomainType;
  readonly localCoordinates: readonly number[];
  readonly universalManifoldEmbedding: readonly number[];
  readonly isometryConservationError: number;
  readonly dimension: CubiODimension;
}

export interface UniversalRepresentationReport {
  readonly representationReportId: string;
  readonly mappedDomainsCount: number;
  readonly domainEmbeddings: readonly DomainCoordinateEmbedding[];
  readonly universalManifoldMetricRank: number;
  readonly isometryPreserved: boolean;
  readonly universalRepresentationDigest: string;
  readonly timestamp: number;
}

// ─── F176: CROSS-DOMAIN RELATIONSHIP ENGINE ───────────────────────────────────

export type StructuralRelationshipType =
  | 'ISOMORPHIC_TOPOLOGY'
  | 'HARMONIC_VIBRATION_HOMOLOGY'
  | 'THERMAL_FLUIDIC_ANALOGY'
  | 'STRESS_DISTRIBUTION_EQUIVALENCE';

export interface CrossDomainRelationshipLink {
  readonly linkId: string;
  readonly sourceSector: SectorDomainType;
  readonly sourcePattern: string;
  readonly targetSector: SectorDomainType;
  readonly targetPattern: string;
  readonly relationshipType: StructuralRelationshipType;
  readonly structuralSimilarityScore: number;
  readonly empiricalTransferConfidence: number;
  readonly pValue: number;
  readonly evidenceVerificationProof: string;
}

export interface CrossDomainRelationshipReport {
  readonly relationshipReportId: string;
  readonly detectedLinksCount: number;
  readonly relationshipLinks: readonly CrossDomainRelationshipLink[];
  readonly evidenceBasedTransferVerified: boolean;
  readonly relationshipProofSeal: string;
  readonly timestamp: number;
}

// ─── F177: SPATIAL KNOWLEDGE GRAPH ────────────────────────────────────────────

export type SpatialGraphNodeType =
  | 'PARAMETRIC_OBJECT'
  | 'GEOMETRIC_SURFACE'
  | 'TOPOLOGICAL_MANIFOLD'
  | 'PHYSICAL_CONSTRAINT'
  | 'TRANSFORMATION_OPERATOR'
  | 'CAUSAL_DEPENDENCY';

export interface SpatialKnowledgeNode {
  readonly nodeId: string;
  readonly nodeType: SpatialGraphNodeType;
  readonly label: string;
  readonly sectorScope: SectorDomainType | 'GLOBAL_FEDERATED_INVARIANT';
  readonly properties: Readonly<Record<string, any>>;
  readonly isPrivateSoulData: boolean;
  readonly checksum: string;
}

export interface SpatialKnowledgeEdge {
  readonly edgeId: string;
  readonly sourceNodeId: string;
  readonly targetNodeId: string;
  readonly relation: string;
  readonly weight: number;
}

export interface SpatialKnowledgeGraphReport {
  readonly graphReportId: string;
  readonly totalNodesCount: number;
  readonly totalEdgesCount: number;
  readonly nodes: readonly SpatialKnowledgeNode[];
  readonly edges: readonly SpatialKnowledgeEdge[];
  readonly privateDataStrictlySegregated: true;
  readonly graphMerkleRoot: string;
  readonly timestamp: number;
}

// ─── F178: WORLD-STATE ENGINE ─────────────────────────────────────────────────

export interface WorldStateEntity {
  readonly entityId: string;
  readonly name: string;
  readonly dimension: CubiODimension;
  readonly spatialCoordinates: readonly number[];
  readonly boundingBoxMm: readonly [number, number, number];
  readonly physicalProperties: Readonly<Record<string, any>>;
}

export interface WorldStateTransitionAudit {
  readonly transitionId: string;
  readonly fromStateHash: string;
  readonly toStateHash: string;
  readonly appliedOperation: string;
  readonly uncertaintyEntropyBits: number;
  readonly isAuditableAndReversible: true;
  readonly timestamp: number;
}

export interface WorldStateReport {
  readonly worldStateId: string;
  readonly activeDimension: CubiODimension;
  readonly totalEntitiesCount: number;
  readonly activeEntities: readonly WorldStateEntity[];
  readonly stateEntropy: number;
  readonly currentWorldStateHash: string;
  readonly recentTransitionAudit: WorldStateTransitionAudit;
  readonly timestamp: number;
}

// ─── F179: CROSS-DOMAIN REASONING ENGINE ──────────────────────────────────────

export interface CrossDomainReasoningStep {
  readonly stepIndex: number;
  readonly contributingSoulId: string;
  readonly sector: SectorDomainType;
  readonly reasoningAction: string;
  readonly worldStateContextVerified: boolean;
  readonly intermediateConfidence: number;
}

export interface CrossDomainReasoningResult {
  readonly reasoningResultId: string;
  readonly complexProblemStatement: string;
  readonly reasoningSteps: readonly CrossDomainReasoningStep[];
  readonly synthesizedSolutionSummary: string;
  readonly overallConfidence: number;
  readonly compoundDeltaCiiUplift: number;
  readonly domainBoundariesConserved: true;
  readonly solutionProofSeal: string;
  readonly timestamp: number;
}

// ─── F180: UNIVERSAL HYPOTHESIS TRANSFER ──────────────────────────────────────

export interface TransferredCandidateHypothesis {
  readonly transferId: string;
  readonly originSector: SectorDomainType;
  readonly originValidatedRule: string;
  readonly targetSector: SectorDomainType;
  readonly candidateHypothesisStatement: string;
  readonly isTruthAssumed: false;
  readonly pendingValidationGate: 'F183_SANDBOX_EXPERIMENT';
}

export interface UniversalHypothesisTransferReport {
  readonly transferReportId: string;
  readonly transferredHypotheses: readonly TransferredCandidateHypothesis[];
  readonly autoTruthAssumptionBlocked: true;
  readonly timestamp: number;
}

// ─── F181: CAUSAL WORLD MODEL ─────────────────────────────────────────────────

export interface CausalInterventionLink {
  readonly causalLinkId: string;
  readonly treatmentVariable: string;
  readonly outcomeVariable: string;
  readonly doCalculusAverageTreatmentEffect: number;
  readonly observationalCorrelation: number;
  readonly isConfoundingEliminated: boolean;
  readonly causalAblationProof: string;
}

export interface CausalWorldModelReport {
  readonly causalModelReportId: string;
  readonly totalCausalLinksCount: number;
  readonly causalLinks: readonly CausalInterventionLink[];
  readonly correlationVsCausationDisambiguated: true;
  readonly timestamp: number;
}

// ─── F182: UNKNOWN STRUCTURE DISCOVERY ────────────────────────────────────────

export interface DiscoveredStructuralAnomaly {
  readonly discoveryId: string;
  readonly discoveryType: 'UNEXPLAINED_HARMONIC_RESONANCE' | 'TOPOLOGICAL_ASYMMETRY' | 'MISSING_CONSTRAINT_LINK';
  readonly observedPatternDescription: string;
  readonly statisticalAnomalySignificanceZScore: number;
  readonly isImmediateKnowledgeBlocked: true;
  readonly targetValidationProtocol: string;
}

export interface UnknownStructureDiscoveryReport {
  readonly discoveryReportId: string;
  readonly anomaliesDetectedCount: number;
  readonly anomalies: readonly DiscoveredStructuralAnomaly[];
  readonly sentToValidationPipeline: true;
  readonly timestamp: number;
}

// ─── F183: UNIVERSAL EXPERIMENT & VALIDATION ENGINE ───────────────────────────

export interface MultiVectorValidationMetrics {
  readonly accuracyPercent: number;
  readonly generalizationPercent: number;
  readonly causalValidityATE: number;
  readonly computeOverheadGflops: number;
  readonly safetyBoundaryPassRatePercent: number;
  readonly compositeScore: number;
}

export interface UniversalValidationTrialResult {
  readonly trialId: string;
  readonly testedHypothesisId: string;
  readonly metrics: MultiVectorValidationMetrics;
  readonly empiricalVerdict: 'FORMALLY_CERTIFIED' | 'REJECTED';
  readonly trialProofSeal: string;
}

export interface UniversalExperimentValidationReport {
  readonly validationReportId: string;
  readonly trialsExecuted: readonly UniversalValidationTrialResult[];
  readonly allMetricsSimultaneouslySatisfied: boolean;
  readonly timestamp: number;
}

// ─── F184: WORLD MODEL SELF-IMPROVEMENT SANDBOX ───────────────────────────────

export interface CandidateWorldModelArchitecture {
  readonly candidateArchitectureId: string;
  readonly proposedFeature: string;
  readonly simulatedPrecisionGainPercent: number;
  readonly simulatedLatencyCutPercent: number;
  readonly sandboxEvaluationScore: number;
  readonly status: 'SANDBOX_WINNER_FOR_HUMAN_GATE' | 'BENCHMARK_INFERIOR';
}

export interface WorldModelSelfImprovementReport {
  readonly selfImprovementReportId: string;
  readonly candidateArchitectures: readonly CandidateWorldModelArchitecture[];
  readonly winnerCandidateId: string;
  readonly directProductionModificationBlocked: true;
  readonly humanGovernanceGateRequired: true;
  readonly timestamp: number;
}

// ─── F185: UNIVERSAL MEMORY CONSOLIDATION ─────────────────────────────────────

export interface ConsolidatedGlobalKnowledgeEntity {
  readonly globalMemoryId: string;
  readonly sourceSoulId: string;
  readonly originSector: SectorDomainType;
  readonly invariantStatement: string;
  readonly empiricalConfidence: number;
  readonly versionLineage: string;
  readonly provenanceDigest: string;
}

export interface UniversalMemoryConsolidationReport {
  readonly consolidationReportId: string;
  readonly totalConsolidatedEntities: number;
  readonly consolidatedEntities: readonly ConsolidatedGlobalKnowledgeEntity[];
  readonly provenanceAndVersionPreserved: true;
  readonly globalMemoryMerkleRoot: string;
  readonly timestamp: number;
}

// ─── F186: WORLD MODEL SAFETY GOVERNOR ────────────────────────────────────────

export interface WorldModelSafetyInspection {
  readonly checkId: string;
  readonly inspectedSubsystem: 'UNIVERSAL_REPRESENTATION' | 'CROSS_DOMAIN_TRANSFER' | 'GLOBAL_MEMORY_GRAPH';
  readonly privilegeEscalationAttempted: false;
  readonly boundaryInvariantsIntact: true;
  readonly permissionLeakDetected: false;
  readonly inspectionVerdict: 'WORLD_MODEL_SAFETY_COMPLIANT';
}

export interface WorldModelSafetyGovernorReport {
  readonly governorReportId: string;
  readonly inspectionsCount: number;
  readonly inspections: readonly WorldModelSafetyInspection[];
  readonly zeroEscalationVerified: true;
  readonly safetyGovernorProofSeal: string;
  readonly timestamp: number;
}

// ─── F187: HUMAN WORLD-MODEL GOVERNANCE GATE ──────────────────────────────────

export interface WorldModelGovernanceApprovalToken {
  readonly tokenId: string;
  readonly operatorId: string;
  readonly ed25519Signature: string;
  readonly authorizedMutationDigest: string;
  readonly expirationTimestamp: number;
  readonly isValid: true;
}

export interface HumanWorldModelGovernanceGateReport {
  readonly gateReportId: string;
  readonly proposedUniversalMutation: string;
  readonly token: WorldModelGovernanceApprovalToken;
  readonly humanSovereignAuthorizationVerified: true;
  readonly approvalAuditProof: string;
  readonly gateStatus: 'UNIVERSAL_WORLD_MODEL_MUTATION_AUTHORIZED';
  readonly timestamp: number;
}

// ─── F188: UNIVERSAL INTELLIGENCE BENCHMARK ───────────────────────────────────

export interface ThreeTierBenchmarkComparisonMetrics {
  readonly reasoningScorePercent: { readonly singleSoul: number; readonly multiSoulFed: number; readonly universalWorldModel: number; readonly totalUplift: number };
  readonly crossDomainTransferPercent: { readonly singleSoul: number; readonly multiSoulFed: number; readonly universalWorldModel: number; readonly totalUplift: number };
  readonly predictionAccuracyPercent: { readonly singleSoul: number; readonly multiSoulFed: number; readonly universalWorldModel: number; readonly totalUplift: number };
  readonly generalizationPercent: { readonly singleSoul: number; readonly multiSoulFed: number; readonly universalWorldModel: number; readonly totalUplift: number };
  readonly averageLatencyMs: { readonly singleSoul: number; readonly multiSoulFed: number; readonly universalWorldModel: number; readonly speedupRatio: number };
  readonly reliabilityPercent: { readonly singleSoul: number; readonly multiSoulFed: number; readonly universalWorldModel: number; readonly totalUplift: number };
  readonly safetyCompliancePercent: { readonly singleSoul: number; readonly multiSoulFed: number; readonly universalWorldModel: number; readonly isConserved: true };
  readonly compoundDeltaCii: number; // e.g. +21.50 points
}

export interface UniversalIntelligenceBenchmarkReport {
  readonly benchmarkReportId: string;
  readonly totalBatteryTasksCount: number; // 100 tasks
  readonly metrics: ThreeTierBenchmarkComparisonMetrics;
  readonly universalSuperiorityConfirmed: true;
  readonly benchmarkProofSeal: string;
  readonly timestamp: number;
}

// ─── F189: MASTER WORLD MODEL CERTIFICATION 👑 ─────────────────────────────────

export interface MasterWorldModelCertificationReport {
  readonly certificateId: string;
  readonly certifiedLayer: 'LAYER_14_UNIVERSAL_WORLD_MODEL_CROSS_DOMAIN';
  readonly certifiedFunnels: readonly string[]; // F175–F188
  readonly compositeWorldModelScore: number; // e.g. 99.99 / 100.0
  readonly masterWorldModelCryptographicSeal: string;
  readonly sovereignSignOffAuthority: 'HUMAN_META_GOVERNANCE';
  readonly formalCertificationVerdict: 'LAYER_14_UNIVERSAL_WORLD_MODEL_CERTIFIED';
  readonly timestamp: number;
}
