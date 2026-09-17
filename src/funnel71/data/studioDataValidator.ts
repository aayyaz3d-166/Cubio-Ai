/**
 * 3D Memory Studio — Funnel 71
 * Studio Data Validator
 */

import { StudioRecord, DataValidationResult } from '../types';
import {
  VALID_RECORD_TYPES,
  VALID_CLASSIFICATIONS,
  VALID_RECORD_STATUSES,
  VALID_DIMENSIONS,
  MAX_RELATIONSHIPS_PER_RECORD,
  MAX_METADATA_KEYS,
} from '../schema/studioSchema';

export class StudioDataValidator {
  public validateRecord(record: unknown): DataValidationResult {
    if (!record || typeof record !== 'object') {
      return { isValid: false, reason: 'Record must be a non-null object', errorCode: 'INVALID_OBJECT' };
    }

    const r = record as Partial<StudioRecord>;

    // 1. ID Validation
    if (!r.id || typeof r.id !== 'string' || r.id.trim().length === 0) {
      return { isValid: false, reason: 'Record ID must be a non-empty string', errorCode: 'INVALID_ID' };
    }

    // 2. Type Validation
    if (!r.type || !VALID_RECORD_TYPES.has(r.type)) {
      return {
        isValid: false,
        reason: `Invalid record type: "${r.type}". Expected one of: ${Array.from(VALID_RECORD_TYPES).join(', ')}`,
        errorCode: 'INVALID_TYPE',
      };
    }

    // 3. Classification Validation
    if (!r.classification || !VALID_CLASSIFICATIONS.has(r.classification)) {
      return {
        isValid: false,
        reason: `Invalid classification: "${r.classification}". Expected one of: ${Array.from(VALID_CLASSIFICATIONS).join(', ')}`,
        errorCode: 'INVALID_CLASSIFICATION',
      };
    }

    // 4. Dimension Validation
    if (r.dimension === undefined || !VALID_DIMENSIONS.has(r.dimension)) {
      return {
        isValid: false,
        reason: `Invalid dimension: "${r.dimension}". Expected one of: ${Array.from(VALID_DIMENSIONS).join(', ')}`,
        errorCode: 'INVALID_DIMENSION',
      };
    }

    // 5. Position Validation (if present)
    if (r.position !== undefined) {
      if (
        !Array.isArray(r.position) ||
        r.position.length !== 3 ||
        !r.position.every((n) => typeof n === 'number' && Number.isFinite(n) && !isNaN(n))
      ) {
        return {
          isValid: false,
          reason: 'Position must be a 3-element tuple of finite numbers (no NaN or Infinity)',
          errorCode: 'INVALID_POSITION',
        };
      }
    }

    // 6. Relationships Validation (if present)
    if (r.relationships !== undefined) {
      if (!Array.isArray(r.relationships)) {
        return { isValid: false, reason: 'Relationships must be an array of string IDs', errorCode: 'INVALID_RELATIONSHIPS' };
      }
      if (r.relationships.length > MAX_RELATIONSHIPS_PER_RECORD) {
        return {
          isValid: false,
          reason: `Relationships count (${r.relationships.length}) exceeds maximum (${MAX_RELATIONSHIPS_PER_RECORD})`,
          errorCode: 'RELATIONSHIP_BOUND_EXCEEDED',
        };
      }
      if (!r.relationships.every((id) => typeof id === 'string' && id.trim().length > 0)) {
        return { isValid: false, reason: 'Relationship IDs must all be non-empty strings', errorCode: 'INVALID_RELATIONSHIP_ID' };
      }
    }

    // 7. Metadata Validation (if present)
    if (r.metadata !== undefined) {
      if (typeof r.metadata !== 'object' || r.metadata === null || Array.isArray(r.metadata)) {
        return { isValid: false, reason: 'Metadata must be an object map', errorCode: 'INVALID_METADATA' };
      }
      const keys = Object.keys(r.metadata);
      if (keys.length > MAX_METADATA_KEYS) {
        return {
          isValid: false,
          reason: `Metadata keys count (${keys.length}) exceeds maximum (${MAX_METADATA_KEYS})`,
          errorCode: 'METADATA_BOUND_EXCEEDED',
        };
      }
      for (const [k, v] of Object.entries(r.metadata)) {
        if (v === undefined) {
          return { isValid: false, reason: `Metadata key "${k}" contains undefined value`, errorCode: 'UNDEFINED_METADATA_VALUE' };
        }
        if (typeof v === 'number' && (!Number.isFinite(v) || isNaN(v))) {
          return { isValid: false, reason: `Metadata key "${k}" contains non-finite number (NaN/Infinity)`, errorCode: 'NON_FINITE_METADATA_NUMBER' };
        }
      }
    }

    // 8. Status Validation
    if (!r.status || !VALID_RECORD_STATUSES.has(r.status)) {
      return {
        isValid: false,
        reason: `Invalid status: "${r.status}". Expected one of: ${Array.from(VALID_RECORD_STATUSES).join(', ')}`,
        errorCode: 'INVALID_STATUS',
      };
    }

    // 9. Timestamps Validation
    if (
      typeof r.createdAt !== 'number' ||
      !Number.isFinite(r.createdAt) ||
      typeof r.updatedAt !== 'number' ||
      !Number.isFinite(r.updatedAt)
    ) {
      return { isValid: false, reason: 'createdAt and updatedAt must be finite numbers', errorCode: 'INVALID_TIMESTAMPS' };
    }

    return { isValid: true };
  }
}
