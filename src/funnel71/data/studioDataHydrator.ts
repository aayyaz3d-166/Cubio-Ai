/**
 * 3D Memory Studio — Funnel 71
 * Studio Data Hydrator
 *
 * Safely parses, validates, and normalizes stored records into canonical StudioRecords.
 * Ensures a single malformed record never corrupts the overall store or pipeline.
 */

import { StudioRecord } from '../types';
import { StudioDataValidator } from './studioDataValidator';

export interface HydrationResult {
  readonly records: readonly StudioRecord[];
  readonly validCount: number;
  readonly rejectedCount: number;
  readonly errors: ReadonlyArray<{ recordId?: string; reason: string }>;
}

export class StudioDataHydrator {
  constructor(private readonly validator: StudioDataValidator = new StudioDataValidator()) {}

  public hydrate(raw: unknown): HydrationResult {
    let rawList: unknown[] = [];

    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        rawList = Array.isArray(parsed) ? parsed : [parsed];
      } catch (err: any) {
        return {
          records: [],
          validCount: 0,
          rejectedCount: 1,
          errors: [{ reason: `JSON parse error during hydration: ${err?.message}` }],
        };
      }
    } else if (Array.isArray(raw)) {
      rawList = raw;
    } else if (raw && typeof raw === 'object') {
      rawList = [raw];
    } else {
      return {
        records: [],
        validCount: 0,
        rejectedCount: 0,
        errors: [],
      };
    }

    const validRecords: StudioRecord[] = [];
    const errors: Array<{ recordId?: string; reason: string }> = [];

    for (const item of rawList) {
      const val = this.validator.validateRecord(item);
      if (val.isValid) {
        validRecords.push(item as StudioRecord);
      } else {
        const id = (item as any)?.id;
        errors.push({ recordId: typeof id === 'string' ? id : undefined, reason: val.reason || 'Unknown validation failure' });
      }
    }

    return {
      records: validRecords,
      validCount: validRecords.length,
      rejectedCount: errors.length,
      errors,
    };
  }
}
