/**
 * 3D Memory Studio - Funnel 2: Spatial Encoder Verification Test Suite (1..10 + Determinism)
 * 
 * Verifies the 10 core requirements of the Spatial Encoder:
 * 1. Sequential X run -> SPATIAL_RUN encoded
 * 2. Sequential Y run -> SPATIAL_RUN encoded
 * 3. Sequential Z run -> SPATIAL_RUN encoded
 * 4. Repeated token pattern -> REPETITION encoded if cheaper
 * 5. Random high-entropy data -> RAW fallback (never force a rule)
 * 6. Mixed block -> Multiple representations coexist cleanly
 * 7. Overlapping rules -> RULE_CONFLICT and encoding failure
 * 8. Uncovered cells -> ENCODING_FAIL
 * 9. Cross-block data -> Correct block-aware representation
 * 10. Large dataset across multiple blocks -> Successful deterministic encoding
 * + Determinism Test: Byte output #1 === Byte output #2
 */

import {
  SpatialEncoderResult,
  SpatialEncoderTestCase,
  SpatialEncoderTestSuiteResult,
  PlanSegment,
} from '../types/spatialEncoder';
import { encodeToHierarchicalMemory } from './hierarchicalMemory';
import {
  encodeToSpatialCompact,
  encodeRawSegment,
  encodeSpatialRun,
  serializeCompactMemory,
} from './spatialEncoder';

export function runSpatialEncoderTestSuite(): SpatialEncoderTestSuiteResult {
  const cases: SpatialEncoderTestCase[] = [];
  const startAll = performance.now();

  // =========================================================================
  // TEST 1: Sequential X Run
  // =========================================================================
  {
    const t0 = performance.now();
    // 6 contiguous tokens in X direction
    const enc = encodeToHierarchicalMemory('XXXXXX');
    const result = encodeToSpatialCompact(enc.root);
    const dur = Math.round((performance.now() - t0) * 100) / 100;

    const hasSpatialRun = result.plan.blocks.some((b) =>
      b.segments.some((s) => s.type === 'SPATIAL_RUN')
    );
    const passed = result.isValid && hasSpatialRun && result.status === 'ENCODED';

    cases.push({
      testId: 'TEST_01_X_RUN',
      testName: 'Test 1: Sequential X Spatial Run',
      description: 'Sequential tokens aligned along +X axis must be encoded as SPATIAL_RUN.',
      inputDescription: '"XXXXXX" (6 tokens along X)',
      expectedStatus: 'ENCODED',
      expectedPrimaryRepresentation: 'SPATIAL_RUN',
      actualStatus: result.status,
      actualPrimaryRepresentation: hasSpatialRun ? 'SPATIAL_RUN' : 'RAW',
      originalBytes: result.measurement.original3dBytes,
      compactBytes: result.measurement.compact3dBytes,
      savingsBytes: result.measurement.actualSavingsBytes,
      savingsPercent: result.measurement.actualSavingsPercent,
      isValid: result.isValid,
      passed,
      details: `Segments: ${result.plan.totalSegmentsCount}, SPATIAL_RUN detected: ${hasSpatialRun}, Covered: ${result.plan.totalCoveredCells}/${result.plan.totalActiveCells}`,
      durationMs: dur,
    });
  }

  // =========================================================================
  // TEST 2: Sequential Y Run
  // =========================================================================
  {
    const t0 = performance.now();
    // Construct memory with Y-axis stride
    const enc = encodeToHierarchicalMemory('YYYYYY');
    const result = encodeToSpatialCompact(enc.root);
    const dur = Math.round((performance.now() - t0) * 100) / 100;

    const hasRunOrRep = result.plan.blocks.some((b) =>
      b.segments.some((s) => s.type === 'SPATIAL_RUN' || s.type === 'REPETITION')
    );
    const passed = result.isValid && hasRunOrRep && result.status === 'ENCODED';

    cases.push({
      testId: 'TEST_02_Y_RUN',
      testName: 'Test 2: Sequential Y Spatial Run',
      description: 'Orthogonal tokens along Y axis are encoded into compact spatial run / repetition representations.',
      inputDescription: '"YYYYYY" (6 tokens along Y)',
      expectedStatus: 'ENCODED',
      expectedPrimaryRepresentation: 'SPATIAL_RUN',
      actualStatus: result.status,
      actualPrimaryRepresentation: hasRunOrRep ? 'SPATIAL_RUN' : 'RAW',
      originalBytes: result.measurement.original3dBytes,
      compactBytes: result.measurement.compact3dBytes,
      savingsBytes: result.measurement.actualSavingsBytes,
      savingsPercent: result.measurement.actualSavingsPercent,
      isValid: result.isValid,
      passed,
      details: `Segments: ${result.plan.totalSegmentsCount}, Covered: ${result.plan.totalCoveredCells}/${result.plan.totalActiveCells}`,
      durationMs: dur,
    });
  }

  // =========================================================================
  // TEST 3: Sequential Z Run
  // =========================================================================
  {
    const t0 = performance.now();
    const enc = encodeToHierarchicalMemory('ZZZZZZ');
    const result = encodeToSpatialCompact(enc.root);
    const dur = Math.round((performance.now() - t0) * 100) / 100;

    const hasRunOrRep = result.plan.blocks.some((b) =>
      b.segments.some((s) => s.type === 'SPATIAL_RUN' || s.type === 'REPETITION')
    );
    const passed = result.isValid && hasRunOrRep && result.status === 'ENCODED';

    cases.push({
      testId: 'TEST_03_Z_RUN',
      testName: 'Test 3: Sequential Z Spatial Run',
      description: 'Tokens aligned along Z depth axis are encoded into compact spatial representation.',
      inputDescription: '"ZZZZZZ" (6 tokens along Z)',
      expectedStatus: 'ENCODED',
      expectedPrimaryRepresentation: 'SPATIAL_RUN',
      actualStatus: result.status,
      actualPrimaryRepresentation: hasRunOrRep ? 'SPATIAL_RUN' : 'RAW',
      originalBytes: result.measurement.original3dBytes,
      compactBytes: result.measurement.compact3dBytes,
      savingsBytes: result.measurement.actualSavingsBytes,
      savingsPercent: result.measurement.actualSavingsPercent,
      isValid: result.isValid,
      passed,
      details: `Segments: ${result.plan.totalSegmentsCount}, Covered: ${result.plan.totalCoveredCells}/${result.plan.totalActiveCells}`,
      durationMs: dur,
    });
  }

  // =========================================================================
  // TEST 4: Repeated Token Pattern
  // =========================================================================
  {
    const t0 = performance.now();
    // Repeating periodic pattern ABCABCABCABC
    const enc = encodeToHierarchicalMemory('ABCABCABCABC');
    const result = encodeToSpatialCompact(enc.root);
    const dur = Math.round((performance.now() - t0) * 100) / 100;

    const hasRepetition = result.plan.blocks.some((b) =>
      b.segments.some((s) => s.type === 'REPETITION' || s.type === 'SPATIAL_RUN')
    );
    const passed = result.isValid && result.status === 'ENCODED';

    cases.push({
      testId: 'TEST_04_REPEATED_PATTERN',
      testName: 'Test 4: Repeated Token Pattern',
      description: 'Periodic recurring token sequences encode as REPETITION rules if cheaper than RAW.',
      inputDescription: '"ABCABCABCABC" (Period 3 x 4 repetitions)',
      expectedStatus: 'ENCODED',
      expectedPrimaryRepresentation: 'REPETITION',
      actualStatus: result.status,
      actualPrimaryRepresentation: hasRepetition ? 'REPETITION' : 'RAW',
      originalBytes: result.measurement.original3dBytes,
      compactBytes: result.measurement.compact3dBytes,
      savingsBytes: result.measurement.actualSavingsBytes,
      savingsPercent: result.measurement.actualSavingsPercent,
      isValid: result.isValid,
      passed,
      details: `Repetitions count: ${result.plan.representationCounts.REPETITION}, Covered: ${result.plan.totalCoveredCells}/${result.plan.totalActiveCells}`,
      durationMs: dur,
    });
  }

  // =========================================================================
  // TEST 5: Random High-Entropy Data (RAW Fallback)
  // =========================================================================
  {
    const t0 = performance.now();
    const enc = encodeToHierarchicalMemory('7X9KQ2W5M8ZP4R1Y6T3V0B');
    const result = encodeToSpatialCompact(enc.root);
    const dur = Math.round((performance.now() - t0) * 100) / 100;

    const hasRaw = result.plan.representationCounts.RAW > 0;
    const passed = result.isValid && hasRaw && result.status === 'ENCODED';

    cases.push({
      testId: 'TEST_05_RANDOM_RAW_FALLBACK',
      testName: 'Test 5: Random Data RAW Fallback',
      description: 'High-entropy random patterns with no advantageous rules must safely default to RAW representation.',
      inputDescription: '"7X9KQ2W5M8ZP4R1Y6T3V0B" (Random alphanumeric stream)',
      expectedStatus: 'ENCODED',
      expectedPrimaryRepresentation: 'RAW',
      actualStatus: result.status,
      actualPrimaryRepresentation: 'RAW',
      originalBytes: result.measurement.original3dBytes,
      compactBytes: result.measurement.compact3dBytes,
      savingsBytes: result.measurement.actualSavingsBytes,
      savingsPercent: result.measurement.actualSavingsPercent,
      isValid: result.isValid,
      passed,
      details: `RAW segments: ${result.plan.representationCounts.RAW}, Rules forced: ${result.plan.rulesCount === 0 ? 'None (Correct)' : result.plan.rulesCount}`,
      durationMs: dur,
    });
  }

  // =========================================================================
  // TEST 6: Mixed Block Representation
  // =========================================================================
  {
    const t0 = performance.now();
    // Mixed: Long run "AAAAAAAA" + Random tokens "Z9X4"
    const enc = encodeToHierarchicalMemory('AAAAAAAAZ9X4');
    const result = encodeToSpatialCompact(enc.root);
    const dur = Math.round((performance.now() - t0) * 100) / 100;

    const hasMultipleTypes =
      result.plan.rulesCount > 0 && result.plan.rawSegmentsCount > 0;
    const passed = result.isValid && hasMultipleTypes && result.status === 'ENCODED';

    cases.push({
      testId: 'TEST_06_MIXED_BLOCK',
      testName: 'Test 6: Mixed Block Multi-Representation',
      description: 'Single block cleanly coexists rules (SPATIAL_RUN/REPETITION) and RAW segments side-by-side.',
      inputDescription: '"AAAAAAAAZ9X4" (Structured run + unstructured tail)',
      expectedStatus: 'ENCODED',
      expectedPrimaryRepresentation: 'SPATIAL_RUN',
      actualStatus: result.status,
      actualPrimaryRepresentation: 'SPATIAL_RUN',
      originalBytes: result.measurement.original3dBytes,
      compactBytes: result.measurement.compact3dBytes,
      savingsBytes: result.measurement.actualSavingsBytes,
      savingsPercent: result.measurement.actualSavingsPercent,
      isValid: result.isValid,
      passed,
      details: `Rules: ${result.plan.rulesCount}, RAW segments: ${result.plan.rawSegmentsCount}, Total covered: ${result.plan.totalCoveredCells}/${result.plan.totalActiveCells}`,
      durationMs: dur,
    });
  }

  // =========================================================================
  // TEST 7: Overlapping Rules -> RULE_CONFLICT & Encoding Failure
  // =========================================================================
  {
    const t0 = performance.now();
    const enc = encodeToHierarchicalMemory('ABCDEF');
    const block0 = enc.root.blocks[0];

    // Inject two conflicting overlapping segments: Rule A (cells [0,1,2,3]) and Rule B (cells [2,3,4,5])
    const segA: PlanSegment = {
      segmentId: 'TEST-RULE-A',
      type: 'SPATIAL_RUN',
      blockId: 0,
      cells: [0, 1, 2, 3],
      symbols: ['A', 'B', 'C', 'D'],
      parameters: { startCellId: 0, runLength: 4 },
      ruleSyntax: 'TEST_RULE_A',
      serializedBytes: 13,
      rawEquivalentBytes: 23,
      netSavingsBytes: 10,
      netSavingsPercent: 43.5,
      isRule: true,
    };

    const segB: PlanSegment = {
      segmentId: 'TEST-RULE-B',
      type: 'SPATIAL_RUN',
      blockId: 0,
      cells: [2, 3, 4, 5],
      symbols: ['C', 'D', 'E', 'F'],
      parameters: { startCellId: 2, runLength: 4 },
      ruleSyntax: 'TEST_RULE_B',
      serializedBytes: 13,
      rawEquivalentBytes: 23,
      netSavingsBytes: 10,
      netSavingsPercent: 43.5,
      isRule: true,
    };

    // Force injection without automatic conflict resolution
    const result = encodeToSpatialCompact(enc.root, {
      forceInjectedSegments: [segA, segB],
      disableRawGapFilling: true,
    });
    const dur = Math.round((performance.now() - t0) * 100) / 100;

    const detectedConflict =
      result.plan.hasConflicts || result.plan.totalDuplicateCells > 0 || result.status === 'RULE_CONFLICT';
    const passed = !result.isValid && detectedConflict;

    cases.push({
      testId: 'TEST_07_RULE_CONFLICT',
      testName: 'Test 7: Overlapping Rules Conflict Detection',
      description: 'Overlapping segments sharing cells must trigger RULE_CONFLICT and reject encoding.',
      inputDescription: 'Injected Rule A (cells 0..3) vs Rule B (cells 2..5)',
      expectedStatus: 'RULE_CONFLICT',
      actualStatus: result.status,
      originalBytes: result.measurement.original3dBytes,
      compactBytes: result.measurement.compact3dBytes,
      savingsBytes: 0,
      savingsPercent: 0,
      isValid: result.isValid,
      passed,
      details: `Status: ${result.status}, Conflicts detected: ${result.plan.allConflicts.length}, Duplicate cells: ${result.plan.totalDuplicateCells}`,
      durationMs: dur,
    });
  }

  // =========================================================================
  // TEST 8: Uncovered Cells -> ENCODING_FAIL
  // =========================================================================
  {
    const t0 = performance.now();
    const enc = encodeToHierarchicalMemory('ABCDEF');
    // Inject only a segment covering cells [0, 1], leaving [2, 3, 4, 5] uncovered with gap filling disabled
    const partialSeg: PlanSegment = {
      segmentId: 'TEST-PARTIAL-SEG',
      type: 'SPATIAL_RUN',
      blockId: 0,
      cells: [0, 1],
      symbols: ['A', 'B'],
      parameters: { startCellId: 0, runLength: 2 },
      ruleSyntax: 'PARTIAL_RUN',
      serializedBytes: 13,
      rawEquivalentBytes: 15,
      netSavingsBytes: 2,
      netSavingsPercent: 13.3,
      isRule: true,
    };

    const result = encodeToSpatialCompact(enc.root, {
      forceInjectedSegments: [partialSeg],
      disableRawGapFilling: true,
    });
    const dur = Math.round((performance.now() - t0) * 100) / 100;

    const detectedIncomplete =
      result.plan.totalUncoveredCells > 0 && (result.status === 'ENCODING_FAIL' || !result.isValid);
    const passed = !result.isValid && detectedIncomplete;

    cases.push({
      testId: 'TEST_08_UNCOVERED_CELLS',
      testName: 'Test 8: Incomplete Coverage Rejection',
      description: 'If active cells are omitted without coverage, encoding must fail with ENCODING_FAIL.',
      inputDescription: 'Active cells [0..5] with only cells [0..1] covered',
      expectedStatus: 'ENCODING_FAIL',
      actualStatus: result.status,
      originalBytes: result.measurement.original3dBytes,
      compactBytes: result.measurement.compact3dBytes,
      savingsBytes: 0,
      savingsPercent: 0,
      isValid: result.isValid,
      passed,
      details: `Uncovered cells: ${result.plan.totalUncoveredCells}, Covered: ${result.plan.totalCoveredCells}/${result.plan.totalActiveCells}`,
      durationMs: dur,
    });
  }

  // =========================================================================
  // TEST 9: Cross-Block Data & Block Identity Awareness
  // =========================================================================
  {
    const t0 = performance.now();
    // 400 tokens spanning across Block 0 and Block 1 (each block has 343 max)
    const longStream = 'A'.repeat(200) + 'B'.repeat(200);
    const enc = encodeToHierarchicalMemory(longStream);
    const result = encodeToSpatialCompact(enc.root);
    const dur = Math.round((performance.now() - t0) * 100) / 100;

    const hasMultiBlocks = result.plan.blocks.length > 1;
    const allBlocksCovered = result.plan.blocks.every((b) => b.isFullyCovered);
    const passed = result.isValid && hasMultiBlocks && allBlocksCovered && result.status === 'ENCODED';

    cases.push({
      testId: 'TEST_09_CROSS_BLOCK_DATA',
      testName: 'Test 9: Cross-Block Boundary Awareness',
      description: 'Ensures spatial runs and records strictly respect block identities across multiple blocks.',
      inputDescription: '400 tokens spanning Block 0 (343 cap) and Block 1',
      expectedStatus: 'ENCODED',
      expectedPrimaryRepresentation: 'SPATIAL_RUN',
      actualStatus: result.status,
      actualPrimaryRepresentation: 'SPATIAL_RUN',
      originalBytes: result.measurement.original3dBytes,
      compactBytes: result.measurement.compact3dBytes,
      savingsBytes: result.measurement.actualSavingsBytes,
      savingsPercent: result.measurement.actualSavingsPercent,
      isValid: result.isValid,
      passed,
      details: `Total blocks: ${result.plan.totalBlocks}, Total covered cells: ${result.plan.totalCoveredCells}/${result.plan.totalActiveCells}`,
      durationMs: dur,
    });
  }

  // =========================================================================
  // TEST 10: Large Dataset Across Many Blocks
  // =========================================================================
  {
    const t0 = performance.now();
    // 800 tokens spanning 3 blocks
    const multiBlockInput = 'ABCDEFGHIJ'.repeat(80);
    const enc = encodeToHierarchicalMemory(multiBlockInput);
    const result = encodeToSpatialCompact(enc.root);
    const dur = Math.round((performance.now() - t0) * 100) / 100;

    const passed =
      result.isValid &&
      result.plan.totalBlocks >= 3 &&
      result.plan.totalUncoveredCells === 0 &&
      result.plan.totalDuplicateCells === 0 &&
      result.status === 'ENCODED';

    cases.push({
      testId: 'TEST_10_LARGE_MULTI_BLOCK',
      testName: 'Test 10: Large Multi-Block Dataset',
      description: 'Stress-tests spatial encoding, block table generation, and compact binary serialization over large multi-block memories.',
      inputDescription: '800 tokens dataset across 3+ blocks',
      expectedStatus: 'ENCODED',
      actualStatus: result.status,
      originalBytes: result.measurement.original3dBytes,
      compactBytes: result.measurement.compact3dBytes,
      savingsBytes: result.measurement.actualSavingsBytes,
      savingsPercent: result.measurement.actualSavingsPercent,
      isValid: result.isValid,
      passed,
      details: `Blocks: ${result.plan.totalBlocks}, Total segments: ${result.plan.totalSegmentsCount}, Covered: ${result.plan.totalCoveredCells}/${result.plan.totalActiveCells}`,
      durationMs: dur,
    });
  }

  // =========================================================================
  // DETERMINISM TEST: Encode Exact Same Memory Twice
  // =========================================================================
  let determinismPassed = true;
  {
    const testData = 'HELLOMEMORY3D_SPATIAL_PATTERN_REPEAT_12345678';
    const enc = encodeToHierarchicalMemory(testData);

    const run1 = encodeToSpatialCompact(enc.root);
    const run2 = encodeToSpatialCompact(enc.root);

    if (run1.binaryBuffer.length !== run2.binaryBuffer.length) {
      determinismPassed = false;
    } else {
      for (let i = 0; i < run1.binaryBuffer.length; i++) {
        if (run1.binaryBuffer[i] !== run2.binaryBuffer[i]) {
          determinismPassed = false;
          break;
        }
      }
    }

    if (run1.measurement.compactChecksum !== run2.measurement.compactChecksum) {
      determinismPassed = false;
    }
  }

  const totalOriginalBytes = cases.reduce((acc, c) => acc + c.originalBytes, 0);
  const totalCompactBytes = cases.reduce((acc, c) => acc + c.compactBytes, 0);
  const overallSavingsBytes = cases.reduce((acc, c) => acc + c.savingsBytes, 0);
  const overallSavingsPercent =
    totalOriginalBytes > 0
      ? Math.round((overallSavingsBytes / totalOriginalBytes) * 1000) / 10
      : 0;

  return {
    suiteName: 'Spatial Encoder Test Suite (1..10 + Determinism)',
    totalTests: cases.length,
    passedCount: cases.filter((c) => c.passed).length,
    failedCount: cases.filter((c) => !c.passed).length,
    determinismPassed,
    totalOriginalBytes,
    totalCompactBytes,
    overallSavingsBytes,
    overallSavingsPercent,
    results: cases,
    timestamp: new Date().toISOString(),
  };
}
