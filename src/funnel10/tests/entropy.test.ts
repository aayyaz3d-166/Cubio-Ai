/**
 * Funnel 10 Test: High Entropy Resistance (TC-F10-08)
 * 
 * Verifies that on high-entropy data where dictionary occurrences have random / non-repeating
 * dictionary IDs and arbitrary non-repeating positions, no repeated candidate families are forced.
 */

import { discoverCandidates } from '../core/discover';
import { DictionaryOccurrence } from '../types/candidate';

export function testHighEntropy(): { passed: boolean; details: string } {
  // Generate 20 high-entropy dictionary occurrences with unique dictIds and random-like coords
  const occurrences: DictionaryOccurrence[] = [];
  for (let i = 0; i < 20; i++) {
    occurrences.push({
      occurrenceId: `ENTROPY_${i}`,
      dictId: 1000 + i, // Every dictionary ID is unique
      blockId: 0,
      originCellId: i * 10,
      originCoord: {
        x: (i * 7 + 13) % 47,
        y: (i * 11 + 5) % 31,
        z: (i * 3 + 19) % 23,
      },
      coveredCells: [i * 10],
      sequenceIndices: [i],
    });
  }

  // Run automatic discovery with maxPatternLength = 2
  const result = discoverCandidates(occurrences, { minPatternLength: 2, maxPatternLength: 2 });

  // In high entropy data, each candidate pair has unique dictionary IDs, so NO family has occurrenceCount > 1
  const repeatedFamilies = result.candidateFamilies.filter((f) => f.occurrenceCount > 1);

  const passed = repeatedFamilies.length === 0;

  return {
    passed,
    details: passed
      ? `High-Entropy Defense Verified: Discovered ${result.totalCandidates} candidate pairs; exactly 0 repeated families were forced (all families have occurrenceCount=1).`
      : `High-entropy test failed: Found ${repeatedFamilies.length} repeated families unexpectedly.`,
  };
}
