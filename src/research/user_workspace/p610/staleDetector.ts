/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.10: Stale Index Detector
 *
 * Detects when index records reference outdated checksums.
 */

import { IndexRecord, StaleDetectionReport } from './types';
import { SpaceManager } from '../p68/spaceManager';

export class StaleDetector {
  public static detectStale(
    records: readonly IndexRecord[],
    spaceManager: SpaceManager
  ): StaleDetectionReport {
    const staleRecordIds: string[] = [];
    const details: {
      recordId: string;
      indexedChecksum: string;
      authoritativeChecksum: string;
    }[] = [];

    for (const rec of records) {
      if (rec.entityType === 'SPACE' || rec.entityType === 'CLONE' || rec.entityType === 'IMPORT') {
        const space = spaceManager.getRepository().get(rec.entityId);
        if (space && space.spaceChecksum !== rec.checksumRef) {
          staleRecordIds.push(rec.recordId);
          details.push({
            recordId: rec.recordId,
            indexedChecksum: rec.checksumRef,
            authoritativeChecksum: space.spaceChecksum,
          });
        }
      }
    }

    return Object.freeze({
      isStale: staleRecordIds.length > 0,
      staleRecordIds: Object.freeze(staleRecordIds),
      details: Object.freeze(details),
    });
  }
}
