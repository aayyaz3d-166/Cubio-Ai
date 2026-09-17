/**
 * 3D Memory Studio - Funnel 12 Test: TC-F12-14
 * High-Entropy Dataset (Incompressible handling)
 */

import { createTestBlock, createTestCell } from './test_helpers';
import { runRoundtripTest } from '../core/roundtrip';
import { Funnel12TestResult } from '../types/report';

export function testHighEntropyDataset(): Funnel12TestResult {
  // Generate 40 pseudo-random high-entropy cells with diverse symbols
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$';
  const cells = [];

  for (let i = 0; i < 40; i++) {
    // Linear congruential pseudorandom coords without collision
    const cellId = (i * 7 + 13) % 343;
    const symbol = alphabet[i % alphabet.length];
    cells.push(createTestCell(cellId, 0, symbol, [i]));
  }

  const block = createTestBlock(0, cells, [0, 0, 0]);

  const result = runRoundtripTest({
    memory: [block],
  });

  const passed = result.success && result.comparison.isLossless && result.artifact.header.rawCellCount === 40;

  return {
    testId: 'TC-F12-14',
    name: 'High-Entropy Dataset',
    passed,
    details: passed
      ? `40 high-entropy isolated cells preserved with 100% fidelity without pattern distortion.`
      : `High-entropy test failed: isLossless=${result.comparison.isLossless}.`,
    artifactBytes: result.artifact.byteLength,
  };
}
