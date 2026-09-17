/**
 * Funnel 10 Test: Independent Candidate Verifier (TC-F10-10)
 * 
 * Verifies that the candidate verifier correctly accepts valid candidates and
 * catches corrupt or invalid candidates with specific rejection reasons.
 */

import { canonicalizeComposite } from '../../funnel9/core/canonicalizer';
import { RawCompositeInput } from '../../funnel9/types/canonical';
import { verifyCandidateOccurrence } from '../core/verifier';
import {
  CompositeCandidateOccurrence,
  CompositeChildOccurrence,
  FUNNEL10_TRANSFORM,
} from '../types/candidate';

export function testCandidateVerification(): { passed: boolean; details: string } {
  // Construct a valid candidate occurrence
  const rawInput: RawCompositeInput = {
    origin: { x: 10, y: 10, z: 10 },
    children: [
      { dictId: 100, position: { x: 10, y: 10, z: 10 }, order: 0, transform: 'TRANSLATION' },
      { dictId: 200, position: { x: 12, y: 14, z: 16 }, order: 1, transform: 'TRANSLATION' },
    ],
    transform: 'TRANSLATION',
  };
  const canonRes = canonicalizeComposite(rawInput);
  if (!canonRes.success || !canonRes.canonical) {
    return { passed: false, details: 'Funnel 9 canonicalization failed in verifier test setup.' };
  }

  const validChildOccs: CompositeChildOccurrence[] = [
    {
      dictId: 100,
      occurrenceId: 'CHILD_1',
      order: 0,
      originCoord: { x: 10, y: 10, z: 10 },
      relativeOffset: { dx: 0, dy: 0, dz: 0 },
      coveredCells: [1, 2],
      sequenceIndices: [0, 1],
      transform: FUNNEL10_TRANSFORM,
    },
    {
      dictId: 200,
      occurrenceId: 'CHILD_2',
      order: 1,
      originCoord: { x: 12, y: 14, z: 16 },
      relativeOffset: { dx: 2, dy: 4, dz: 6 },
      coveredCells: [3, 4],
      sequenceIndices: [2, 3],
      transform: FUNNEL10_TRANSFORM,
    },
  ];

  const validCand: CompositeCandidateOccurrence = {
    occurrenceId: 'CAND_VALID',
    blockId: 0,
    originCoord: { x: 10, y: 10, z: 10 },
    originCellId: 1,
    children: validChildOccs,
    childCount: 2,
    coveredCells: [1, 2, 3, 4],
    sequenceIndices: [0, 1, 2, 3],
    transform: FUNNEL10_TRANSFORM,
    canonical: canonRes.canonical,
    signature: canonRes.canonical.signature,
    fingerprint: canonRes.canonical.fingerprint,
  };

  const validRes = verifyCandidateOccurrence(validCand);
  if (!validRes.isValid) {
    return { passed: false, details: `Valid candidate unexpectedly rejected: ${validRes.issues.join('; ')}` };
  }

  // Corrupt 1: Relative offset mismatch
  const corruptOffsetChild: CompositeChildOccurrence[] = [
    { ...validChildOccs[0] },
    { ...validChildOccs[1], relativeOffset: { dx: 99, dy: 4, dz: 6 } }, // Corrupt relative offset
  ];
  const corruptCand1: CompositeCandidateOccurrence = {
    ...validCand,
    occurrenceId: 'CAND_CORRUPT_OFFSET',
    children: corruptOffsetChild,
  };
  const res1 = verifyCandidateOccurrence(corruptCand1);
  if (res1.isValid || res1.rejectionReason !== 'INVALID_TRANSLATION') {
    return { passed: false, details: 'Failed to detect invalid relative offset mismatch in verifier.' };
  }

  // Corrupt 2: Missing sequence indices
  const corruptCand2: CompositeCandidateOccurrence = {
    ...validCand,
    occurrenceId: 'CAND_NO_SEQ',
    sequenceIndices: [],
  };
  const res2 = verifyCandidateOccurrence(corruptCand2);
  if (res2.isValid || res2.rejectionReason !== 'SEQUENCE_METADATA_MISSING') {
    return { passed: false, details: 'Failed to detect missing sequence metadata in verifier.' };
  }

  return {
    passed: true,
    details: 'Candidate Verifier Verified: Correctly approved valid candidate and rejected corrupt candidates with precise error reasons.',
  };
}
