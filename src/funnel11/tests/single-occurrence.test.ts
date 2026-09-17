/**
 * Test TC-F11-02: Single Occurrence Evaluation
 * 
 * Verifies that single-occurrence candidates are evaluated based purely on exact byte cost
 * without any hard-coded occurrence threshold rule (e.g. no "occurrenceCount >= 2" assumption).
 */

import { createBenchmarkCandidateFamily } from '../core/benchmark';
import { scoreCandidateFamily } from '../core/scorer';

export function testSingleOccurrence(): { passed: boolean; details: string } {
  // 2 children, 1 occurrence
  // Definition cost: 9 + 2*8 = 25 bytes
  // Reference cost: 1 * 12 = 12 bytes
  // Total composite cost: 25 + 12 = 37 bytes
  // Expanded cost: 1 * (2 * 9) = 18 bytes
  // Actual savings: 18 - 37 = -19 bytes -> Unprofitable by 19 bytes
  const singleOccFamily = createBenchmarkCandidateFamily(
    'COMPOSITE{D10@[0,0,0]|D11@[1,0,0]}',
    [10, 11],
    [[0, 0, 0], [1, 0, 0]],
    [{ x: 0, y: 0, z: 0 }]
  );

  const score = scoreCandidateFamily(singleOccFamily);

  // Must be rejected solely due to NO_ACTUAL_BYTE_SAVINGS
  if (score.isProfitable || score.status !== 'REJECTED') {
    return {
      passed: false,
      details: `Expected single occurrence to be rejected for byte deficit, got status: ${score.status}`,
    };
  }

  if (score.rejectionReason !== 'NO_ACTUAL_BYTE_SAVINGS') {
    return {
      passed: false,
      details: `Expected rejection reason NO_ACTUAL_BYTE_SAVINGS, got ${score.rejectionReason}`,
    };
  }

  if (score.cost.actualSavings !== -19) {
    return {
      passed: false,
      details: `Expected net loss of -19 bytes, got ${score.cost.actualSavings}`,
    };
  }

  if (score.cost.breakEvenOccurrences !== 5) {
    // savings per occ = 18 - 12 = 6B. ceil(25 / 6) = 5 occurrences.
    return {
      passed: false,
      details: `Expected break-even threshold of 5 occurrences, got ${score.cost.breakEvenOccurrences}`,
    };
  }

  return {
    passed: true,
    details: `Successfully verified single occurrence evaluation: mathematically rejected for -19B deficit with computed break-even at ${score.cost.breakEvenOccurrences} occurrences.`,
  };
}
