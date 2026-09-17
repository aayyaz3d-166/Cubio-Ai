/**
 * CUBiO AI — Task 22: Native Sparse Memory Architecture
 * Phase 2 — Native Memory
 * src/cubio/memory/native/validation.ts
 *
 * Strict validation and bounds enforcement for native memory items.
 */

import { validateCellId } from '../../../core/address369';
import {
  MAX_OBJECT_ID_LENGTH,
  MAX_TENANT_ID_LENGTH,
  MAX_TAGS_COUNT,
  MAX_TAG_LENGTH,
  MAX_ATTRIBUTES_COUNT,
  MAX_METADATA_BYTES,
  NativeMemoryMetadata,
} from './types';
import { DeterministicState } from '../../math/engine/types';
import { NativeMathValue } from '../../math/types';

export class NativeMemoryValidationError extends Error {
  constructor(message: string) {
    super(`[NATIVE_MEMORY_VALIDATION_ERROR] ${message}`);
    this.name = 'NativeMemoryValidationError';
  }
}

export class TenantIsolationError extends Error {
  constructor(message: string) {
    super(`[TENANT_ISOLATION_ERROR] ${message}`);
    this.name = 'TenantIsolationError';
  }
}

/**
 * Asserts that an objectId is a valid non-empty string within size bounds.
 */
export function assertValidObjectId(objectId: string): void {
  if (typeof objectId !== 'string' || objectId.trim().length === 0) {
    throw new NativeMemoryValidationError('objectId must be a non-empty string');
  }
  if (objectId.length > MAX_OBJECT_ID_LENGTH) {
    throw new NativeMemoryValidationError(
      `objectId exceeds maximum length (${MAX_OBJECT_ID_LENGTH}): length=${objectId.length}`
    );
  }
}

/**
 * Asserts that a tenantId is a valid non-empty string within size bounds.
 */
export function assertValidTenantId(tenantId: string): void {
  if (typeof tenantId !== 'string' || tenantId.trim().length === 0) {
    throw new NativeMemoryValidationError('tenantId must be a non-empty string');
  }
  if (tenantId.length > MAX_TENANT_ID_LENGTH) {
    throw new NativeMemoryValidationError(
      `tenantId exceeds maximum length (${MAX_TENANT_ID_LENGTH}): length=${tenantId.length}`
    );
  }
}

/**
 * Validates metadata tags and attributes for bounds and finite values.
 */
export function assertValidMetadata(metadata: Partial<NativeMemoryMetadata>): void {
  if (!metadata || typeof metadata !== 'object') {
    throw new NativeMemoryValidationError('metadata must be an object');
  }

  if (metadata.tags !== undefined) {
    if (!Array.isArray(metadata.tags)) {
      throw new NativeMemoryValidationError('metadata.tags must be an array');
    }
    if (metadata.tags.length > MAX_TAGS_COUNT) {
      throw new NativeMemoryValidationError(
        `metadata.tags exceeds maximum count (${MAX_TAGS_COUNT}): count=${metadata.tags.length}`
      );
    }
    for (let i = 0; i < metadata.tags.length; i++) {
      const tag = metadata.tags[i];
      if (typeof tag !== 'string' || tag.trim().length === 0) {
        throw new NativeMemoryValidationError(`Tag at index ${i} must be a non-empty string`);
      }
      if (tag.length > MAX_TAG_LENGTH) {
        throw new NativeMemoryValidationError(
          `Tag "${tag}" exceeds maximum length (${MAX_TAG_LENGTH})`
        );
      }
    }
  }

  if (metadata.attributes !== undefined) {
    if (typeof metadata.attributes !== 'object' || metadata.attributes === null) {
      throw new NativeMemoryValidationError('metadata.attributes must be an object');
    }
    const keys = Object.keys(metadata.attributes);
    if (keys.length > MAX_ATTRIBUTES_COUNT) {
      throw new NativeMemoryValidationError(
        `metadata.attributes exceeds maximum count (${MAX_ATTRIBUTES_COUNT}): count=${keys.length}`
      );
    }
    for (const k of keys) {
      const v = metadata.attributes[k];
      if (typeof v === 'number') {
        if (!Number.isFinite(v)) {
          throw new NativeMemoryValidationError(
            `Attribute "${k}" contains non-finite number: ${v}`
          );
        }
      } else if (typeof v !== 'string' && typeof v !== 'boolean') {
        throw new NativeMemoryValidationError(
          `Attribute "${k}" has invalid type. Permitted: string | number | boolean. Received: ${typeof v}`
        );
      }
    }
  }

  // Check serialized size bounds
  const approxBytes = JSON.stringify(metadata).length * 2;
  if (approxBytes > MAX_METADATA_BYTES) {
    throw new NativeMemoryValidationError(
      `Metadata serialized payload size (${approxBytes} bytes) exceeds limit (${MAX_METADATA_BYTES} bytes)`
    );
  }
}

/**
 * Asserts that a state object is a valid Phase 1 mathematical structure.
 */
export function assertValidMemoryState(state: DeterministicState | NativeMathValue): void {
  if (!state || typeof state !== 'object' || typeof state.mathType !== 'string' || typeof state.checksum !== 'string') {
    throw new NativeMemoryValidationError('Memory state must be a valid NativeMathValue or DeterministicState with a checksum');
  }
}

/**
 * Asserts spatial cell validity via canonical authority.
 */
export function assertValidMemoryCellId(cellId?: number | null): void {
  if (cellId !== undefined && cellId !== null) {
    try {
      validateCellId(cellId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new NativeMemoryValidationError(`Invalid spatial cellId for memory item: ${msg}`);
    }
  }
}
