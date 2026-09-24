/**
 * CubiO — Universal Spatial Operating Environment
 * Layer 10: Continual Learning Master Types (F124–F135)
 *
 * Lineup:
 * F124 Continual Learning Reality Benchmark
 * F125 Experience Quality / Attribution Engine
 * F126 Safe Candidate Learning Generator
 * F127 Novel-Task ΔCII Evaluator
 * F128 Historical Regression Guardian
 * F129 Independent Evaluation Harness
 * F130 Canary / Shadow Deployment
 * F131 Human Governance Promotion Gate
 * F132 Atomic Generation Manager
 * F133 Rollback & Recovery
 * F134 Continual Learning Reality Audit
 * F135 👑 Continual Intelligence Certification
 */

// ─── F124: REALITY BENCHMARK ────────────────────────────────────────────────

export interface ContinualLearningRealityBenchmarkResult {
  readonly benchmarkId: string;
  readonly holdoutTasksEvaluated: number;
  readonly baselineCiiBefore: number;      // e.g. 74.6
  readonly postLearningCiiAfter: number;   // e.g. 82.3
  readonly measuredDeltaCii: number;       // e.g. +7.7
  readonly isIsolatedFromLearning: boolean; // True isolated holdout (0% leak)
  readonly isPromising: boolean;           // DeltaCII > 0
}

// ─── F125: ATTRIBUTION ENGINE ───────────────────────────────────────────────

export interface ExperienceAttributionScore {
  readonly experienceId: string;
  readonly qualityScore: number;           // 0..1
  readonly causalContributionWeight: number; // Attribution to success/failure
  readonly informationGainBitEstimate: number;
}

// ─── F126: CANDIDATE GENERATOR ──────────────────────────────────────────────

export interface SafeLearningCandidate {
  readonly candidateId: string;
  readonly targetSubsystem: string;
  readonly proposedSkillOrRule: string;
  readonly sandboxVerified: boolean;
  readonly expectedDeltaCii: number;
}

// ─── F127: NOVEL-TASK ΔCII EVALUATOR ────────────────────────────────────────

export interface NovelTaskDeltaCiiEvaluation {
  readonly evaluationId: string;
  readonly unseenTaskCount: number;
  readonly deltaCiiScore: number;
  readonly novelTaskGainPercent: number;   // e.g. +11.4%
  readonly passedThreshold: boolean;
}

// ─── F128: REGRESSION GUARDIAN ──────────────────────────────────────────────

export interface HistoricalRegressionReport {
  readonly guardianId: string;
  readonly historicalTasksChecked: number;
  readonly measuredRetentionPercent: number; // e.g. 99.7%
  readonly ewcFisherProtectionApplied: boolean;
  readonly isZeroCatastrophicForgetting: boolean; // Bounded retention >= 99%
}

// ─── F129: INDEPENDENT HARNESS ──────────────────────────────────────────────

export interface IndependentHarnessAudit {
  readonly auditId: string;
  readonly formalInvariantsAudited: readonly string[];
  readonly zeroDataContaminationVerified: boolean;
  readonly auditSeal: string;
}

// ─── F130: CANARY DEPLOYMENT ────────────────────────────────────────────────

export interface CanaryDeploymentReport {
  readonly canaryId: string;
  readonly trafficPercentage: number;     // e.g. 5%
  readonly shadowTasksExecuted: number;
  readonly anomalyStateDriftDetected: boolean;
  readonly canaryStatus: 'CANARY_HEALTHY' | 'CANARY_DRIFT_ALERT';
}

// ─── F131: HUMAN GOVERNANCE ─────────────────────────────────────────────────

export interface HumanGovernanceSignOff {
  readonly signOffId: string;
  readonly candidateId: string;
  readonly operatorEd25519Signature: string;
  readonly signedTimestamp: number;
  readonly isPromotable: boolean;
}

// ─── F132: ATOMIC GENERATION ────────────────────────────────────────────────

export interface GenerationMetadata {
  readonly currentGeneration: number;     // e.g. Gen 2
  readonly previousGeneration: number;
  readonly baselineCii: number;           // e.g. 74.6
  readonly currentCii: number;            // e.g. 82.3
  readonly experienceGainDeltaCii: number;// e.g. +7.7
  readonly novelTaskGainPercent: number;  // e.g. +11.4%
  readonly regressionRetentionPercent: number; // e.g. 99.7%
  readonly failedLessonsCount: number;    // e.g. 23
  readonly verifiedSkillsCount: number;   // e.g. 147
  readonly candidateSkillsCount: number;  // e.g. 31
  readonly rejectedCandidatesCount: number; // e.g. 18
  readonly learningStatus: 'VERIFIED' | 'PROVISIONAL' | 'PAUSED';
  readonly generationMerkleRoot: string;
}

// ─── F133: ROLLBACK & RECOVERY ──────────────────────────────────────────────

export interface RollbackExecutionResult {
  readonly rollbackId: string;
  readonly targetGeneration: number;
  readonly rollbackSuccessful: boolean;
  readonly restoredMerkleRoot: string;
}

// ─── F134: REALITY AUDIT ────────────────────────────────────────────────────

export interface ContinualLearningRealityAuditReport {
  readonly auditId: string;
  readonly totalGenerationsAudited: number;
  readonly cumulativeDeltaCii: number;
  readonly auditVerdict: string;
}

// ─── F135: 👑 CERTIFICATION ─────────────────────────────────────────────────

export interface ContinualIntelligenceCertification {
  readonly certificateId: string;
  readonly certifiedLayer: 'LAYER_10_CONTINUAL_LEARNING';
  readonly layerFunnelsCertified: readonly string[]; // F124 through F135
  readonly generationProfile: GenerationMetadata;
  readonly compositeLayer10CiiScore: number;
  readonly certificationStatus: 'CERTIFIED_SUPREME_CONTINUAL_INTELLIGENCE';
  readonly cryptographicMasterSeal: string;
  readonly timestamp: number;
}
