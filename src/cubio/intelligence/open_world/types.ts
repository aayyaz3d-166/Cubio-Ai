/**
 * CubiO — Universal Spatial Operating Environment
 * Layer 9: Open-World / Adaptive Intelligence Master Types (F124–F138)
 */

// ─── F124: OPEN-WORLD ENVIRONMENT ──────────────────────────────────────────

export interface OpenWorldEnvironmentState {
  readonly environmentId: string;
  readonly isPartiallyObservable: boolean;
  readonly observedVariables: Readonly<Record<string, unknown>>;
  readonly unmodeledSignalsCount: number;
  readonly stateEntropy: number; // 0.0 .. 1.0
  readonly stateChecksum: string;
  readonly observedAt: number;
}

// ─── F125: UNKNOWN TASK DISCOVERY ──────────────────────────────────────────

export interface DiscoveredTask {
  readonly discoveredTaskId: string;
  readonly inferredGoal: string;
  readonly latentConstraints: readonly string[];
  readonly discoveryConfidence: number; // 0.0 .. 1.0
  readonly anomalyTriggerSignature: string;
}

// ─── F126: AUTONOMOUS HYPOTHESIS GENERATION ────────────────────────────────

export interface OpenWorldHypothesis {
  readonly hypothesisId: string;
  readonly causalClaim: string;
  readonly mathematicalInvariant: string;
  readonly falsificationCondition: string;
  readonly priorBeliefProbability: number; // 0.0 .. 1.0
}

// ─── F127: EXPERIMENT DESIGN ───────────────────────────────────────────────

export interface ProbingExperiment {
  readonly experimentId: string;
  readonly targetHypothesisId: string;
  readonly probingActionPayload: Readonly<Record<string, unknown>>;
  readonly expectedObservationIfTrue: string;
  readonly expectedObservationIfFalse: string;
  readonly isNonDestructive: boolean;
}

export interface ExperimentOutcome {
  readonly experimentId: string;
  readonly executedSuccessfully: boolean;
  readonly rawObservation: string;
  readonly hypothesisConfirmed: boolean;
  readonly posteriorBeliefProbability: number;
  readonly durationMs: number;
}

// ─── F128: ACTIVE LEARNING ─────────────────────────────────────────────────

export interface InformationGainEvaluation {
  readonly candidateProbes: readonly string[];
  readonly selectedProbeIndex: number;
  readonly expectedInformationGainBits: number;
  readonly epistemicEntropyReduction: number;
}

// ─── F129: ADAPTIVE STRATEGY SELECTION ─────────────────────────────────────

export type OpenWorldStrategyMode =
  | 'EXPLORATORY_PROBING'
  | 'CONSERVATIVE_SAFETY_FIRST'
  | 'EXPLOITATIVE_EXECUTION'
  | 'HYBRID_ACTIVE_RECOVERY';

export interface AdaptiveStrategyDecision {
  readonly strategyId: string;
  readonly selectedMode: OpenWorldStrategyMode;
  readonly rationale: string;
  readonly explorationBudgetPercentage: number;
  readonly riskToleranceScore: number;
}

// ─── F130: FAILURE-TO-KNOWLEDGE CONVERSION ─────────────────────────────────

export interface FailureKnowledgeRecord {
  readonly failureId: string;
  readonly runtimeErrorSignature: string;
  readonly rootCauseDiagnosis: string;
  readonly negativeConstraintRule: string;
  readonly preventativeAssertionCode: string;
  readonly savedToMerkleMemory: boolean;
}

// ─── F131: PERSISTENT WORLD-MODEL UPDATE ───────────────────────────────────

export interface PersistentWorldModelUpdateReport {
  readonly updateId: string;
  readonly newEntitiesAdded: number;
  readonly relationsRefined: number;
  readonly modelGraphDensity: number;
  readonly updatedWorldChecksum: string;
}

// ─── F132: NOVEL TOOL DISCOVERY & SYNTHESIS ────────────────────────────────

export interface SynthesizedNovelTool {
  readonly toolId: string;
  readonly toolName: string;
  readonly description: string;
  readonly executableScriptAST: string;
  readonly inputSchema: Readonly<Record<string, string>>;
  readonly sandboxedCompilationPassed: boolean;
  readonly toolChecksum: string;
}

// ─── F133: UNKNOWN API ADAPTATION ──────────────────────────────────────────

export interface InferredApiSchema {
  readonly apiEndpoint: string;
  readonly detectedProtocol: 'REST' | 'GRAPHQL' | 'WEBSOCKET' | 'RPC';
  readonly discoveredMethods: readonly string[];
  readonly synthesizedClientAdapterCode: string;
  readonly roundTripVerificationPassed: boolean;
}

// ─── F134: DECISION ARBITRATION ────────────────────────────────────────────

export interface ArbitrationDecision {
  readonly arbitrationId: string;
  readonly actionGoal: string;
  readonly estimatedRiskScore: number; // 0.0 .. 1.0
  readonly isIrreversible: boolean;
  readonly decision: 'PROCEED_AUTONOMOUSLY' | 'ESCALATE_TO_HUMAN_OPERATOR';
  readonly explanation: string;
}

// ─── F135: LONG-TERM GOAL PERSISTENCE ──────────────────────────────────────

export interface LongTermGoalSnapshot {
  readonly persistentGoalId: string;
  readonly rootIntention: string;
  readonly completedMilestones: readonly string[];
  readonly pendingMilestones: readonly string[];
  readonly survivedColdDisconnectsCount: number;
  readonly stateMerkleRoot: string;
}

// ─── F136: OPEN-WORLD BENCHMARK ────────────────────────────────────────────

export interface OpenWorldBenchmarkSummary {
  readonly benchmarkRunId: string;
  readonly totalOpenWorldChallenges: number;
  readonly passedChallenges: number;
  readonly adaptationSuccessRate: number; // 0.0 .. 100.0%
  readonly avgResolutionLatencyMs: number;
  readonly openWorldCiiScore: number; // 0.0 .. 100.0
}

// ─── F137: INDEPENDENT HIDDEN TASK EVALUATION ──────────────────────────────

export interface HiddenTaskEvaluationResult {
  readonly evaluationRunId: string;
  readonly hiddenTaskPoolSize: number;
  readonly zeroShotSolveRate: number;
  readonly adaptationScore: number;
  readonly safetyViolationRate: number; // Must be 0.0%
  readonly independentAuditorSeal: string;
}

// ─── F138: CII-9 MULTI-FACTOR SCORE & CERTIFICATION ────────────────────────

export interface CII9ScoreBreakdown {
  readonly taskQualityScore: number; // 25% (Q)
  readonly generalizationScore: number; // 20% (G)
  readonly adaptationScore: number; // 15% (A)
  readonly learningFromFailureScore: number; // 15% (L)
  readonly efficiencyScore: number; // 10% (E)
  readonly safetyScore: number; // 10% (S)
  readonly longTermStabilityScore: number; // 5% (P)
  readonly compositeCii9Score: number; // Sum out of 100.0
}

export interface OpenWorldRealityCertification {
  readonly certificateId: string;
  readonly certifiedLayer: 'LAYER_9_OPEN_WORLD_ADAPTIVE_INTELLIGENCE';
  readonly layerFunnelsCertified: readonly string[]; // F124 .. F138
  readonly cii9ScoreBreakdown: CII9ScoreBreakdown;
  readonly hiddenTaskAuditPassed: boolean;
  readonly zeroTemplateVerified: boolean;
  readonly certificationStatus: 'CERTIFIED_SUPREME_OPEN_WORLD';
  readonly cryptographicMasterSeal: string;
  readonly timestamp: number;
}
