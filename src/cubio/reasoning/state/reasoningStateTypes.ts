/**
 * CUBiO AI — Funnel 40: Multi-Step Reasoning State Engine
 * Phase 3 — Information Intelligence
 * src/cubio/reasoning/state/reasoningStateTypes.ts
 *
 * Universal type contracts for multi-step reasoning states.
 * Formulates complex reasoning as an explicit cryptographic state DAG,
 * strictly separates canonical facts from speculative hypotheses,
 * enables bounded branching and safe pruning, and bridges with Task 21 mathematical states.
 */

import { DeterministicState } from '../../math/engine/types';

/** Status lifecycle of a reasoning branch */
export type BranchStatus =
  | 'ACTIVE'           // Currently exploring or expanding
  | 'CONVERGED'        // Successfully proved/concluded
  | 'PRUNED'           // Safely discarded (dead end, low score, or exceeded budget)
  | 'CONTRADICTED'     // Contradiction detected on this branch
  | 'CYCLE_DETECTED';  // Cyclic reasoning loop detected and halted

/** Ground-truth canonical fact derived from verified information */
export interface CanonicalFact {
  readonly factId: string;
  readonly subject: string;
  readonly predicate: string;
  readonly object: string | number | boolean | readonly number[];
  readonly confidence: number;
  readonly sourceObjectId?: string;
  readonly cellId?: number;
  readonly checksum: string;
}

/** Tentative hypothesis or speculative assumption on a branch */
export interface ReasoningHypothesis {
  readonly hypothesisId: string;
  readonly subject: string;
  readonly predicate: string;
  readonly object: string | number | boolean | readonly number[];
  readonly confidence: number;
  readonly branchTag: string;
  readonly supportedByFactIds: readonly string[];
  readonly sourcePatternId?: string;
  readonly checksum: string;
}

/** Operations applied during a state transition */
export type StateTransitionOp =
  | { readonly type: 'ASSERT_FACT'; readonly fact: CanonicalFact }
  | { readonly type: 'PROPOSE_HYPOTHESIS'; readonly hypothesis: ReasoningHypothesis }
  | { readonly type: 'RETRACT_HYPOTHESIS'; readonly hypothesisId: string }
  | { readonly type: 'PROMOTE_HYPOTHESIS'; readonly hypothesisId: string }
  | { readonly type: 'SET_SPATIAL_CELL'; readonly cellId: number };

/** Delta changes applied in a single state transition (structural sharing) */
export interface StateDelta {
  readonly addedFacts: readonly CanonicalFact[];
  readonly addedHypotheses: readonly ReasoningHypothesis[];
  readonly removedHypothesisIds: readonly string[];
  readonly promotedHypothesisIds: readonly string[];
  readonly spatialCellId?: number;
}

/**
 * Immutable snapshot of a multi-step reasoning state.
 * Maintains cryptographic hash links to predecessor states,
 * strict separation of canonical facts vs hypotheses, and Task 21 state bindings.
 */
export interface MultiStepReasoningState {
  readonly stateId: string;
  readonly version: number;
  readonly stepIndex: number;
  readonly depth: number;
  readonly parentStateId?: string;
  readonly parentChecksum?: string;
  readonly branchId: string;
  readonly branchStatus: BranchStatus;
  readonly pruneReason?: string;

  /** Unalterable ground-truth facts inherited/added */
  readonly canonicalFacts: ReadonlyMap<string, CanonicalFact>;
  /** Branch-specific speculative hypotheses */
  readonly hypotheses: ReadonlyMap<string, ReasoningHypothesis>;

  /** Structural sharing deltas introduced in this transition */
  readonly deltas: StateDelta;

  /** Bound Task 21 Deterministic Mathematical State */
  readonly task21State: DeterministicState;

  /** Canonical SHA-256 state digest */
  readonly checksum: string;
}

/** A tracked branch exploring a path through the reasoning state graph */
export interface ReasoningBranch {
  readonly branchId: string;
  readonly parentBranchId?: string;
  readonly rootStateId: string;
  readonly headStateId: string;
  readonly depth: number;
  readonly score: number;
  readonly status: BranchStatus;
  readonly pruneReason?: string;
}

/** Full serializable snapshot of the multi-step reasoning state tree */
export interface StateTreeSnapshot {
  readonly treeId: string;
  readonly rootStateId: string;
  readonly states: Readonly<Record<string, MultiStepReasoningState>>;
  readonly branches: Readonly<Record<string, ReasoningBranch>>;
  readonly activeBranchIds: readonly string[];
  readonly treeChecksum: string;
  readonly timestamp: number;
}

/** Engine execution bounds and configuration */
export interface StateEngineConfig {
  readonly maxDepth?: number;                // Maximum branch depth (default: 8)
  readonly maxBranchesPerState?: number;     // Maximum child branches from any single state (default: 3)
  readonly maxActiveBranches?: number;       // Maximum concurrently active branches (default: 10)
  readonly budgetMs?: number;                // Time budget in ms (default: 2000)
  readonly minBranchScore?: number;          // Pruning score cutoff (default: 0.2)
}
