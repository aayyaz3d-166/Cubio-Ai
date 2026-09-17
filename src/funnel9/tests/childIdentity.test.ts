/**
 * Funnel 9 Test: Dictionary Identity
 * 
 * Verifies that dictionary IDs form an essential component of the canonical identity,
 * ensuring composites with identical spatial geometry but different child IDs are NOT equal.
 */

import { canonicalizeComposite } from '../core/canonicalizer';
import { areCanonicalCompositesEqual } from '../core/comparator';
import { RawCompositeInput } from '../types/canonical';

export function testChildIdentity(): { passed: boolean; details: string } {
  // Composite 1: Dict IDs [101, 102, 103] at relative positions (0,0,0), (2,0,0), (4,0,0)
  const comp1: RawCompositeInput = {
    children: [
      { dictId: 101, position: { x: 0, y: 0, z: 0 }, order: 0 },
      { dictId: 102, position: { x: 2, y: 0, z: 0 }, order: 1 },
      { dictId: 103, position: { x: 4, y: 0, z: 0 }, order: 2 },
    ],
  };

  // Composite 2: Dict IDs [101, 102, 104] at exact same positions (0,0,0), (2,0,0), (4,0,0)
  const comp2: RawCompositeInput = {
    children: [
      { dictId: 101, position: { x: 0, y: 0, z: 0 }, order: 0 },
      { dictId: 102, position: { x: 2, y: 0, z: 0 }, order: 1 },
      { dictId: 104, position: { x: 4, y: 0, z: 0 }, order: 2 },
    ],
  };

  const res1 = canonicalizeComposite(comp1);
  const res2 = canonicalizeComposite(comp2);

  if (!res1.success || !res2.success) {
    return { passed: false, details: 'Canonicalization failed on child identity test composites.' };
  }

  const can1 = res1.canonical!;
  const can2 = res2.canonical!;

  const areEqual = areCanonicalCompositesEqual(can1, can2);
  const sigsEqual = can1.signature === can2.signature;

  const passed = !areEqual && !sigsEqual;

  return {
    passed,
    details: passed
      ? `Child Identity Invariant Verified: Composites with identical geometry but different child dictionary IDs ([101,102,103] vs [101,102,104]) produced distinct canonical identities.`
      : `Child identity failed: Composites with differing dictionary IDs were evaluated as equal.`,
  };
}
