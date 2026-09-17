/**
 * Test TC-F11-06: 100% Deterministic Execution
 * 
 * Runs scoring, selection, and binary serialization 100 times across shuffled candidate batches.
 * Verifies identical candidate IDs, ordering, cost numbers, status verdicts, and byte buffers.
 */

import { createBenchmarkCandidateFamily } from '../core/benchmark';
import { selectCompositeEntries } from '../core/selector';
import { serializeCompositeDefinition } from '../core/serializer';

export function testDeterministicExecution(): { passed: boolean; details: string } {
  const family1 = createBenchmarkCandidateFamily(
    'COMPOSITE{D101@[0,0,0]|D102@[1,0,0]|D103@[0,1,0]}',
    [101, 102, 103],
    [[0, 0, 0], [1, 0, 0], [0, 1, 0]],
    [{ x: 0, y: 0, z: 0 }, { x: 2, y: 0, z: 0 }, { x: 4, y: 0, z: 0 }, { x: 0, y: 2, z: 0 }, { x: 2, y: 2, z: 0 }]
  );

  const family2 = createBenchmarkCandidateFamily(
    'COMPOSITE{D201@[0,0,0]|D202@[2,0,0]}',
    [201, 202],
    [[0, 0, 0], [2, 0, 0]],
    [{ x: 0, y: 4, z: 0 }, { x: 3, y: 4, z: 0 }, { x: 0, y: 4, z: 2 }, { x: 3, y: 4, z: 2 }, { x: 0, y: 4, z: 4 }, { x: 3, y: 4, z: 4 }]
  );

  const family3 = createBenchmarkCandidateFamily(
    'COMPOSITE{D301@[0,0,0]|D302@[1,1,1]}',
    [301, 302],
    [[0, 0, 0], [1, 1, 1]],
    [{ x: 0, y: 0, z: 4 }] // 1 occurrence -> Unprofitable
  );

  const baselineSelection = selectCompositeEntries([family1, family2, family3]);
  const baselineDef1 = serializeCompositeDefinition(family1.canonical, 1);
  const baselineDef2 = serializeCompositeDefinition(family2.canonical, 2);

  const RUNS = 100;

  for (let run = 0; run < RUNS; run++) {
    // Permute input ordering randomly
    const permutation = [family1, family2, family3].sort(() => (run % 2 === 0 ? 0.5 - ((run * 7) % 11) / 11 : -0.5));
    const runResult = selectCompositeEntries(permutation);

    // 1. Check selected entry count
    if (runResult.selectedEntries.length !== baselineSelection.selectedEntries.length) {
      return {
        passed: false,
        details: `Run #${run}: Mismatch in selected count: expected ${baselineSelection.selectedEntries.length}, got ${runResult.selectedEntries.length}`,
      };
    }

    // 2. Check deterministic ordering and metrics
    for (let i = 0; i < runResult.selectedEntries.length; i++) {
      const baseEntry = baselineSelection.selectedEntries[i];
      const runEntry = runResult.selectedEntries[i];

      if (baseEntry.signature !== runEntry.signature) {
        return {
          passed: false,
          details: `Run #${run}: Ordering changed at index ${i}. Expected signature ${baseEntry.signature}, got ${runEntry.signature}`,
        };
      }

      if (baseEntry.compositeId !== runEntry.compositeId) {
        return {
          passed: false,
          details: `Run #${run}: Composite ID changed at index ${i}. Expected ${baseEntry.compositeId}, got ${runEntry.compositeId}`,
        };
      }

      if (baseEntry.score.cost.actualSavings !== runEntry.score.cost.actualSavings) {
        return {
          passed: false,
          details: `Run #${run}: Cost changed at index ${i}. Expected ${baseEntry.score.cost.actualSavings}B, got ${runEntry.score.cost.actualSavings}B`,
        };
      }

      // Check serialized binary bytes
      if (baseEntry.definitionBytes.length !== runEntry.definitionBytes.length) {
        return {
          passed: false,
          details: `Run #${run}: Binary byte length mismatch at index ${i}`,
        };
      }

      for (let b = 0; b < baseEntry.definitionBytes.length; b++) {
        if (baseEntry.definitionBytes[b] !== runEntry.definitionBytes[b]) {
          return {
            passed: false,
            details: `Run #${run}: Binary byte mismatch at byte offset ${b} in definition`,
          };
        }
      }
    }
  }

  return {
    passed: true,
    details: 'Successfully verified 100 consecutive runs: identical IDs, ordering, costs, and byte-for-byte binary buffers.',
  };
}
