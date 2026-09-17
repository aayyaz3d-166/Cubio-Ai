/**
 * 3D Memory Studio — Funnel 71
 * Data Filter Manager
 */

import { StudioRecord, DataQueryCriteria } from '../types';

export class DataFilterManager {
  public filterRecords(
    records: readonly StudioRecord[],
    criteria: DataQueryCriteria
  ): readonly StudioRecord[] {
    return records.filter((record) => {
      if (criteria.type && record.type !== criteria.type) return false;
      if (criteria.classification && record.classification !== criteria.classification) return false;
      if (criteria.dimension !== undefined && record.dimension !== criteria.dimension) return false;
      if (criteria.clusterId && record.clusterId !== criteria.clusterId) return false;
      if (criteria.status && record.status !== criteria.status) return false;

      if (criteria.search) {
        const q = criteria.search.toLowerCase();
        const matchesId = record.id.toLowerCase().includes(q);
        const matchesSource = record.source ? record.source.toLowerCase().includes(q) : false;
        const matchesCluster = record.clusterId ? record.clusterId.toLowerCase().includes(q) : false;
        const matchesMeta = record.metadata
          ? JSON.stringify(record.metadata).toLowerCase().includes(q)
          : false;

        if (!matchesId && !matchesSource && !matchesCluster && !matchesMeta) {
          return false;
        }
      }

      return true;
    });
  }
}
