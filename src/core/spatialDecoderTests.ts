/**
 * 3D Memory Studio - Funnel 3: Spatial Decoder Test Suite
 * 
 * 12 Rigorous Test Cases:
 * 1. Single SPATIAL_RUN (1D line on X/Y/Z)
 * 2. Repeated Token Pattern (REPETITION)
 * 3. 3D Spatial Cluster (CLUSTER)
 * 4. Repeated Shape (REPEATED_SHAPE)
 * 5. Sequence Trajectory Path (SEQUENCE_PATH)
 * 6. Mixed RAW + Rules Hybrid Coexistence
 * 7. Multi-Block Hierarchical Memory
 * 8. Cross-Block Sequence Trajectory
 * 9. High-Entropy Random Data (Pure RAW fallback)
 * 10. Large Multi-Block Dataset (Stress test)
 * 11. Corrupted Artifact Integrity Detection (Must FAIL)
 * 12. Double Roundtrip Stability (Original == Decoded == ReDecoded)
 */

import { Coordinate3D, MemoryBlock, MemoryCell, RootMemory } from '../types/memory';
import { SpatialDecoderTestSuiteResult } from '../types/spatialDecoder';
import { cellIdToCoordinate, coordinateToCellId } from './address369';
import { createMemoryBlock, encodeToHierarchicalMemory } from './hierarchicalMemory';
import {
  createEncodingPlan,
  encodeSpatialRun,
  encodeRepetition,
  encodeCluster,
  encodeRawSegment,
  serializeCompactMemory,
  computeLogicalMemoryChecksum,
} from './spatialEncoder';
import { decodeCompactBinary, compareRoundtrip } from './spatialDecoder';

/**
 * Creates a synthetic multi-block memory with specific active cell coordinates and symbols
 */
function createSyntheticMemory(
  blockConfigs: Array<{
    blockId: number;
    cells: Array<{ id: number; symbol: string; stepIndex?: number }>;
  }>
): RootMemory {
  const blocks: MemoryBlock[] = [];

  for (const cfg of blockConfigs) {
    const block = createMemoryBlock(cfg.blockId, null, undefined, 1, `Synthetic Block ${cfg.blockId}`);

    for (const c of cfg.cells) {
      const cell = block.cells[c.id];
      if (cell) {
        cell.state = 1;
        cell.symbol = c.symbol;
        cell.symbolId = c.symbol.charCodeAt(0) - 65;
        cell.stepIndices = [c.stepIndex ?? 0];
        cell.occurrenceCount = 1;
      }
    }

    const activeCount = block.cells.filter((c) => c.state === 1).length;
    block.metadata.activeCellCount = activeCount;
    block.metadata.tokenCount = activeCount;
    blocks.push(block);
  }

  const totalActive = blocks.reduce((sum, b) => sum + b.metadata.activeCellCount, 0);

  return {
    rootId: 'ROOT',
    level: 1,
    blocks,
    activeBlockId: blocks[0]?.blockId ?? 0,
    totalCapacity: blocks.length * 343,
    totalActiveCells: totalActive,
    entryRef: blocks[0] ? { blockId: blocks[0].blockId, cellId: 0 } : null,
    sequenceSteps: [],
    metadata: {
      title: 'Synthetic Test Memory',
      createdAt: new Date().toISOString(),
      totalAllocatedBlocks: blocks.length,
      researchQuestion: 'Spatial Decoding Test Suite',
      isExpandable: true,
      preservesSpatialRelationships: true,
    },
  };
}

/**
 * Executes the entire Funnel 3 Spatial Decoder Test Suite
 */
export function runSpatialDecoderTestSuite(): SpatialDecoderTestSuiteResult {
  const suiteStartTime = performance.now();
  const results: SpatialDecoderTestSuiteResult['results'] = [];

  // ==========================================================================
  // TEST 1: Single SPATIAL_RUN
  // ==========================================================================
  {
    const start = performance.now();
    const cells: Array<{ id: number; symbol: string }> = [];
    for (let x = 0; x < 6; x++) {
      cells.push({ id: coordinateToCellId(x, 2, 2), symbol: 'A' });
    }
    const mem = createSyntheticMemory([{ blockId: 0, cells }]);
    const plan = createEncodingPlan(mem);
    const { binaryBuffer } = serializeCompactMemory(plan, mem);
    const decodeResult = decodeCompactBinary(binaryBuffer, mem);

    const passed =
      decodeResult.success &&
      decodeResult.checksumMatch &&
      decodeResult.exactComparison?.isIdentical === true;

    results.push({
      testId: 'TEST-1',
      testName: 'Single SPATIAL_RUN Verification',
      description: 'Encodes and decodes a contiguous 1D run along +X axis and verifies mathematical expansion.',
      passed,
      durationMs: Math.round((performance.now() - start) * 100) / 100,
      details: decodeResult.exactComparison?.details || decodeResult.error || 'Passed',
      decodeStage: decodeResult.stage,
      checksumMatch: decodeResult.checksumMatch,
      exactMatch: decodeResult.exactComparison?.isIdentical ?? false,
      coverageStatus: decodeResult.coverage.details,
    });
  }

  // ==========================================================================
  // TEST 2: Repeated Token Pattern (REPETITION)
  // ==========================================================================
  {
    const start = performance.now();
    const cells: Array<{ id: number; symbol: string }> = [];
    const pattern = ['A', 'B', 'C'];
    for (let i = 0; i < 9; i++) {
      cells.push({ id: 20 + i * 2, symbol: pattern[i % 3] });
    }
    const mem = createSyntheticMemory([{ blockId: 0, cells }]);
    const plan = createEncodingPlan(mem);
    const { binaryBuffer } = serializeCompactMemory(plan, mem);
    const decodeResult = decodeCompactBinary(binaryBuffer, mem);

    const passed =
      decodeResult.success &&
      decodeResult.checksumMatch &&
      decodeResult.exactComparison?.isIdentical === true;

    results.push({
      testId: 'TEST-2',
      testName: 'Repeated Token Pattern (REPETITION)',
      description: 'Expands periodic token pattern with spatial stride and validates token-to-cell mapping.',
      passed,
      durationMs: Math.round((performance.now() - start) * 100) / 100,
      details: decodeResult.exactComparison?.details || decodeResult.error || 'Passed',
      decodeStage: decodeResult.stage,
      checksumMatch: decodeResult.checksumMatch,
      exactMatch: decodeResult.exactComparison?.isIdentical ?? false,
      coverageStatus: decodeResult.coverage.details,
    });
  }

  // ==========================================================================
  // TEST 3: 3D Spatial Cluster (CLUSTER)
  // ==========================================================================
  {
    const start = performance.now();
    const cells: Array<{ id: number; symbol: string }> = [];
    for (let x = 1; x <= 3; x++) {
      for (let y = 1; y <= 3; y++) {
        for (let z = 1; z <= 2; z++) {
          cells.push({ id: coordinateToCellId(x, y, z), symbol: 'C' });
        }
      }
    }
    const mem = createSyntheticMemory([{ blockId: 0, cells }]);
    const plan = createEncodingPlan(mem);
    const { binaryBuffer } = serializeCompactMemory(plan, mem);
    const decodeResult = decodeCompactBinary(binaryBuffer, mem);

    const passed =
      decodeResult.success &&
      decodeResult.checksumMatch &&
      decodeResult.exactComparison?.isIdentical === true;

    results.push({
      testId: 'TEST-3',
      testName: '3D Spatial Cluster (CLUSTER)',
      description: 'Reconstructs dense geometric bounding box cluster with relative cell indices.',
      passed,
      durationMs: Math.round((performance.now() - start) * 100) / 100,
      details: decodeResult.exactComparison?.details || decodeResult.error || 'Passed',
      decodeStage: decodeResult.stage,
      checksumMatch: decodeResult.checksumMatch,
      exactMatch: decodeResult.exactComparison?.isIdentical ?? false,
      coverageStatus: decodeResult.coverage.details,
    });
  }

  // ==========================================================================
  // TEST 4: Repeated Shape
  // ==========================================================================
  {
    const start = performance.now();
    const cells: Array<{ id: number; symbol: string }> = [
      { id: 10, symbol: 'S' },
      { id: 11, symbol: 'S' },
      { id: 17, symbol: 'S' },
      { id: 18, symbol: 'S' },
      { id: 50, symbol: 'S' },
      { id: 51, symbol: 'S' },
      { id: 57, symbol: 'S' },
      { id: 58, symbol: 'S' },
    ];
    const mem = createSyntheticMemory([{ blockId: 0, cells }]);
    const plan = createEncodingPlan(mem);
    const { binaryBuffer } = serializeCompactMemory(plan, mem);
    const decodeResult = decodeCompactBinary(binaryBuffer, mem);

    const passed =
      decodeResult.success &&
      decodeResult.checksumMatch &&
      decodeResult.exactComparison?.isIdentical === true;

    results.push({
      testId: 'TEST-4',
      testName: 'Repeated Shape Reconstruction',
      description: 'Validates occurrence count and cell locations for repeating shape structures.',
      passed,
      durationMs: Math.round((performance.now() - start) * 100) / 100,
      details: decodeResult.exactComparison?.details || decodeResult.error || 'Passed',
      decodeStage: decodeResult.stage,
      checksumMatch: decodeResult.checksumMatch,
      exactMatch: decodeResult.exactComparison?.isIdentical ?? false,
      coverageStatus: decodeResult.coverage.details,
    });
  }

  // ==========================================================================
  // TEST 5: Sequence Path Trajectory
  // ==========================================================================
  {
    const start = performance.now();
    const cells: Array<{ id: number; symbol: string; stepIndex: number }> = [
      { id: 50, symbol: 'H', stepIndex: 0 },
      { id: 51, symbol: 'E', stepIndex: 1 },
      { id: 52, symbol: 'L', stepIndex: 2 },
      { id: 53, symbol: 'L', stepIndex: 3 },
      { id: 54, symbol: 'O', stepIndex: 4 },
    ];
    const mem = createSyntheticMemory([{ blockId: 0, cells }]);
    const plan = createEncodingPlan(mem);
    const { binaryBuffer } = serializeCompactMemory(plan, mem);
    const decodeResult = decodeCompactBinary(binaryBuffer, mem);

    const passed =
      decodeResult.success &&
      decodeResult.checksumMatch &&
      decodeResult.exactComparison?.isIdentical === true;

    results.push({
      testId: 'TEST-5',
      testName: 'Sequence Path Trajectory',
      description: 'Reconstructs sequential step trajectory and preserves token ordering.',
      passed,
      durationMs: Math.round((performance.now() - start) * 100) / 100,
      details: decodeResult.exactComparison?.details || decodeResult.error || 'Passed',
      decodeStage: decodeResult.stage,
      checksumMatch: decodeResult.checksumMatch,
      exactMatch: decodeResult.exactComparison?.isIdentical ?? false,
      coverageStatus: decodeResult.coverage.details,
    });
  }

  // ==========================================================================
  // TEST 6: Mixed RAW + Rules Hybrid Coexistence
  // ==========================================================================
  {
    const start = performance.now();
    const cells: Array<{ id: number; symbol: string }> = [
      // 1D Run
      { id: coordinateToCellId(0, 0, 0), symbol: 'R' },
      { id: coordinateToCellId(1, 0, 0), symbol: 'R' },
      { id: coordinateToCellId(2, 0, 0), symbol: 'R' },
      { id: coordinateToCellId(3, 0, 0), symbol: 'R' },
      // Isolated RAW cells
      { id: coordinateToCellId(5, 5, 5), symbol: 'X' },
      { id: coordinateToCellId(2, 4, 6), symbol: 'Y' },
      { id: coordinateToCellId(6, 1, 3), symbol: 'Z' },
    ];
    const mem = createSyntheticMemory([{ blockId: 0, cells }]);
    const plan = createEncodingPlan(mem);
    const { binaryBuffer } = serializeCompactMemory(plan, mem);
    const decodeResult = decodeCompactBinary(binaryBuffer, mem);

    const passed =
      decodeResult.success &&
      decodeResult.checksumMatch &&
      decodeResult.exactComparison?.isIdentical === true;

    results.push({
      testId: 'TEST-6',
      testName: 'Mixed RAW + Rules Hybrid Coexistence',
      description: 'Verifies simultaneous seamless decoding of structured rules and isolated RAW fallback cells.',
      passed,
      durationMs: Math.round((performance.now() - start) * 100) / 100,
      details: decodeResult.exactComparison?.details || decodeResult.error || 'Passed',
      decodeStage: decodeResult.stage,
      checksumMatch: decodeResult.checksumMatch,
      exactMatch: decodeResult.exactComparison?.isIdentical ?? false,
      coverageStatus: decodeResult.coverage.details,
    });
  }

  // ==========================================================================
  // TEST 7: Multi-Block Memory
  // ==========================================================================
  {
    const start = performance.now();
    const block0Cells = [
      { id: 10, symbol: 'A' },
      { id: 11, symbol: 'B' },
      { id: 12, symbol: 'C' },
    ];
    const block1Cells = [
      { id: 20, symbol: 'D' },
      { id: 21, symbol: 'E' },
      { id: 22, symbol: 'F' },
    ];
    const block2Cells = [
      { id: 30, symbol: 'G' },
      { id: 31, symbol: 'H' },
      { id: 32, symbol: 'I' },
    ];
    const mem = createSyntheticMemory([
      { blockId: 0, cells: block0Cells },
      { blockId: 1, cells: block1Cells },
      { blockId: 2, cells: block2Cells },
    ]);
    const plan = createEncodingPlan(mem);
    const { binaryBuffer } = serializeCompactMemory(plan, mem);
    const decodeResult = decodeCompactBinary(binaryBuffer, mem);

    const passed =
      decodeResult.success &&
      decodeResult.checksumMatch &&
      decodeResult.blockValidations.length === 3 &&
      decodeResult.exactComparison?.isIdentical === true;

    results.push({
      testId: 'TEST-7',
      testName: 'Multi-Block Hierarchical Memory',
      description: 'Reconstructs 3 distinct memory blocks, verifying block IDs, origins, and cell membership.',
      passed,
      durationMs: Math.round((performance.now() - start) * 100) / 100,
      details: decodeResult.exactComparison?.details || decodeResult.error || 'Passed',
      decodeStage: decodeResult.stage,
      checksumMatch: decodeResult.checksumMatch,
      exactMatch: decodeResult.exactComparison?.isIdentical ?? false,
      coverageStatus: decodeResult.coverage.details,
    });
  }

  // ==========================================================================
  // TEST 8: Cross-Block Sequence
  // ==========================================================================
  {
    const start = performance.now();
    const fullText = 'THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG';
    const encodeRes = encodeToHierarchicalMemory(fullText, 1, 'Cross-Block Test');
    const mem = encodeRes.root;
    const plan = createEncodingPlan(mem);
    const { binaryBuffer } = serializeCompactMemory(plan, mem);
    const decodeResult = decodeCompactBinary(binaryBuffer, mem);

    const passed =
      decodeResult.success &&
      decodeResult.checksumMatch &&
      decodeResult.exactComparison?.isIdentical === true;

    results.push({
      testId: 'TEST-8',
      testName: 'Cross-Block Trajectory Sequence',
      description: 'Validates sequence index restoration across block transitions for full sentences.',
      passed,
      durationMs: Math.round((performance.now() - start) * 100) / 100,
      details: decodeResult.exactComparison?.details || decodeResult.error || 'Passed',
      decodeStage: decodeResult.stage,
      checksumMatch: decodeResult.checksumMatch,
      exactMatch: decodeResult.exactComparison?.isIdentical ?? false,
      coverageStatus: decodeResult.coverage.details,
    });
  }

  // ==========================================================================
  // TEST 9: High-Entropy Random Data
  // ==========================================================================
  {
    const start = performance.now();
    const cells: Array<{ id: number; symbol: string }> = [];
    const usedIds = new Set<number>();
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

    for (let i = 0; i < 30; i++) {
      let randId: number;
      do {
        randId = Math.floor(Math.random() * 340);
      } while (usedIds.has(randId));
      usedIds.add(randId);
      cells.push({ id: randId, symbol: chars[i % chars.length] });
    }

    const mem = createSyntheticMemory([{ blockId: 0, cells }]);
    const plan = createEncodingPlan(mem);
    const { binaryBuffer } = serializeCompactMemory(plan, mem);
    const decodeResult = decodeCompactBinary(binaryBuffer, mem);

    const passed =
      decodeResult.success &&
      decodeResult.checksumMatch &&
      decodeResult.exactComparison?.isIdentical === true;

    results.push({
      testId: 'TEST-9',
      testName: 'High-Entropy Random Data (RAW Fallback)',
      description: 'Ensures non-pattern random data correctly falls back to RAW and decodes with 100% fidelity.',
      passed,
      durationMs: Math.round((performance.now() - start) * 100) / 100,
      details: decodeResult.exactComparison?.details || decodeResult.error || 'Passed',
      decodeStage: decodeResult.stage,
      checksumMatch: decodeResult.checksumMatch,
      exactMatch: decodeResult.exactComparison?.isIdentical ?? false,
      coverageStatus: decodeResult.coverage.details,
    });
  }

  // ==========================================================================
  // TEST 10: Large Multi-Block Dataset (Stress Test)
  // ==========================================================================
  {
    const start = performance.now();
    const longText = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.repeat(15); // 390 characters across multiple blocks
    const encodeRes = encodeToHierarchicalMemory(longText, 1, 'Stress Test');
    const mem = encodeRes.root;
    const plan = createEncodingPlan(mem);
    const { binaryBuffer } = serializeCompactMemory(plan, mem);
    const decodeResult = decodeCompactBinary(binaryBuffer, mem);

    const passed =
      decodeResult.success &&
      decodeResult.checksumMatch &&
      decodeResult.exactComparison?.isIdentical === true;

    results.push({
      testId: 'TEST-10',
      testName: 'Large Multi-Block Dataset (Stress Test)',
      description: 'Stress-tests binary decoding across 390 characters and multiple hierarchical blocks.',
      passed,
      durationMs: Math.round((performance.now() - start) * 100) / 100,
      details: decodeResult.exactComparison?.details || decodeResult.error || 'Passed',
      decodeStage: decodeResult.stage,
      checksumMatch: decodeResult.checksumMatch,
      exactMatch: decodeResult.exactComparison?.isIdentical ?? false,
      coverageStatus: decodeResult.coverage.details,
    });
  }

  // ==========================================================================
  // TEST 11: Corrupted Artifact Detection (Must FAIL)
  // ==========================================================================
  {
    const start = performance.now();
    const mem = createSyntheticMemory([
      { blockId: 0, cells: [{ id: 10, symbol: 'A' }, { id: 11, symbol: 'B' }] },
    ]);
    const plan = createEncodingPlan(mem);
    const { binaryBuffer } = serializeCompactMemory(plan, mem);

    // Corrupt magic identifier: change 'C' to 'X'
    const corruptedMagic = new Uint8Array(binaryBuffer);
    corruptedMagic[0] = 0x58; // 'X'
    const result1 = decodeCompactBinary(corruptedMagic, mem);

    // Corrupt version: change 0x01 to 0x99
    const corruptedVersion = new Uint8Array(binaryBuffer);
    corruptedVersion[4] = 0x99;
    const result2 = decodeCompactBinary(corruptedVersion, mem);

    // Corrupt payload opcode
    const corruptedOpcode = new Uint8Array(binaryBuffer);
    const recordOffset = 16 + 10; // Header (16B) + 1 block entry (10B)
    if (corruptedOpcode.length > recordOffset) {
      corruptedOpcode[recordOffset] = 0xfe; // Invalid opcode
    }
    const result3 = decodeCompactBinary(corruptedOpcode, mem);

    const passed =
      result1.success === false &&
      result2.success === false &&
      result3.success === false;

    results.push({
      testId: 'TEST-11',
      testName: 'Corrupted Artifact Detection (Strict Failures)',
      description: 'Verifies that corrupted magic, invalid versions, and illegal opcodes are safely caught.',
      passed,
      durationMs: Math.round((performance.now() - start) * 100) / 100,
      details: passed
        ? 'CORRUPTION CAUGHT: Magic, Version, and Opcode tamperings were successfully rejected.'
        : 'FAIL: Decoder failed to detect binary corruption.',
      decodeStage: result1.stage,
      checksumMatch: false,
      exactMatch: false,
      coverageStatus: 'Corruption Safely Rejected',
    });
  }

  // ==========================================================================
  // TEST 12: Double Roundtrip Stability
  // ==========================================================================
  {
    const start = performance.now();
    const encodeRes = encodeToHierarchicalMemory('DOUBLE ROUNDTRIP STABILITY', 1, 'Double Pass');
    const mem = encodeRes.root;
    
    // Pass 1: Encode -> Decode
    const plan1 = createEncodingPlan(mem);
    const { binaryBuffer: bin1 } = serializeCompactMemory(plan1, mem);
    const dec1 = decodeCompactBinary(bin1, mem);

    // Pass 2: Re-encode reconstructed memory -> Decode again
    let passed = false;
    let details = 'Double roundtrip failed';

    if (dec1.success && dec1.reconstructedMemory) {
      const plan2 = createEncodingPlan(dec1.reconstructedMemory);
      const { binaryBuffer: bin2 } = serializeCompactMemory(plan2, dec1.reconstructedMemory);
      const dec2 = decodeCompactBinary(bin2, dec1.reconstructedMemory);

      const chkOrig = computeLogicalMemoryChecksum(mem);
      const chk1 = computeLogicalMemoryChecksum(dec1.reconstructedMemory);
      const chk2 = dec2.reconstructedMemory ? computeLogicalMemoryChecksum(dec2.reconstructedMemory) : '';

      passed = dec2.success && chkOrig === chk1 && chk1 === chk2;
      details = passed
        ? `STABLE: Checksum Original (${chkOrig}) === Pass 1 (${chk1}) === Pass 2 (${chk2})`
        : `Instability detected between roundtrips.`;
    }

    results.push({
      testId: 'TEST-12',
      testName: 'Double Roundtrip Verification (Stability)',
      description: 'Executes Original → Encode → Decode → Re-Encode → Re-Decode to guarantee idempotence.',
      passed,
      durationMs: Math.round((performance.now() - start) * 100) / 100,
      details,
      decodeStage: 'COMPLETE',
      checksumMatch: passed,
      exactMatch: passed,
      coverageStatus: '100% Stable Idempotent Pipeline',
    });
  }

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.length - passedCount;

  return {
    totalTests: results.length,
    passedCount,
    failedCount,
    durationMs: Math.round((performance.now() - suiteStartTime) * 100) / 100,
    determinismPassed: passedCount === results.length,
    doubleRoundtripPassed: results.find((r) => r.testId === 'TEST-12')?.passed ?? false,
    corruptionHandlingPassed: results.find((r) => r.testId === 'TEST-11')?.passed ?? false,
    results,
  };
}
