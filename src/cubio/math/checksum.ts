/**
 * CUBiO AI — Task 17: Native Mathematical Representation Layer
 * Phase 1 — Mathematical Core
 * src/cubio/math/checksum.ts
 *
 * Single Canonical Integrity Checksum standard:
 * Directly reuses the canonical SHA-256 integrity infrastructure from
 * src/cubio/core/canonicalIdentity.ts.
 *
 * INVARIANT: No competing or divergent hashing mechanisms permitted.
 */

import { calculateCanonicalChecksum } from '../core/canonicalIdentity';

/**
 * Computes the deterministic canonical SHA-256 digest of a native mathematical payload.
 */
export function computeMathChecksum(payload: Record<string, unknown>): string {
  // Strip any pre-existing checksum field to guarantee idempotency and content-only hashing
  const cleanPayload: Record<string, unknown> = {};
  for (const key of Object.keys(payload)) {
    if (key !== 'checksum') {
      cleanPayload[key] = payload[key];
    }
  }
  return calculateCanonicalChecksum(cleanPayload);
}
