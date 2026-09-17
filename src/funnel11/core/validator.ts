/**
 * 3D Memory Studio - Funnel 11: Candidate & Coverage Validator
 * 
 * Validates candidates against Funnel 11 constraints:
 * - Single block constraint
 * - Transform type (strictly TRANSLATION)
 * - Valid child counts and offsets
 * - Coverage integrity (missing = 0, duplicates = 0, unexpected = 0)
 */

import { CompositeCandidateFamily, CompositeCandidateOccurrence } from '../../funnel10/types/candidate';
import { Funnel11RejectionReason } from '../types/profitability';
import { SelectedCompositeEntry } from '../types/selection';

export interface ValidationCheckResult {
  readonly isValid: boolean;
  readonly rejectionReason?: Funnel11RejectionReason;
  readonly message: string;
}

/**
 * Validates an individual candidate occurrence for Funnel 11.
 */
export function validateCandidateOccurrence(
  occurrence: CompositeCandidateOccurrence
): ValidationCheckResult {
  // 1. Transform check
  if (occurrence.transform !== 'TRANSLATION') {
    return {
      isValid: false,
      rejectionReason: 'UNSUPPORTED_TRANSFORM',
      message: `Unsupported transform "${occurrence.transform}". Only TRANSLATION is supported.`,
    };
  }

  // 2. Child count check
  if (!occurrence.children || occurrence.children.length < 2) {
    return {
      isValid: false,
      rejectionReason: 'INVALID_CHILDREN',
      message: `Invalid child count (${occurrence.children ? occurrence.children.length : 0}). Minimum 2 children required.`,
    };
  }

  // 3. Covered cells check
  if (!occurrence.coveredCells || occurrence.coveredCells.length === 0) {
    return {
      isValid: false,
      rejectionReason: 'EMPTY_CANDIDATE',
      message: 'Candidate covers zero cells.',
    };
  }

  return { isValid: true, message: 'Valid occurrence.' };
}

/**
 * Validates a candidate family for Funnel 11.
 */
export function validateCandidateFamily(
  family: CompositeCandidateFamily
): ValidationCheckResult {
  // 1. Occurrences check
  if (!family.occurrences || family.occurrences.length === 0) {
    return {
      isValid: false,
      rejectionReason: 'ZERO_OCCURRENCES',
      message: 'Candidate family has zero occurrences.',
    };
  }

  // 2. Cross-block check
  if (family.blockIds.length > 1) {
    return {
      isValid: false,
      rejectionReason: 'CROSS_BLOCK_COMPOSITE',
      message: `Cross-block candidate spans ${family.blockIds.length} blocks (${family.blockIds.join(', ')}). Funnel 11 enforces single-block composites.`,
    };
  }

  // 3. Transform check
  if (family.canonical.transform !== 'TRANSLATION') {
    return {
      isValid: false,
      rejectionReason: 'UNSUPPORTED_TRANSFORM',
      message: `Canonical transform "${family.canonical.transform}" is not supported.`,
    };
  }

  // 4. Validate all individual occurrences
  for (const occ of family.occurrences) {
    const occCheck = validateCandidateOccurrence(occ);
    if (!occCheck.isValid) {
      return occCheck;
    }
  }

  return { isValid: true, message: 'Valid candidate family.' };
}

/**
 * Validates that selected composite entries maintain complete coverage integrity
 * without missing, duplicate, or unexpected cells.
 */
export function validateCoverageIntegrity(
  selectedEntries: readonly SelectedCompositeEntry[],
  allActiveCellIds: readonly number[]
): {
  isValid: boolean;
  totalActiveCells: number;
  coveredCellsCount: number;
  missingCellsCount: number;
  duplicateCellsCount: number;
  unexpectedCellsCount: number;
  issues: readonly string[];
} {
  const issues: string[] = [];
  const activeSet = new Set(allActiveCellIds);
  const coveredSet = new Set<number>();
  let duplicateCount = 0;
  let unexpectedCount = 0;

  for (const entry of selectedEntries) {
    for (const occ of entry.occurrences) {
      for (const cellId of occ.coveredCells) {
        if (!activeSet.has(cellId)) {
          unexpectedCount++;
          issues.push(`Unexpected cell #${cellId} covered by ${entry.formattedId} (${occ.occurrenceId})`);
        }
        if (coveredSet.has(cellId)) {
          duplicateCount++;
          issues.push(`Duplicate cell #${cellId} claimed by multiple occurrences`);
        } else {
          coveredSet.add(cellId);
        }
      }
    }
  }

  const missingCount = allActiveCellIds.filter((id) => !coveredSet.has(id)).length;

  const isValid = duplicateCount === 0 && unexpectedCount === 0;

  return {
    isValid,
    totalActiveCells: allActiveCellIds.length,
    coveredCellsCount: coveredSet.size,
    missingCellsCount: missingCount,
    duplicateCellsCount: duplicateCount,
    unexpectedCellsCount: unexpectedCount,
    issues,
  };
}
