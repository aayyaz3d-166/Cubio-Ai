/**
 * CUBiO AI — Phase 6: Task 80
 * Multi-Step Language Reasoning Layer
 * src/cubio/language/native/reasoning/nativeLanguageReasoningEngine.ts
 *
 * Master Native Language Reasoning Engine.
 * Integrates linguistic statement parsing, explicit cryptographic state DAGs,
 * deterministic deductive rule execution, epistemic truth preservation,
 * and fail-safe missing evidence resolution.
 * Zero external LLM reasoning fallback.
 */

import * as crypto from 'crypto';
import { CanonicalDomain, DEFAULT_TENANT_ID } from '../../../core/canonicalIdentity';
import { EpistemicStatus } from '../../../epistemic/native/epistemicTypes';
import {
  ReasoningPremise,
  ReasoningInference,
  ReasoningContradiction,
  MissingEvidence,
} from '../../../reasoning/native/reasoningTypes';
import { InferenceRuleEngine } from '../../../reasoning/native/inferenceRules';
import {
  MultiStepReasoningStateEngine,
} from '../../../reasoning/state/multiStepReasoningStateEngine';
import {
  CanonicalFact,
  ReasoningHypothesis,
  StateTransitionOp,
  MultiStepReasoningState,
} from '../../../reasoning/state/reasoningStateTypes';
import { NativeTokenizer } from '../nativeTokenizer';
import { LanguageStatementParser } from './languageStatementParser';
import {
  LanguageReasoningConfig,
  DEFAULT_LANGUAGE_REASONING_CONFIG,
  LanguageReasoningQuery,
  LanguageReasoningResult,
  LanguageReasoningStep,
  LanguageReasoningStatus,
  LanguageRuleType,
  ParsedProposition,
  ReasoningBudgetExceededError,
  TenantReasoningMismatchError,
} from './languageReasoningTypes';

export class NativeLanguageReasoningEngine {
  private readonly _tokenizer: NativeTokenizer;
  private readonly _parser: LanguageStatementParser;
  private readonly _defaultConfig: LanguageReasoningConfig;

  constructor(
    tokenizer?: NativeTokenizer,
    parser?: LanguageStatementParser,
    defaultConfig?: Partial<LanguageReasoningConfig>
  ) {
    this._tokenizer = tokenizer ?? new NativeTokenizer();
    this._parser = parser ?? new LanguageStatementParser(this._tokenizer);
    this._defaultConfig = Object.freeze({
      maxReasoningDepth: defaultConfig?.maxReasoningDepth ?? DEFAULT_LANGUAGE_REASONING_CONFIG.maxReasoningDepth,
      maxSteps: defaultConfig?.maxSteps ?? DEFAULT_LANGUAGE_REASONING_CONFIG.maxSteps,
      budgetMs: defaultConfig?.budgetMs ?? DEFAULT_LANGUAGE_REASONING_CONFIG.budgetMs,
      minConfidence: defaultConfig?.minConfidence ?? DEFAULT_LANGUAGE_REASONING_CONFIG.minConfidence,
      haltOnContradiction: defaultConfig?.haltOnContradiction ?? DEFAULT_LANGUAGE_REASONING_CONFIG.haltOnContradiction,
      requireEvidenceForInference:
        defaultConfig?.requireEvidenceForInference ?? DEFAULT_LANGUAGE_REASONING_CONFIG.requireEvidenceForInference,
      maxBranchFactor: defaultConfig?.maxBranchFactor ?? DEFAULT_LANGUAGE_REASONING_CONFIG.maxBranchFactor,
    });
  }

  public get tokenizer(): NativeTokenizer {
    return this._tokenizer;
  }

  public get parser(): LanguageStatementParser {
    return this._parser;
  }

  public get config(): LanguageReasoningConfig {
    return this._defaultConfig;
  }

  /**
   * Executes multi-step deterministic reasoning over language inputs.
   */
  public solve(query: LanguageReasoningQuery): LanguageReasoningResult {
    const startTime = Date.now();
    const tenantId = query.tenantId?.trim() || DEFAULT_TENANT_ID;
    const maxDepth = query.maxDepth ?? this._defaultConfig.maxReasoningDepth;
    const budgetMs = query.budgetMs ?? this._defaultConfig.budgetMs;

    // 1. Gather & parse all linguistic inputs
    const statements: string[] = [];
    if (query.contextStatements && query.contextStatements.length > 0) {
      for (const s of query.contextStatements) {
        statements.push(...this._parser.splitStatements(s));
      }
    }
    if (query.contextSequences && query.contextSequences.length > 0) {
      for (const seq of query.contextSequences) {
        if (seq.tenantId !== tenantId) {
          throw new TenantReasoningMismatchError(
            `Cross-tenant sequence rejected: sequence tenant ${seq.tenantId} vs query tenant ${tenantId}`
          );
        }
        statements.push(...this._parser.splitStatements(seq.rawText));
      }
    }

    // Split query if it contains background context
    const queryStatements = this._parser.splitStatements(query.queryText);
    for (const qs of queryStatements) {
      // Don't re-add pure questions as facts
      if (!qs.endsWith('?')) {
        statements.push(qs);
      }
    }

    const propositions = this._parser.parseStatements(statements, { tenantId });
    const initialFacts = this._parser.toCanonicalFacts(propositions);
    const activePremises = this._parser.toReasoningPremises(propositions, tenantId);

    // 2. Initialize Genesis State (S_0) in MultiStepReasoningStateEngine
    const stateEngine = new MultiStepReasoningStateEngine({
      maxDepth: Math.max(maxDepth, this._defaultConfig.maxSteps, 50),
      maxBranchesPerState: this._defaultConfig.maxBranchFactor,
      budgetMs,
    });

    let currentState: MultiStepReasoningState = stateEngine.createGenesisState(initialFacts, {
      stateId: `state_${tenantId}_s0`,
      branchId: 'branch_main',
      initialCellId: propositions.find((p) => p.spatialCellId !== undefined)?.spatialCellId ?? 171,
    });

    // 3. Extract query target goal
    const goal = this._resolveQueryGoal(query);

    const steps: LanguageReasoningStep[] = [];
    const inferredConclusions: ReasoningInference[] = [];
    const contradictions: ReasoningContradiction[] = [];
    const missingEvidence: MissingEvidence[] = [];

    let status: LanguageReasoningStatus = 'UNKNOWN';
    let conclusionText = 'Conclusion indeterminate based on available context.';
    let conclusionEpistemic: EpistemicStatus = 'EPISTEMIC_UNKNOWN';
    let conclusionConfidence = 0.0;
    let stepCount = 0;

    // 4. Initial Check: Detect immediate contradictions in premises
    for (let i = 0; i < activePremises.length; i++) {
      for (let j = i + 1; j < activePremises.length; j++) {
        const contra = InferenceRuleEngine.tryDetectContradiction(activePremises[i], activePremises[j]);
        if (contra) {
          contradictions.push(contra);
          if (this._defaultConfig.haltOnContradiction) {
            status = 'CONTRADICTED';
            conclusionText = `Contradiction detected: ${contra.reason}`;
            conclusionEpistemic = 'EPISTEMIC_UNKNOWN';
            conclusionConfidence = 0.0;
            break;
          }
        }
      }
      if (status === 'CONTRADICTED') break;
    }

    // 5. Multi-Hop Deductive Expansion Loop
    if (status !== 'CONTRADICTED') {
      let madeProgress = true;
      let currentDepth = 0;

      while (madeProgress && currentDepth < maxDepth && stepCount < this._defaultConfig.maxSteps) {
        madeProgress = false;

        // Check computation budget
        if (Date.now() - startTime > budgetMs) {
          status = 'BUDGET_EXCEEDED';
          conclusionText = 'Reasoning computation budget exceeded before conclusive deduction.';
          break;
        }

        const premisePairs: Array<[ReasoningPremise, ReasoningPremise]> = [];
        for (let i = 0; i < activePremises.length; i++) {
          for (let j = 0; j < activePremises.length; j++) {
            if (i !== j) {
              premisePairs.push([activePremises[i], activePremises[j]]);
            }
          }
        }

        // Sort pairs deterministically
        premisePairs.sort((a, b) => a[0].premiseId.localeCompare(b[0].premiseId) || a[1].premiseId.localeCompare(b[1].premiseId));

        for (const [p1, p2] of premisePairs) {
          if (stepCount >= this._defaultConfig.maxSteps) break;

          // A. Modus Ponens: (P) and (P -> Q) => Q
          const mp = InferenceRuleEngine.tryModusPonens(p1, p2, stepCount + 1);
          if (mp && !this._hasPremise(activePremises, mp.inference.subject, mp.inference.predicate, mp.inference.object)) {
            const stepResult = this._applyInferenceStep(
              mp.inference,
              'MODUS_PONENS',
              [p1.premiseId, p2.premiseId],
              currentState,
              stateEngine,
              activePremises,
              inferredConclusions,
              steps,
              stepCount + 1
            );
            currentState = stepResult.nextState;
            stepCount++;
            madeProgress = true;

            if (goal.targetSubject) {
              const match = this._findGoalMatch(activePremises, inferredConclusions, goal);
              if (match) {
                status = match.isNegated ? 'REFUTED' : 'PROVED';
                conclusionText = match.statement;
                conclusionEpistemic = match.epistemicStatus;
                conclusionConfidence = match.confidence;
                break;
              }
            }
          }

          // B. Transitive Chains: (A -> B) & (B -> C) => (A -> C)
          const trans = InferenceRuleEngine.tryTransitiveChain(p1, p2, stepCount + 1);
          if (trans && !this._hasPremise(activePremises, trans.inference.subject, trans.inference.predicate, trans.inference.object)) {
            const stepResult = this._applyInferenceStep(
              trans.inference,
              'TRANSITIVE_DEDUCTION',
              [p1.premiseId, p2.premiseId],
              currentState,
              stateEngine,
              activePremises,
              inferredConclusions,
              steps,
              stepCount + 1
            );
            currentState = stepResult.nextState;
            stepCount++;
            madeProgress = true;

            if (goal.targetSubject) {
              const match = this._findGoalMatch(activePremises, inferredConclusions, goal);
              if (match) {
                status = match.isNegated ? 'REFUTED' : 'PROVED';
                conclusionText = match.statement;
                conclusionEpistemic = match.epistemicStatus;
                conclusionConfidence = match.confidence;
                break;
              }
            }
          }

          // C. Spatial Vector Composition
          const spatial = InferenceRuleEngine.trySpatialVectorComposition(p1, p2, stepCount + 1);
          if (spatial && !this._hasPremise(activePremises, spatial.inference.subject, spatial.inference.predicate, spatial.inference.object)) {
            const stepResult = this._applyInferenceStep(
              spatial.inference,
              'SPATIAL_COORDINATION',
              [p1.premiseId, p2.premiseId],
              currentState,
              stateEngine,
              activePremises,
              inferredConclusions,
              steps,
              stepCount + 1
            );
            currentState = stepResult.nextState;
            stepCount++;
            madeProgress = true;

            if (goal.targetSubject) {
              const match = this._findGoalMatch(activePremises, inferredConclusions, goal);
              if (match) {
                status = match.isNegated ? 'REFUTED' : 'PROVED';
                conclusionText = match.statement;
                conclusionEpistemic = match.epistemicStatus;
                conclusionConfidence = match.confidence;
                break;
              }
            }
          }

          // D. Contradiction Check on newly derived inferences
          const contra = InferenceRuleEngine.tryDetectContradiction(p1, p2);
          if (contra && !contradictions.some((c) => c.contradictionId === contra.contradictionId)) {
            contradictions.push(contra);
            if (this._defaultConfig.haltOnContradiction) {
              status = 'CONTRADICTED';
              conclusionText = `Contradiction detected during multi-step inference: ${contra.reason}`;
              conclusionEpistemic = 'EPISTEMIC_UNKNOWN';
              conclusionConfidence = 0.0;
              break;
            }
          }
        }

        if (status === 'CONTRADICTED') break;

        // Check if goal is satisfied
        if (goal.targetSubject) {
          const match = this._findGoalMatch(activePremises, inferredConclusions, goal);
          if (match) {
            status = match.isNegated ? 'REFUTED' : 'PROVED';
            conclusionText = match.statement;
            conclusionEpistemic = match.epistemicStatus;
            conclusionConfidence = match.confidence;
            break;
          }
        }

        currentDepth++;
      }
    }

    // 6. Check Goal Resolution after expansion
    if (status === 'UNKNOWN' && goal.targetSubject) {
      const match = this._findGoalMatch(activePremises, inferredConclusions, goal);
      if (match) {
        status = match.isNegated ? 'REFUTED' : 'PROVED';
        conclusionText = match.statement;
        conclusionEpistemic = match.epistemicStatus;
        conclusionConfidence = match.confidence;
      } else {
        // Missing Evidence Identification
        const missing = InferenceRuleEngine.tryDetectMissingEvidence(activePremises, {
          targetSubject: goal.targetSubject,
          targetPredicate: goal.targetPredicate ?? 'is_a',
          targetObject: goal.targetObject,
        });

        if (missing) {
          missingEvidence.push(missing);
        } else {
          missingEvidence.push({
            subject: goal.targetSubject,
            predicate: goal.targetPredicate ?? 'is_a',
            expectedObject: goal.targetObject,
            reason: `No deductive chain connects "${goal.targetSubject}" to "${goal.targetObject ?? 'target'}" in available context.`,
          });
        }

        status = 'UNKNOWN';
        conclusionText = `Unknown: Required evidence missing for target [${goal.targetSubject} ${goal.targetPredicate ?? 'relation'} ${goal.targetObject ?? '?'}]`;
        conclusionEpistemic = 'EPISTEMIC_UNKNOWN';
        conclusionConfidence = 0.0;
      }
    } else if (status === 'UNKNOWN' && inferredConclusions.length > 0) {
      // General question without specific target - return strongest derived inference
      const strongest = inferredConclusions[inferredConclusions.length - 1];
      status = 'PROVED';
      conclusionText = strongest.statement;
      conclusionEpistemic = strongest.epistemicStatus === 'ESTABLISHED_FACT' ? 'CANONICAL_FACT' : 'SUPPORTED_HYPOTHESIS';
      conclusionConfidence = strongest.confidence;
    }

    const elapsed = Date.now() - startTime;
    const treeSnapshot = stateEngine.exportTreeSnapshot();

    // Compute cryptographic DAG checksum
    const dagChecksum = crypto
      .createHash('sha256')
      .update(
        JSON.stringify({
          treeId: treeSnapshot.treeId,
          statesCount: Object.keys(treeSnapshot.states).length,
          stepsCount: steps.length,
          status,
          checksum: treeSnapshot.treeChecksum,
        })
      )
      .digest('hex');

    return Object.freeze({
      queryText: query.queryText,
      tenantId,
      rootStateId: treeSnapshot.rootStateId,
      finalStateId: currentState.stateId,
      status,
      conclusionText,
      epistemicStatus: conclusionEpistemic,
      confidence: conclusionConfidence,
      reasoningDepth: currentState.depth,
      stepsCount: steps.length,
      steps: Object.freeze(steps),
      retrievedFacts: Object.freeze(initialFacts),
      inferredConclusions: Object.freeze(inferredConclusions),
      contradictions: Object.freeze(contradictions),
      missingEvidence: Object.freeze(missingEvidence),
      stateTreeSnapshot: treeSnapshot,
      dagChecksum,
      durationMs: elapsed,
    });
  }

  // ===========================================================================
  // PRIVATE HELPERS
  // ===========================================================================

  private _resolveQueryGoal(query: LanguageReasoningQuery): {
    targetSubject?: string;
    targetPredicate?: string;
    targetObject?: string | number;
  } {
    const fromQuery = this._parser.parseQueryGoal(query.queryText);
    return {
      targetSubject: query.targetSubject?.toLowerCase() ?? fromQuery.targetSubject,
      targetPredicate: query.targetPredicate?.toLowerCase() ?? fromQuery.targetPredicate,
      targetObject: query.targetObject ? String(query.targetObject).toLowerCase() : fromQuery.targetObject,
    };
  }

  private _hasPremise(
    premises: readonly ReasoningPremise[],
    subject: string,
    predicate: string,
    object: string | number | boolean | readonly number[]
  ): boolean {
    const subClean = subject.toLowerCase();
    const predClean = predicate.toLowerCase();
    const objStr = String(object).toLowerCase();

    return premises.some(
      (p) =>
        p.subject.toLowerCase() === subClean &&
        p.predicate.toLowerCase() === predClean &&
        String(p.object).toLowerCase() === objStr
    );
  }

  private _applyInferenceStep(
    inference: ReasoningInference,
    ruleType: LanguageRuleType,
    parentPremiseIds: readonly string[],
    currentState: MultiStepReasoningState,
    stateEngine: MultiStepReasoningStateEngine,
    activePremises: ReasoningPremise[],
    inferredConclusions: ReasoningInference[],
    steps: LanguageReasoningStep[],
    stepIndex: number
  ): { nextState: MultiStepReasoningState } {
    // Require evidence check
    if (this._defaultConfig.requireEvidenceForInference && parentPremiseIds.length === 0) {
      throw new LanguageReasoningError(`Evidence mandate violated: inference ${inference.inferenceId} lacks parent premise evidence.`);
    }

    inferredConclusions.push(inference);

    // Map inference epistemic status
    const isCanonicalFact = inference.epistemicStatus === 'ESTABLISHED_FACT';
    const targetStatus: EpistemicStatus = isCanonicalFact ? 'CANONICAL_FACT' : 'SUPPORTED_HYPOTHESIS';

    // Build state transition operation
    let op: StateTransitionOp;
    if (isCanonicalFact) {
      const fact: CanonicalFact = {
        factId: `fact_inf_${stepIndex}`,
        subject: inference.subject,
        predicate: inference.predicate,
        object: inference.object,
        confidence: inference.confidence,
        checksum: inference.checksum,
      };
      op = { type: 'ASSERT_FACT', fact };
    } else {
      const hypothesis: ReasoningHypothesis = {
        hypothesisId: `hypo_inf_${stepIndex}`,
        subject: inference.subject,
        predicate: inference.predicate,
        object: inference.object,
        confidence: inference.confidence,
        branchTag: currentState.branchId,
        supportedByFactIds: parentPremiseIds,
        checksum: inference.checksum,
      };
      op = { type: 'PROPOSE_HYPOTHESIS', hypothesis };
    }

    // Transition state DAG
    const nextStateId = `state_s${stepIndex}`;
    const nextState = stateEngine.transitionState(currentState.stateId, [op], {
      nextStateId,
    });

    // Record step
    const step: LanguageReasoningStep = {
      stepIndex,
      stepId: `step_${stepIndex}`,
      parentStepId: steps.length > 0 ? steps[steps.length - 1].stepId : undefined,
      stateId: nextState.stateId,
      ruleApplied: ruleType,
      inputPremiseIds: parentPremiseIds,
      statement: inference.statement,
      derivedInference: inference,
      epistemicStatus: targetStatus,
      confidence: inference.confidence,
      evidenceReferences: parentPremiseIds,
      stateChecksum: nextState.checksum,
      timestamp: Date.now(),
    };
    steps.push(step);

    // Add to active premises for multi-hop expansion
    activePremises.push({
      premiseId: `premise_inf_${stepIndex}`,
      type: isCanonicalFact ? 'OBSERVED_FACT' : 'DERIVED_INFERENCE',
      statement: inference.statement,
      subject: inference.subject,
      predicate: inference.predicate,
      object: inference.object,
      confidence: inference.confidence,
      epistemicStatus: inference.epistemicStatus,
      timestamp: Date.now(),
    });

    return { nextState };
  }

  private _findGoalMatch(
    premises: readonly ReasoningPremise[],
    inferences: readonly ReasoningInference[],
    goal: { targetSubject?: string; targetPredicate?: string; targetObject?: string | number }
  ): {
    statement: string;
    epistemicStatus: EpistemicStatus;
    confidence: number;
    isNegated: boolean;
  } | null {
    if (!goal.targetSubject) return null;

    const tSub = goal.targetSubject.toLowerCase();
    const tPred = goal.targetPredicate?.toLowerCase();
    const tObj = goal.targetObject !== undefined ? String(goal.targetObject).toLowerCase() : undefined;

    // Check inferences first (most recently derived)
    for (let i = inferences.length - 1; i >= 0; i--) {
      const inf = inferences[i];
      const sMatch = inf.subject.toLowerCase() === tSub;
      const pMatch = !tPred || inf.predicate.toLowerCase() === tPred || inf.predicate.toLowerCase().includes(tPred);
      const oMatch = !tObj || String(inf.object).toLowerCase() === tObj;

      if (sMatch && pMatch && oMatch) {
        const isNeg = inf.predicate.toLowerCase().startsWith('not_') || String(inf.object).toLowerCase() === 'false';
        const epStatus: EpistemicStatus = inf.epistemicStatus === 'ESTABLISHED_FACT' ? 'CANONICAL_FACT' : 'SUPPORTED_HYPOTHESIS';
        return {
          statement: inf.statement,
          epistemicStatus: epStatus,
          confidence: inf.confidence,
          isNegated: isNeg,
        };
      }
    }

    // Check premises
    for (let i = premises.length - 1; i >= 0; i--) {
      const p = premises[i];
      const sMatch = p.subject.toLowerCase() === tSub;
      const pMatch = !tPred || p.predicate.toLowerCase() === tPred || p.predicate.toLowerCase().includes(tPred);
      const oMatch = !tObj || String(p.object).toLowerCase() === tObj;

      if (sMatch && pMatch && oMatch) {
        const isNeg = p.predicate.toLowerCase().startsWith('not_') || String(p.object).toLowerCase() === 'false';
        const epStatus: EpistemicStatus = p.epistemicStatus === 'ESTABLISHED_FACT' ? 'CANONICAL_FACT' : 'SUPPORTED_HYPOTHESIS';
        return {
          statement: p.statement,
          epistemicStatus: epStatus,
          confidence: p.confidence,
          isNegated: isNeg,
        };
      }
    }

    return null;
  }
}
