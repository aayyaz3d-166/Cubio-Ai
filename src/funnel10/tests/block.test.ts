/**
 * Funnel 10 Test: Cross-Block Candidate Rejection (TC-F10-05)
 * 
 * Verifies that candidate groupings containing dictionary occurrences from different
 * memory blocks are strictly rejected with CROSS_BLOCK_COMPOSITE.
 */

import { discoverCandidates } from '../core/discover';
import { DictionaryOccurrence } from '../types/candidate';

export function testCrossBlockRejection(): { passed: boolean; details: string } {
  // Candidate spanning Block 3 and Block 4
  const occurrences: DictionaryOccurrence[] = [
    {
      occurrenceId: 'BLK3_A',
      dictId: 301,
      blockId: 3, // Block 3
      originCellId: 10,
      originCoord: { x: 0, y: 0, z: 0 },
      coveredCells: [10],
      sequenceIndices: [0],
    },
    {
      occurrenceId: 'BLK4_B',
      dictId: 302,
      blockId: 4, // Block 4 (Cross-block!)
      originCellId: 20,
      originCoord: { x: 2, y: 0, z: 0 },
      coveredCells: [20],
      sequenceIndices: [1],
    },
  ];

  const explicitGroupings = [['BLK3_A', 'BLK4_B']];
  const result = discoverCandidates(occurrences, { explicitGroupings });

  const rejectedCorrectly =
    result.totalCandidates === 0 &&
    result.totalRejected === 1 &&
    result.rejectedCandidates[0].reason === 'CROSS_BLOCK_COMPOSITE' &&
    result.rejectionReasons.CROSS_BLOCK_COMPOSITE === 1;

  return {
    passed: rejectedCorrectly,
    details: rejectedCorrectly
      ? `Cross-Block Rejection Verified: Candidate spanning Block 3 and Block 4 correctly rejected with CROSS_BLOCK_COMPOSITE.`
      : `Cross-block rejection failed: totalCandidates=${result.totalCandidates}, totalRejected=${result.totalRejected}, reason=${result.rejectedCandidates[0]?.reason}.`,
  };
}
