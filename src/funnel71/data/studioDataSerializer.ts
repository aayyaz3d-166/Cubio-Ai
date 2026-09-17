/**
 * 3D Memory Studio — Funnel 71
 * Studio Data Serializer
 *
 * Enforces strict serialization safety:
 * - Omits undefined fields
 * - Preserves null intentionally
 * - Preserves finite numbers
 * - Strictly rejects NaN and Infinity
 * - Produces deterministic canonical JSON output
 */

import { StudioRecord } from '../types';

export class StudioDataSerializer {
  public serializeRecord(record: StudioRecord): string {
    const clean = this.cleanObject(record);
    return this.deterministicStringify(clean);
  }

  public serializeRecords(records: readonly StudioRecord[]): string {
    const cleanList = records.map((r) => this.cleanObject(r));
    return this.deterministicStringify(cleanList);
  }

  public cleanObject(val: unknown): any {
    if (val === undefined) {
      return undefined;
    }
    if (val === null) {
      return null;
    }
    if (typeof val === 'number') {
      if (!Number.isFinite(val) || isNaN(val)) {
        throw new Error(`Serialization error: Non-finite number encountered (${val})`);
      }
      return val;
    }
    if (typeof val === 'string' || typeof val === 'boolean') {
      return val;
    }
    if (Array.isArray(val)) {
      return val.map((item) => this.cleanObject(item)).filter((item) => item !== undefined);
    }
    if (typeof val === 'object') {
      const res: Record<string, any> = {};
      const keys = Object.keys(val as object).sort();
      for (const k of keys) {
        const cleaned = this.cleanObject((val as Record<string, any>)[k]);
        if (cleaned !== undefined) {
          res[k] = cleaned;
        }
      }
      return res;
    }
    return undefined;
  }

  public deterministicStringify(val: unknown): string {
    return JSON.stringify(val, (_key, value) => {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        return Object.keys(value)
          .sort()
          .reduce((sorted: Record<string, any>, key) => {
            sorted[key] = value[key];
            return sorted;
          }, {});
      }
      return value;
    });
  }
}
