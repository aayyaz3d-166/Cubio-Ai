/**
 * Funnel 9 Test: Hash Collision Safety
 * 
 * Verifies that:
 * 1. Fingerprint/hash is ONLY a lookup accelerator.
 * 2. In the event of a hash collision (two distinct composites mapping to the same fingerprint),
 *    the two-stage safe comparator NEVER produces a false positive.
 */

import { canonicalizeComposite } from '../core/canonicalizer';
import { areCanonicalCompositesEqual, CanonicalCompositeCatalog } from '../core/comparator';
import { CanonicalComposite, RawCompositeInput } from '../types/canonical';

export function testHashCollisionSafety(): { passed: boolean; details: string } {
  const comp1Input: RawCompositeInput = {
    children: [
      { dictId: 10, position: { x: 0, y: 0, z: 0 }, order: 0 },
      { dictId: 20, position: { x: 1, y: 0, z: 0 }, order: 1 },
    ],
  };

  const comp2Input: RawCompositeInput = {
    children: [
      { dictId: 10, position: { x: 0, y: 0, z: 0 }, order: 0 },
      { dictId: 30, position: { x: 1, y: 0, z: 0 }, order: 1 }, // Dict 30 instead of 20
    ],
  };

  const can1 = canonicalizeComposite(comp1Input).canonical!;
  const can2 = canonicalizeComposite(comp2Input).canonical!;

  // Verify that the two composites are structurally distinct
  const areActuallyEqual = areCanonicalCompositesEqual(can1, can2);

  // Force simulated identical fingerprint for testing collision safety
  const forcedFingerprint = '0xDEADBEEF';
  const collidingCan1: CanonicalComposite = {
    ...can1,
    fingerprint: forcedFingerprint,
  };
  const collidingCan2: CanonicalComposite = {
    ...can2,
    fingerprint: forcedFingerprint,
  };

  // Register both colliding composites into catalog
  const catalog = new CanonicalCompositeCatalog();
  catalog.register(collidingCan1);
  catalog.register(collidingCan2);

  // Bucket should have both items
  const bucket = catalog.getBucket(forcedFingerprint);
  const bucketHas2 = bucket.length === 2;

  // Search for can1 -> must find collidingCan1, NOT collidingCan2
  const match1 = catalog.findMatch(collidingCan1);
  const match2 = catalog.findMatch(collidingCan2);

  const matchedCorrectly1 = match1 !== null && match1.children[1].dictId === 20;
  const matchedCorrectly2 = match2 !== null && match2.children[1].dictId === 30;

  // Search for a non-existent composite with the same forced fingerprint
  const nonExistentCan: CanonicalComposite = {
    ...can1,
    fingerprint: forcedFingerprint,
    children: [
      {
        dictId: 999,
        offset: { dx: 0, dy: 0, dz: 0 },
        order: 0,
        transform: 'TRANSLATION',
        hierarchyLevel: 2,
      },
    ],
  };
  const matchNonExistent = catalog.findMatch(nonExistentCan);
  const nonExistentRejected = matchNonExistent === null;

  const passed =
    !areActuallyEqual &&
    bucketHas2 &&
    matchedCorrectly1 &&
    matchedCorrectly2 &&
    nonExistentRejected;

  return {
    passed,
    details: passed
      ? `Hash Collision Safety Verified: Simulated 0xDEADBEEF hash collision handled cleanly via two-stage verification. Distinct composites in the same bucket never produced false positives.`
      : `Collision safety failed: areActuallyEqual=${areActuallyEqual}, bucketHas2=${bucketHas2}, matchedCorrectly1=${matchedCorrectly1}, nonExistentRejected=${nonExistentRejected}.`,
  };
}
