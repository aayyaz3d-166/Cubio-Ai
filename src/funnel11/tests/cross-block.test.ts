/**
 * Test TC-F11-08: Cross-Block Candidate Rejection
 * 
 * Verifies that candidate families spanning multiple memory blocks are strictly
 * rejected with reason 'CROSS_BLOCK_COMPOSITE'.
 */

import { createBenchmarkCandidateFamily } from '../core/benchmark';
import { scoreCandidateFamily } from '../core/scorer';
import { selectCompositeEntries } from '../core/selector';

export function testCrossBlockRejection(): { passed: boolean; details: string } {
  // Candidate spanning block 0 and block 1
  const crossBlockFamily = createBenchmarkCandidateFamily(
    'COMPOSITE{D801@[0,0,0]|D802@[1,0,0]}',
    [801, 802],
    [[0, 0, 0], [1, 0, 0]],
    [
      { x: 0, y: 0, z: 0, blockId: 0 },
      { x: 2, y: 0, z: 0, blockId: 0 },
      { x: 0, y: 0, z: 0, blockId: 1 }, // spans block 1!
      { x: 2, y: 0, z: 0, blockId: 1 },
    ]
  );

  const score = scoreCandidateFamily(crossBlockFamily);

  if (score.isProfitable || score.status !== 'REJECTED') {
    return {
      passed: false,
      details: `Expected cross-block candidate to be rejected, got status: ${score.status}`,
    };
  }

  if (score.rejectionReason !== 'CROSS_BLOCK_COMPOSITE') {
    return {
      passed: false,
      details: `Expected rejection reason CROSS_BLOCK_COMPOSITE, got: ${score.rejectionReason}`,
    };
  }

  const selection = selectCompositeEntries([crossBlockFamily]);
  if (selection.selectedEntries.length !== 0) {
    return {
      passed: false,
      details: `Expected 0 selected entries for cross-block family, got ${selection.selectedEntries.length}`,
    };
  }

  return {
    passed: true,
    details: 'Successfully verified that cross-block candidates are strictly rejected with CROSS_BLOCK_COMPOSITE.',
  };
}
