/**
 * Funnel 10 Test: Canonical Grouping (TC-F10-07)
 * 
 * Verifies that candidate occurrences with arbitrary translations across 3D space
 * properly integrate with Funnel 9 to group into a unified candidate family.
 */

import { discoverCandidates } from '../core/discover';
import { DictionaryOccurrence } from '../types/candidate';

export function testCanonicalGrouping(): { passed: boolean; details: string } {
  const occurrences: DictionaryOccurrence[] = [];
  const explicitGroupings: string[][] = [];

  // Generate 5 instances of a 3-element composition at random translated origins
  // Dict 100 @ (0,0,0) + Dict 200 @ (1,2,3) + Dict 300 @ (4,5,6)
  const translations = [
    { x: 0, y: 0, z: 0 },
    { x: 10, y: 20, z: 30 },
    { x: -50, y: 40, z: 12 },
    { x: 100, y: -80, z: 64 },
    { x: 7, y: 14, z: 21 },
  ];

  for (let i = 0; i < translations.length; i++) {
    const t = translations[i];
    const idA = `OCC_G${i}_A`;
    const idB = `OCC_G${i}_B`;
    const idC = `OCC_G${i}_C`;

    occurrences.push({
      occurrenceId: idA,
      dictId: 100,
      blockId: 0,
      originCellId: i * 10,
      originCoord: { x: t.x, y: t.y, z: t.z },
      coveredCells: [i * 10],
      sequenceIndices: [i * 3],
    });

    occurrences.push({
      occurrenceId: idB,
      dictId: 200,
      blockId: 0,
      originCellId: i * 10 + 1,
      originCoord: { x: t.x + 1, y: t.y + 2, z: t.z + 3 },
      coveredCells: [i * 10 + 1],
      sequenceIndices: [i * 3 + 1],
    });

    occurrences.push({
      occurrenceId: idC,
      dictId: 300,
      blockId: 0,
      originCellId: i * 10 + 2,
      originCoord: { x: t.x + 4, y: t.y + 5, z: t.z + 6 },
      coveredCells: [i * 10 + 2],
      sequenceIndices: [i * 3 + 2],
    });

    explicitGroupings.push([idA, idB, idC]);
  }

  const result = discoverCandidates(occurrences, { explicitGroupings });

  const passed =
    result.totalCandidates === 5 &&
    result.totalFamilies === 1 &&
    result.candidateFamilies[0].occurrenceCount === 5 &&
    result.candidateFamilies[0].signature.includes('[D=100@(0,0,0)#0];[D=200@(1,2,3)#1];[D=300@(4,5,6)#2]');

  return {
    passed,
    details: passed
      ? `Canonical Grouping Verified: 5 instances translated across 3D space grouped into 1 family with signature: ${result.candidateFamilies[0].signature}.`
      : `Canonical grouping test failed: totalCandidates=${result.totalCandidates}, totalFamilies=${result.totalFamilies}.`,
  };
}
