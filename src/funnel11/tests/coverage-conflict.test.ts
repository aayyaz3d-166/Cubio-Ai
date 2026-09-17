/**
 * Test TC-F11-09: Overlap Conflict Resolution & Coverage Validation
 * 
 * Verifies that when multiple profitable candidates compete for the same spatial cells:
 * 1. Cell overlap is resolved deterministically (greedy priority).
 * 2. Savings are never double-counted.
 * 3. Final coverage has duplicateCells = 0 and unexpectedCells = 0.
 */

import { createBenchmarkCandidateFamily } from '../core/benchmark';
import { selectCompositeEntries } from '../core/selector';

export function testCoverageConflictResolution(): { passed: boolean; details: string } {
  // Family A: 4 children, 6 occurrences (high savings: 6*(4*9) - (9+4*8 + 6*12) = 216 - 113 = 103B)
  // Occurs at origins (0,0,0), (3,0,0), (0,3,0), etc.
  const familyA = createBenchmarkCandidateFamily(
    'COMPOSITE{D901@[0,0,0]|D902@[1,0,0]|D903@[0,1,0]|D904@[1,1,0]}',
    [901, 902, 903, 904],
    [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0]],
    [
      { x: 0, y: 0, z: 0 },
      { x: 3, y: 0, z: 0 },
      { x: 0, y: 3, z: 0 },
      { x: 3, y: 3, z: 0 },
      { x: 0, y: 0, z: 3 },
      { x: 3, y: 0, z: 3 },
    ],
    1
  );

  // Family B: 2 children, 6 occurrences (lower savings: 6*18 - (25 + 72) = 108 - 97 = 11B)
  // Competes for the EXACT same cells as Family A at origins (0,0,0), (3,0,0), etc.!
  const familyB = createBenchmarkCandidateFamily(
    'COMPOSITE{D901@[0,0,0]|D902@[1,0,0]}',
    [901, 902],
    [[0, 0, 0], [1, 0, 0]],
    [
      { x: 0, y: 0, z: 0 },
      { x: 3, y: 0, z: 0 },
      { x: 0, y: 3, z: 0 },
      { x: 3, y: 3, z: 0 },
      { x: 0, y: 0, z: 3 },
      { x: 3, y: 0, z: 3 },
    ],
    1
  );

  const selection = selectCompositeEntries([familyB, familyA]);

  // Family A should win because it has higher net savings (103B vs 11B)
  if (selection.selectedEntries.length !== 1) {
    return {
      passed: false,
      details: `Expected exactly 1 winning composite entry after conflict resolution, got ${selection.selectedEntries.length}`,
    };
  }

  const winner = selection.selectedEntries[0];
  if (winner.signature !== familyA.signature) {
    return {
      passed: false,
      details: `Expected higher-saving Family A to win, got ${winner.signature}`,
    };
  }

  // Family B should be rejected due to CELL_OVERLAP_CONFLICT
  const rejectedB = selection.rejectedEntries.find((r) => r.signature === familyB.signature);
  if (!rejectedB || rejectedB.reason !== 'CELL_OVERLAP_CONFLICT') {
    return {
      passed: false,
      details: `Expected Family B to be rejected with CELL_OVERLAP_CONFLICT, got: ${rejectedB?.reason}`,
    };
  }

  // Verify coverage validation
  if (!selection.coverageValidation.isValid) {
    return {
      passed: false,
      details: `Coverage validation failed: ${selection.coverageValidation.issues.join(', ')}`,
    };
  }

  if (selection.coverageValidation.duplicateCellsCount !== 0) {
    return {
      passed: false,
      details: `Expected 0 duplicate cells, got ${selection.coverageValidation.duplicateCellsCount}`,
    };
  }

  return {
    passed: true,
    details: 'Successfully verified overlap resolution: higher-saving composite selected, conflicting candidate rejected, zero duplicate cells.',
  };
}
