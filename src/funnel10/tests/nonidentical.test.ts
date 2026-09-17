/**
 * Funnel 10 Test: Similar but Non-Identical Compositions (TC-F10-03)
 * 
 * Verifies that compositions differing by:
 * - 1 dictionary ID, OR
 * - 1 relative offset, OR
 * - child ordering
 * are correctly discovered into distinct candidate families.
 */

import { discoverCandidates } from '../core/discover';
import { DictionaryOccurrence } from '../types/candidate';

export function testSimilarNonIdentical(): { passed: boolean; details: string } {
  const occurrences: DictionaryOccurrence[] = [
    // Base Composition: Dict 10 + Dict 20 @ (2, 0, 0)
    {
      occurrenceId: 'BASE_1',
      dictId: 10,
      blockId: 0,
      originCellId: 1,
      originCoord: { x: 0, y: 0, z: 0 },
      coveredCells: [1],
      sequenceIndices: [0],
    },
    {
      occurrenceId: 'BASE_2',
      dictId: 20,
      blockId: 0,
      originCellId: 2,
      originCoord: { x: 2, y: 0, z: 0 },
      coveredCells: [2],
      sequenceIndices: [1],
    },

    // Differ by Dict ID: Dict 10 + Dict 99 @ (2, 0, 0)
    {
      occurrenceId: 'DIFF_DICT_1',
      dictId: 10,
      blockId: 0,
      originCellId: 10,
      originCoord: { x: 10, y: 0, z: 0 },
      coveredCells: [10],
      sequenceIndices: [2],
    },
    {
      occurrenceId: 'DIFF_DICT_2',
      dictId: 99,
      blockId: 0,
      originCellId: 11,
      originCoord: { x: 12, y: 0, z: 0 },
      coveredCells: [11],
      sequenceIndices: [3],
    },

    // Differ by Offset: Dict 10 + Dict 20 @ (3, 0, 0)
    {
      occurrenceId: 'DIFF_OFF_1',
      dictId: 10,
      blockId: 0,
      originCellId: 20,
      originCoord: { x: 20, y: 0, z: 0 },
      coveredCells: [20],
      sequenceIndices: [4],
    },
    {
      occurrenceId: 'DIFF_OFF_2',
      dictId: 20,
      blockId: 0,
      originCellId: 21,
      originCoord: { x: 23, y: 0, z: 0 },
      coveredCells: [21],
      sequenceIndices: [5],
    },

    // Differ by Order: Dict 20 @ (0,0,0) + Dict 10 @ (-2, 0, 0) -> order reversed
    {
      occurrenceId: 'DIFF_ORD_1',
      dictId: 20,
      blockId: 0,
      originCellId: 30,
      originCoord: { x: 32, y: 0, z: 0 },
      coveredCells: [30],
      sequenceIndices: [6],
    },
    {
      occurrenceId: 'DIFF_ORD_2',
      dictId: 10,
      blockId: 0,
      originCellId: 31,
      originCoord: { x: 30, y: 0, z: 0 },
      coveredCells: [31],
      sequenceIndices: [7],
    },
  ];

  const explicitGroupings = [
    ['BASE_1', 'BASE_2'],
    ['DIFF_DICT_1', 'DIFF_DICT_2'],
    ['DIFF_OFF_1', 'DIFF_OFF_2'],
    ['DIFF_ORD_1', 'DIFF_ORD_2'],
  ];

  const result = discoverCandidates(occurrences, { explicitGroupings });

  const passed =
    result.totalCandidates === 4 &&
    result.totalFamilies === 4 &&
    result.candidateFamilies.every((f) => f.occurrenceCount === 1);

  return {
    passed,
    details: passed
      ? `Non-Identical Separation Verified: 4 subtly different compositions (Base, Diff-Dict, Diff-Offset, Diff-Order) formed 4 distinct candidate families.`
      : `Non-identical test failed: totalCandidates=${result.totalCandidates}, totalFamilies=${result.totalFamilies}.`,
  };
}
