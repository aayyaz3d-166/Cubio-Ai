/**
 * 3D Memory Studio - Funnel 12 Test: TC-F12-04
 * Sequence Preservation Verification
 */

import { createTestBlock, createTestCell } from './test_helpers';
import { runRoundtripTest } from '../core/roundtrip';
import { Funnel12TestResult } from '../types/report';

export function testSequencePreservation(): Funnel12TestResult {
  // Deliberately create non-monotonic cell IDs with strict sequence order
  const tokens = ['H', 'E', 'L', 'L', 'O', '_', '3', 'D'];
  const cellPositions = [45, 12, 180, 2, 99, 200, 7, 310];

  const cells = tokens.map((tok, idx) =>
    createTestCell(cellPositions[idx], 0, tok, [idx])
  );

  const block = createTestBlock(0, cells, [0, 0, 0]);

  const result = runRoundtripTest({
    memory: [block],
  });

  // Verify decoded sequence token by token
  const decodedTokens = result.decodeResult.decodedMemory?.sequence.map((s) => s.symbol) || [];
  const sequenceMatches = JSON.stringify(tokens) === JSON.stringify(decodedTokens);

  const passed = result.success && sequenceMatches && result.comparison.sequenceIndicesMatch;

  return {
    testId: 'TC-F12-04',
    name: 'Sequence Preservation',
    passed,
    details: passed
      ? `Sequence of ${tokens.length} tokens (${tokens.join('')}) preserved exactly across non-contiguous 3D coordinates.`
      : `Sequence mismatch: expected ${tokens.join('')}, got ${decodedTokens.join('')}.`,
    artifactBytes: result.artifact.byteLength,
  };
}
