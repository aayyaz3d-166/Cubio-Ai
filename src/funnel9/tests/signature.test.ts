/**
 * Funnel 9 Test: Signature Structure, Single Child, and Empty Composite Edge Cases
 * 
 * Verifies that:
 * 1. Zero-child composite is strictly rejected with EMPTY_CHILDREN.
 * 2. Single-child composite canonicalizes cleanly with offset (0,0,0).
 * 3. Signature encodes hierarchy level (LV=3), transform (T=TRANSLATION), child count, and details.
 */

import { canonicalizeComposite } from '../core/canonicalizer';
import { RawCompositeInput } from '../types/canonical';

export function testSignatureAndEdgeCases(): { passed: boolean; details: string } {
  // 1. Empty Composite
  const emptyComp: RawCompositeInput = {
    children: [],
  };
  const resEmpty = canonicalizeComposite(emptyComp);
  const emptyRejected = resEmpty.success === false && resEmpty.errorCode === 'EMPTY_CHILDREN';

  // 2. Single Child Composite at non-zero global origin
  const singleComp: RawCompositeInput = {
    origin: { x: 45, y: 78, z: 90 },
    children: [{ dictId: 777, position: { x: 45, y: 78, z: 90 }, order: 0 }],
  };
  const resSingle = canonicalizeComposite(singleComp);
  const singleValid =
    resSingle.success === true &&
    resSingle.canonical !== undefined &&
    resSingle.canonical.childCount === 1 &&
    resSingle.canonical.children[0].dictId === 777 &&
    resSingle.canonical.children[0].offset.dx === 0 &&
    resSingle.canonical.children[0].offset.dy === 0 &&
    resSingle.canonical.children[0].offset.dz === 0 &&
    resSingle.canonical.relativeBoundingBox.spanX === 1 &&
    resSingle.canonical.relativeBoundingBox.spanY === 1 &&
    resSingle.canonical.relativeBoundingBox.spanZ === 1;

  // 3. Signature format verification
  const multiComp: RawCompositeInput = {
    children: [
      { dictId: 10, position: { x: 0, y: 0, z: 0 }, order: 0 },
      { dictId: 20, position: { x: 2, y: 3, z: 4 }, order: 1 },
    ],
  };
  const resMulti = canonicalizeComposite(multiComp);
  const signatureValid =
    resMulti.success === true &&
    resMulti.canonical?.signature.startsWith('COMP3:(LV=3|T=TRANSLATION|N=2|C=[D=10@(0,0,0)#0];[D=20@(2,3,4)#1])') === true;

  const passed = emptyRejected && singleValid && signatureValid;

  return {
    passed,
    details: passed
      ? `Signature & Edge Cases Verified: Empty composite rejected with EMPTY_CHILDREN; Single child normalized to (0,0,0); Signature format validated (${resMulti.canonical?.signature}).`
      : `Signature/Edge cases failed: emptyRejected=${emptyRejected}, singleValid=${singleValid}, signatureValid=${signatureValid}.`,
  };
}
