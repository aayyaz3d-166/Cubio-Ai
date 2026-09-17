/**
 * Funnel 10 Test: Single Occurrence Discovery (TC-F10-04)
 * 
 * Verifies that a valid composite candidate with only 1 occurrence is still discovered,
 * and is NOT prematurely rejected simply because occurrenceCount = 1 (Profitability / Selection
 * is deferred to later funnels).
 */

import { discoverCandidates } from '../core/discover';
import { DictionaryOccurrence } from '../types/candidate';

export function testSingleOccurrence(): { passed: boolean; details: string } {
  const occurrences: DictionaryOccurrence[] = [
    {
      occurrenceId: 'SING_1',
      dictId: 901,
      blockId: 0,
      originCellId: 50,
      originCoord: { x: 10, y: 10, z: 10 },
      coveredCells: [50, 51],
      sequenceIndices: [0, 1],
    },
    {
      occurrenceId: 'SING_2',
      dictId: 902,
      blockId: 0,
      originCellId: 52,
      originCoord: { x: 12, y: 10, z: 10 },
      coveredCells: [52, 53],
      sequenceIndices: [2, 3],
    },
  ];

  const explicitGroupings = [['SING_1', 'SING_2']];
  const result = discoverCandidates(occurrences, { explicitGroupings });

  const candidateDiscovered =
    result.totalCandidates === 1 &&
    result.totalFamilies === 1 &&
    result.candidateFamilies[0].occurrenceCount === 1 &&
    result.totalRejected === 0;

  return {
    passed: candidateDiscovered,
    details: candidateDiscovered
      ? `Single Occurrence Discovery Verified: Valid candidate discovered with occurrenceCount=1 without premature profitability rejection.`
      : `Single occurrence test failed: totalCandidates=${result.totalCandidates}, totalFamilies=${result.totalFamilies}, totalRejected=${result.totalRejected}.`,
  };
}
