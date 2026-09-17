/**
 * 3D Memory Studio - Funnel 12 Test: TC-F12-15
 * Large Repeated Geometry (High compression & scale)
 */

import { decodeCompact3DV4 } from '../core/decoder';
import { serializeCompact3DV4 } from '../core/serializer';
import {
  F12CompositeDefinition,
  F12CompositeReference,
  F12DictionaryEntry,
} from '../types/records';
import { Funnel12TestResult } from '../types/report';

export function testLargeRepeatedGeometry(): Funnel12TestResult {
  // 1. Level 2 Dict: 4-cell 2x2 square tile in XY plane
  const dictCross: F12DictionaryEntry = {
    dictId: 1,
    ruleType: 0x01,
    relativeOffsets: [
      { dx: 0, dy: 0, dz: 0 },
      { dx: 1, dy: 0, dz: 0 },
      { dx: 0, dy: 1, dz: 0 },
      { dx: 1, dy: 1, dz: 0 },
    ],
    symbol: 'G',
    flags: 0,
  };

  // 2. Level 3 Composite: 2 square tiles stacked in Z (2x2x2 cube, 8 cells)
  const compDef: F12CompositeDefinition = {
    compositeId: 1,
    childCount: 2,
    transformType: 0x01,
    flags: 0,
    children: [
      { childDictId: 1, offset: { dx: 0, dy: 0, dz: 0 }, order: 0, transform: 0x01 },
      { childDictId: 1, offset: { dx: 0, dy: 0, dz: 1 }, order: 1, transform: 0x01 },
    ],
  };

  // 3. Place 8 occurrences across grid without spatial overlap
  const compRefs: F12CompositeReference[] = [];
  const origins = [
    { x: 0, y: 0, z: 0 },
    { x: 3, y: 0, z: 0 },
    { x: 0, y: 3, z: 0 },
    { x: 3, y: 3, z: 0 },
    { x: 0, y: 0, z: 3 },
    { x: 3, y: 0, z: 3 },
    { x: 0, y: 3, z: 3 },
    { x: 3, y: 3, z: 3 },
  ];

  let seq = 0;
  for (let i = 0; i < origins.length; i++) {
    const o = origins[i];
    const cellId = o.x + o.y * 7 + o.z * 49;
    compRefs.push({
      opcode: 0x0C,
      blockId: 0,
      compositeId: 1,
      originCellId: cellId,
      coveredCount: 8,
      startSeqIndex: seq,
      flags: 0,
    });
    seq += 8;
  }

  const totalCells = 8 * 8; // 64 cells

  const artifact = serializeCompact3DV4({
    blockCount: 1,
    totalActiveCells: totalCells,
    totalSequenceSteps: totalCells,
    dictionaryEntries: [dictCross],
    compositeDefinitions: [compDef],
    compositeReferences: compRefs,
    primitiveRecords: [],
    rawCellRecords: [],
  });

  const decodeResult = decodeCompact3DV4(artifact.binaryBuffer);

  // Original uncompressed cost: 64 cells * 7 bytes = 448 bytes
  // Artifact cost: Header (32) + Dict (6+12+1=19) + CompDef (6+16=22) + 8*12 (96) + Checksum (4) = 173 bytes
  const savings = 448 - artifact.byteLength;
  const passed = (
    decodeResult.success &&
    decodeResult.decodedMemory !== null &&
    decodeResult.decodedMemory.totalCellsCount === totalCells &&
    decodeResult.coverageReport.isValid &&
    artifact.byteLength < 200
  );

  return {
    testId: 'TC-F12-15',
    name: 'Large Repeated Geometry',
    passed,
    details: passed
      ? `Successfully compressed 64 geometric cells into ${artifact.byteLength}B artifact (vs 448B original, saved ${savings}B, 2.6x ratio).`
      : `Geometry test failed: decoded cells=${decodeResult.decodedMemory?.totalCellsCount}`,
    artifactBytes: artifact.byteLength,
    savingsBytes: savings,
  };
}
