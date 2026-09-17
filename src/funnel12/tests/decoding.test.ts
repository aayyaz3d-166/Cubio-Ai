/**
 * 3D Memory Studio - Funnel 12 Test: TC-F12-02
 * Independent Decoding (Stateless buffer decoding)
 */

import { decodeCompact3DV4 } from '../core/decoder';
import { encodeHierarchyCompact3DV4 } from '../core/encoder';
import { F12DictionaryEntry, F12RawCellRecord } from '../types/records';
import { Funnel12TestResult } from '../types/report';

export function testIndependentDecoding(): Funnel12TestResult {
  const dictEntries: F12DictionaryEntry[] = [
    {
      dictId: 1,
      ruleType: 0x01,
      relativeOffsets: [{ dx: 0, dy: 0, dz: 0 }, { dx: 0, dy: 1, dz: 0 }],
      symbol: 'X',
      flags: 0,
    },
  ];

  const rawCells: F12RawCellRecord[] = [
    { opcode: 0x00, blockId: 0, cellId: 50, sequenceIndex: 0, state: 1, symbol: 'Y' },
    { opcode: 0x00, blockId: 0, cellId: 51, sequenceIndex: 1, state: 1, symbol: 'Z' },
  ];

  const artifact = encodeHierarchyCompact3DV4({
    memory: [],
    dictionary: dictEntries,
    rawCellRecords: rawCells,
  });

  // Decode from raw bytes ONLY
  const rawBytes = new Uint8Array(artifact.binaryBuffer);
  const decodeResult = decodeCompact3DV4(rawBytes);

  const passed = (
    decodeResult.success &&
    decodeResult.checksumValid &&
    decodeResult.decodedMemory !== null &&
    decodeResult.decodedMemory.totalCellsCount === 2 &&
    decodeResult.decodedMemory.sequence.length === 2 &&
    decodeResult.errors.length === 0
  );

  return {
    testId: 'TC-F12-02',
    name: 'Independent Decoding',
    passed,
    details: passed
      ? `Independent decoder reconstructed ${decodeResult.decodedMemory?.totalCellsCount} cells and checked CRC32 cleanly.`
      : `Decoding failed: errors=${decodeResult.errors.join(', ')}.`,
    artifactBytes: artifact.byteLength,
  };
}
