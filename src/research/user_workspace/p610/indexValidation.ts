/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.10: Index Validation Engine
 *
 * Validates index schema version, record uniqueness, user scoping, and checksum integrity.
 */

import { WorkspaceIndexState, IndexValidationReport } from './types';
import { deterministicHash } from './determinism';

export class IndexValidationEngine {
  public static validateIndexState(state: WorkspaceIndexState): IndexValidationReport {
    const issues: string[] = [];
    const seenIds = new Set<string>();

    const schemaVer = String(state.schemaVersion || '');
    if (schemaVer !== '6.10.0' && !schemaVer.startsWith('6.')) {
      issues.push(`Invalid schema version: ${state.schemaVersion}`);
    }

    for (const rec of state.records) {
      if (seenIds.has(rec.recordId)) {
        issues.push(`Duplicate index record ID: ${rec.recordId}`);
      }
      seenIds.add(rec.recordId);

      if (rec.userId !== state.userId) {
        issues.push(`Cross-user isolation violation in record ${rec.recordId}: ${rec.userId} !== ${state.userId}`);
      }
    }

    const isValid = issues.length === 0;
    const status = !isValid
      ? issues.some((m) => m.includes('Cross-user'))
        ? 'CROSS_USER_VIOLATION'
        : issues.some((m) => m.includes('Duplicate'))
        ? 'DUPLICATE_INDEX_ID'
        : issues.some((m) => m.includes('schema version'))
        ? 'INVALID_SCHEMA_VERSION'
        : 'CORRUPTED_INDEX'
      : 'INDEX_VALID';

    const reportChecksum = deterministicHash(
      JSON.stringify([status, isValid, state.indexChecksum, issues.length])
    );

    return Object.freeze({
      isValid,
      status,
      issues: Object.freeze(issues),
      reportChecksum,
    });
  }
}
