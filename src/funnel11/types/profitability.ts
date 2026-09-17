/**
 * 3D Memory Studio - Funnel 11: Profitability Types
 * 
 * Defines immutable data contracts for deterministic cost measurement,
 * byte accounting, and profitability scoring of Level 3 composite candidates.
 * 
 * Invariants:
 * - Readonly, pure, deterministic structures.
 * - No theoretical or estimated compression claims.
 * - Every byte must be derived from actual binary serialization.
 */

import { CompositeCandidateFamily, CompositeCandidateOccurrence } from '../../funnel10/types/candidate';
import { CanonicalComposite } from '../../funnel9/types/canonical';

/**
 * Rejection reason codes for Funnel 11 evaluation
 */
export type Funnel11RejectionReason =
  | 'NO_ACTUAL_BYTE_SAVINGS'
  | 'CROSS_BLOCK_COMPOSITE'
  | 'UNSUPPORTED_TRANSFORM'
  | 'INVALID_CHILDREN'
  | 'EMPTY_CANDIDATE'
  | 'CELL_OVERLAP_CONFLICT'
  | 'COVERAGE_ERROR'
  | 'ZERO_OCCURRENCES';

/**
 * Status of candidate profitability evaluation
 */
export type ProfitabilityStatus = 'ACCEPTED' | 'REJECTED';

/**
 * Exact serialized byte cost breakdown for a composite candidate
 */
export interface CompositeCostBreakdown {
  /** Serialized byte cost of defining the composite in the dictionary table */
  readonly compositeDefinitionCost: number;
  /** Serialized byte cost of a single composite occurrence reference */
  readonly referenceCostPerOccurrence: number;
  /** Total reference byte cost across all occurrences (occurrenceCount * referenceCostPerOccurrence) */
  readonly totalReferenceCost: number;
  /** Total composite cost (compositeDefinitionCost + totalReferenceCost) */
  readonly totalCompositeCost: number;
  /** Serialized byte cost of representing all children individually without composition */
  readonly expandedChildCost: number;
  /** Expanded byte cost per occurrence */
  readonly expandedCostPerOccurrence: number;
  /** Net byte savings (expandedChildCost - totalCompositeCost) */
  readonly actualSavings: number;
  /** Percentage reduction in bytes ((actualSavings / expandedChildCost) * 100) */
  readonly reductionPercent: number;
  /** Compression ratio (expandedChildCost / totalCompositeCost) */
  readonly compressionRatio: number;
  /** Number of occurrences required to break even on definition overhead */
  readonly breakEvenOccurrences: number;
}

/**
 * Complete profitability score and verdict for a candidate family
 */
export interface CandidateProfitabilityScore {
  /** Deterministic candidate identifier (e.g. C11_001 or signature hash) */
  readonly candidateId: string;
  /** Funnel 9 canonical signature */
  readonly signature: string;
  /** Funnel 9 fingerprint */
  readonly fingerprint: string;
  /** Total number of evaluated occurrences */
  readonly occurrenceCount: number;
  /** Distinct block IDs where this candidate appears */
  readonly blockIds: readonly number[];
  /** Detailed cost breakdown */
  readonly cost: CompositeCostBreakdown;
  /** Acceptance verdict */
  readonly isProfitable: boolean;
  /** Evaluation status */
  readonly status: ProfitabilityStatus;
  /** Rejection reason if not accepted */
  readonly rejectionReason?: Funnel11RejectionReason;
  /** Descriptive human-readable diagnostic message */
  readonly diagnosticMessage: string;
}
