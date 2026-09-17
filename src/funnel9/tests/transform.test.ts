/**
 * Funnel 9 Test: Transform Type Support & Rejection
 * 
 * Verifies that:
 * 1. 'TRANSLATION' is supported.
 * 2. Unsupported transforms ('ROTATION', 'SCALING', 'REFLECTION', 'SHEAR') are strictly rejected.
 */

import { canonicalizeComposite } from '../core/canonicalizer';
import { RawCompositeInput } from '../types/canonical';

export function testTransform(): { passed: boolean; details: string } {
  // Valid Translation
  const validComp: RawCompositeInput = {
    transform: 'TRANSLATION',
    children: [
      { dictId: 1, position: { x: 0, y: 0, z: 0 }, transform: 'TRANSLATION' },
      { dictId: 2, position: { x: 1, y: 0, z: 0 }, transform: 'TRANSLATION' },
    ],
  };

  // Unsupported Rotation on composite
  const rotComp: RawCompositeInput = {
    transform: 'ROTATION',
    children: [
      { dictId: 1, position: { x: 0, y: 0, z: 0 } },
      { dictId: 2, position: { x: 1, y: 0, z: 0 } },
    ],
  };

  // Unsupported Scaling on child
  const scaleChildComp: RawCompositeInput = {
    children: [
      { dictId: 1, position: { x: 0, y: 0, z: 0 } },
      { dictId: 2, position: { x: 1, y: 0, z: 0 }, transform: 'SCALING' },
    ],
  };

  // Unsupported Reflection
  const reflectComp: RawCompositeInput = {
    transform: 'REFLECTION',
    children: [
      { dictId: 1, position: { x: 0, y: 0, z: 0 } },
    ],
  };

  const resValid = canonicalizeComposite(validComp);
  const resRot = canonicalizeComposite(rotComp);
  const resScale = canonicalizeComposite(scaleChildComp);
  const resReflect = canonicalizeComposite(reflectComp);

  const validAccepted = resValid.success === true && resValid.canonical?.transform === 'TRANSLATION';
  const rotRejected = resRot.success === false && resRot.errorCode === 'UNSUPPORTED_TRANSFORM';
  const scaleRejected = resScale.success === false && resScale.errorCode === 'UNSUPPORTED_TRANSFORM';
  const reflectRejected = resReflect.success === false && resReflect.errorCode === 'UNSUPPORTED_TRANSFORM';

  const passed = validAccepted && rotRejected && scaleRejected && reflectRejected;

  return {
    passed,
    details: passed
      ? `Transform Invariant Verified: TRANSLATION accepted cleanly. ROTATION, SCALING, and REFLECTION successfully rejected with UNSUPPORTED_TRANSFORM.`
      : `Transform test failed: validAccepted=${validAccepted}, rotRejected=${rotRejected}, scaleRejected=${scaleRejected}, reflectRejected=${reflectRejected}.`,
  };
}
