/**
 * Funnel 10 Test: Sequence Order Preservation (TC-F10-06)
 * 
 * Verifies that logical sequence order is preserved independently of spatial coordinates,
 * and that candidates retain exact child ordering.
 */

import { discoverCandidates } from '../core/discover';
import { DictionaryOccurrence } from '../types/candidate';

export function testSequenceOrder(): { passed: boolean; details: string } {
  // Candidate where spatial coordinate of Child B (x=1) is smaller than Child A (x=5),
  // but logical sequence index of Child A is 0, and Child B is 1.
  const occurrences: DictionaryOccurrence[] = [
    {
      occurrenceId: 'SEQ_A',
      dictId: 501,
      blockId: 2,
      originCellId: 10,
      originCoord: { x: 5, y: 0, z: 0 },
      coveredCells: [10],
      sequenceIndices: [0],
      symbols: ['FIRST_IN_STREAM'],
    },
    {
      occurrenceId: 'SEQ_B',
      dictId: 502,
      blockId: 2,
      originCellId: 11,
      originCoord: { x: 1, y: 0, z: 0 },
      coveredCells: [11],
      sequenceIndices: [1],
      symbols: ['SECOND_IN_STREAM'],
    },
  ];

  const explicitGroupings = [['SEQ_A', 'SEQ_B']];
  const result = discoverCandidates(occurrences, { explicitGroupings });

  if (result.totalCandidates !== 1 || result.totalFamilies !== 1) {
    return { passed: false, details: 'Discovery failed for sequence candidate.' };
  }

  const cand = result.discoveredCandidates[0];
  const child0 = cand.children[0];
  const child1 = cand.children[1];

  const orderPreserved = child0.dictId === 501 && child0.order === 0 && child1.dictId === 502 && child1.order === 1;
  const offsetPreserved = child0.relativeOffset.dx === 0 && child1.relativeOffset.dx === -4; // 1 - 5 = -4
  const sequencePreserved =
    cand.sequenceIndices[0] === 0 &&
    cand.sequenceIndices[1] === 1 &&
    child0.symbols?.[0] === 'FIRST_IN_STREAM' &&
    child1.symbols?.[0] === 'SECOND_IN_STREAM';

  const passed = orderPreserved && offsetPreserved && sequencePreserved;

  return {
    passed,
    details: passed
      ? `Sequence Order Verified: Logical child order (Dict 501 -> Dict 502) and relative negative offset dx=-4 strictly preserved without spatial reordering.`
      : `Sequence test failed: orderPreserved=${orderPreserved}, offsetPreserved=${offsetPreserved}, sequencePreserved=${sequencePreserved}.`,
  };
}
