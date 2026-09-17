/**
 * CUBiO AI — Phase 6: Task 80
 * Multi-Step Language Reasoning Layer
 * src/cubio/language/native/reasoning/languageReasoningTypes.ts
 *
 * Universal type contracts, configurations, domain errors, and interfaces
 * for multi-step language reasoning, proposition parsing, state DAG derivation,
 * and epistemic conclusion evaluation.
 */

import { CanonicalDomain, DEFAULT_TENANT_ID } from '../../../core/canonicalIdentity';
import { EpistemicStatus } from '../../../epistemic/native/epistemicTypes';
import {
  ReasoningPremise,
  ReasoningInference,
  ReasoningContradiction,
  MissingEvidence,
  ReasoningStatus,
} from '../../../reasoning/native/reasoningTypes';
import { CanonicalFact, MultiStepReasoningState, StateTreeSnapshot } from '../../../reasoning/state/reasoningStateTypes';
import { LanguageRepresentationError, NativeLanguageSequence } from '../languageTypes';

// =============================================================================
// DOMAIN ERRORS
// =============================================================================

export class LanguageReasoningError extends LanguageRepresentationError {
  constructor(message: string, code = 'LANGUAGE_REASONING_ERROR') {
    super(message, code);
    this.name = 'LanguageReasoningError';
  }
}

export class ReasoningBudgetExceededError extends LanguageReasoningError {
  constructor(message: string) {
    super(message, 'REASONING_BUDGET_EXCEEDED');
    this.name = 'ReasoningBudgetExceededError';
  }
}

export class MissingEvidenceReasoningError extends LanguageReasoningError {
  public readonly missingItems: readonly MissingEvidence[];

  constructor(missingItems: readonly MissingEvidence[]) {
    const summary = missingItems.map((m) => `[${m.subject} ${m.predicate} ${m.expectedObject ?? '?'}]`).join(', ');
    super(`Cannot deduce conclusion: required evidence missing for ${summary}`, 'MISSING_EVIDENCE_REASONING');
    this.name = 'MissingEvidenceReasoningError';
    this.missingItems = missingItems;
  }
}

export class UnsupportedAssumptionError extends LanguageReasoningError {
  public readonly statement: string;

  constructor(statement: string) {
    super(
      `Unsupported linguistic assumption cannot be promoted to canonical fact without verified empirical evidence: "${statement}"`,
      'UNSUPPORTED_ASSUMPTION_VIOLATION'
    );
    this.name = 'UnsupportedAssumptionError';
    this.statement = statement;
  }
}

export class TenantReasoningMismatchError extends LanguageReasoningError {
  constructor(message: string) {
    super(message, 'TENANT_REASONING_MISMATCH');
    this.name = 'TenantReasoningMismatchError';
  }
}

// =============================================================================
// CONFIGURATION CONTRACTS
// =============================================================================

export interface LanguageReasoningConfig {
  /** Maximum allowable deductive steps deep */
  readonly maxReasoningDepth: number;
  /** Maximum number of total reasoning transitions across all branches */
  readonly maxSteps: number;
  /** Computation budget in milliseconds */
  readonly budgetMs: number;
  /** Minimum confidence threshold for derived inferences [0.0..1.0] */
  readonly minConfidence: number;
  /** Halt immediately upon detecting logical contradiction */
  readonly haltOnContradiction: boolean;
  /** Require explicit evidence references for every supported inference */
  readonly requireEvidenceForInference: boolean;
  /** Maximum branching factor per intermediate state */
  readonly maxBranchFactor: number;
}

export const DEFAULT_LANGUAGE_REASONING_CONFIG: LanguageReasoningConfig = Object.freeze({
  maxReasoningDepth: 6,
  maxSteps: 50,
  budgetMs: 2000,
  minConfidence: 0.20,
  haltOnContradiction: true,
  requireEvidenceForInference: true,
  maxBranchFactor: 3,
});

// =============================================================================
// PARSED PROPOSITION CONTRACTS
// =============================================================================

export type PropositionRelationType =
  | 'IS_A'
  | 'HAS'
  | 'PART_OF'
  | 'CONTAINS'
  | 'CONNECTED_TO'
  | 'TRANSITIONS_TO'
  | 'DEPENDS_ON'
  | 'LEADS_TO'
  | 'LOCATED_AT'
  | 'ADJACENT_TO'
  | 'GREATER_THAN'
  | 'LESS_THAN'
  | 'EQUALS'
  | 'CAUSES'
  | 'CUSTOM';

export interface ParsedProposition {
  readonly propositionId: string;
  readonly subject: string;
  readonly predicate: string;
  readonly relationType: PropositionRelationType;
  readonly object: string | number;
  readonly isNegated: boolean;
  readonly epistemicStatus: EpistemicStatus;
  readonly confidence: number;
  readonly spatialCellId?: number;
  readonly rawStatement: string;
  readonly sourceSequenceId?: string;
  readonly sourceObjectId?: string;
}

// =============================================================================
// REASONING QUERY & STEP CONTRACTS
// =============================================================================

export interface LanguageReasoningQuery {
  readonly queryText: string;
  readonly tenantId?: string;
  readonly domain?: CanonicalDomain;
  readonly contextStatements?: readonly string[];
  readonly contextSequences?: readonly NativeLanguageSequence[];
  readonly targetSubject?: string;
  readonly targetPredicate?: string;
  readonly targetObject?: string | number;
  readonly maxDepth?: number;
  readonly budgetMs?: number;
}

export type LanguageRuleType =
  | 'MODUS_PONENS'
  | 'RELATIONAL_CHAIN'
  | 'TRANSITIVE_DEDUCTION'
  | 'SPATIAL_COORDINATION'
  | 'CONTRADICTION_DETECTION'
  | 'EPISTEMIC_UNKNOWN_RESOLUTION'
  | 'HYPOTHESIS_PROPOSAL';

export interface LanguageReasoningStep {
  readonly stepIndex: number;
  readonly stepId: string;
  readonly parentStepId?: string;
  readonly stateId: string;
  readonly ruleApplied: LanguageRuleType;
  readonly inputPremiseIds: readonly string[];
  readonly statement: string;
  readonly derivedInference?: ReasoningInference;
  readonly epistemicStatus: EpistemicStatus;
  readonly confidence: number;
  readonly evidenceReferences: readonly string[];
  readonly stateChecksum: string;
  readonly timestamp: number;
}

export type LanguageReasoningStatus =
  | 'PROVED'
  | 'REFUTED'
  | 'UNKNOWN'
  | 'CONTRADICTED'
  | 'BUDGET_EXCEEDED';

export interface LanguageReasoningResult {
  readonly queryText: string;
  readonly tenantId: string;
  readonly rootStateId: string;
  readonly finalStateId: string;
  readonly status: LanguageReasoningStatus;
  readonly conclusionText: string;
  readonly epistemicStatus: EpistemicStatus;
  readonly confidence: number;
  readonly reasoningDepth: number;
  readonly stepsCount: number;
  readonly steps: readonly LanguageReasoningStep[];
  readonly retrievedFacts: readonly CanonicalFact[];
  readonly inferredConclusions: readonly ReasoningInference[];
  readonly contradictions: readonly ReasoningContradiction[];
  readonly missingEvidence: readonly MissingEvidence[];
  readonly stateTreeSnapshot: StateTreeSnapshot;
  readonly dagChecksum: string;
  readonly durationMs: number;
}
