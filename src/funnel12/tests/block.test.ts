/**
 * 3D Memory Studio - Funnel 12 Test: TC-F12-05
 * Block Preservation Verification (Multi-block reconstruction)
 */

import { createTestBlock, createTestCell } from './test_helpers';
import { runRoundtripTest } from '../core/roundtrip';
import { Funnel12TestResult } from '../types/report';

export function testBlockPreservation(): Funnel12TestResult {
  const block0Cells = [
    createTestCell(0, 0, 'A', [0]),
    createTestCell(1, 0, 'B', [1]),
  ];

  const block1Cells = [
    createTestCell(50, 1, 'C', [2]),
    createTestCell(51, 1, 'D', [3]),
  ];

  const block0 = createTestBlock(0, block0Cells, [0, 0, 0]);
  const block1 = createTestBlock(1, block1Cells, [7, 0, 0]);

  const result = runRoundtripTest({
    memory: [block0, block1],
  });

  const decodedBlocks = result.decodeResult.decodedMemory?.blocks || [];
  const hasBothBlocks = decodedBlocks.length === 2 && decodedBlocks[0].blockId === 0 && decodedBlocks[1].blockId === 1;

  const passed = result.success && hasBothBlocks && result.comparison.blocksMatch;

  return {
    testId: 'TC-F12-05',
    name: 'Block Preservation',
    passed,
    details: passed
      ? `Multi-block structure (Block 0 with ${block0Cells.length} cells, Block 1 with ${block1Cells.length} cells) preserved with full isolation.`
      : `Block preservation failed: decoded ${decodedBlocks.length} blocks.`,
    artifactBytes: result.artifact.byteLength,
  };
}
