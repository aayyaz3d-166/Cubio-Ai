/**
 * Funnel 10 Test: Deterministic Discovery Execution (TC-F10-09)
 * 
 * Verifies that running discovery multiple times on the same input produces
 * 100% byte-for-byte and structurally identical results across runs.
 */

import { deterministicStringify } from '../../funnel9/core/signature';
import { discoverCandidates } from '../core/discover';
import { DictionaryOccurrence } from '../types/candidate';

export function testDeterministicDiscovery(): { passed: boolean; details: string } {
  const occurrences: DictionaryOccurrence[] = [
    {
      occurrenceId: 'D1_A',
      dictId: 10,
      blockId: 0,
      originCellId: 0,
      originCoord: { x: 0, y: 0, z: 0 },
      coveredCells: [0],
      sequenceIndices: [0],
    },
    {
      occurrenceId: 'D1_B',
      dictId: 20,
      blockId: 0,
      originCellId: 1,
      originCoord: { x: 1, y: 1, z: 1 },
      coveredCells: [1],
      sequenceIndices: [1],
    },
    {
      occurrenceId: 'D2_A',
      dictId: 10,
      blockId: 0,
      originCellId: 10,
      originCoord: { x: 5, y: 5, z: 5 },
      coveredCells: [10],
      sequenceIndices: [2],
    },
    {
      occurrenceId: 'D2_B',
      dictId: 20,
      blockId: 0,
      originCellId: 11,
      originCoord: { x: 6, y: 6, z: 6 },
      coveredCells: [11],
      sequenceIndices: [3],
    },
  ];

  const run1 = discoverCandidates(occurrences, { minPatternLength: 2, maxPatternLength: 2 });
  const str1 = deterministicStringify({
    totalCandidates: run1.totalCandidates,
    totalFamilies: run1.totalFamilies,
    families: run1.candidateFamilies.map((f) => ({
      sig: f.signature,
      fp: f.fingerprint,
      count: f.occurrenceCount,
      occIds: f.occurrences.map((o) => o.occurrenceId),
    })),
  });

  let allIdentical = true;

  for (let i = 0; i < 50; i++) {
    const runCurrent = discoverCandidates(occurrences, { minPatternLength: 2, maxPatternLength: 2 });
    const strCurrent = deterministicStringify({
      totalCandidates: runCurrent.totalCandidates,
      totalFamilies: runCurrent.totalFamilies,
      families: runCurrent.candidateFamilies.map((f) => ({
        sig: f.signature,
        fp: f.fingerprint,
        count: f.occurrenceCount,
        occIds: f.occurrences.map((o) => o.occurrenceId),
      })),
    });

    if (strCurrent !== str1) {
      allIdentical = false;
      break;
    }
  }

  return {
    passed: allIdentical,
    details: allIdentical
      ? `Determinism Verified: 50 independent discovery runs produced 100% identical outputs and canonical family ordering.`
      : 'Determinism test failed: Output fluctuated across runs.',
  };
}
