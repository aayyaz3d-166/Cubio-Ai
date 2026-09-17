/**
 * Test TC-F11-05: No Actual Savings Rejection
 * 
 * Verifies that any candidate where totalCompositeCost >= expandedChildCost
 * is strictly rejected with reason 'NO_ACTUAL_BYTE_SAVINGS'.
 */

import { createBenchmarkCandidateFamily } from '../core/benchmark';
import { scoreCandidateFamily } from '../core/scorer';
import { selectCompositeEntries } from '../core/selector';

export function testNoActualSavingsRejection(): { passed: boolean; details: string } {
  // Case A: 2 children, 2 occurrences
  // Definition cost: 9 + 2*8 = 25 bytes
  // Reference cost: 2 * 12 = 24 bytes
  // Total composite cost: 25 + 24 = 49 bytes
  // Expanded cost: 2 * (2 * 9) = 36 bytes
  // Net savings: 36 - 49 = -13 bytes -> Unprofitable
  const familyA = createBenchmarkCandidateFamily(
    'COMPOSITE{D50@[0,0,0]|D51@[1,0,0]}',
    [50, 51],
    [[0, 0, 0], [1, 0, 0]],
    [{ x: 0, y: 0, z: 0 }, { x: 3, y: 0, z: 0 }]
  );

  const scoreA = scoreCandidateFamily(familyA);

  if (scoreA.isProfitable || scoreA.status !== 'REJECTED') {
    return {
      passed: false,
      details: `Expected familyA to be rejected, got status ${scoreA.status}`,
    };
  }

  if (scoreA.rejectionReason !== 'NO_ACTUAL_BYTE_SAVINGS') {
    return {
      passed: false,
      details: `Expected rejection reason NO_ACTUAL_BYTE_SAVINGS, got ${scoreA.rejectionReason}`,
    };
  }

  // Case B: Exactly Break-Even (Zero savings)
  // Let's check break-even:
  // If childCount = 2, savings per occ = 18 - 12 = 6 bytes.
  // Definition = 25 bytes.
  // 4 occurrences: Expanded = 4*18 = 72. Total comp = 25 + 4*12 = 73. Savings = -1. Rejected!
  // 5 occurrences: Expanded = 5*18 = 90. Total comp = 25 + 5*12 = 85. Savings = +5. Accepted!
  const family4Occ = createBenchmarkCandidateFamily(
    'COMPOSITE{D60@[0,0,0]|D61@[1,0,0]}',
    [60, 61],
    [[0, 0, 0], [1, 0, 0]],
    [{ x: 0, y: 0, z: 0 }, { x: 3, y: 0, z: 0 }, { x: 0, y: 3, z: 0 }, { x: 3, y: 3, z: 0 }]
  );

  const score4Occ = scoreCandidateFamily(family4Occ);
  if (score4Occ.isProfitable || score4Occ.status !== 'REJECTED') {
    return {
      passed: false,
      details: `Expected 4-occurrence candidate (savings = -1B) to be rejected, got status ${score4Occ.status}`,
    };
  }

  const selection = selectCompositeEntries([familyA, family4Occ]);
  if (selection.selectedEntries.length !== 0) {
    return {
      passed: false,
      details: `Expected 0 selected entries for unprofitable batch, got ${selection.selectedEntries.length}`,
    };
  }

  if (selection.rejectedEntries.length !== 2) {
    return {
      passed: false,
      details: `Expected 2 rejected entries, got ${selection.rejectedEntries.length}`,
    };
  }

  return {
    passed: true,
    details: 'Successfully verified that candidates with net byte deficit are strictly rejected with NO_ACTUAL_BYTE_SAVINGS.',
  };
}
