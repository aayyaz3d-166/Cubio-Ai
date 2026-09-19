/**
 * CUBiO AI — Phase 5: Task 64 — Native Reasoning Benchmark Suite
 * src/cubio/benchmark/reasoning/reasoningBenchmarkTypes.ts
 *
 * Core type contracts, problem specifications, execution results, error types,
 * and aggregated matrix interfaces for native reasoning capability benchmarking.
 */

import { NativeInformationObject } from '../../information/native/infoTypes';
import { ReasoningQuery } from '../../reasoning/native/reasoningTypes';

// =============================================================================
// BENCHMARK CATEGORIES & DIFFICULTY TIERS
// =============================================================================

export type BenchmarkCategory =
  | 'DEDUCTION'               // Formal transitive syllogisms and categorical logic
  | 'MULTI_STEP'               // Multi-hop DAG reasoning chains requiring intermediate states
  | 'CONTRADICTION'           // Conflicting premise sets and hypothesis refutation
  | 'NUMERICAL'               // Inequality bounds and quantitative range deductions
  | 'RELATIONAL'              // Dependency graphs, hierarchical and kinship structures
  | 'SPATIAL'                 // 343 spatial cell containment, adjacency, orientation
  | 'INSUFFICIENT_INFO'       // Incomplete premise sets requiring EPISTEMIC_UNKNOWN (zero guessing)
  | 'ADVERSARIAL_DISTRACTOR'; // Irrelevant distractor premises to test noise immunity

export type BenchmarkDifficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'CHALLENGE';

export type ExpectedEpistemicStatus =
  | 'ESTABLISHED_FACT'
  | 'REFUTED_HYPOTHESIS'
  | 'EPISTEMIC_UNKNOWN';

export type BenchmarkErrorType =
  | 'NONE'
  | 'HALLUCINATION'            // Asserted conclusion not derived from premises
  | 'FALSE_CERTAINTY'          // Claimed fact when information was incomplete
  | 'UNSUPPORTED_LEAP'         // Missing intermediate deductive link in chain
  | 'CONTRADICTION_UNHANDLED'  // Permitted contradictory conclusion without flag
  | 'PREMATURE_TERMINATION'    // Stopped before reaching necessary deductive depth
  | 'BUDGET_EXCEEDED';         // Exceeded step or depth limits

// =============================================================================
// BENCHMARK PROBLEM CONTRACT
// =============================================================================

export interface BenchmarkConclusion {
  readonly subject: string;
  readonly predicate: string;
  readonly object: string;
}

export interface BenchmarkProblem {
  readonly problemId: string;
  readonly name: string;
  readonly category: BenchmarkCategory;
  readonly difficulty: BenchmarkDifficulty;
  readonly description: string;
  readonly premises: readonly NativeInformationObject[];
  readonly query?: ReasoningQuery;
  readonly expectedConclusion: BenchmarkConclusion | null;
  readonly expectedEpistemicStatus: ExpectedEpistemicStatus;
  readonly minRequiredDepth: number;
  readonly isUnseen: boolean;
  readonly contradictionExpected?: boolean;
}

// =============================================================================
// EXECUTION & RESULT METRICS
// =============================================================================

export interface ProblemExecutionResult {
  readonly problemId: string;
  readonly category: BenchmarkCategory;
  readonly difficulty: BenchmarkDifficulty;
  readonly isUnseen: boolean;
  readonly passed: boolean;
  readonly status: string;
  readonly reachedConclusion: BenchmarkConclusion | null;
  readonly expectedConclusion: BenchmarkConclusion | null;
  readonly conclusionEpistemicStatus: string;
  readonly expectedEpistemicStatus: ExpectedEpistemicStatus;
  readonly stepsExecuted: number;
  readonly maxDepthReached: number;
  readonly durationMs: number;
  readonly formalCorrectness: boolean;
  readonly heuristicConfidence: number;
  readonly errorType: BenchmarkErrorType;
  readonly provenanceHash: string;
  readonly intermediateStateCount: number;
}

export interface CategorySummary {
  readonly category: BenchmarkCategory;
  readonly totalProblems: number;
  readonly passedProblems: number;
  readonly accuracy: number;               // [0..1]
  readonly groundedness: number;           // [0..1] fraction with valid provenance
  readonly meanDepth: number;
  readonly meanLatencyMs: number;
  readonly hallucinationRate: number;
  readonly falseCertaintyRate: number;
}

export interface ReasoningBenchmarkMatrix {
  readonly timestamp: number;
  readonly tenantId: string;
  readonly totalProblems: number;
  readonly passedCount: number;
  readonly overallAccuracy: number;
  readonly overallGroundedness: number;
  readonly compositeReasoningQuotient: number; // CRQ: 0..100
  readonly seenAccuracy: number;
  readonly unseenAccuracy: number;
  readonly categorySummaries: Readonly<Record<BenchmarkCategory, CategorySummary>>;
  readonly results: readonly ProblemExecutionResult[];
  readonly actuationBlocked: boolean;
}

// =============================================================================
// STRUCTURED ERRORS
// =============================================================================

export class ReasoningBenchmarkError extends Error {
  public readonly code: string;
  public readonly timestamp: number;

  constructor(message: string, code = 'REASONING_BENCHMARK_ERROR') {
    super(`[${code}] ${message}`);
    this.name = 'ReasoningBenchmarkError';
    this.code = code;
    this.timestamp = Date.now();
  }
}

export class FalseCertaintyViolationError extends ReasoningBenchmarkError {
  constructor(problemId: string, details: string) {
    super(
      `False certainty violation in problem "${problemId}": ${details}. Under incomplete information, EPISTEMIC_UNKNOWN must be returned.`,
      'FALSE_CERTAINTY_VIOLATION'
    );
    this.name = 'FalseCertaintyViolationError';
  }
}

export class HallucinatedConclusionError extends ReasoningBenchmarkError {
  constructor(problemId: string, details: string) {
    super(
      `Hallucinated conclusion in problem "${problemId}": ${details}. Conclusion has no unbroken provenance link to premises.`,
      'HALLUCINATED_CONCLUSION'
    );
    this.name = 'HallucinatedConclusionError';
  }
}