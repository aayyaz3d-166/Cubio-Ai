/**
 * 3D Memory Studio — Funnel 71
 * Schema Version
 */

export const CURRENT_SCHEMA_VERSION = 1;

export function isSupportedSchemaVersion(version: number): boolean {
  return typeof version === 'number' && version >= 1 && version <= CURRENT_SCHEMA_VERSION;
}
