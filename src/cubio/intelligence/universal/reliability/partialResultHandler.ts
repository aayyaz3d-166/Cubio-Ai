/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F68: Partial Result Handler
 *
 * Salvages valid completed DAG outputs from failed/interrupted executions and fills missing fields with defaults.
 */

import { PartialResultSalvageResult } from './types';

export class PartialResultHandler {
  public salvagePartialResult(
    rawResult: unknown,
    requiredKeys: readonly string[],
    defaults: Readonly<Record<string, unknown>>
  ): Readonly<PartialResultSalvageResult> {
    const isObject = typeof rawResult === 'object' && rawResult !== null;
    const rawRecord = isObject ? (rawResult as Record<string, unknown>) : {};

    const salvaged: Record<string, unknown> = {};
    const fallbackDefaultsApplied: string[] = [];

    for (const key of requiredKeys) {
      if (rawRecord[key] !== undefined) {
        salvaged[key] = rawRecord[key];
      } else {
        salvaged[key] = defaults[key] !== undefined ? defaults[key] : null;
        fallbackDefaultsApplied.push(key);
      }
    }

    const isPartial = fallbackDefaultsApplied.length > 0;

    return Object.freeze({
      salvagedProperties: Object.freeze(salvaged),
      isPartial,
      fallbackDefaultsApplied: Object.freeze(fallbackDefaultsApplied),
    });
  }
}
