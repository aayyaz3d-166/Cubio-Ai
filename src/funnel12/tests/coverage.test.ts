/**
 * 3D Memory Studio - Funnel 12 Test: TC-F12-08
 * Coverage Exactness & Overlap Detection
 */

import { decodeCompact3DV4 } from '../core/decoder';
import { serializeCompact3DV4 } from '../core/serializer';
import { F12RawCellRecord } from '../types/records';
import { Funnel12TestResult } from '../types/report';

export function testCoverageExactness(): Funnel12TestResult {
  // Case A: Exact Valid Coverage (5 cells)
  const validCells: F12RawCellRecord[] = [
    { opcode: 0x00, blockId: 0, cellId: 10, sequenceIndex: 0, state: 1, symbol: 'A' },
    { opcode: 0x00, blockId: 0, cellId: 11, sequenceIndex: 1, state: 1, symbol: 'B' },
    { opcode: 0x00, blockId: 0, cellId: 12, sequenceIndex: 2, state: 1, symbol: 'C' },
    { opcode: 0x00, blockId: 0, cellId: 13, sequenceIndex: 3, state: 1, symbol: 'D' },
    { opcode: 0x00, blockId: 0, cellId: 14, sequenceIndex: 4, state: 1, symbol: 'E' },
  ];

  const validArtifact = serializeCompact3DV4({
    blockCount: 1,
    totalActiveCells: 5,
    totalSequenceSteps: 5,
    dictionaryEntries: [],
    compositeDefinitions: [],
    compositeReferences: [],
    primitiveRecords: [],
    rawCellRecords: validCells,
  });

  const validDecode = decodeCompact3DV4(validArtifact.binaryBuffer);

  // Case B: Duplicate overlap cell (Cell #10 duplicated)
  const duplicateCells: F12RawCellRecord[] = [
    { opcode: 0x00, blockId: 0, cellId: 10, sequenceIndex: 0, state: 1, symbol: 'A' },
    { opcode: 0x00, blockId: 0, cellId: 10, sequenceIndex: 1, state: 1, symbol: 'A' }, // Duplicate!
  ];

  const duplicateArtifact = serializeCompact3DV4({
    blockCount: 1,
    totalActiveCells: 2,
    totalSequenceSteps: 2,
    dictionaryEntries: [],
    compositeDefinitions: [],
    compositeReferences: [],
    primitiveRecords: [],
    rawCellRecords: duplicateCells,
  });

  const duplicateDecode = decodeCompact3DV4(duplicateArtifact.binaryBuffer);

  const passed = (
    validDecode.success &&
    validDecode.coverageReport.isValid &&
    !duplicateDecode.success &&
    !duplicateDecode.coverageReport.isValid &&
    duplicateDecode.coverageReport.duplicateCellsCount > 0
  );

  return {
    testId: 'TC-F12-08',
    name: 'Coverage Exactness',
    passed,
    details: passed
      ? `Exact coverage accepted cleanly; duplicate overlap correctly caught and rejected.`
      : `Coverage test failed: validDecode.success=${validDecode.success}, duplicateDecode.success=${duplicateDecode.success}`,
    artifactBytes: validArtifact.byteLength,
  };
}
