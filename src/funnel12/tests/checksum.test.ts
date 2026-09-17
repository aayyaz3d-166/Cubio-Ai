/**
 * 3D Memory Studio - Funnel 12 Test: TC-F12-09
 * Checksum Verification
 */

import { calculateCRC32, formatChecksumHex } from '../core/checksum';
import { decodeCompact3DV4 } from '../core/decoder';
import { serializeCompact3DV4 } from '../core/serializer';
import { F12RawCellRecord } from '../types/records';
import { Funnel12TestResult } from '../types/report';

export function testChecksumVerification(): Funnel12TestResult {
  const rawCells: F12RawCellRecord[] = [
    { opcode: 0x00, blockId: 0, cellId: 1, sequenceIndex: 0, state: 1, symbol: 'A' },
  ];

  const artifact = serializeCompact3DV4({
    blockCount: 1,
    totalActiveCells: 1,
    totalSequenceSteps: 1,
    dictionaryEntries: [],
    compositeDefinitions: [],
    compositeReferences: [],
    primitiveRecords: [],
    rawCellRecords: rawCells,
  });

  const decode = decodeCompact3DV4(artifact.binaryBuffer);

  const crcDirect = calculateCRC32(artifact.binaryBuffer, 0, artifact.byteLength - 4);
  const matched = (
    decode.success &&
    decode.checksumValid &&
    decode.calculatedChecksumHex === artifact.checksumHex &&
    crcDirect === artifact.checksum
  );

  return {
    testId: 'TC-F12-09',
    name: 'Checksum Verification',
    passed: matched,
    details: matched
      ? `32-bit CRC32 checksum (${artifact.checksumHex}) verified exactly across encoder, direct calculator, and decoder.`
      : `Checksum verification failed.`,
    artifactBytes: artifact.byteLength,
  };
}
