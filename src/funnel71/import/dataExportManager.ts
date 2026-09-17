/**
 * 3D Memory Studio — Funnel 71
 * Data Export Manager
 */

import { StudioRecord, DataExportBundle } from '../types';
import { CURRENT_SCHEMA_VERSION } from '../schema/schemaVersion';
import { StudioDataSerializer } from '../data/studioDataSerializer';

export class DataExportManager {
  constructor(private readonly serializer: StudioDataSerializer = new StudioDataSerializer()) {}

  public exportBundle(records: readonly StudioRecord[]): DataExportBundle {
    return {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      exportedAt: Date.now(),
      recordCount: records.length,
      records: [...records],
    };
  }

  public exportJSON(records: readonly StudioRecord[]): string {
    const bundle = this.exportBundle(records);
    return this.serializer.deterministicStringify(this.serializer.cleanObject(bundle));
  }
}
