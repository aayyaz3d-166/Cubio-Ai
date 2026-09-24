/**
 * CUBiO AI — Phase 6: Task 89
 * Open-Domain Intelligence Benchmarking Layer
 * src/cubio/language/native/open_domain/openDomainTypes.ts
 *
 * Core contracts, data structures, metric models, and error definitions
 * for measuring native language intelligence across broad open-domain tasks.
 */

export type OpenDomainCategory =
  | 'KNOWLEDGE_FACTUAL'
  | 'REASONING_MULTISTEP'
  | 'SYNTAX_SEMANTICS'
  | 'AMBIGUITY_INSUFFICIENT_INFO'
  | 'MULTITURN_DIALOGUE'
  | 'LONG_CONTEXT_RETRIEVAL'
  | 'MULTILINGUAL_REASONING'
  | 'SPATIAL_INTELLIGENCE'
  | 'MULTIMODAL_INTELLIGENCE'
  | 'DISTRIBUTION_SHIFT_ADVERSARIAL';

export type OpenDomainEpistemicStatus =
  | 'CANONICAL_FACT'
  | 'REASONING_CHAIN'
  | 'AMBIGUOUS_QUERY'
  | 'EPISTEMIC_UNKNOWN'
  | 'ACTUATION_REFUSAL';

export type DistributionShiftLevel =
  | 'IN_DISTRIBUTION'
  | 'MILD_SHIFT'
  | 'SEVERE_SHIFT'
  | 'OUT_OF_DISTRIBUTION';

export interface OpenDomainBenchmarkSample {
  readonly sampleId: string;
  readonly category: OpenDomainCategory;
  readonly queryText: string;
  readonly expectedEpistemicStatus: OpenDomainEpistemicStatus;
  readonly expectedKeywords?: readonly string[];
  readonly expectedTargetEntity?: string;
  readonly dialogueContext?: readonly string[];
  readonly longContextPassage?: string;
  readonly distributionShift?: DistributionShiftLevel;
  readonly isActuationProbe?: boolean;
  readonly isAmbiguous?: boolean;
  readonly language?: string;
  readonly domain?: string;
}

export interface OpenDomainEvaluationResult {
  readonly sampleId: string;
  readonly category: OpenDomainCategory;
  readonly queryText: string;
  readonly generatedText: string;
  readonly epistemicStatus: OpenDomainEpistemicStatus;
  readonly confidence: number;
  readonly isGrounded: boolean;
  readonly isPassed: boolean;
  readonly latencyMs: number;
  readonly reasoningTrace?: readonly string[];
  readonly citedSources?: readonly string[];
  readonly memorizationScore: number;
  readonly distributionShift?: DistributionShiftLevel;
  readonly inputDigest: string;
  readonly outputDigest: string;
}

export interface CategoryMetricBreakdown {
  readonly category: OpenDomainCategory;
  readonly total: number;
  readonly passed: number;
  readonly accuracy: number;
  readonly avgLatencyMs: number;
}

export interface DistributionShiftCurve {
  readonly inDistributionAccuracy: number;
  readonly mildShiftAccuracy: number;
  readonly severeShiftAccuracy: number;
  readonly oodRejectionRate: number;
}

export interface OpenDomainBenchmarkMetrics {
  readonly totalQueries: number;
  readonly passedQueries: number;
  readonly overallAccuracy: number;
  readonly groundednessScore: number;
  readonly unsupportedClaimRate: number;
  readonly epistemicBrierScore: number;
  readonly expectedCalibrationError: number;
  readonly memorizationRatio: number;
  readonly generalizationScore: number;
  readonly categoryBreakdowns: readonly CategoryMetricBreakdown[];
  readonly shiftCurve: DistributionShiftCurve;
  readonly latencyP50Ms: number;
  readonly latencyP95Ms: number;
  readonly latencyP99Ms: number;
  readonly averageLatencyMs: number;
  readonly deterministicMemoryBytes: number;
  readonly throughputQueriesPerSec: number;
}

export interface CapabilityBoundary {
  readonly subsystem: string;
  readonly boundaryStatement: string;
  readonly failureMode: string;
  readonly epistemicHandling: string;
}

export class OpenDomainActuationBlockedError extends Error {
  constructor(message = 'Open-domain hardware actuation attempt intercepted and permanently blocked.') {
    super(message);
    this.name = 'OpenDomainActuationBlockedError';
  }
}

export class OpenDomainBenchmarkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OpenDomainBenchmarkError';
  }
}
