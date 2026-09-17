/**
 * CUBiO AI — Task 04: Canonical Identity Foundation
 * src/cubio/core/canonicalIdentity.ts
 *
 * Implements the Universal Canonical Identity Contract:
 *
 *   Universal Identity (objectId)
 *       ≠
 *   Spatial Location (cellId / blockId)
 *       ≠
 *   State Version (stateVersion)
 *       ≠
 *   Content Integrity (checksum)
 *
 * Principles:
 * 1. objectId is immutable and universal.
 * 2. cellId is optional spatial location (0..342).
 * 3. address369 and (x, y, z) are ALWAYS derived from cellId via src/core/address369.ts.
 * 4. objectId NEVER changes when an entity moves to a new cellId.
 * 5. Checksum is a deterministic SHA-256 digest of the payload.
 * 6. stateVersion increments monotonically (1..N).
 * 7. Multi-tenant isolation is scoped via tenantId (default 'root').
 */

import * as crypto from 'crypto';
import {
  DIMENSION,
  TOTAL_SPATIAL_CELLS,
  TOTAL_ADDRESS_SPACE,
  SPATIAL_ADDRESS_OFFSET,
  SPATIAL_ADDRESS_END,
  validateCellId,
  cellIdToCoordinate,
  cellIdToAddress369,
  address369ToCellId,
  coordinateToCellId,
} from '../../core/address369';
import { Coordinate3D } from '../../types/memory';

export {
  DIMENSION,
  TOTAL_SPATIAL_CELLS,
  TOTAL_ADDRESS_SPACE,
  SPATIAL_ADDRESS_OFFSET,
  SPATIAL_ADDRESS_END,
};

export type CanonicalDomain =
  | 'SPATIAL_MEMORY'
  | 'CONVERSATIONAL'
  | 'KNOWLEDGE'
  | 'GOVERNANCE'
  | 'TRAINING'
  | 'RESEARCH'
  | 'SYSTEM';

export const VALID_CANONICAL_DOMAINS: readonly CanonicalDomain[] = Object.freeze([
  'SPATIAL_MEMORY',
  'CONVERSATIONAL',
  'KNOWLEDGE',
  'GOVERNANCE',
  'TRAINING',
  'RESEARCH',
  'SYSTEM',
]);

export const DEFAULT_TENANT_ID = 'root';

/**
 * Universal Canonical Identity Key
 * Lightweight pure data pointer for all CubiO data/state objects.
 */
export interface CanonicalIdentityKey {
  /** Globally unique, immutable entity identifier (e.g. URN:CUBIO:{domain}:{uniqueKey}) */
  readonly objectId: string;

  /** Tenant / namespace isolation scope */
  readonly tenantId: string;

  /** Functional architectural domain */
  readonly domain: CanonicalDomain;

  /** Monotonic revision number of this entity state (1, 2, 3...) */
  readonly stateVersion: number;

  /** Deterministic content integrity digest of the payload (SHA-256 hex) */
  readonly checksum: string;

  /** Optional spatial location cell index in range [0..342] */
  readonly cellId?: number;

  /** Optional spatial hierarchical block index (0..N) */
  readonly blockId?: number;
}

/**
 * Derived spatial attributes resolved on-the-fly from cellId.
 * NEVER stored redundantly.
 */
export interface DerivedSpatialIdentity {
  readonly cellId: number;
  readonly address369: number;
  readonly coordinate: readonly [number, number, number];
  readonly blockId: number;
}

/**
 * Deterministically canonicalizes any JavaScript value into a stable JSON string
 * where object keys are sorted lexicographically at every nested level.
 */
export function canonicalStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return '[' + value.map((v) => canonicalStringify(v)).join(',') + ']';
  }

  const obj = value as Record<string, unknown>;
  const sortedKeys = Object.keys(obj).sort();
  const pairs = sortedKeys.map(
    (key) => JSON.stringify(key) + ':' + canonicalStringify(obj[key])
  );
  return '{' + pairs.join(',') + '}';
}

/**
 * Computes a deterministic SHA-256 hex checksum of arbitrary payload data.
 */
export function calculateCanonicalChecksum(payload: unknown): string {
  const canonicalPayload = canonicalStringify(payload);
  return crypto.createHash('sha256').update(canonicalPayload, 'utf8').digest('hex');
}

/**
 * Generates a stable, unique universal objectId.
 * Format: URN:CUBIO:{domain}:{uniqueKey}
 */
export function generateCanonicalObjectId(domain: CanonicalDomain, customKey?: string): string {
  const key = customKey && customKey.trim().length > 0
    ? customKey.trim()
    : crypto.randomBytes(12).toString('hex');
  return `URN:CUBIO:${domain}:${key}`;
}

/**
 * Validates that a number is a valid canonical spatial cell ID [0..342].
 */
export function isValidCellId(cellId: unknown): cellId is number {
  return typeof cellId === 'number' && Number.isInteger(cellId) && cellId >= 0 && cellId < TOTAL_SPATIAL_CELLS;
}

/**
 * Strictly validates a CanonicalIdentityKey against all architectural invariants.
 * Throws an Error with explicit description upon invariant violation.
 */
export function validateCanonicalIdentity(key: CanonicalIdentityKey): void {
  if (!key || typeof key !== 'object') {
    throw new Error('CanonicalIdentityKey must be a valid object.');
  }

  if (typeof key.objectId !== 'string' || key.objectId.trim().length === 0) {
    throw new Error('CanonicalIdentityKey.objectId must be a non-empty string.');
  }

  if (typeof key.tenantId !== 'string' || key.tenantId.trim().length === 0) {
    throw new Error('CanonicalIdentityKey.tenantId must be a non-empty string.');
  }

  if (!VALID_CANONICAL_DOMAINS.includes(key.domain)) {
    throw new Error(`Invalid CanonicalIdentityKey.domain: "${key.domain}". Must be one of [${VALID_CANONICAL_DOMAINS.join(', ')}].`);
  }

  if (typeof key.stateVersion !== 'number' || !Number.isInteger(key.stateVersion) || key.stateVersion < 1) {
    throw new Error(`CanonicalIdentityKey.stateVersion must be a positive integer >= 1. Got: ${key.stateVersion}`);
  }

  if (typeof key.checksum !== 'string' || !/^[0-9a-f]{64}$/i.test(key.checksum)) {
    throw new Error(`CanonicalIdentityKey.checksum must be a 64-character hex string (SHA-256). Got: "${key.checksum}"`);
  }

  if (key.cellId !== undefined) {
    if (!isValidCellId(key.cellId)) {
      throw new Error(`CanonicalIdentityKey.cellId out of bounds [0..342]: ${key.cellId}`);
    }
  }

  if (key.blockId !== undefined) {
    if (typeof key.blockId !== 'number' || !Number.isInteger(key.blockId) || key.blockId < 0) {
      throw new Error(`CanonicalIdentityKey.blockId must be a non-negative integer. Got: ${key.blockId}`);
    }
  }
}

/**
 * Factory for creating immutable CanonicalIdentityKey instances.
 */
export function createCanonicalIdentity(params: {
  objectId?: string;
  tenantId?: string;
  domain: CanonicalDomain;
  stateVersion?: number;
  payload?: unknown;
  checksum?: string;
  cellId?: number;
  blockId?: number;
}): CanonicalIdentityKey {
  const domain = params.domain;
  const objectId = params.objectId && params.objectId.trim().length > 0
    ? params.objectId.trim()
    : generateCanonicalObjectId(domain);
  const tenantId = params.tenantId && params.tenantId.trim().length > 0
    ? params.tenantId.trim()
    : DEFAULT_TENANT_ID;
  const stateVersion = params.stateVersion ?? 1;

  let checksum = params.checksum;
  if (!checksum) {
    if (params.payload !== undefined) {
      checksum = calculateCanonicalChecksum(params.payload);
    } else {
      checksum = calculateCanonicalChecksum({ objectId, domain, stateVersion, cellId: params.cellId });
    }
  }

  const key: CanonicalIdentityKey = Object.freeze({
    objectId,
    tenantId,
    domain,
    stateVersion,
    checksum,
    ...(params.cellId !== undefined ? { cellId: params.cellId } : {}),
    ...(params.blockId !== undefined ? { blockId: params.blockId } : {}),
  });

  validateCanonicalIdentity(key);
  return key;
}

/**
 * Resolves derived spatial properties from an identity key.
 * Throws if the object is non-spatial (cellId is undefined).
 */
export function deriveSpatialIdentity(key: CanonicalIdentityKey): DerivedSpatialIdentity {
  if (key.cellId === undefined) {
    throw new Error(`Cannot derive spatial identity for non-spatial object: ${key.objectId}`);
  }
  validateCellId(key.cellId);
  const coord = cellIdToCoordinate(key.cellId);
  const address369 = cellIdToAddress369(key.cellId);
  return Object.freeze({
    cellId: key.cellId,
    address369,
    coordinate: [coord.x, coord.y, coord.z] as const,
    blockId: key.blockId ?? 0,
  });
}

/**
 * Creates a new state version for an existing canonical object without changing its identity.
 */
export function createNextVersion(
  current: CanonicalIdentityKey,
  updates: {
    newPayload?: unknown;
    newChecksum?: string;
    newCellId?: number;
    newBlockId?: number;
  }
): CanonicalIdentityKey {
  const nextChecksum = updates.newChecksum ?? (
    updates.newPayload !== undefined
      ? calculateCanonicalChecksum(updates.newPayload)
      : current.checksum
  );

  return createCanonicalIdentity({
    objectId: current.objectId,
    tenantId: current.tenantId,
    domain: current.domain,
    stateVersion: current.stateVersion + 1,
    checksum: nextChecksum,
    cellId: updates.newCellId !== undefined ? updates.newCellId : current.cellId,
    blockId: updates.newBlockId !== undefined ? updates.newBlockId : current.blockId,
  });
}
