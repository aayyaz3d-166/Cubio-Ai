/**
 * 3D Memory Studio - Funnel 10: Candidate Verifier Engine
 * 
 * Implements an independent, pure, non-mutating validation engine for discovered composite candidates.
 * 
 * Verification Checklist:
 * 1. All child dictionary IDs exist and are positive integers.
 * 2. All child occurrences exist with valid finite 3D coordinates.
 * 3. Logical child ordering is preserved without arbitrary sorting.
 * 4. Relative spatial offsets are mathematically exact relative to anchor.
 * 5. Transform is strictly TRANSLATION.
 * 6. All child occurrences belong to the exact same memory block (Single-Block Rule).
 * 7. Candidate canonicalizes cleanly via Funnel 9.
 * 8. Candidate signature exactly matches Funnel 9 canonical representation.
 * 9. Covered cells are available and properly recorded.
 * 10. Sequence information is preserved.
 */

import { areCanonicalCompositesEqual } from '../../funnel9/core/comparator';
import { canonicalizeComposite } from '../../funnel9/core/canonicalizer';
import { RawCompositeInput } from '../../funnel9/types/canonical';
import {
  CandidateRejectionReason,
  CompositeCandidateOccurrence,
  DictionaryOccurrence,
  FUNNEL10_TRANSFORM,
} from '../types/candidate';
import { CandidateVerificationResult } from '../types/discovery';

/**
 * Validates a raw list of child dictionary occurrences forming a candidate composite.
 * Returns rejection reason if invalid, or undefined if valid.
 */
export function validateChildOccurrences(
  children: readonly DictionaryOccurrence[]
): { isValid: boolean; reason?: CandidateRejectionReason; message?: string } {
  if (!children || children.length === 0) {
    return {
      isValid: false,
      reason: 'EMPTY_CANDIDATE',
      message: 'Candidate contains zero child occurrences.',
    };
  }

  // 1. Single-Block Rule: Check if all children belong to the same memory block
  const firstBlockId = children[0].blockId;
  for (let i = 1; i < children.length; i++) {
    if (children[i].blockId !== firstBlockId) {
      return {
        isValid: false,
        reason: 'CROSS_BLOCK_COMPOSITE',
        message: `Cross-block composite detected: Child 0 is in Block ${firstBlockId} while Child ${i} is in Block ${children[i].blockId}. Composites must be strictly single-block.`,
      };
    }
  }

  // 2. Child dictionary ID and coordinate checks
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (typeof child.dictId !== 'number' || !Number.isInteger(child.dictId) || child.dictId <= 0) {
      return {
        isValid: false,
        reason: 'INVALID_DICTIONARY_REFERENCE',
        message: `Child at index ${i} has invalid dictionary ID '${child.dictId}'. Must be a positive integer.`,
      };
    }

    if (
      !child.originCoord ||
      !Number.isFinite(child.originCoord.x) ||
      !Number.isFinite(child.originCoord.y) ||
      !Number.isFinite(child.originCoord.z)
    ) {
      return {
        isValid: false,
        reason: 'INVALID_CHILD',
        message: `Child #${child.dictId} at index ${i} has invalid or non-finite origin coordinates.`,
      };
    }

    // Check transform
    if (child.transform && child.transform.toUpperCase() !== FUNNEL10_TRANSFORM) {
      return {
        isValid: false,
        reason: 'UNSUPPORTED_TRANSFORM',
        message: `Child #${child.dictId} at index ${i} uses unsupported transform '${child.transform}'. Only 'TRANSLATION' is supported.`,
      };
    }

    // Sequence indices check
    if (!child.sequenceIndices || child.sequenceIndices.length === 0) {
      return {
        isValid: false,
        reason: 'SEQUENCE_METADATA_MISSING',
        message: `Child #${child.dictId} at index ${i} is missing required sequence indices.`,
      };
    }
  }

  return { isValid: true };
}

/**
 * Independently verifies a constructed CompositeCandidateOccurrence.
 */
export function verifyCandidateOccurrence(
  candidate: CompositeCandidateOccurrence
): CandidateVerificationResult {
  const issues: string[] = [];
  let rejectionReason: CandidateRejectionReason | undefined;

  // 1. Check child count
  if (!candidate.children || candidate.children.length === 0) {
    issues.push('Candidate has no children.');
    return {
      isValid: false,
      candidateId: candidate.occurrenceId,
      issues,
      rejectionReason: 'EMPTY_CANDIDATE',
    };
  }

  // 2. Check Single-Block integrity
  const blockId = candidate.blockId;
  if (typeof blockId !== 'number' || blockId < 0) {
    issues.push(`Invalid candidate block ID ${blockId}.`);
    rejectionReason = 'CROSS_BLOCK_COMPOSITE';
  }

  // 3. Check transform
  if (candidate.transform !== FUNNEL10_TRANSFORM) {
    issues.push(`Unsupported candidate transform '${candidate.transform}'. Must be TRANSLATION.`);
    rejectionReason = 'UNSUPPORTED_TRANSFORM';
  }

  // 4. Check children integrity and relative offsets
  const anchor = candidate.originCoord;
  for (let i = 0; i < candidate.children.length; i++) {
    const child = candidate.children[i];

    if (typeof child.dictId !== 'number' || child.dictId <= 0) {
      issues.push(`Child ${i} has invalid dictId ${child.dictId}.`);
      if (!rejectionReason) rejectionReason = 'INVALID_DICTIONARY_REFERENCE';
    }

    if (child.transform !== FUNNEL10_TRANSFORM) {
      issues.push(`Child ${i} uses unsupported transform '${child.transform}'.`);
      if (!rejectionReason) rejectionReason = 'UNSUPPORTED_TRANSFORM';
    }

    if (child.order !== i) {
      issues.push(`Child ${i} order index mismatch: expected ${i}, found ${child.order}.`);
      if (!rejectionReason) rejectionReason = 'INVALID_CHILD';
    }

    // Verify mathematical exactness of relative offset
    const expectedDx = child.originCoord.x - anchor.x;
    const expectedDy = child.originCoord.y - anchor.y;
    const expectedDz = child.originCoord.z - anchor.z;

    if (
      child.relativeOffset.dx !== expectedDx ||
      child.relativeOffset.dy !== expectedDy ||
      child.relativeOffset.dz !== expectedDz
    ) {
      issues.push(
        `Child ${i} relative offset mismatch: expected (${expectedDx},${expectedDy},${expectedDz}), found (${child.relativeOffset.dx},${child.relativeOffset.dy},${child.relativeOffset.dz}).`
      );
      if (!rejectionReason) rejectionReason = 'INVALID_TRANSLATION';
    }
  }

  // 5. Canonicalize via Funnel 9 and compare
  const rawInput: RawCompositeInput = {
    origin: candidate.originCoord,
    children: candidate.children.map((c) => ({
      dictId: c.dictId,
      position: c.originCoord,
      order: c.order,
      transform: c.transform,
      transformMetadata: c.transformMetadata,
    })),
    transform: candidate.transform,
    transformMetadata: candidate.transformMetadata,
  };

  const canonRes = canonicalizeComposite(rawInput);
  if (!canonRes.success || !canonRes.canonical) {
    issues.push(`Funnel 9 canonicalization failed: ${canonRes.error}`);
    if (!rejectionReason) rejectionReason = 'CANONICALIZATION_FAILED';
  } else {
    // Check canonical signature match
    if (candidate.signature !== canonRes.canonical.signature) {
      issues.push(
        `Signature mismatch: candidate signature '${candidate.signature}' does not match Funnel 9 canonical signature '${canonRes.canonical.signature}'.`
      );
      if (!rejectionReason) rejectionReason = 'CANONICALIZATION_FAILED';
    }

    // Check deep canonical equality
    if (!areCanonicalCompositesEqual(candidate.canonical, canonRes.canonical)) {
      issues.push('Candidate canonical representation does not match freshly re-canonicalized composite.');
      if (!rejectionReason) rejectionReason = 'CANONICALIZATION_FAILED';
    }
  }

  // 6. Verify covered cells and sequence indices
  if (!candidate.coveredCells || candidate.coveredCells.length === 0) {
    issues.push('Candidate has no covered cells recorded.');
    if (!rejectionReason) rejectionReason = 'INVALID_CHILD';
  }

  if (!candidate.sequenceIndices || candidate.sequenceIndices.length === 0) {
    issues.push('Candidate has no sequence indices recorded.');
    if (!rejectionReason) rejectionReason = 'SEQUENCE_METADATA_MISSING';
  }

  return {
    isValid: issues.length === 0,
    candidateId: candidate.occurrenceId,
    issues,
    rejectionReason,
  };
}
