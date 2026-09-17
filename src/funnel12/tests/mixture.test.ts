/**
 * 3D Memory Studio - Funnel 12 Test: TC-F12-07
 * Composite + Primitive + RAW Mixture
 */

import { decodeCompact3DV4 } from '../core/decoder';
import { serializeCompact3DV4 } from '../core/serializer';
import {
  F12CompositeDefinition,
  F12CompositeReference,
  F12DictionaryEntry,
  F12PrimitiveRecord,
  F12RawCellRecord,
} from '../types/records';
import { Funnel12TestResult } from '../types/report';

export function testCompositePrimitiveRawMixture(): Funnel12TestResult {
  // 1. Level 2 Dict + Level 3 Composite (covers 4 cells: (0,0,0), (1,0,0), (0,1,0), (0,2,0))
  const dict1: F12DictionaryEntry = {
    dictId: 1,
    ruleType: 0x01,
    relativeOffsets: [{ dx: 0, dy: 0, dz: 0 }, { dx: 1, dy: 0, dz: 0 }],
    symbol: 'M',
    flags: 0,
  };
  const dict2: F12DictionaryEntry = {
    dictId: 2,
    ruleType: 0x01,
    relativeOffsets: [{ dx: 0, dy: 0, dz: 0 }, { dx: 0, dy: 1, dz: 0 }],
    symbol: 'N',
    flags: 0,
  };
  const compDef: F12CompositeDefinition = {
    compositeId: 1,
    childCount: 2,
    transformType: 0x01,
    flags: 0,
    children: [
      { childDictId: 1, offset: { dx: 0, dy: 0, dz: 0 }, order: 0, transform: 0x01 },
      { childDictId: 2, offset: { dx: 0, dy: 1, dz: 0 }, order: 1, transform: 0x01 },
    ],
  };
  const compRef: F12CompositeReference = {
    opcode: 0x0C,
    blockId: 0,
    compositeId: 1,
    originCellId: 0,
    coveredCount: 4,
    startSeqIndex: 0,
    flags: 0,
  };

  // 2. Level 1 Primitive Run (covers 2 cells: (4,4,0), (5,4,0) -> cellId: 32, 33)
  const prim: F12PrimitiveRecord = {
    opcode: 0x01,
    blockId: 0,
    originCellId: 32,
    cellCount: 2,
    startSeqIndex: 4,
    symbol: 'P',
    relativeOffsets: [{ dx: 0, dy: 0, dz: 0 }, { dx: 1, dy: 0, dz: 0 }],
  };

  // 3. Level 0 Raw Cell (covers 1 cell: (6,6,6) -> cellId: 342)
  const raw: F12RawCellRecord = {
    opcode: 0x00,
    blockId: 0,
    cellId: 342,
    sequenceIndex: 6,
    state: 1,
    symbol: 'R',
  };

  const artifact = serializeCompact3DV4({
    blockCount: 1,
    totalActiveCells: 7,
    totalSequenceSteps: 7,
    dictionaryEntries: [dict1, dict2],
    compositeDefinitions: [compDef],
    compositeReferences: [compRef],
    primitiveRecords: [prim],
    rawCellRecords: [raw],
  });

  const decodeResult = decodeCompact3DV4(artifact.binaryBuffer);

  const passed = (
    decodeResult.success &&
    decodeResult.decodedMemory !== null &&
    decodeResult.decodedMemory.totalCellsCount === 7 &&
    decodeResult.counts.compositeRefs === 1 &&
    decodeResult.counts.primitiveRecords === 1 &&
    decodeResult.counts.rawCells === 1 &&
    decodeResult.coverageReport.isValid
  );

  return {
    testId: 'TC-F12-07',
    name: 'Composite + Primitive + RAW Mixture',
    passed,
    details: passed
      ? `Heterogeneous hierarchy (Level 3 Composite + Level 1 Primitive + Level 0 RAW) reconstructed seamlessly.`
      : `Heterogeneous decoding failed: ${decodeResult.errors.join(', ')}`,
    artifactBytes: artifact.byteLength,
  };
}
