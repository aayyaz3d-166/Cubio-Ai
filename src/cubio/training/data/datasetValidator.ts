/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 43: Dataset Validator
 *
 * Enforces schema integrity, validates modality payloads (Text strings, Image pixel arrays,
 * Audio waveform floats, 3D vertex coordinates), and filters out corrupt records.
 */

import {
  RawDatasetRecord,
} from './types';
import { ModalityType } from '../../multimodal/types';

export interface DatasetValidationReport {
  readonly isValid: boolean;
  readonly validRecords: readonly RawDatasetRecord[];
  readonly rejectedRecordsCount: number;
  readonly rejectionErrors: readonly string[];
}

export class DatasetValidator {
  private allowedModalities: Set<ModalityType> = new Set(['TEXT', 'IMAGE', 'AUDIO', 'THREED']);

  /**
   * Validates a batch of raw dataset records.
   */
  public validateBatch(records: readonly RawDatasetRecord[]): DatasetValidationReport {
    const valid: RawDatasetRecord[] = [];
    const errors: string[] = [];

    for (const r of records) {
      if (!r.recordId || typeof r.recordId !== 'string') {
        errors.push(`Record missing valid recordId: ${JSON.stringify(r)}`);
        continue;
      }
      if (!this.allowedModalities.has(r.modality)) {
        errors.push(`Record ${r.recordId} has unsupported modality: ${r.modality}`);
        continue;
      }
      if (r.rawContent === undefined || r.rawContent === null) {
        errors.push(`Record ${r.recordId} has null or undefined rawContent`);
        continue;
      }

      // Modality-specific payload validation
      switch (r.modality) {
        case 'TEXT':
          if (typeof r.rawContent !== 'string' || r.rawContent.trim().length === 0) {
            errors.push(`Record ${r.recordId} text content is empty or invalid`);
            continue;
          }
          break;
        case 'IMAGE':
          if (!(r.rawContent instanceof Float64Array) && !Array.isArray(r.rawContent)) {
            errors.push(`Record ${r.recordId} image content must be Float64Array or array of numbers`);
            continue;
          }
          break;
        case 'AUDIO':
          if (!(r.rawContent instanceof Float64Array) && !Array.isArray(r.rawContent)) {
            errors.push(`Record ${r.recordId} audio content must be Float64Array or array of numbers`);
            continue;
          }
          break;
        case 'THREED':
          if (!Array.isArray(r.rawContent)) {
            errors.push(`Record ${r.recordId} 3D content must be an array of vertex coordinates`);
            continue;
          }
          break;
      }

      valid.push(r);
    }

    return Object.freeze({
      isValid: errors.length === 0,
      validRecords: Object.freeze(valid),
      rejectedRecordsCount: errors.length,
      rejectionErrors: Object.freeze(errors),
    });
  }
}
