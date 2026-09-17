/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.14: Search & Index Validator
 *
 * Deep validation for WorkspaceIndex, SearchResults, and NavigationTargets.
 */

import {
  WorkspaceIndex,
  SearchValidationReport,
  SearchValidationStatus,
} from './types';
import { deterministicHash } from './determinism';

export class SearchValidator {
  /**
   * Validate a WorkspaceIndex against all structural and boundary constraints.
   */
  public static validateIndex(index: WorkspaceIndex): SearchValidationReport {
    const issues: string[] = [];

    // 1. Index identity
    if (!index.indexId || !index.indexId.startsWith('IDX_P614_')) {
      issues.push('Invalid indexId prefix');
    }

    // 2. Schema version
    if (index.schemaVersion !== '6.14.0') {
      issues.push(`Unsupported schemaVersion: ${index.schemaVersion}`);
    }

    // 3. Entity count matches
    if (index.entities.length !== index.entityCount) {
      issues.push(`Entity count mismatch: expected ${index.entityCount}, got ${index.entities.length}`);
    }

    // 4. Duplicate entity detection
    const seenEntityIds = new Set<string>();
    for (const entity of index.entities) {
      if (seenEntityIds.has(entity.entityId)) {
        issues.push(`Duplicate entity ID detected: ${entity.entityId}`);
      }
      seenEntityIds.add(entity.entityId);

      // 5. Workspace boundary
      if (entity.workspaceId !== index.workspaceId) {
        issues.push(`Entity ${entity.entityId} belongs to wrong workspace: ${entity.workspaceId}`);
      }

      // 6. Finite coordinate validation
      if (entity.coordinates) {
        const [x, y, z] = entity.coordinates;
        if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
          issues.push(`Entity ${entity.entityId} contains non-finite coordinates`);
        }
      }

      // 7. Lineage presence
      if (!entity.lineageId || entity.lineageId.length < 4) {
        issues.push(`Entity ${entity.entityId} has missing or malformed lineageId`);
      }
    }

    // 8. Deterministic ordering check (entityType, then entityId)
    for (let i = 1; i < index.entities.length; i++) {
      const prev = index.entities[i - 1];
      const curr = index.entities[i];
      const typeCmp = prev.entityType.localeCompare(curr.entityType);
      if (typeCmp > 0 || (typeCmp === 0 && prev.entityId.localeCompare(curr.entityId) > 0)) {
        issues.push(`Index entities not sorted in canonical deterministic order at index ${i}`);
        break;
      }
    }

    const isValid = issues.length === 0;
    let status: SearchValidationStatus = 'SEARCH_VALID';

    if (!isValid) {
      if (issues.some((i) => i.includes('Duplicate'))) {
        status = 'DUPLICATE_ENTITY_DETECTED';
      } else if (issues.some((i) => i.includes('workspace') || i.includes('boundary'))) {
        status = 'INVALID_BOUNDARY';
      } else if (issues.some((i) => i.includes('non-finite'))) {
        status = 'NON_FINITE_COORDINATE';
      } else {
        status = 'SEARCH_INVALID';
      }
    }

    const raw = JSON.stringify([index.indexId, isValid, status, issues]);
    const reportChecksum = deterministicHash(raw);

    return Object.freeze({
      isValid,
      status,
      issues: Object.freeze(issues),
      reportChecksum,
    });
  }
}
