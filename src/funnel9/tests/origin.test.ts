/**
 * Funnel 9 Test: Origin Invariance
 * 
 * Verifies that two composites with the same relative geometry produce identical
 * canonical representations, signatures, and fingerprints regardless of their global origins.
 */

import { canonicalizeComposite, translateRawComposite } from '../core/canonicalizer';
import { areCanonicalCompositesEqual } from '../core/comparator';
import { RawCompositeInput } from '../types/canonical';

export function testOriginInvariance(): { passed: boolean; details: string } {
  // Composite A: origin = (0,0,0), children at (0,0,0) and (2,1,0)
  const compositeA: RawCompositeInput = {
    origin: { x: 0, y: 0, z: 0 },
    children: [
      { dictId: 10, position: { x: 0, y: 0, z: 0 }, order: 0 },
      { dictId: 20, position: { x: 2, y: 1, z: 0 }, order: 1 },
    ],
  };

  // Composite B: origin = (4,5,2), children at (4,5,2) and (6,6,2)
  const compositeB: RawCompositeInput = {
    origin: { x: 4, y: 5, z: 2 },
    children: [
      { dictId: 10, position: { x: 4, y: 5, z: 2 }, order: 0 },
      { dictId: 20, position: { x: 6, y: 6, z: 2 }, order: 1 },
    ],
  };

  // Composite C: arbitrary translation via translateRawComposite (+100, -50, +30)
  const compositeC = translateRawComposite(compositeA, { x: 100, y: -50, z: 30 });

  const resA = canonicalizeComposite(compositeA);
  const resB = canonicalizeComposite(compositeB);
  const resC = canonicalizeComposite(compositeC);

  if (!resA.success || !resB.success || !resC.success) {
    return { passed: false, details: 'Canonicalization failed on one of the origin test composites.' };
  }

  const canA = resA.canonical!;
  const canB = resB.canonical!;
  const canC = resC.canonical!;

  const aEqualsB = areCanonicalCompositesEqual(canA, canB);
  const aEqualsC = areCanonicalCompositesEqual(canA, canC);
  const sigMatch = canA.signature === canB.signature && canA.signature === canC.signature;
  const fpMatch = canA.fingerprint === canB.fingerprint && canA.fingerprint === canC.fingerprint;

  const passed = aEqualsB && aEqualsC && sigMatch && fpMatch;

  return {
    passed,
    details: passed
      ? `Origin Invariance Verified: Composites across 3 distinct global origins ((0,0,0), (4,5,2), (100,-50,30)) yielded identical canonical signatures (${canA.signature}) and fingerprints (${canA.fingerprint}).`
      : `Origin Invariance Failed: Equality checks A==B (${aEqualsB}), A==C (${aEqualsC}), signatures match (${sigMatch}), fingerprints match (${fpMatch}).`,
  };
}
