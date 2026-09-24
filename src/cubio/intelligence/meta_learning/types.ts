/**
 * CubiO — Universal Spatial Operating Environment
 * Layer 11: Meta-Learning & Autonomous Self-Improvement Types (F136–F147)
 */

export type DomainCapabilityType =
  | 'SPATIAL_BREP_TOPOLOGY'
  | 'CNC_5AXIS_MOTION_PLANNING'
  | 'ACOUSTIC_PHOTONIC_TRANSFER'
  | 'STRUCTURAL_CAUSAL_DAG'
  | 'NOVEL_OUT_OF_DISTRIBUTION_GEOMETRY'
  | 'CONTINUOUS_SURFACE_DIFFERENTIABILITY'
  | 'HIGH_PRESSURE_MECHANICAL_INVARIANTS';

export interface DomainProficiencyScore {
  readonly domain: DomainCapabilityType;
  readonly currentProficiencyScore: number; // 0..100
  readonly failureRate: number; // 0..1
  readonly epistemicUncertainty: number; // 0..1
  readonly bottleneckSeverityIndex: number; // 0..1
  readonly sampleCount: number;
}

export interface LearningObjectiveProposal {
  readonly objectiveId: string;
  readonly targetDomain: DomainCapabilityType;
  readonly objectiveTitle: string;
  readonly currentProficiency: number;
  readonly targetProficiency: number;
  readonly bottleneckSeverity: number;
  readonly epistemicUncertainty: number;
  readonly expectedCiiUpliftPotential: number;
  readonly priorityRank: number;
  readonly rationale: string;
  readonly formalSuccessCriteria: readonly string[];
}

export interface F136ObjectiveReport {
  readonly objectiveReportId: string;
  readonly domainsAnalyzedCount: number;
  readonly domainProficiencies: readonly DomainProficiencyScore[];
  readonly prioritizedObjectives: readonly LearningObjectiveProposal[];
  readonly selectedPrimaryObjective: LearningObjectiveProposal;
  readonly epistemicUncertaintySum: number;
  readonly f136AcceptanceGatePassed: boolean;
  readonly cryptographicProof: string;
  readonly timestamp: number;
}

export interface MetaLearningStrategy {
  readonly strategyId: string;
  readonly strategyName: string;
  readonly historicalAvgDeltaCii: number;
  readonly sampleEfficiency: number;
  readonly riskProfile: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface MetaIntelligenceCertification {
  readonly certificateId: string;
  readonly certifiedLayer: 'LAYER_11_META_LEARNING';
  readonly layerFunnelsCertified: readonly string[];
  readonly taskCiiScore: number;
  readonly metaLearningVelocityScore: number;
  readonly compositeMetaIntelligenceScore: number;
  readonly certificationStatus: 'CERTIFIED_SUPREME_META_INTELLIGENCE';
  readonly cryptographicMasterSeal: string;
  readonly timestamp: number;
}
