/**
 * Funnel 9 Test: Diagnostic Comparison & Difference Detection
 * 
 * Verifies that compareCanonicalComposites produces accurate diagnostic reasons
 * when comparing differing composites (child count, offset, dictId, order).
 */

import { canonicalizeComposite } from '../core/canonicalizer';
import { compareCanonicalComposites } from '../core/comparator';
import { RawCompositeInput } from '../types/canonical';

export function testDifferenceReporting(): { passed: boolean; details: string } {
  const base: RawCompositeInput = {
    children: [
      { dictId: 1, position: { x: 0, y: 0, z: 0 }, order: 0 },
      { dictId: 2, position: { x: 1, y: 0, z: 0 }, order: 1 },
    ],
  };

  // Differing child count (3 children instead of 2)
  const diffCount: RawCompositeInput = {
    children: [
      { dictId: 1, position: { x: 0, y: 0, z: 0 }, order: 0 },
      { dictId: 2, position: { x: 1, y: 0, z: 0 }, order: 1 },
      { dictId: 3, position: { x: 2, y: 0, z: 0 }, order: 2 },
    ],
  };

  // Differing child ID (Dict 99 instead of Dict 2)
  const diffDict: RawCompositeInput = {
    children: [
      { dictId: 1, position: { x: 0, y: 0, z: 0 }, order: 0 },
      { dictId: 99, position: { x: 1, y: 0, z: 0 }, order: 1 },
    ],
  };

  const canBase = canonicalizeComposite(base).canonical!;
  const canCount = canonicalizeComposite(diffCount).canonical!;
  const canDict = canonicalizeComposite(diffDict).canonical!;

  const cmpCount = compareCanonicalComposites(canBase, canCount);
  const cmpDict = compareCanonicalComposites(canBase, canDict);

  const countReportValid =
    !cmpCount.areEqual && cmpCount.differenceType === 'CHILD_COUNT_MISMATCH';
  const dictReportValid =
    !cmpDict.areEqual &&
    cmpDict.differenceType === 'DICT_ID_MISMATCH' &&
    cmpDict.differingChildIndex === 1;

  const passed = countReportValid && dictReportValid;

  return {
    passed,
    details: passed
      ? `Diagnostic Difference Detection Verified: CHILD_COUNT_MISMATCH and DICT_ID_MISMATCH (child index 1) identified with precision.`
      : `Difference reporting test failed: countReportValid=${countReportValid}, dictReportValid=${dictReportValid}.`,
  };
}
