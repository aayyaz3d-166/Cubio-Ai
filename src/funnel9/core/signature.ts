/**
 * 3D Memory Studio - Funnel 9: Signature & Fingerprint Engine
 * 
 * Generates deterministic signature strings and lookup fingerprints for canonical composites.
 * 
 * Rules:
 * - Deterministic serialization order: Children are serialized in their exact logical order.
 * - Signatures encode hierarchy level, transform type, child count, child dictIds, relative offsets, and ordering.
 * - Fingerprints are 32-bit FNV-1a hexadecimal strings used ONLY for fast lookup acceleration.
 * - Fingerprints MUST NEVER be used as the sole equality check.
 */

import { CanonicalChildRecord, CanonicalComposite, FUNNEL9_TRANSFORM } from '../types/canonical';

/**
 * Deterministic JSON stringifier with alphabetically sorted object keys
 */
export function deterministicStringify(value: unknown): string {
  if (value === null || value === undefined) {
    return String(value);
  }
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'string') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return '[' + value.map((item) => deterministicStringify(item)).join(',') + ']';
  }
  if (typeof value === 'object') {
    const keys = Object.keys(value as Record<string, unknown>).sort();
    const entries = keys.map(
      (k) => `${JSON.stringify(k)}:${deterministicStringify((value as Record<string, unknown>)[k])}`
    );
    return '{' + entries.join(',') + '}';
  }
  return JSON.stringify(value);
}

/**
 * Computes a 32-bit FNV-1a hash formatted as an 8-character uppercase hex string.
 * Fast, pure, and deterministic across runtime environments.
 */
export function calculateFNV1aHex(input: string): string {
  let hash = 0x811c9dc5; // 2166136261 (FNV offset basis)
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    // 32-bit FNV prime multiplication: hash * 16777619
    hash = Math.imul(hash, 0x01000193);
  }
  // Convert to unsigned 32-bit integer hex string
  const unsigned = hash >>> 0;
  return '0x' + unsigned.toString(16).padStart(8, '0').toUpperCase();
}

/**
 * Constructs the canonical signature string for an ordered list of canonical child records.
 * 
 * Format:
 * `COMP3:T=TRANSLATION:N=<count>:[D=<dictId>@(<dx>,<dy>,<dz>)#<order>|...]`
 */
export function calculateCompositeSignature(
  children: readonly CanonicalChildRecord[],
  transform: string = FUNNEL9_TRANSFORM,
  transformMetadata?: Readonly<Record<string, unknown>>
): string {
  const parts: string[] = [];

  parts.push(`LV=3`);
  parts.push(`T=${transform}`);
  parts.push(`N=${children.length}`);

  if (transformMetadata && Object.keys(transformMetadata).length > 0) {
    parts.push(`M=${deterministicStringify(transformMetadata)}`);
  }

  const childTokens = children.map((c) => {
    let metaPart = '';
    if (c.transformMetadata && Object.keys(c.transformMetadata).length > 0) {
      metaPart = `+M=${deterministicStringify(c.transformMetadata)}`;
    }
    return `[D=${c.dictId}@(${c.offset.dx},${c.offset.dy},${c.offset.dz})#${c.order}${metaPart}]`;
  });

  parts.push(`C=${childTokens.join(';')}`);

  return `COMP3:(${parts.join('|')})`;
}

/**
 * Calculates the lookup fingerprint (hash) from a canonical composite or its signature.
 * Note: Used solely as a lookup accelerator; never as a sole equality condition.
 */
export function calculateCompositeFingerprint(signature: string): string {
  return calculateFNV1aHex(signature);
}

/**
 * Serializes a CanonicalComposite into an explicit deterministic string format for lossless roundtrips.
 */
export function serializeCanonicalComposite(canonical: CanonicalComposite): string {
  return deterministicStringify({
    hierarchyLevel: canonical.hierarchyLevel,
    childCount: canonical.childCount,
    transform: canonical.transform,
    transformMetadata: canonical.transformMetadata || null,
    children: canonical.children.map((c) => ({
      dictId: c.dictId,
      offset: { dx: c.offset.dx, dy: c.offset.dy, dz: c.offset.dz },
      order: c.order,
      transform: c.transform,
      transformMetadata: c.transformMetadata || null,
      hierarchyLevel: c.hierarchyLevel,
    })),
    signature: canonical.signature,
    fingerprint: canonical.fingerprint,
    relativeBoundingBox: canonical.relativeBoundingBox,
  });
}

/**
 * Deserializes a canonical JSON string back into a strongly typed, frozen CanonicalComposite object.
 */
export function deserializeCanonicalComposite(serialized: string): CanonicalComposite {
  const parsed = JSON.parse(serialized);

  const children: CanonicalChildRecord[] = (parsed.children || []).map((c: any) =>
    Object.freeze({
      dictId: Number(c.dictId),
      offset: Object.freeze({
        dx: Number(c.offset.dx),
        dy: Number(c.offset.dy),
        dz: Number(c.offset.dz),
      }),
      order: Number(c.order),
      transform: FUNNEL9_TRANSFORM,
      transformMetadata: c.transformMetadata ? Object.freeze(c.transformMetadata) : undefined,
      hierarchyLevel: 2 as const,
    })
  );

  return Object.freeze({
    hierarchyLevel: 3 as const,
    childCount: Number(parsed.childCount || children.length),
    children: Object.freeze(children),
    transform: FUNNEL9_TRANSFORM,
    transformMetadata: parsed.transformMetadata ? Object.freeze(parsed.transformMetadata) : undefined,
    signature: String(parsed.signature),
    fingerprint: String(parsed.fingerprint),
    relativeBoundingBox: Object.freeze({
      minDx: Number(parsed.relativeBoundingBox.minDx),
      maxDx: Number(parsed.relativeBoundingBox.maxDx),
      minDy: Number(parsed.relativeBoundingBox.minDy),
      maxDy: Number(parsed.relativeBoundingBox.maxDy),
      minDz: Number(parsed.relativeBoundingBox.minDz),
      maxDz: Number(parsed.relativeBoundingBox.maxDz),
      spanX: Number(parsed.relativeBoundingBox.spanX),
      spanY: Number(parsed.relativeBoundingBox.spanY),
      spanZ: Number(parsed.relativeBoundingBox.spanZ),
    }),
  });
}
