/**
 * 3D Memory Studio - Funnel 12 Test: TC-F12-03
 * Exact Roundtrip Verification
 */

import { createTestBlock, createTestCell } from './test_helpers';
import { runRoundtripTest } from '../core/roundtrip';
import { Funnel12TestResult } from '../types/report';

export function testExactRoundtrip(): Funnel12TestResult {
  const cells = [
    createTestCell(0, 0, 'A', [0]),
    createTestCell(1, 0, 'B', [1]),
    createTestCell(2, 0, 'C', [2]),
  ];

  const block = createTestBlock(0, cells, [0, 0, 0]);

  const result = runRoundtripTest({
    memory: [block],
  });

  const passed = result.success && result.comparison.isLossless;

  return {
    testId: 'TC-F12-03',
    name: 'Exact Roundtrip Verification',
    passed,
    details: passed
      ? `Lossless roundtrip confirmed across ${result.comparison.originalCellCount} cells.`
      : `Roundtrip failed: ${result.comparison.mismatches.join('; ')}`,
    artifactBytes: result.artifact.byteLength,
  };
}
