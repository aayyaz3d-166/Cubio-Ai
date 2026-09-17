/**
 * CubiO — Universal Spatial Operating Environment
 * Master Data Architecture & Provenance Contracts
 */

export type MasterProvenanceTier =
  | 'TIER_1_HUMAN_AXIOM'
  | 'TIER_2_VERIFIED_INVARIANT'
  | 'TIER_3_MACHINE_CANDIDATE';

export type VerificationState =
  | 'FORMALLY_PROVEN'
  | 'EMPIRICALLY_VERIFIED'
  | 'STATISTICALLY_SUPPORTED'
  | 'UNVERIFIED_HEURISTIC';

export interface BaseRecordHeader {
  readonly version: number;
  readonly parentLineage: readonly string[];
  readonly verificationState: VerificationState;
  readonly timestamp: number;
  readonly hash: string;
}

export interface MasterProvenanceRecord extends BaseRecordHeader {
  readonly recordId: string;
  readonly provenanceTier: MasterProvenanceTier;
  readonly content: {
    readonly creatorType: 'HUMAN_OPERATOR' | 'FORMAL_VERIFIER' | 'AUTONOMOUS_EXTRACTOR';
    readonly humanSignature?: string;
    readonly verifierProofHash?: string;
    readonly evaluatorRecordHash?: string;
    readonly targetResourceHash: string;
  };
}

export interface CanonicalKnowledgeNode extends BaseRecordHeader {
  readonly nodeId: string;
  readonly modality: 'SPATIAL_BREP' | 'AST_LOGIC' | 'ACOUSTIC_FREQUENCY' | 'CAUSAL_DAG' | 'EMPIRICAL_TELEMETRY' | 'NATURAL_SPEC';
  readonly provenance: MasterProvenanceRecord;
  readonly content: {
    readonly rawOrStructuredData: Readonly<Record<string, unknown>>;
    readonly mathematicalInvariants: readonly string[];
    readonly semanticEmbedding?: readonly number[];
    readonly topologicalGenus?: number;
    readonly resonantFrequencyHz?: number;
  };
}

export interface EpisodicTrajectory extends BaseRecordHeader {
  readonly trajectoryId: string;
  readonly taskFingerprint: string;
  readonly provenance: MasterProvenanceRecord;
  readonly content: {
    readonly initialContext: Readonly<Record<string, unknown>>;
    readonly stepTrace: readonly {
      readonly stepIndex: number;
      readonly toolInvoked: string;
      readonly parametersDigest: string;
      readonly observationDelta: Readonly<Record<string, unknown>>;
      readonly stepLatencyMs: number;
    }[];
    readonly finalOutcome: {
      readonly isSuccess: boolean;
      readonly ciiScoreAchieved: number;
      readonly physicalDefectsDetected: number;
      readonly totalExecutionTimeMs: number;
    };
  };
}

export interface FailurePostMortem extends BaseRecordHeader {
  readonly failureId: string;
  readonly taskFingerprint: string;
  readonly provenance: MasterProvenanceRecord;
  readonly content: {
    readonly failedActionSignature: string;
    readonly rootCauseDiagnosis: {
      readonly primaryFailureSubsystem: string;
      readonly causalChainDAG: readonly string[];
      readonly violatedExpectationOrInvariant: string;
    };
    readonly negativeConstraintRule: string;
    readonly recurrencePreventedCount: number;
  };
}

export interface InvariantSolutionPattern extends BaseRecordHeader {
  readonly patternId: string;
  readonly patternTitle: string;
  readonly provenance: MasterProvenanceRecord;
  readonly content: {
    readonly invariantFormula: string;
    readonly sourceTrajectoriesCount: number;
    readonly applicabilityPreconditions: readonly string[];
    readonly reusableStrategy: {
      readonly atomicSkillSequence: readonly string[];
      readonly parameterizedAdjustments: Readonly<Record<string, string>>;
    };
    readonly measuredCiiElevationDelta: number;
  };
}

export interface KnowledgeRelation extends BaseRecordHeader {
  readonly relationId: string;
  readonly sourceNodeId: string;
  readonly targetNodeId: string;
  readonly relationType: 'ISOMORPHIC_TO' | 'CAUSES' | 'TRANSFORMS_TO' | 'SUBSUMES' | 'CONSTRAINS';
  readonly provenance: MasterProvenanceRecord;
  readonly content: {
    readonly weight: number;
    readonly transformationMatrix?: readonly number[];
    readonly formalProofHash?: string;
  };
}

export interface VerificationRecord extends BaseRecordHeader {
  readonly verificationId: string;
  readonly targetResourceHash: string;
  readonly provenance: MasterProvenanceRecord;
  readonly content: {
    readonly verifierSubsystem: string;
    readonly checksExecuted: readonly string[];
    readonly passedChecksCount: number;
    readonly totalChecksCount: number;
    readonly resultingVerificationState: VerificationState;
    readonly executionAuditSummary: string;
  };
}

export interface LearningCandidate extends BaseRecordHeader {
  readonly candidateId: string;
  readonly targetSubsystem: string;
  readonly provenance: MasterProvenanceRecord;
  readonly content: {
    readonly proposedSkillOrRule: string;
    readonly rationale: string;
    readonly sandboxEvaluationScore: number;
    readonly historicalRegressionDelta: number;
    readonly status: 'PROPOSED_SANDBOXED' | 'EVALUATED_READY_FOR_REVIEW' | 'PROMOTED_PRODUCTION';
  };
}

export interface BenchmarkRecord extends BaseRecordHeader {
  readonly benchmarkId: string;
  readonly taskFingerprint: string;
  readonly provenance: MasterProvenanceRecord;
  readonly content: {
    readonly domainType: 'KNOWN_DOMAIN' | 'NOVEL_ZERO_SHOT';
    readonly taskDescription: string;
    readonly expectedInvariants: readonly string[];
    readonly maxToleratedDefects: number;
    readonly targetLatencyMs: number;
    readonly groundTruthOutputs?: Readonly<Record<string, unknown>>;
  };
}

export type StoragePartitionType =
  | 'ACTIVE_EXPERIENCE_BUFFER'
  | 'CONSOLIDATED_KNOWLEDGE_GRAPH'
  | 'HOLDOUT_BENCHMARK_SUITE';

export interface StoragePartitionAccessRequest {
  readonly requestedPartition: StoragePartitionType;
  readonly callerIdentity: string;
  readonly callerRole: 'AGENT_RUNTIME' | 'LEARNING_PIPELINE' | 'BENCHMARK_RUNNER' | 'OPERATOR';
  readonly securityAuthToken: string;
}

export interface StoragePartitionAccessResult {
  readonly accessGranted: boolean;
  readonly reasonMessage: string;
  readonly partitionPath?: string;
}
