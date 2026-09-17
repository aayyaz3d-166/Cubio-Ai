/**
 * Funnel 10 Test: Repeated Primitive Group (TC-F10-01)
 * 
 * Verifies that two or more occurrences of the same dictionary composition
 * are discovered and grouped into one candidate family with multiple occurrences.
 */

import { discoverCandidates } from '../core/discover';
import { DictionaryOccurrence } from '../types/candidate';

export function testRepeatedPrimitiveGroup(): { passed: boolean; details: string } {
  // 3 occurrences of composition: Dict 101 @ (0,0,0) + Dict 102 @ (2,0,0) in Block 0
  const occurrences: DictionaryOccurrence[] = [
    // Occurrence 1 at origin (0, 0, 0)
    {
      occurrenceId: 'OCC_01_A',
      dictId: 101,
      blockId: 0,
      originCellId: 0,
      originCoord: { x: 0, y: 0, z: 0 },
      coveredCells: [0, 1],
      sequenceIndices: [0, 1],
      symbols: ['A', 'A'],
    },
    {
      occurrenceId: 'OCC_01_B',
      dictId: 102,
      blockId: 0,
      originCellId: 2,
      originCoord: { x: 2, y: 0, z: 0 },
      coveredCells: [2, 3],
      sequenceIndices: [2, 3],
      symbols: ['B', 'B'],
    },

    // Occurrence 2 at origin (10, 0, 0)
    {
      occurrenceId: 'OCC_02_A',
      dictId: 101,
      blockId: 0,
      originCellId: 10,
      originCoord: { x: 10, y: 0, z: 0 },
      coveredCells: [10, 11],
      sequenceIndices: [4, 5],
      symbols: ['A', 'A'],
    },
    {
      occurrenceId: 'OCC_02_B',
      dictId: 102,
      blockId: 0,
      originCellId: 12,
      originCoord: { x: 12, y: 0, z: 0 },
      coveredCells: [12, 13],
      sequenceIndices: [6, 7],
      symbols: ['B', 'B'],
    },

    // Occurrence 3 at origin (20, 0, 0)
    {
      occurrenceId: 'OCC_03_A',
      dictId: 101,
      blockId: 0,
      originCellId: 20,
      originCoord: { x: 20, y: 0, z: 0 },
      coveredCells: [20, 21],
      sequenceIndices: [8, 9],
      symbols: ['A', 'A'],
    },
    {
      occurrenceId: 'OCC_03_B',
      dictId: 102,
      blockId: 0,
      originCellId: 22,
      originCoord: { x: 22, y: 0, z: 0 },
      coveredCells: [22, 23],
      sequenceIndices: [10, 11],
      symbols: ['B', 'B'],
    },
  ];

  const explicitGroupings = [
    ['OCC_01_A', 'OCC_01_B'],
    ['OCC_02_A', 'OCC_02_B'],
    ['OCC_03_A', 'OCC_03_B'],
  ];

  const result = discoverCandidates(occurrences, { explicitGroupings });

  const has3Candidates = result.totalCandidates === 3;
  const has1Family = result.totalFamilies === 1;
  const occurrencesCount = has1Family ? result.candidateFamilies[0].occurrenceCount : 0;
  const sigMatch = has1Family && result.candidateFamilies[0].signature.includes('D=101@(0,0,0)#0');

  const passed = has3Candidates && has1Family && occurrencesCount === 3 && sigMatch;

  return {
    passed,
    details: passed
      ? `Repeated Group Discovered: 3 occurrences successfully grouped into 1 canonical candidate family (Signature: ${result.candidateFamilies[0].signature}).`
      : `Repeated group test failed: totalCandidates=${result.totalCandidates}, totalFamilies=${result.totalFamilies}, occurrencesCount=${occurrencesCount}.`,
  };
}
