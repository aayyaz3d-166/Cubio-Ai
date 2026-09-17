/**
 * Funnel 9 Test: Strict Equality & Roundtrip Serialization
 * 
 * Verifies that:
 * 1. Exactly identical composites evaluate to areEqual = true.
 * 2. Canonical serialization and deserialization perform a byte-for-byte lossless roundtrip.
 */

import { canonicalizeComposite } from '../core/canonicalizer';
import { areCanonicalCompositesEqual } from '../core/comparator';
import { deserializeCanonicalComposite, serializeCanonicalComposite } from '../core/signature';
import { RawCompositeInput } from '../types/canonical';

export function testEqualityAndRoundtrip(): { passed: boolean; details: string } {
  const compInput: RawCompositeInput = {
    origin: { x: 5, y: 10, z: 15 },
    transformMetadata: { tag: 'CLUSTER_ALPHA', version: 1 },
    children: [
      { dictId: 50, position: { x: 5, y: 10, z: 15 }, order: 0 },
      { dictId: 51, position: { x: 7, y: 10, z: 15 }, order: 1 },
      { dictId: 52, position: { x: 5, y: 13, z: 18 }, order: 2 },
    ],
  };

  const res = canonicalizeComposite(compInput);
  if (!res.success || !res.canonical) {
    return { passed: false, details: 'Canonicalization failed in equality test.' };
  }

  const originalCanonical = res.canonical;

  // 1. Serialization
  const serializedStr = serializeCanonicalComposite(originalCanonical);

  // 2. Deserialization
  const roundtripCanonical = deserializeCanonicalComposite(serializedStr);

  // 3. Compare original with roundtripped
  const areEqual = areCanonicalCompositesEqual(originalCanonical, roundtripCanonical);
  const sigMatch = originalCanonical.signature === roundtripCanonical.signature;
  const fpMatch = originalCanonical.fingerprint === roundtripCanonical.fingerprint;
  const metaMatch = originalCanonical.transformMetadata?.tag === roundtripCanonical.transformMetadata?.tag;

  const passed = areEqual && sigMatch && fpMatch && metaMatch;

  return {
    passed,
    details: passed
      ? `Canonical Equality & Roundtrip Verified: Exact parity preserved across serialization/deserialization cycle (Signature: ${originalCanonical.signature}, Fingerprint: ${originalCanonical.fingerprint}).`
      : `Equality/Roundtrip test failed: areEqual=${areEqual}, sigMatch=${sigMatch}, fpMatch=${fpMatch}.`,
  };
}
