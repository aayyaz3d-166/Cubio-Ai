/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 43: Dataset Normalizer & 369 State Mapper
 *
 * Deterministically normalizes multimodal records into canonical representations,
 * attaches 369 digital roots, harmonic weights, and cryptographic CAS CIDs.
 */

import {
  RawDatasetRecord,
  NormalizedDatasetRecord,
} from './types';
import { Math369 } from '../../engine_369/math369';
import { deterministicHash } from '../../state/determinism';

export class DatasetNormalizer {
  /**
   * Normalizes a raw dataset record into a deterministic, content-addressed NormalizedDatasetRecord.
   */
  public normalizeRecord(raw: RawDatasetRecord): NormalizedDatasetRecord {
    let normalizedContent: any;
    let byteSize = 0;
    let entropySeed = 0;

    switch (raw.modality) {
      case 'TEXT': {
        const textStr = String(raw.rawContent).trim().toLowerCase();
        normalizedContent = textStr;
        byteSize = textStr.length;
        for (let i = 0; i < textStr.length; i++) {
          entropySeed += textStr.charCodeAt(i);
        }
        break;
      }
      case 'IMAGE': {
        const arr = raw.rawContent instanceof Float64Array ? raw.rawContent : new Float64Array(raw.rawContent);
        const outArr = new Float64Array(arr.length);
        for (let i = 0; i < arr.length; i++) {
          outArr[i] = parseFloat(Math.min(1.0, Math.max(0.0, arr[i])).toFixed(4));
          entropySeed += Math.round(outArr[i] * 100);
        }
        normalizedContent = outArr;
        byteSize = outArr.byteLength;
        break;
      }
      case 'AUDIO': {
        const arr = raw.rawContent instanceof Float64Array ? raw.rawContent : new Float64Array(raw.rawContent);
        const outArr = new Float64Array(arr.length);
        for (let i = 0; i < arr.length; i++) {
          outArr[i] = parseFloat(Math.min(1.0, Math.max(-1.0, arr[i])).toFixed(4));
          entropySeed += Math.round(Math.abs(outArr[i]) * 100);
        }
        normalizedContent = outArr;
        byteSize = outArr.byteLength;
        break;
      }
      case 'THREED': {
        const verts = raw.rawContent as Array<[number, number, number]>;
        const outVerts: Array<[number, number, number]> = [];
        for (const [x, y, z] of verts) {
          const nx = parseFloat(Math.min(1.0, Math.max(-1.0, x)).toFixed(4));
          const ny = parseFloat(Math.min(1.0, Math.max(-1.0, y)).toFixed(4));
          const nz = parseFloat(Math.min(1.0, Math.max(-1.0, z)).toFixed(4));
          outVerts.push([nx, ny, nz]);
          entropySeed += Math.round((Math.abs(nx) + Math.abs(ny) + Math.abs(nz)) * 100);
        }
        normalizedContent = Object.freeze(outVerts);
        byteSize = outVerts.length * 24;
        break;
      }
    }

    const digitalRoot = Math369.computeDigitalRoot(Math.max(1, entropySeed));
    const harmonicWeight = parseFloat((digitalRoot / 9.0).toFixed(4));

    const contentStr = typeof normalizedContent === 'string' ? normalizedContent : Array.isArray(normalizedContent) ? JSON.stringify(normalizedContent) : normalizedContent.slice(0, 8).join(',');
    const contentHash = deterministicHash(
      `NORM_REC:${raw.modality}:${raw.semanticConcept}:${contentStr}:${digitalRoot}:${byteSize}`
    );
    const casCid = `bafk_data_${contentHash.slice(2, 12)}`;

    return Object.freeze({
      recordId: raw.recordId,
      modality: raw.modality,
      normalizedContent,
      semanticConcept: raw.semanticConcept.trim().toLowerCase(),
      digitalRoot369: digitalRoot,
      harmonicWeight,
      casCid,
      checksum: `0x${contentHash}`,
      byteSize,
      timestamp: Date.now(),
    });
  }
}
