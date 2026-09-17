/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.10: Orphan Reference Detector
 *
 * Identifies orphaned index references where the underlying entity no longer exists.
 */

import { IndexRecord, OrphanDetectionReport } from './types';
import { SpaceManager } from '../p68/spaceManager';

export class OrphanDetector {
  public static detectOrphans(
    records: readonly IndexRecord[],
    spaceManager: SpaceManager
  ): OrphanDetectionReport {
    const orphanedRecordIds: string[] = [];
    const issues: string[] = [];

    const existingSpaces = new Set(
      spaceManager
        .getRepository()
        .list()
        .map((s) => s.spaceId)
    );

    for (const rec of records) {
      if (
        rec.entityType === 'SPACE' ||
        rec.entityType === 'CLONE' ||
        rec.entityType === 'IMPORT'
      ) {
        if (!existingSpaces.has(rec.entityId)) {
          orphanedRecordIds.push(rec.recordId);
          issues.push(`Index record ${rec.recordId} references deleted space ${rec.entityId}`);
        }
      }
    }

    return Object.freeze({
      hasOrphans: orphanedRecordIds.length > 0,
      orphanedRecordIds: Object.freeze(orphanedRecordIds),
      issues: Object.freeze(issues),
    });
  }
}
