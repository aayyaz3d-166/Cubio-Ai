/**
 * CUBiO AI — Task 31: Native Information Representation Layer
 * Phase 3 — Information Intelligence
 * src/cubio/information/native/infoValidation.ts
 *
 * Strict fail-closed validation rules for native information payloads.
 * Rejects NaN, Infinity, unbounded payloads, circular references, and malformed structures.
 */

import { assertValidObjectId, assertValidTenantId } from '../../memory/native/validation';
import {
  InformationModality,
  InformationPayload,
  NativeTextPayload,
  NativeNumericPayload,
  NativeCategoricalPayload,
  NativeStructuredPayload,
  NativeInformationPrimitive,
} from './infoTypes';

export class NativeInformationValidationError extends Error {
  public constructor(message: string) {
    super(`[NATIVE_INFORMATION_VALIDATION_ERROR] ${message}`);
    this.name = 'NativeInformationValidationError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Configured architectural hard bounds */
export const MAX_TEXT_CONTENT_BYTES = 1_048_576; // 1 MB text limit
export const MAX_NUMERIC_VECTOR_LENGTH = 10_000;
export const MAX_NUMERIC_TENSOR_ELEMENTS = 10_000;
export const MAX_STRUCTURED_FIELDS = 1_000;
export const MAX_STRUCTURED_DEPTH = 16;

/**
 * Validates that a value is a strictly finite number (not NaN, not Infinity).
 */
export function assertFiniteNumber(value: unknown, context: string): asserts value is number {
  if (typeof value !== 'number') {
    throw new NativeInformationValidationError(`${context} must be a number, received: ${typeof value}`);
  }
  if (Number.isNaN(value)) {
    throw new NativeInformationValidationError(`${context} cannot be NaN`);
  }
  if (!Number.isFinite(value)) {
    throw new NativeInformationValidationError(`${context} cannot be Infinity or -Infinity`);
  }
}

/**
 * Validates a NativeTextPayload fail-closed.
 */
export function validateTextPayload(payload: NativeTextPayload): void {
  if (!payload || typeof payload !== 'object') {
    throw new NativeInformationValidationError('Text payload must be a non-null object');
  }
  if (payload.modality !== 'TEXT') {
    throw new NativeInformationValidationError(`Expected modality 'TEXT', received: ${payload.modality}`);
  }
  if (typeof payload.content !== 'string') {
    throw new NativeInformationValidationError('Text content must be a string');
  }
  const byteLength = Buffer.byteLength(payload.content, 'utf8');
  if (byteLength > MAX_TEXT_CONTENT_BYTES) {
    throw new NativeInformationValidationError(
      `Text content byte length (${byteLength}) exceeds maximum bound (${MAX_TEXT_CONTENT_BYTES})`
    );
  }
  if (payload.encoding !== 'utf-8') {
    throw new NativeInformationValidationError(`Text encoding must be 'utf-8', received: ${payload.encoding}`);
  }
  if (payload.charCount !== payload.content.length) {
    throw new NativeInformationValidationError(
      `charCount (${payload.charCount}) does not match content length (${payload.content.length})`
    );
  }
  if (payload.tokensCount !== undefined) {
    assertFiniteNumber(payload.tokensCount, 'tokensCount');
    if (payload.tokensCount < 0) {
      throw new NativeInformationValidationError('tokensCount cannot be negative');
    }
  }
  if (payload.language !== undefined) {
    if (typeof payload.language !== 'string' || payload.language.trim().length === 0) {
      throw new NativeInformationValidationError('Language tag must be a non-empty string');
    }
  }
}

/**
 * Validates a NativeNumericPayload fail-closed.
 */
export function validateNumericPayload(payload: NativeNumericPayload): void {
  if (!payload || typeof payload !== 'object') {
    throw new NativeInformationValidationError('Numeric payload must be a non-null object');
  }
  if (payload.modality !== 'NUMERIC') {
    throw new NativeInformationValidationError(`Expected modality 'NUMERIC', received: ${payload.modality}`);
  }

  if (payload.min !== undefined) {
    assertFiniteNumber(payload.min, 'min');
  }
  if (payload.max !== undefined) {
    assertFiniteNumber(payload.max, 'max');
  }
  if (payload.min !== undefined && payload.max !== undefined && payload.min > payload.max) {
    throw new NativeInformationValidationError(`Numeric min (${payload.min}) cannot exceed max (${payload.max})`);
  }

  switch (payload.kind) {
    case 'SCALAR': {
      assertFiniteNumber(payload.value, 'Scalar numeric value');
      if (payload.min !== undefined && (payload.value as number) < payload.min) {
        throw new NativeInformationValidationError(`Scalar value ${payload.value} is below min ${payload.min}`);
      }
      if (payload.max !== undefined && (payload.value as number) > payload.max) {
        throw new NativeInformationValidationError(`Scalar value ${payload.value} exceeds max ${payload.max}`);
      }
      if (!Array.isArray(payload.shape) || payload.shape.length !== 1 || payload.shape[0] !== 1) {
        throw new NativeInformationValidationError('Scalar shape must be [1]');
      }
      break;
    }
    case 'VECTOR': {
      if (!Array.isArray(payload.value)) {
        throw new NativeInformationValidationError('Vector numeric value must be an array');
      }
      if (payload.value.length === 0) {
        throw new NativeInformationValidationError('Vector cannot be empty');
      }
      if (payload.value.length > MAX_NUMERIC_VECTOR_LENGTH) {
        throw new NativeInformationValidationError(
          `Vector length ${payload.value.length} exceeds maximum bound ${MAX_NUMERIC_VECTOR_LENGTH}`
        );
      }
      for (let i = 0; i < payload.value.length; i++) {
        assertFiniteNumber(payload.value[i], `Vector element at index ${i}`);
        if (payload.min !== undefined && payload.value[i] < payload.min) {
          throw new NativeInformationValidationError(
            `Vector element at index ${i} (${payload.value[i]}) is below min ${payload.min}`
          );
        }
        if (payload.max !== undefined && payload.value[i] > payload.max) {
          throw new NativeInformationValidationError(
            `Vector element at index ${i} (${payload.value[i]}) exceeds max ${payload.max}`
          );
        }
      }
      if (!Array.isArray(payload.shape) || payload.shape.length !== 1 || payload.shape[0] !== payload.value.length) {
        throw new NativeInformationValidationError(
          `Vector shape [${payload.shape}] does not match length [${payload.value.length}]`
        );
      }
      break;
    }
    case 'TENSOR': {
      if (!Array.isArray(payload.value)) {
        throw new NativeInformationValidationError('Tensor numeric value must be a 2D array');
      }
      const rows = payload.value.length;
      if (rows === 0) {
        throw new NativeInformationValidationError('Tensor cannot be empty');
      }
      const firstRow = payload.value[0];
      if (!Array.isArray(firstRow) || firstRow.length === 0) {
        throw new NativeInformationValidationError('Tensor rows must be non-empty arrays');
      }
      const cols = firstRow.length;
      const totalElements = rows * cols;
      if (totalElements > MAX_NUMERIC_TENSOR_ELEMENTS) {
        throw new NativeInformationValidationError(
          `Tensor elements count ${totalElements} exceeds bound ${MAX_NUMERIC_TENSOR_ELEMENTS}`
        );
      }
      for (let r = 0; r < rows; r++) {
        const row = payload.value[r];
        if (!Array.isArray(row) || row.length !== cols) {
          throw new NativeInformationValidationError(`Tensor row ${r} length ${row?.length} does not match cols ${cols}`);
        }
        for (let c = 0; c < cols; c++) {
          assertFiniteNumber(row[c], `Tensor element at [${r}, ${c}]`);
          if (payload.min !== undefined && row[c] < payload.min) {
            throw new NativeInformationValidationError(`Tensor element [${r}, ${c}] is below min ${payload.min}`);
          }
          if (payload.max !== undefined && row[c] > payload.max) {
            throw new NativeInformationValidationError(`Tensor element [${r}, ${c}] exceeds max ${payload.max}`);
          }
        }
      }
      if (!Array.isArray(payload.shape) || payload.shape.length !== 2 || payload.shape[0] !== rows || payload.shape[1] !== cols) {
        throw new NativeInformationValidationError(
          `Tensor shape [${payload.shape}] does not match matrix dimensions [${rows}, ${cols}]`
        );
      }
      break;
    }
    default: {
      throw new NativeInformationValidationError(`Unsupported numeric kind: ${(payload as any).kind}`);
    }
  }
}

/**
 * Validates a NativeCategoricalPayload fail-closed.
 */
export function validateCategoricalPayload(payload: NativeCategoricalPayload): void {
  if (!payload || typeof payload !== 'object') {
    throw new NativeInformationValidationError('Categorical payload must be a non-null object');
  }
  if (payload.modality !== 'CATEGORICAL') {
    throw new NativeInformationValidationError(`Expected modality 'CATEGORICAL', received: ${payload.modality}`);
  }
  if (typeof payload.category !== 'string' || payload.category.trim().length === 0) {
    throw new NativeInformationValidationError('Category must be a non-empty string');
  }
  if (typeof payload.label !== 'string' || payload.label.trim().length === 0) {
    throw new NativeInformationValidationError('Label must be a non-empty string');
  }
  if (payload.confidence !== undefined) {
    assertFiniteNumber(payload.confidence, 'confidence');
    if (payload.confidence < 0.0 || payload.confidence > 1.0) {
      throw new NativeInformationValidationError(
        `Confidence must be bounded in [0.0, 1.0], received: ${payload.confidence}`
      );
    }
  }
  if (payload.vocabularyId !== undefined) {
    if (typeof payload.vocabularyId !== 'string' || payload.vocabularyId.trim().length === 0) {
      throw new NativeInformationValidationError('vocabularyId must be a non-empty string');
    }
  }
  if (payload.attributes !== undefined) {
    if (typeof payload.attributes !== 'object' || payload.attributes === null || Array.isArray(payload.attributes)) {
      throw new NativeInformationValidationError('attributes must be a valid key-value object');
    }
    for (const [k, v] of Object.entries(payload.attributes)) {
      if (typeof v === 'number') {
        assertFiniteNumber(v, `Attribute "${k}"`);
      } else if (typeof v !== 'string' && typeof v !== 'boolean') {
        throw new NativeInformationValidationError(`Attribute "${k}" must be a string, finite number, or boolean`);
      }
    }
  }
}

/**
 * Validates structured fields recursively for primitives, bounds, depth, and circular references.
 */
function validateStructuredValue(
  value: unknown,
  depth: number,
  seenObjects: Set<object>
): void {
  if (depth > MAX_STRUCTURED_DEPTH) {
    throw new NativeInformationValidationError(
      `Structured payload depth exceeds maximum allowed limit (${MAX_STRUCTURED_DEPTH})`
    );
  }

  if (value === null || typeof value === 'boolean' || typeof value === 'string') {
    return;
  }

  if (typeof value === 'number') {
    assertFiniteNumber(value, 'Structured field value');
    return;
  }

  if (typeof value === 'object') {
    if (seenObjects.has(value)) {
      throw new NativeInformationValidationError('Circular reference detected in structured payload');
    }
    seenObjects.add(value);

    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        validateStructuredValue(value[i], depth + 1, seenObjects);
      }
    } else {
      const keys = Object.keys(value);
      if (keys.length > MAX_STRUCTURED_FIELDS) {
        throw new NativeInformationValidationError(
          `Structured field count (${keys.length}) exceeds bound (${MAX_STRUCTURED_FIELDS})`
        );
      }
      for (const k of keys) {
        validateStructuredValue((value as Record<string, unknown>)[k], depth + 1, seenObjects);
      }
    }

    seenObjects.delete(value);
    return;
  }

  throw new NativeInformationValidationError(
    `Unsupported value type in structured payload: ${typeof value}`
  );
}

/**
 * Validates a NativeStructuredPayload fail-closed.
 */
export function validateStructuredPayload(payload: NativeStructuredPayload): void {
  if (!payload || typeof payload !== 'object') {
    throw new NativeInformationValidationError('Structured payload must be a non-null object');
  }
  if (payload.modality !== 'STRUCTURED') {
    throw new NativeInformationValidationError(`Expected modality 'STRUCTURED', received: ${payload.modality}`);
  }
  if (!payload.fields || typeof payload.fields !== 'object' || Array.isArray(payload.fields)) {
    throw new NativeInformationValidationError('Structured fields must be a non-null object');
  }
  const seenObjects = new Set<object>();
  validateStructuredValue(payload.fields, 0, seenObjects);
}

/**
 * Master validator routing to specific modality validator.
 */
export function assertValidInformationPayload(
  modality: InformationModality,
  payload: InformationPayload
): void {
  if (!payload || typeof payload !== 'object') {
    throw new NativeInformationValidationError('Information payload must be a non-null object');
  }
  if (payload.modality !== modality) {
    throw new NativeInformationValidationError(
      `Payload modality mismatch: declared '${modality}', payload has '${payload.modality}'`
    );
  }

  switch (modality) {
    case 'TEXT':
      validateTextPayload(payload as NativeTextPayload);
      break;
    case 'NUMERIC':
      validateNumericPayload(payload as NativeNumericPayload);
      break;
    case 'CATEGORICAL':
      validateCategoricalPayload(payload as NativeCategoricalPayload);
      break;
    case 'STRUCTURED':
      validateStructuredPayload(payload as NativeStructuredPayload);
      break;
    default:
      throw new NativeInformationValidationError(`Unknown information modality: ${modality}`);
  }
}
