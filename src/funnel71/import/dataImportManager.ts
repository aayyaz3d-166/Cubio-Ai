/**
 * 3D Memory Studio — Funnel 71
 * Data Import Manager
 *
 * Validates external JSON bundles and imports records atomically.
 * Prevents partial corruption if any invalid schema or data is encountered.
 */

import { StudioRecord, DataExportBundle } from '../types';
import { isSupportedSchemaVersion } from '../schema/schemaVersion';
import { StudioDataValidator } from '../data/studioDataValidator';
import { MAX_IMPORT_SIZE_BYTES } from '../schema/studioSchema';

export interface ImportResult {
  readonly success: boolean;
  readonly importedCount: number;
  readonly records: readonly StudioRecord[];
  readonly error?: string;
}

export class DataImportManager {
  constructor(private readonly validator: StudioDataValidator = new StudioDataValidator()) {}

  public validateAndParseImport(jsonString: string): ImportResult {
    if (jsonString.length > MAX_IMPORT_SIZE_BYTES) {
      return {
        success: false,
        importedCount: 0,
        records: [],
        error: `Import payload size (${jsonString.length} bytes) exceeds limit (${MAX_IMPORT_SIZE_BYTES} bytes)`,
      };
    }

    let parsed: any;
    try {
      parsed = JSON.parse(jsonString);
    } catch (err: any) {
      return {
        success: false,
        importedCount: 0,
        records: [],
        error: `Invalid JSON payload: ${err?.message}`,
      };
    }

    let records: any[] = [];
    if (parsed && typeof parsed === 'object') {
      if (parsed.schemaVersion !== undefined) {
        if (!isSupportedSchemaVersion(parsed.schemaVersion)) {
          return {
            success: false,
            importedCount: 0,
            records: [],
            error: `Unsupported schema version: ${parsed.schemaVersion}`,
          };
        }
        records = Array.isArray(parsed.records) ? parsed.records : [];
      } else if (Array.isArray(parsed)) {
        records = parsed;
      } else {
        records = [parsed];
      }
    } else {
      return {
        success: false,
        importedCount: 0,
        records: [],
        error: 'Import payload must be a JSON object or array',
      };
    }

    const validated: StudioRecord[] = [];
    for (let i = 0; i < records.length; i++) {
      const item = records[i];
      const val = this.validator.validateRecord(item);
      if (!val.isValid) {
        return {
          success: false,
          importedCount: 0,
          records: [],
          error: `Record #${i + 1} validation failed: ${val.reason} (${val.errorCode})`,
        };
      }
      validated.push(item as StudioRecord);
    }

    return {
      success: true,
      importedCount: validated.length,
      records: validated,
    };
  }
}
