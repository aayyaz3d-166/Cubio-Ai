/**
 * CubiO — Universal Spatial Operating Environment
 * Layer 8: Generalized Autonomous Intelligence Master Types (F111–F123)
 */

export type MetaInvariantCategory =
  | 'TOPOLOGICAL_CONSERVATION'
  | 'HARMONIC_MODULO_RESONANCE'
  | 'WAVE_IMPEDANCE_BOUNDARY'
  | 'ENTROPY_ISOLATION_SANDBOX'
  | 'CONSENSUS_EQUILIBRIUM'
  | 'CAUSAL_DEPENDENCY';

export interface AbstractMetaPrinciple {
  readonly principleId: string;
  readonly category: MetaInvariantCategory;
  readonly mathematicalInvariantFormula: string;
  readonly abstractProperties: readonly string[];
  readonly sourceDomain: string;
  readonly resonanceConfidence: number;
  readonly extractedAt: number;
}

export interface CrossDomainIsomorphismMapping {
  readonly mappingId: string;
  readonly sourceDomain: string;
  readonly targetDomain: string;
  readonly metaPrinciple: AbstractMetaPrinciple;
  readonly structuralAnalogies: Readonly<Record<string, string>>;
  readonly transferConfidence: number;
  readonly mappingChecksum: string;
}

export interface NovelUnknownTaskSpecification {
  readonly taskId: string;
  readonly targetDomain: string;
  readonly naturalLanguageObjective: string;
  readonly targetConstraints: readonly string[];
  readonly rawEnvironmentInput: Readonly<Record<string, unknown>>;
}

export interface DynamicActionNode {
  readonly nodeId: string;
  readonly stage: 'PERCEIVE' | 'PLAN' | 'REASON' | 'SYNTHESIZE' | 'EXECUTE' | 'VERIFY';
  readonly assignedAgentRole: string;
  readonly synthesizedInstruction: string;
  readonly transferredInvariantRule: string;
  readonly dependsOnNodeIds: readonly string[];
}

export interface ZeroTemplateSolutionDAG {
  readonly dagId: string;
  readonly targetDomain: string;
  readonly nodes: readonly DynamicActionNode[];
  readonly estimatedCiiScore: number;
  readonly zeroTemplateVerified: boolean;
  readonly dagChecksum: string;
}

export interface GeneralizationTransferResult {
  readonly transferRunId: string;
  readonly novelTask: NovelUnknownTaskSpecification;
  readonly appliedIsomorphism: CrossDomainIsomorphismMapping;
  readonly synthesizedDAG: ZeroTemplateSolutionDAG;
  readonly executionOutcome: Readonly<Record<string, unknown>>;
  readonly targetDomainInvariantSatisfied: boolean;
  readonly empiricalQualityScore: number;
  readonly executionLatencyMs: number;
  readonly liveCiiScoreOutOf100: number;
  readonly generalizationSealHash: string;
  readonly timestamp: number;
}

export interface IGeneralizedAutonomousIntelligence {
  transferReasoningToNovelDomain(
    novelTask: NovelUnknownTaskSpecification
  ): Promise<GeneralizationTransferResult>;
}

// ─── F114: SELF-DIRECTED GOAL DECOMPOSITION ─────────────────────────────────

export interface GoalSubNode {
  readonly subGoalId: string;
  readonly description: string;
  readonly priority: number;
  readonly requiredCapabilities: readonly string[];
  readonly successCriteria: string;
  readonly estimatedRisk: number;
}

export interface GoalDecompositionTree {
  readonly rootGoalId: string;
  readonly rawGoalPrompt: string;
  readonly subGoals: readonly GoalSubNode[];
  readonly dependencyEdges: readonly [string, string][]; // [from, to]
  readonly treeChecksum: string;
}

// ─── F115: UNCERTAINTY & CONFIDENCE ENGINE ─────────────────────────────────

export interface UncertaintyEvaluation {
  readonly evaluationId: string;
  readonly epistemicUncertainty: number; // 0.0 .. 1.0 (knowledge gap)
  readonly aleatoricUncertainty: number; // 0.0 .. 1.0 (inherent stochasticity)
  readonly totalEntropy: number;
  readonly calibratedConfidenceScore: number; // 0.0 .. 1.0
  readonly confidenceInterval: [number, number]; // e.g. [0.95, 0.99]
  readonly shouldRequestClarification: boolean;
}

// ─── F116: COUNTERFACTUAL REASONING ENGINE ─────────────────────────────────

export interface CounterfactualQuery {
  readonly queryId: string;
  readonly baselineFacts: Readonly<Record<string, unknown>>;
  readonly counterfactualIntervention: Readonly<Record<string, unknown>>;
  readonly targetOutcomeVariable: string;
}

export interface CounterfactualSimulationResult {
  readonly queryId: string;
  readonly factualOutcome: unknown;
  readonly counterfactualOutcome: unknown;
  readonly divergenceDelta: number;
  readonly causalExplanation: string;
  readonly isPhysicallyValid: boolean;
}

// ─── F117: CAUSAL REASONING ENGINE ─────────────────────────────────────────

export interface CausalEdge {
  readonly cause: string;
  readonly effect: string;
  readonly mechanismFormula: string;
  readonly strength: number;
}

export interface StructuralCausalModel {
  readonly modelId: string;
  readonly variables: readonly string[];
  readonly causalEdges: readonly CausalEdge[];
  readonly isAcyclic: boolean;
}

export interface DoInterventionResult {
  readonly interventionVariable: string;
  readonly assignedValue: unknown;
  readonly downstreamEffects: Readonly<Record<string, unknown>>;
  readonly backDoorCriterionSatisfied: boolean;
}

// ─── F118: KNOWLEDGE GRAPH & WORLD MODEL ───────────────────────────────────

export interface WorldEntity {
  readonly entityId: string;
  readonly entityType: string;
  readonly attributes: Readonly<Record<string, unknown>>;
  readonly spatialCoordinates?: [number, number, number];
}

export interface WorldRelation {
  readonly sourceEntityId: string;
  readonly relationType: string;
  readonly targetEntityId: string;
  readonly weight: number;
}

export interface SovereignWorldModelGraph {
  readonly modelId: string;
  readonly entities: readonly WorldEntity[];
  readonly relations: readonly WorldRelation[];
  readonly graphDensity: number;
  readonly worldChecksum: string;
}

// ─── F119: GENERALIZATION BENCHMARK ────────────────────────────────────────

export interface GeneralizationBenchmarkReport {
  readonly benchmarkRunId: string;
  readonly totalZeroShotScenarios: number;
  readonly passedScenarios: number;
  readonly generalizationPassRate: number;
  readonly avgTransferLatencyMs: number;
  readonly compositeGeneralizationCii: number;
}

// ─── F120: AUTONOMOUS RESEARCH LOOP ────────────────────────────────────────

export interface ResearchHypothesis {
  readonly hypothesisId: string;
  readonly claim: string;
  readonly proposedExperiment: string;
  readonly expectedFalsificationCriteria: string;
}

export interface AutonomousResearchReport {
  readonly researchRunId: string;
  readonly hypothesis: ResearchHypothesis;
  readonly experimentExecuted: boolean;
  readonly empiricalObservation: string;
  readonly hypothesisValidated: boolean;
  readonly updatedTheorySummary: string;
}

// ─── F121: SELF-CRITIQUE & ERROR CORRECTION ────────────────────────────────

export interface MetacognitiveCritique {
  readonly critiqueId: string;
  readonly targetOutput: unknown;
  readonly hallucinationRiskScore: number;
  readonly detectedFlaws: readonly string[];
  readonly autoCorrectedOutput: unknown;
  readonly correctionVerified: boolean;
}

// ─── F122: INDEPENDENT INTELLIGENCE EVALUATION ─────────────────────────────

export interface IndependentEvaluationAudit {
  readonly auditId: string;
  readonly evaluationAuthority: string;
  readonly testBatterySize: number;
  readonly unbiasedAccuracyScore: number;
  readonly robustnessAgainstAdversarialProbes: number;
  readonly evaluationSealChecksum: string;
}

// ─── F123: GENERALIZED REALITY CERTIFICATION ───────────────────────────────

export interface GeneralizedRealityCertification {
  readonly certificateId: string;
  readonly certifiedLayer: 'LAYER_8_GENERALIZED_AUTONOMOUS_INTELLIGENCE';
  readonly layerFunnelsCertified: readonly string[];
  readonly crossDomainTransferScore: number;
  readonly zeroTemplateScore: number;
  readonly counterfactualScore: number;
  readonly causalReasoningScore: number;
  readonly worldModelIntegrityScore: number;
  readonly compositeLayer8CiiScore: number;
  readonly status: 'CERTIFIED_SUPREME_GENERALIZED';
  readonly cryptographicMasterSeal: string;
  readonly timestamp: number;
}
