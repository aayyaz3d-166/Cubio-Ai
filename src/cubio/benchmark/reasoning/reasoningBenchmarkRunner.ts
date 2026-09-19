/**
 * CUBiO AI — Phase 5: Task 64 — Native Reasoning Benchmark Suite
 * src/cubio/benchmark/reasoning/reasoningBenchmarkRunner.ts
 *
 * Master benchmark runner that evaluates native reasoning capability across
 * formal deduction, multi-hop DAGs, spatial relations, contradictions, and epistemic uncertainty.
 */

import { createHash } from 'node:crypto';
import { NativeInformationReasoningEngine } from '../../reasoning/native/nativeInformationReasoningEngine';
import { MultiStepReasoningStateEngine } from '../../reasoning/state/multiStepReasoningStateEngine';
import {
  BenchmarkProblem,
  ProblemExecutionResult,
  CategorySummary,
  ReasoningBenchmarkMatrix,
  BenchmarkCategory,
  BenchmarkErrorType,
  BenchmarkConclusion,
} from './reasoningBenchmarkTypes';
import { ReasoningProblemCatalog } from './reasoningProblemCatalog';

export class ReasoningBenchmarkRunner {
  private readonly _tenantId: string;
  private readonly _reasoningEngine: NativeInformationReasoningEngine;
  private readonly _stateEngine: MultiStepReasoningStateEngine;

  // Permanent hardware actuation lockout
  public readonly canActuate: false = false;
  public readonly actuationState: 'PERMANENTLY_BLOCKED' = 'PERMANENTLY_BLOCKED';
  public readonly actuationBlocked: true = true;

  constructor(tenantId: string = 'tenant_benchmark') {
    this._tenantId = tenantId;
    this._reasoningEngine = new NativeInformationReasoningEngine({
      maxDepth: 10,
      maxSteps: 100,
      budgetMs: 5000,
      haltOnContradiction: true,
      allowHypotheses: true,
    });
    this._stateEngine = new MultiStepReasoningStateEngine({
      maxDepth: 10,
      budgetMs: 5000,
    });
  }

  public get tenantId(): string {
    return this._tenantId;
  }

  /**
   * Attempting hardware actuation is permanently blocked fail-closed.
   */
  public attemptActuation(): never {
    throw new Error(
      '[PERMANENT_ACTUATION_LOCKOUT] Physical or external actuation is permanently blocked in ReasoningBenchmarkRunner.'
    );
  }

  /**
   * Executes a single benchmark problem against the native reasoning engine.
   */
  public evaluateProblem(problem: BenchmarkProblem): ProblemExecutionResult {
    const t0 = performance.now();

    try {
      const trace = this._reasoningEngine.reason(problem.premises, [], problem.query);
      const durationMs = parseFloat((performance.now() - t0).toFixed(2));

      // 1. Contradiction Expected Scenario
      if (problem.contradictionExpected) {
        const contradictionDetected = trace.contradictions.length > 0;
        const passed = contradictionDetected;
        const errorType: BenchmarkErrorType = contradictionDetected ? 'NONE' : 'CONTRADICTION_UNHANDLED';

        return Object.freeze({
          problemId: problem.problemId,
          category: problem.category,
          difficulty: problem.difficulty,
          isUnseen: problem.isUnseen,
          passed,
          status: trace.status,
          reachedConclusion: null,
          expectedConclusion: null,
          conclusionEpistemicStatus: contradictionDetected ? 'REFUTED_HYPOTHESIS' : 'ESTABLISHED_FACT',
          expectedEpistemicStatus: problem.expectedEpistemicStatus,
          stepsExecuted: trace.totalStepsExecuted,
          maxDepthReached: trace.totalStepsExecuted > 0 ? 1 : 0,
          durationMs,
          formalCorrectness: passed,
          heuristicConfidence: contradictionDetected ? 1.0 : 0.0,
          errorType,
          provenanceHash: trace.inputChecksum,
          intermediateStateCount: trace.states.length,
        });
      }

      // 2. Insufficient Information Scenario (Must Refuse to Guess -> UNKNOWN)
      if (problem.expectedEpistemicStatus === 'EPISTEMIC_UNKNOWN') {
        // If the engine asserted an established fact connecting the disjoint entities, that's FALSE_CERTAINTY
        const hasSpuriousFact = trace.finalInferences.some(
          (inf) => inf.epistemicStatus === 'ESTABLISHED_FACT'
        );

        const passed = !hasSpuriousFact;
        const errorType: BenchmarkErrorType = passed ? 'NONE' : 'FALSE_CERTAINTY';

        return Object.freeze({
          problemId: problem.problemId,
          category: problem.category,
          difficulty: problem.difficulty,
          isUnseen: problem.isUnseen,
          passed,
          status: trace.status,
          reachedConclusion: null,
          expectedConclusion: null,
          conclusionEpistemicStatus: 'EPISTEMIC_UNKNOWN',
          expectedEpistemicStatus: 'EPISTEMIC_UNKNOWN',
          stepsExecuted: trace.totalStepsExecuted,
          maxDepthReached: 0,
          durationMs,
          formalCorrectness: passed,
          heuristicConfidence: 1.0, // High confidence in correctly identifying UNKNOWN
          errorType,
          provenanceHash: trace.inputChecksum,
          intermediateStateCount: trace.states.length,
        });
      }

      // 3. Expected Deductive Conclusion Scenario
      const expected = problem.expectedConclusion;
      let matchedInference = null;

      if (expected) {
        for (const inf of trace.finalInferences) {
          if (
            inf.subject === expected.subject &&
            inf.predicate === expected.predicate &&
            String(inf.object) === String(expected.object)
          ) {
            matchedInference = inf;
            break;
          }
        }
      }

      let passed = false;
      let errorType: BenchmarkErrorType = 'NONE';

      if (!matchedInference) {
        passed = false;
        errorType = trace.totalStepsExecuted < problem.minRequiredDepth ? 'PREMATURE_TERMINATION' : 'UNSUPPORTED_LEAP';
      } else {
        // Verify provenance: must have supported premises
        const hasProvenance =
          matchedInference.supportedByPremiseIds && matchedInference.supportedByPremiseIds.length > 0;

        if (!hasProvenance) {
          passed = false;
          errorType = 'HALLUCINATION';
        } else if (trace.totalStepsExecuted < problem.minRequiredDepth) {
          passed = false;
          errorType = 'PREMATURE_TERMINATION';
        } else {
          passed = true;
          errorType = 'NONE';
        }
      }

      const reachedConclusion: BenchmarkConclusion | null = matchedInference
        ? {
            subject: matchedInference.subject,
            predicate: matchedInference.predicate,
            object: String(matchedInference.object),
          }
        : null;

      return Object.freeze({
        problemId: problem.problemId,
        category: problem.category,
        difficulty: problem.difficulty,
        isUnseen: problem.isUnseen,
        passed,
        status: trace.status,
        reachedConclusion,
        expectedConclusion: problem.expectedConclusion,
        conclusionEpistemicStatus: matchedInference?.epistemicStatus ?? 'EPISTEMIC_UNKNOWN',
        expectedEpistemicStatus: problem.expectedEpistemicStatus,
        stepsExecuted: trace.totalStepsExecuted,
        maxDepthReached: trace.totalStepsExecuted,
        durationMs,
        formalCorrectness: passed,
        heuristicConfidence: matchedInference?.confidence ?? 0.0,
        errorType,
        provenanceHash: trace.inputChecksum,
        intermediateStateCount: trace.states.length,
      });
    } catch (err: any) {
      const durationMs = parseFloat((performance.now() - t0).toFixed(2));
      return Object.freeze({
        problemId: problem.problemId,
        category: problem.category,
        difficulty: problem.difficulty,
        isUnseen: problem.isUnseen,
        passed: false,
        status: 'FAILED',
        reachedConclusion: null,
        expectedConclusion: problem.expectedConclusion,
        conclusionEpistemicStatus: 'EPISTEMIC_UNKNOWN',
        expectedEpistemicStatus: problem.expectedEpistemicStatus,
        stepsExecuted: 0,
        maxDepthReached: 0,
        durationMs,
        formalCorrectness: false,
        heuristicConfidence: 0.0,
        errorType: 'BUDGET_EXCEEDED',
        provenanceHash: '',
        intermediateStateCount: 0,
      });
    }
  }

  /**
   * Executes the full benchmark suite across all categories in ReasoningProblemCatalog.
   */
  public runFullBenchmark(): ReasoningBenchmarkMatrix {
    const problems = ReasoningProblemCatalog.getAllProblems();
    const results: ProblemExecutionResult[] = [];

    for (const p of problems) {
      const res = this.evaluateProblem(p);
      results.push(res);
    }

    const categories: BenchmarkCategory[] = [
      'DEDUCTION',
      'MULTI_STEP',
      'CONTRADICTION',
      'NUMERICAL',
      'RELATIONAL',
      'SPATIAL',
      'INSUFFICIENT_INFO',
      'ADVERSARIAL_DISTRACTOR',
    ];

    const categorySummaries: Record<string, CategorySummary> = {};

    for (const cat of categories) {
      const catResults = results.filter((r) => r.category === cat);
      const total = catResults.length;
      const passed = catResults.filter((r) => r.passed).length;
      const accuracy = total > 0 ? parseFloat((passed / total).toFixed(4)) : 1.0;

      // Groundedness: fraction of passed inferences with zero hallucinations
      const grounded = catResults.filter((r) => r.errorType !== 'HALLUCINATION' && r.errorType !== 'FALSE_CERTAINTY').length;
      const groundedness = total > 0 ? parseFloat((grounded / total).toFixed(4)) : 1.0;

      const meanDepth =
        total > 0
          ? parseFloat((catResults.reduce((s, r) => s + r.maxDepthReached, 0) / total).toFixed(2))
          : 0;

      const meanLatency =
        total > 0
          ? parseFloat((catResults.reduce((s, r) => s + r.durationMs, 0) / total).toFixed(2))
          : 0;

      const hallucinationCount = catResults.filter((r) => r.errorType === 'HALLUCINATION').length;
      const falseCertaintyCount = catResults.filter((r) => r.errorType === 'FALSE_CERTAINTY').length;

      categorySummaries[cat] = Object.freeze({
        category: cat,
        totalProblems: total,
        passedProblems: passed,
        accuracy,
        groundedness,
        meanDepth,
        meanLatencyMs: meanLatency,
        hallucinationRate: total > 0 ? parseFloat((hallucinationCount / total).toFixed(4)) : 0,
        falseCertaintyRate: total > 0 ? parseFloat((falseCertaintyCount / total).toFixed(4)) : 0,
      });
    }

    const totalProblems = results.length;
    const passedCount = results.filter((r) => r.passed).length;
    const overallAccuracy = totalProblems > 0 ? parseFloat((passedCount / totalProblems).toFixed(4)) : 1.0;

    const totalGrounded = results.filter(
      (r) => r.errorType !== 'HALLUCINATION' && r.errorType !== 'FALSE_CERTAINTY'
    ).length;
    const overallGroundedness =
      totalProblems > 0 ? parseFloat((totalGrounded / totalProblems).toFixed(4)) : 1.0;

    // Seen vs Unseen
    const seenResults = results.filter((r) => !r.isUnseen);
    const unseenResults = results.filter((r) => r.isUnseen);

    const seenPassed = seenResults.filter((r) => r.passed).length;
    const unseenPassed = unseenResults.filter((r) => r.passed).length;

    const seenAccuracy = seenResults.length > 0 ? parseFloat((seenPassed / seenResults.length).toFixed(4)) : 1.0;
    const unseenAccuracy = unseenResults.length > 0 ? parseFloat((unseenPassed / unseenResults.length).toFixed(4)) : 1.0;

    // Composite Reasoning Quotient (CRQ: 0..100)
    const crq = parseFloat(
      (overallAccuracy * 50.0 + overallGroundedness * 30.0 + unseenAccuracy * 20.0).toFixed(1)
    );

    return Object.freeze({
      timestamp: Date.now(),
      tenantId: this._tenantId,
      totalProblems,
      passedCount,
      overallAccuracy,
      overallGroundedness,
      compositeReasoningQuotient: crq,
      seenAccuracy,
      unseenAccuracy,
      categorySummaries: Object.freeze(categorySummaries as Record<BenchmarkCategory, CategorySummary>),
      results: Object.freeze(results),
      actuationBlocked: true,
    });
  }
}