/**
 * 3D Memory Studio - Funnel 12 Test: TC-F12-06
 * Composite Translation Reconstruction
 */

import { decodeCompact3DV4 } from '../core/decoder';
import { encodeHierarchyCompact3DV4 } from '../core/encoder';
import { serializeCompact3DV4 } from '../core/serializer';
import { F12CompositeDefinition, F12CompositeReference, F12DictionaryEntry } from '../types/records';
import { Funnel12TestResult } from '../types/report';

export function testCompositeTranslationReconstruction(): Funnel12TestResult {
  // Define Level 2 Dictionary
  const dict1: F12DictionaryEntry = {
    dictId: 10,
    ruleType: 0x01,
    relativeOffsets: [{ dx: 0, dy: 0, dz: 0 }, { dx: 1, dy: 0, dz: 0 }],
    symbol: 'T',
    flags: 0,
  };
  const dict2: F12DictionaryEntry = {
    dictId: 11,
    ruleType: 0x01,
    relativeOffsets: [{ dx: 0, dy: 0, dz: 0 }, { dx: 0, dy: 1, dz: 0 }],
    symbol: 'L',
    flags: 0,
  };

  // Define Level 3 Composite (Child 1 at [0,0,0], Child 2 at [0,0,1])
  const compDef: F12CompositeDefinition = {
    compositeId: 1,
    childCount: 2,
    transformType: 0x01, // TRANSLATION
    flags: 0,
    children: [
      { childDictId: 10, offset: { dx: 0, dy: 0, dz: 0 }, order: 0, transform: 0x01 },
      { childDictId: 11, offset: { dx: 0, dy: 0, dz: 1 }, order: 1, transform: 0x01 },
    ],
  };

  // Reference at origin cell (1, 1, 1) -> Cell ID = 1 + 7 + 49 = 57
  const compRef1: F12CompositeReference = {
    opcode: 0x0C,
    blockId: 0,
    compositeId: 1,
    originCellId: 57, // (1, 1, 1)
    coveredCount: 4,
    startSeqIndex: 0,
    flags: 0,
  };

  // Reference translated to (3, 3, 2) -> Cell ID = 3 + 21 + 98 = 122
  const compRef2: F12CompositeReference = {
    opcode: 0x0C,
    blockId: 0,
    compositeId: 1,
    originCellId: 122, // (3, 3, 2)
    coveredCount: 4,
    startSeqIndex: 4,
    flags: 0,
  };

  const artifact = serializeCompact3DV4({
    blockCount: 1,
    totalActiveCells: 8,
    totalSequenceSteps: 8,
    dictionaryEntries: [dict1, dict2],
    compositeDefinitions: [compDef],
    compositeReferences: [compRef1, compRef2],
    primitiveRecords: [],
    rawCellRecords: [],
  });

  const decodeResult = decodeCompact3DV4(artifact.binaryBuffer);

  const passed = (
    decodeResult.success &&
    decodeResult.decodedMemory !== null &&
    decodeResult.decodedMemory.totalCellsCount === 8 &&
    decodeResult.coverageReport.isValid
  );

  return {
    testId: 'TC-F12-06',
    name: 'Composite Translation Reconstruction',
    passed,
    details: passed
      ? `Successfully decoded Level 3 composite references with 3D translation vectors across 8 spatial cells.`
      : `Translation reconstruction failed: ${decodeResult.errors.join(', ')}`,
    artifactBytes: artifact.byteLength,
  };
}
