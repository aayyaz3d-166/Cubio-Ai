/**
 * 3D Memory Studio - Funnel 12 Test: TC-F12-12
 * Input-Order Independence
 */

import { serializeCompact3DV4 } from '../core/serializer';
import { F12DictionaryEntry, F12RawCellRecord } from '../types/records';
import { Funnel12TestResult } from '../types/report';

export function testInputOrderIndependence(): Funnel12TestResult {
  const dict1: F12DictionaryEntry = {
    dictId: 1,
    ruleType: 0x01,
    relativeOffsets: [{ dx: 0, dy: 0, dz: 0 }],
    symbol: 'A',
    flags: 0,
  };
  const dict2: F12DictionaryEntry = {
    dictId: 2,
    ruleType: 0x01,
    relativeOffsets: [{ dx: 0, dy: 0, dz: 0 }],
    symbol: 'B',
    flags: 0,
  };

  const raw1: F12RawCellRecord = { opcode: 0x00, blockId: 0, cellId: 10, sequenceIndex: 0, state: 1, symbol: 'A' };
  const raw2: F12RawCellRecord = { opcode: 0x00, blockId: 0, cellId: 20, sequenceIndex: 1, state: 1, symbol: 'B' };

  // Order A: dict1, dict2; raw1, raw2
  const artifactA = serializeCompact3DV4({
    blockCount: 1,
    totalActiveCells: 2,
    totalSequenceSteps: 2,
    dictionaryEntries: [dict1, dict2],
    compositeDefinitions: [],
    compositeReferences: [],
    primitiveRecords: [],
    rawCellRecords: [raw1, raw2],
  });

  // Order B (Reversed): dict2, dict1; raw2, raw1
  const artifactB = serializeCompact3DV4({
    blockCount: 1,
    totalActiveCells: 2,
    totalSequenceSteps: 2,
    dictionaryEntries: [dict2, dict1],
    compositeDefinitions: [],
    compositeReferences: [],
    primitiveRecords: [],
    rawCellRecords: [raw2, raw1],
  });

  let identical = artifactA.checksum === artifactB.checksum && artifactA.byteLength === artifactB.byteLength;
  if (identical) {
    for (let i = 0; i < artifactA.byteLength; i++) {
      if (artifactA.binaryBuffer[i] !== artifactB.binaryBuffer[i]) {
        identical = false;
        break;
      }
    }
  }

  return {
    testId: 'TC-F12-12',
    name: 'Input-Order Independence',
    passed: identical,
    details: identical
      ? `Canonical sorting guaranteed identical binary artifact (${artifactA.checksumHex}) regardless of input table ordering.`
      : `Order independence failed: Checksums ${artifactA.checksumHex} vs ${artifactB.checksumHex}`,
    artifactBytes: artifactA.byteLength,
  };
}
