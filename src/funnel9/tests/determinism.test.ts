/**
 * Funnel 9 Test: Deterministic Execution
 * 
 * Verifies that running canonicalization, serialization, and signature generation
 * across 100 iterations yields 100% byte-for-byte deterministic outputs.
 */

import { canonicalizeComposite } from '../core/canonicalizer';
import { areCanonicalCompositesEqual } from '../core/comparator';
import { serializeCanonicalComposite } from '../core/signature';
import { RawCompositeInput } from '../types/canonical';

export function testDeterminism(): { passed: boolean; details: string } {
  const input: RawCompositeInput = {
    origin: { x: 12, y: 34, z: 56 },
    transformMetadata: { b: 2, a: 1, c: { z: 9, y: 8 } },
    children: [
      { dictId: 10, position: { x: 12, y: 34, z: 56 }, order: 0 },
      { dictId: 20, position: { x: 15, y: 30, z: 60 }, order: 1, transformMetadata: { k: 'val2', j: 'val1' } },
      { dictId: 30, position: { x: 10, y: 40, z: 50 }, order: 2 },
    ],
  };

  const firstRun = canonicalizeComposite(input);
  if (!firstRun.success || !firstRun.canonical) {
    return { passed: false, details: 'First run canonicalization failed.' };
  }

  const baseCanonical = firstRun.canonical;
  const baseSerialized = serializeCanonicalComposite(baseCanonical);
  const baseSignature = baseCanonical.signature;
  const baseFingerprint = baseCanonical.fingerprint;

  let allIdentical = true;

  for (let iter = 0; iter < 100; iter++) {
    const run = canonicalizeComposite(input);
    if (!run.success || !run.canonical) {
      allIdentical = false;
      break;
    }

    const currentCanonical = run.canonical;
    const currentSerialized = serializeCanonicalComposite(currentCanonical);

    if (
      !areCanonicalCompositesEqual(baseCanonical, currentCanonical) ||
      currentSerialized !== baseSerialized ||
      currentCanonical.signature !== baseSignature ||
      currentCanonical.fingerprint !== baseFingerprint
    ) {
      allIdentical = false;
      break;
    }
  }

  return {
    passed: allIdentical,
    details: allIdentical
      ? `Determinism Verified: 100 independent iterations generated identical byte representations (Sig: ${baseSignature}, FP: ${baseFingerprint}).`
      : 'Determinism test failed: Output fluctuated across iterations.',
  };
}
