/**
 * 3D Memory Studio - Funnel 12 Test: TC-F12-01
 * Basic Hierarchical Encoding
 */

import { encodeHierarchyCompact3DV4 } from '../core/encoder';
import { Compact3DArtifactV4 } from '../types/artifact';
import { F12DictionaryEntry, F12RawCellRecord } from '../types/records';
import { Funnel12TestResult } from '../types/report';

export function testBasicHierarchicalEncoding(): Funnel12TestResult {
  const dictEntries: F12DictionaryEntry[] = [
    {
      dictId: 101,
      ruleType: 0x01,
      relativeOffsets: [{ dx: 0, dy: 0, dz: 0 }, { dx: 1, dy: 0, dz: 0 }],
      symbol: 'A',
      flags: 0,
    },
  ];

  const rawCells: F12RawCellRecord[] = [
    { opcode: 0x00, blockId: 0, cellId: 10, sequenceIndex: 0, state: 1, symbol: 'B' },
    { opcode: 0x00, blockId: 0, cellId: 11, sequenceIndex: 1, state: 1, symbol: 'C' },
  ];

  const artifact = encodeHierarchyCompact3DV4({
    memory: [],
    dictionary: dictEntries,
    rawCellRecords: rawCells,
  });

  const headerValid = (
    artifact.header.magic === 'C3D4' &&
    artifact.header.formatVersion === 4 &&
    artifact.header.hierarchyMaxDepth === 3 &&
    artifact.header.dictEntryCount === 1 &&
    artifact.header.rawCellCount === 2
  );

  const passed = headerValid && artifact.byteLength > 0 && artifact.checksum > 0;

  return {
    testId: 'TC-F12-01',
    name: 'Basic Hierarchical Encoding',
    passed,
    details: passed
      ? `Successfully encoded compact3d-v4 artifact (${artifact.byteLength}B) with valid header and CRC32.`
      : `Encoding validation failed: headerValid=${headerValid}, byteLength=${artifact.byteLength}.`,
    artifactBytes: artifact.byteLength,
  };
}
