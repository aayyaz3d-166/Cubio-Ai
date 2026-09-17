/**
 * CUBiO AI — Task 31: Native Information Representation Layer
 * Phase 3 — Information Intelligence
 * src/cubio/information/native/infoSerialization.ts
 *
 * Deterministic canonical serialization and cryptographic SHA-256 hashing
 * for native information payloads and canonical identities.
 */

import { createHash } from 'node:crypto';
import { InformationPayload, CanonicalInformationIdentity } from './infoTypes';

/**
 * Deeply and deterministically serializes any JS value into a canonical JSON string.
 * All object keys are sorted recursively in strict Unicode code-point order.
 */
export function canonicalJsonStringify(value: unknown): string {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') {
    return JSON.stringify(value);
  }

  if (typeof value === 'number') {
    if (Object.is(value, -0)) return '0';
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    const elements = value.map((el) => canonicalJsonStringify(el));
    return `[${elements.join(',')}]`;
  }

  if (typeof value === 'object') {
    const keys = Object.keys(value).sort();
    const entries: string[] = [];
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      const v = (value as Record<string, unknown>)[k];
      if (v !== undefined) {
        entries.push(`${JSON.stringify(k)}:${canonicalJsonStringify(v)}`);
      }
    }
    return `{${entries.join(',')}}`;
  }

  return JSON.stringify(value);
}

/**
 * Computes a content-addressable SHA-256 digest over the canonical information payload.
 * Used for detecting duplicates and aliasing across memory records.
 */
export function computeInformationContentHash(payload: InformationPayload): string {
  const canonicalStr = canonicalJsonStringify(payload);
  return createHash('sha256').update(canonicalStr, 'utf8').digest('hex');
}

/**
 * Computes the primary cryptographic SHA-256 checksum for a NativeInformationObject,
 * binding its canonical identity metadata, version lineage, and payload.
 */
export function computeInformationChecksum(
  identity: {
    readonly objectId: string;
    readonly tenantId: string;
    readonly domain: string;
    readonly stateVersion: number;
    readonly parentChecksum?: string;
  },
  payload: InformationPayload
): string {
  const canonicalStr = canonicalJsonStringify({
    identity: {
      objectId: identity.objectId,
      tenantId: identity.tenantId,
      domain: identity.domain,
      stateVersion: identity.stateVersion,
      parentChecksum: identity.parentChecksum ?? null,
    },
    payload,
  });
  return createHash('sha256').update(canonicalStr, 'utf8').digest('hex');
}

/**
 * Recursively freezes an object and all nested properties.
 */
export function deepFreeze<T>(obj: T): Readonly<T> {
  if (obj === null || typeof obj !== 'object' || Object.isFrozen(obj)) {
    return obj as Readonly<T>;
  }

  Object.freeze(obj);

  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      deepFreeze(obj[i]);
    }
  } else {
    for (const key of Object.keys(obj)) {
      deepFreeze((obj as Record<string, unknown>)[key]);
    }
  }

  return obj as Readonly<T>;
}
