/**
 * 3D Memory Studio - Funnel 12 Test: TC-F12-11
 * 100x Deterministic Encoding Verification
 */

import { encodeHierarchyCompact3DV4 } from '../core/encoder';
import { serializeCompact3DV4 } from '../core/serializer';
import {
  F12CompositeDefinition,
  F12CompositeReference,
  F12DictionaryEntry,
  F12RawCellRecord,
} from '../types/records';
import { Funnel12TestResult } from '../types/report';

export function testDeterministicEncoding100x(): Funnel12TestResult {
  const dict1: F12DictionaryEntry = {
    dictId: 5,
    ruleType: 0x01,
    relativeOffsets: [{ dx: 0, dy: 0, dz: 0 }, { dx: 1, dy: 0, dz: 0 }],
    symbol: 'D',
    flags: 0,
  };

  const compDef: F12CompositeDefinition = {
    compositeId: 2,
    childCount: 1,
    transformType: 0x01,
    flags: 0,
    children: [
      { childDictId: 5, offset: { dx: 0, dy: 0, dz: 0 }, order: 0, transform: 0x01 },
    ],
  };

  const compRef: F12CompositeReference = {
    opcode: 0x0C,
    blockId: 0,
    compositeId: 2,
    originCellId: 10,
    coveredCount: 2,
    startSeqIndex: 0,
    flags: 0,
  };

  const rawCells: F12RawCellRecord[] = [
    { opcode: 0x00, blockId: 0, cellId: 50, sequenceIndex: 2, state: 1, symbol: 'Z' },
  ];

  const baselineArtifact = serializeCompact3DV4({
    blockCount: 1,
    totalActiveCells: 3,
    totalSequenceSteps: 3,
    dictionaryEntries: [dict1],
    compositeDefinitions: [compDef],
    compositeReferences: [compRef],
    primitiveRecords: [],
    rawCellRecords: rawCells,
  });

  const baselineBytes = baselineArtifact.binaryBuffer;
  const baselineCrc = baselineArtifact.checksum;

  let identicalCount = 0;
  const iterations = 100;

  for (let i = 0; i < iterations; i++) {
    const artifact = serializeCompact3DV4({
      blockCount: 1,
      totalActiveCells: 3,
      totalSequenceSteps: 3,
      dictionaryEntries: [dict1],
      compositeDefinitions: [compDef],
      compositeReferences: [compRef],
      primitiveRecords: [],
      rawCellRecords: rawCells,
    });

    if (artifact.checksum === baselineCrc && artifact.byteLength === baselineArtifact.byteLength) {
      let match = true;
      for (let b = 0; b < artifact.byteLength; b++) {
        if (artifact.binaryBuffer[b] !== baselineBytes[b]) {
          match = false;
          break;
        }
      }
      if (match) {
        identicalCount++;
      }
    }
  }

  const passed = identicalCount === iterations;

  return {
    testId: 'TC-F12-11',
    name: '100x Deterministic Encoding',
    passed,
    details: passed
      ? `100/100 independent encoding passes produced 100% byte-for-byte identical binary output (CRC: ${baselineArtifact.checksumHex}).`
      : `Determinism test failed: only ${identicalCount}/${iterations} matched.`,
    artifactBytes: baselineArtifact.byteLength,
  };
}
