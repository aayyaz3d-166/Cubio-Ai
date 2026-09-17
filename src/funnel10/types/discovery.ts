/**
 * 3D Memory Studio - Funnel 10: Discovery Types & Pipeline Configuration
 * 
 * Defines the configuration, input batches, and aggregate result contracts for Funnel 10 discovery.
 */

import {
  CandidateRejectionReason,
  CompositeCandidateFamily,
  CompositeCandidateOccurrence,
  DictionaryOccurrence,
  RejectedCandidate,
} from './candidate';

/**
 * Configuration options for the candidate discovery engine
 */
export interface DiscoveryOptions {
  /** Maximum number of children per composite pattern (default: 4, max: 8) */
  readonly maxPatternLength?: number;
  /** Minimum number of children per composite pattern (default: 2) */
  readonly minPatternLength?: number;
  /** Maximum spatial distance/span between children to consider as a composition */
  readonly maxSpatialSpan?: number;
  /** Maximum sequence distance between children to consider */
  readonly maxSequenceSpan?: number;
  /** Optional custom pattern groupings if explicitly provided */
  readonly explicitGroupings?: readonly (readonly string[])[];
}

/**
 * Complete result output of the Funnel 10 Discovery Pipeline
 */
export interface DiscoveryResult {
  /** All valid discovered composite occurrences */
  readonly discoveredCandidates: readonly CompositeCandidateOccurrence[];
  /** Grouped candidate families sharing identical canonical identity */
  readonly candidateFamilies: readonly CompositeCandidateFamily[];
  /** Candidates rejected during discovery or validation */
  readonly rejectedCandidates: readonly RejectedCandidate[];
  /** Breakdown of rejection counts by reason */
  readonly rejectionReasons: Readonly<Record<CandidateRejectionReason, number>>;
  /** Total number of input Level 2 dictionary occurrences analyzed */
  readonly totalInputOccurrences: number;
  /** Total number of discovered valid candidate occurrences */
  readonly totalCandidates: number;
  /** Total number of distinct candidate families */
  readonly totalFamilies: number;
  /** Total number of rejected candidates */
  readonly totalRejected: number;
  /** Execution status message */
  readonly statusMessage: string;
}

/**
 * Verification result for an individual candidate occurrence or family
 */
export interface CandidateVerificationResult {
  readonly isValid: boolean;
  readonly candidateId: string;
  readonly issues: readonly string[];
  readonly rejectionReason?: CandidateRejectionReason;
}
