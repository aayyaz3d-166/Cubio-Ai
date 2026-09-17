/**
 * Funnel 9 Test: Logical Child Ordering
 * 
 * Verifies that two composites with the same children and positions but differing
 * logical child orders (e.g. A->B vs B->A) produce distinct canonical representations.
 */

import { canonicalizeComposite } from '../core/canonicalizer';
import { areCanonicalCompositesEqual } from '../core/comparator';
import { RawCompositeInput } from '../types/canonical';

export function testOrdering(): { passed: boolean; details: string } {
  // Order 1: Child A (dictId 100) first at (0,0,0), then Child B (dictId 200) at (1,1,1)
  const compOrder1: RawCompositeInput = {
    children: [
      { dictId: 100, position: { x: 0, y: 0, z: 0 }, order: 0 },
      { dictId: 200, position: { x: 1, y: 1, z: 1 }, order: 1 },
    ],
  };

  // Order 2: Child B (dictId 200) first at (1,1,1), then Child A (dictId 100) at (0,0,0)
  const compOrder2: RawCompositeInput = {
    children: [
      { dictId: 200, position: { x: 1, y: 1, z: 1 }, order: 0 },
      { dictId: 100, position: { x: 0, y: 0, z: 0 }, order: 1 },
    ],
  };

  const res1 = canonicalizeComposite(compOrder1);
  const res2 = canonicalizeComposite(compOrder2);

  if (!res1.success || !res2.success) {
    return { passed: false, details: 'Canonicalization failed on ordering test composites.' };
  }

  const can1 = res1.canonical!;
  const can2 = res2.canonical!;

  const areEqual = areCanonicalCompositesEqual(can1, can2);
  const sigsEqual = can1.signature === can2.signature;

  // Since order 1 anchor is Child A (dict 100 @ (0,0,0)), its relative offsets are (0,0,0) and (+1,+1,+1)
  // Since order 2 anchor is Child B (dict 200 @ (1,1,1)), its relative offsets are (0,0,0) and (-1,-1,-1)
  // Furthermore dict ID sequence is (100, 200) vs (200, 100)
  const passed = !areEqual && !sigsEqual;

  return {
    passed,
    details: passed
      ? `Child Ordering Invariant Verified: Logical execution order is preserved in identity. Composite (100->200) and Composite (200->100) produced distinct signatures (${can1.signature} vs ${can2.signature}).`
      : `Child ordering failed: Composites with different child orders were incorrectly evaluated as equal.`,
  };
}
