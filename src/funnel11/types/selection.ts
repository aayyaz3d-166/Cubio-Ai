/**
 * 3D Memory Studio - Funnel 11: Selection & Overlap Resolution Types
 * 
 * Defines immutable data structures for selected profitable composite entries,
 * selected occurrences, conflict resolution, and selection results.
 */

import { CompositeCandidateOccurrence } from '../../funnel10/types/candidate';
import { CanonicalComposite, Vector3D } from '../../funnel9/types/canonical';
import { CandidateProfitabilityScore, Funnel11RejectionReason } from './profitability';

/**
 * An accepted, selected composite entry ready for hierarchical encoding
 */
export interface SelectedCompositeEntry {
  /** Numeric deterministic composite ID (1, 2, 3...) */
  readonly compositeId: number;
  /** Formatted string ID (e.g. "C11-001") */
  readonly formattedId: string;
  /** Funnel 9 canonical composite representation */
  readonly canonical: CanonicalComposite;
  /** Funnel 9 canonical signature */
  readonly signature: string;
  /** Funnel 9 fingerprint */
  readonly fingerprint: string;
  /** Associated profitability score */
  readonly score: CandidateProfitabilityScore;
  /** Selected occurrences that do not overlap with other accepted composites */
  readonly occurrences: readonly SelectedCompositeOccurrence[];
  /** Count of accepted occurrences */
  readonly occurrenceCount: number;
  /** Memory block IDs containing these occurrences */
  readonly blockIds: readonly number[];
  /** Total active cells covered by this selected composite */
  readonly coveredCellIds: readonly number[];
  /** Serialized binary bytes for the composite definition */
  readonly definitionBytes: Uint8Array;
  /** Serialized definition byte length */
  readonly definitionByteLength: number;
}

/**
 * An accepted, non-overlapping occurrence of a selected composite
 */
export interface SelectedCompositeOccurrence {
  /** Occurrence identifier */
  readonly occurrenceId: string;
  /** Parent composite ID */
  readonly compositeId: number;
  /** Memory block ID */
  readonly blockId: number;
  /** Origin cell ID */
  readonly originCellId: number;
  /** Spatial origin coordinate */
  readonly originCoord: Vector3D;
  /** Covered cell IDs */
  readonly coveredCells: readonly number[];
  /** Sequence indices in logical token order */
  readonly sequenceIndices: readonly number[];
  /** Serialized binary bytes for this occurrence reference */
  readonly referenceBytes: Uint8Array;
  /** Serialized reference byte length */
  readonly referenceByteLength: number;
}

/**
 * Record of a candidate family or occurrence rejected during selection
 */
export interface RejectedSelectionEntry {
  readonly candidateId: string;
  readonly signature: string;
  readonly occurrenceCount: number;
  readonly reason: Funnel11RejectionReason;
  readonly diagnosticMessage: string;
  readonly blockIds: readonly number[];
  readonly initialSavings: number;
}

/**
 * Complete Result of the Funnel 11 Selection & Conflict Resolution Pipeline
 */
export interface CompositeSelectionResult {
  /** Accepted, profitable, non-overlapping composite entries */
  readonly selectedEntries: readonly SelectedCompositeEntry[];
  /** Candidates rejected during evaluation or overlap resolution */
  readonly rejectedEntries: readonly RejectedSelectionEntry[];
  /** All candidate profitability scores evaluated */
  readonly allScores: readonly CandidateProfitabilityScore[];
  /** Aggregate byte accounting across all selected entries */
  readonly aggregateMetrics: {
    readonly totalExpandedCost: number;
    readonly totalDefinitionCost: number;
    readonly totalReferenceCost: number;
    readonly totalSelectedCost: number;
    readonly netSavingsBytes: number;
    readonly overallReductionPercent: number;
    readonly overallCompressionRatio: number;
    readonly totalAcceptedOccurrences: number;
    readonly totalCoveredCells: number;
  };
  /** Validation result for cell coverage integrity */
  readonly coverageValidation: {
    readonly isValid: boolean;
    readonly totalActiveCells: number;
    readonly coveredCellsCount: number;
    readonly missingCellsCount: number;
    readonly duplicateCellsCount: number;
    readonly unexpectedCellsCount: number;
    readonly issues: readonly string[];
  };
  /** Total number of candidate families analyzed */
  readonly totalFamiliesAnalyzed: number;
  /** Total number of profitable families accepted */
  readonly totalFamiliesAccepted: number;
  /** Total number of families rejected */
  readonly totalFamiliesRejected: number;
  /** Diagnostic status message */
  readonly statusMessage: string;
}

/**
 * Options for configuring selection and conflict resolution
 */
export interface SelectionOptions {
  /** Minimum required net byte savings to accept a composite (default: 1) */
  readonly minSavingsBytes?: number;
  /** Minimum required reduction percentage (default: 0) */
  readonly minReductionPercent?: number;
  /** Maximum number of composite definitions allowed in dictionary (default: 256) */
  readonly maxCompositeEntries?: number;
  /** Total active cells in the memory grid/blocks (for coverage verification) */
  readonly allActiveCellIds?: readonly number[];
}
