/**
 * Funnel 10 Test: Translated Repeat (TC-F10-02)
 * 
 * Verifies that the same child dictionary composition at different 3D global origins
 * produces the same canonical candidate family via Funnel 9 integration.
 */

import { discoverCandidates } from '../core/discover';
import { DictionaryOccurrence } from '../types/candidate';

export function testTranslatedRepeat(): { passed: boolean; details: string } {
  // Composition: Dict 201 + Dict 202 with relative offset dx=+3, dy=+2, dz=+1
  // Instance 1 at (0, 0, 0)
  // Instance 2 at (15, 25, 35)
  // Instance 3 at (100, -20, 50)
  const occurrences: DictionaryOccurrence[] = [
    // Instance 1
    {
      occurrenceId: 'T1_A',
      dictId: 201,
      blockId: 1,
      originCellId: 100,
      originCoord: { x: 0, y: 0, z: 0 },
      coveredCells: [100],
      sequenceIndices: [0],
    },
    {
      occurrenceId: 'T1_B',
      dictId: 202,
      blockId: 1,
      originCellId: 101,
      originCoord: { x: 3, y: 2, z: 1 },
      coveredCells: [101],
      sequenceIndices: [1],
    },

    // Instance 2 (translated by +15, +25, +35)
    {
      occurrenceId: 'T2_A',
      dictId: 201,
      blockId: 1,
      originCellId: 200,
      originCoord: { x: 15, y: 25, z: 35 },
      coveredCells: [200],
      sequenceIndices: [2],
    },
    {
      occurrenceId: 'T2_B',
      dictId: 202,
      blockId: 1,
      originCellId: 201,
      originCoord: { x: 18, y: 27, z: 36 },
      coveredCells: [201],
      sequenceIndices: [3],
    },

    // Instance 3 (translated to 100, -20, 50)
    {
      occurrenceId: 'T3_A',
      dictId: 201,
      blockId: 1,
      originCellId: 300,
      originCoord: { x: 100, y: -20, z: 50 },
      coveredCells: [300],
      sequenceIndices: [4],
    },
    {
      occurrenceId: 'T3_B',
      dictId: 202,
      blockId: 1,
      originCellId: 301,
      originCoord: { x: 103, y: -18, z: 51 },
      coveredCells: [301],
      sequenceIndices: [5],
    },
  ];

  const explicitGroupings = [
    ['T1_A', 'T1_B'],
    ['T2_A', 'T2_B'],
    ['T3_A', 'T3_B'],
  ];

  const result = discoverCandidates(occurrences, { explicitGroupings });

  const passed =
    result.totalCandidates === 3 &&
    result.totalFamilies === 1 &&
    result.candidateFamilies[0].occurrenceCount === 3 &&
    result.candidateFamilies[0].signature.includes('[D=201@(0,0,0)#0];[D=202@(3,2,1)#1]');

  return {
    passed,
    details: passed
      ? `Translated Repeat Verified: 3 occurrences across disparate 3D global origins resolved to single canonical family (${result.candidateFamilies[0].signature}).`
      : `Translated repeat test failed: totalCandidates=${result.totalCandidates}, totalFamilies=${result.totalFamilies}.`,
  };
}
