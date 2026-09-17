/**
 * Funnel 9 Test: Offsets and Negative Offsets
 * 
 * Verifies that:
 * 1. Different relative offsets produce distinct canonical identities.
 * 2. Negative relative offsets are fully supported, normalized, and preserved.
 */

import { canonicalizeComposite } from '../core/canonicalizer';
import { areCanonicalCompositesEqual } from '../core/comparator';
import { RawCompositeInput } from '../types/canonical';

export function testOffsets(): { passed: boolean; details: string } {
  // Base Composite: Child 0 at (10, 10, 10), Child 1 at (12, 11, 10) -> dx=+2, dy=+1, dz=0
  const baseComp: RawCompositeInput = {
    origin: { x: 0, y: 0, z: 0 },
    children: [
      { dictId: 101, position: { x: 10, y: 10, z: 10 }, order: 0 },
      { dictId: 102, position: { x: 12, y: 11, z: 10 }, order: 1 },
    ],
  };

  // Differing Offset Composite: Child 0 at (10, 10, 10), Child 1 at (13, 11, 10) -> dx=+3, dy=+1, dz=0
  const diffOffsetComp: RawCompositeInput = {
    origin: { x: 0, y: 0, z: 0 },
    children: [
      { dictId: 101, position: { x: 10, y: 10, z: 10 }, order: 0 },
      { dictId: 102, position: { x: 13, y: 11, z: 10 }, order: 1 },
    ],
  };

  // Negative Offset Composite: Child 0 at (10, 10, 10), Child 1 at (7, 6, 4) -> dx=-3, dy=-4, dz=-6
  const negativeOffsetComp: RawCompositeInput = {
    origin: { x: 0, y: 0, z: 0 },
    children: [
      { dictId: 201, position: { x: 10, y: 10, z: 10 }, order: 0 },
      { dictId: 202, position: { x: 7, y: 6, z: 4 }, order: 1 },
    ],
  };

  const resBase = canonicalizeComposite(baseComp);
  const resDiff = canonicalizeComposite(diffOffsetComp);
  const resNeg = canonicalizeComposite(negativeOffsetComp);

  if (!resBase.success || !resDiff.success || !resNeg.success) {
    return { passed: false, details: 'Canonicalization failed on offset test composites.' };
  }

  const canBase = resBase.canonical!;
  const canDiff = resDiff.canonical!;
  const canNeg = resNeg.canonical!;

  const areDifferent = !areCanonicalCompositesEqual(canBase, canDiff);
  const sigsDifferent = canBase.signature !== canDiff.signature;

  const negChild = canNeg.children[1];
  const negativeOffsetsValid =
    negChild.offset.dx === -3 && negChild.offset.dy === -4 && negChild.offset.dz === -6;
  const boundingBoxValid =
    canNeg.relativeBoundingBox.minDx === -3 &&
    canNeg.relativeBoundingBox.minDy === -4 &&
    canNeg.relativeBoundingBox.minDz === -6;

  const passed = areDifferent && sigsDifferent && negativeOffsetsValid && boundingBoxValid;

  return {
    passed,
    details: passed
      ? `Offset Invariants Verified: Distinct relative offsets produce unequal canonical forms (${canBase.signature} vs ${canDiff.signature}); Negative offsets dx=-3, dy=-4, dz=-6 successfully preserved.`
      : `Offset test failed: areDifferent=${areDifferent}, sigsDifferent=${sigsDifferent}, negOffsetsValid=${negativeOffsetsValid}.`,
  };
}
