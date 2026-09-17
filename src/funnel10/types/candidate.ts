/**
 * 3D Memory Studio - Funnel 10: Composite Candidate Types
 * 
 * Defines immutable data structures for Level 3 Composite Candidates, Occurrences,
 * and Families discovered from Level 2 Dictionary occurrences.
 * 
 * Invariants:
 * - Readonly, pure, deterministic structures.
 * - Single-block constraint strictly enforced per candidate.
 * - Exact canonicalization powered exclusively by Funnel 9.
 * - No compression decisions, profitability scoring, or dictionary mutation.
 */

import { CanonicalComposite, CanonicalOffset3D, Vector3D } from '../../funnel9/types/canonical';

/**
 * Supported Transform Type for Funnel 10
 */
export const FUNNEL10_TRANSFORM = 'TRANSLATION' as const;
export type Funnel10TransformType = typeof FUNNEL10_TRANSFORM;

/**
 * Rejection reason codes for candidate discovery and validation
 */
export type CandidateRejectionReason =
  | 'CROSS_BLOCK_COMPOSITE'
  | 'INVALID_CHILD'
  | 'INVALID_TRANSLATION'
  | 'EMPTY_CANDIDATE'
  | 'CANONICALIZATION_FAILED'
  | 'SEQUENCE_METADATA_MISSING'
  | 'INVALID_DICTIONARY_REFERENCE'
  | 'UNSUPPORTED_TRANSFORM';

/**
 * Level 2 Dictionary Occurrence (Input to Funnel 10)
 */
export interface DictionaryOccurrence {
  /** Unique occurrence identifier */
  readonly occurrenceId: string;
  /** Dictionary ID of the pattern */
  readonly dictId: number;
  /** Memory block ID containing this occurrence */
  readonly blockId: number;
  /** Origin cell ID */
  readonly originCellId: number;
  /** Spatial origin coordinate in 3D grid */
  readonly originCoord: Vector3D;
  /** List of covered cell IDs */
  readonly coveredCells: readonly number[];
  /** Sequence indices in logical token sequence */
  readonly sequenceIndices: readonly number[];
  /** Logical token symbols */
  readonly symbols?: readonly string[];
  /** Optional rule type string (e.g. SPATIAL_RUN, REPETITION) */
  readonly ruleType?: string;
  /** Optional transform type (must be TRANSLATION) */
  readonly transform?: string;
  /** Optional transform metadata */
  readonly transformMetadata?: Readonly<Record<string, unknown>>;
}

/**
 * Discovered Child Occurrence Record within a composite
 */
export interface CompositeChildOccurrence {
  /** Dictionary ID */
  readonly dictId: number;
  /** Underlying dictionary occurrence ID */
  readonly occurrenceId: string;
  /** Logical ordering index (0, 1, 2, ...) */
  readonly order: number;
  /** Absolute spatial origin of this child occurrence */
  readonly originCoord: Vector3D;
  /** Relative 3D offset from composite canonical anchor */
  readonly relativeOffset: CanonicalOffset3D;
  /** Cell IDs covered by this child occurrence */
  readonly coveredCells: readonly number[];
  /** Sequence indices covered by this child occurrence */
  readonly sequenceIndices: readonly number[];
  /** Symbols or tokens */
  readonly symbols?: readonly string[];
  /** Transform applied */
  readonly transform: Funnel10TransformType;
  /** Optional transform metadata */
  readonly transformMetadata?: Readonly<Record<string, unknown>>;
}

/**
 * Single discovered occurrence of a Level 3 composite candidate
 */
export interface CompositeCandidateOccurrence {
  /** Candidate occurrence unique identifier */
  readonly occurrenceId: string;
  /** Memory block containing this candidate */
  readonly blockId: number;
  /** Composite global anchor/origin */
  readonly originCoord: Vector3D;
  /** Origin cell ID */
  readonly originCellId: number;
  /** Ordered list of child occurrences */
  readonly children: readonly CompositeChildOccurrence[];
  /** Total child count */
  readonly childCount: number;
  /** All cell IDs covered by this composite occurrence */
  readonly coveredCells: readonly number[];
  /** All sequence indices covered by this composite occurrence */
  readonly sequenceIndices: readonly number[];
  /** Transform type (Strictly 'TRANSLATION') */
  readonly transform: Funnel10TransformType;
  /** Transform metadata if any */
  readonly transformMetadata?: Readonly<Record<string, unknown>>;
  /** Funnel 9 Canonical Composite Representation */
  readonly canonical: CanonicalComposite;
  /** Canonical signature from Funnel 9 */
  readonly signature: string;
  /** Canonical lookup fingerprint from Funnel 9 */
  readonly fingerprint: string;
}

/**
 * Candidate Family grouping multiple occurrences sharing the exact same canonical identity
 */
export interface CompositeCandidateFamily {
  /** Canonical signature defining this family */
  readonly signature: string;
  /** Lookup fingerprint for hash bucket acceleration */
  readonly fingerprint: string;
  /** Funnel 9 canonical composite representation */
  readonly canonical: CanonicalComposite;
  /** List of all discovered occurrences for this canonical pattern */
  readonly occurrences: readonly CompositeCandidateOccurrence[];
  /** Total number of occurrences discovered */
  readonly occurrenceCount: number;
  /** Distinct block IDs where this candidate appears */
  readonly blockIds: readonly number[];
  /** Total active cells covered across all occurrences */
  readonly totalCoveredCells: number;
}

/**
 * Record of a candidate rejected during discovery or validation
 */
export interface RejectedCandidate {
  readonly candidateId: string;
  readonly reason: CandidateRejectionReason;
  readonly message: string;
  readonly blockId?: number;
  readonly childDictIds?: readonly number[];
  readonly rawChildrenCount?: number;
}
