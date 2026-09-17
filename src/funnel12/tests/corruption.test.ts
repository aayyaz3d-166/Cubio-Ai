/**
 * 3D Memory Studio - Funnel 12 Test: TC-F12-10
 * Corrupted Artifact Rejection
 */

import { decodeCompact3DV4 } from '../core/decoder';
import { serializeCompact3DV4 } from '../core/serializer';
import { F12RawCellRecord } from '../types/records';
import { Funnel12TestResult } from '../types/report';

export function testCorruptedArtifactRejection(): Funnel12TestResult {
  const rawCells: F12RawCellRecord[] = [
    { opcode: 0x00, blockId: 0, cellId: 1, sequenceIndex: 0, state: 1, symbol: 'A' },
    { opcode: 0x00, blockId: 0, cellId: 2, sequenceIndex: 1, state: 1, symbol: 'B' },
  ];

  const validArtifact = serializeCompact3DV4({
    blockCount: 1,
    totalActiveCells: 2,
    totalSequenceSteps: 2,
    dictionaryEntries: [],
    compositeDefinitions: [],
    compositeReferences: [],
    primitiveRecords: [],
    rawCellRecords: rawCells,
  });

  // Test 1: Single byte mutation (payload corruption)
  const mutatedBuffer = new Uint8Array(validArtifact.binaryBuffer);
  mutatedBuffer[10] ^= 0xff; // flip bits in header
  const mutatedDecode = decodeCompact3DV4(mutatedBuffer);

  // Test 2: Truncated buffer
  const truncatedBuffer = validArtifact.binaryBuffer.slice(0, 15);
  const truncatedDecode = decodeCompact3DV4(truncatedBuffer);

  // Test 3: Bad Magic
  const badMagicBuffer = new Uint8Array(validArtifact.binaryBuffer);
  badMagicBuffer[0] = 0x00;
  const badMagicDecode = decodeCompact3DV4(badMagicBuffer);

  const passed = (
    !mutatedDecode.success &&
    !truncatedDecode.success &&
    !badMagicDecode.success &&
    mutatedDecode.errors.length > 0 &&
    truncatedDecode.errors.length > 0 &&
    badMagicDecode.errors.length > 0
  );

  return {
    testId: 'TC-F12-10',
    name: 'Corrupted Artifact Rejection',
    passed,
    details: passed
      ? `Successfully rejected mutated buffer (CRC fail), truncated buffer (underflow), and bad magic headers.`
      : `Rejection test failed: mutatedDecode.success=${mutatedDecode.success}, truncatedDecode.success=${truncatedDecode.success}`,
    artifactBytes: validArtifact.byteLength,
  };
}
