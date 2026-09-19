/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 43: Dataset Deduplicator
 *
 * Implements content-addressed deduplication using Merkle CAS CIDs,
 * suppressing identical samples and tracking memory savings.
 */

import {
  NormalizedDatasetRecord,
} from './types';

export interface DeduplicationReport {
  readonly uniqueRecords: readonly NormalizedDatasetRecord[];
  readonly totalInspected: number;
  readonly duplicatesFound: number;
  readonly bytesSaved: number;
  readonly savingsRatio: number;
}

export class DatasetDeduplicator {
  private seenCids: Set<string> = new Set();
  private duplicatesCount = 0;
  private bytesSaved = 0;

  /**
   * Deduplicates a batch of normalized records.
   */
  public deduplicateBatch(records: readonly NormalizedDatasetRecord[]): DeduplicationReport {
    const unique: NormalizedDatasetRecord[] = [];

    for (const r of records) {
      if (this.seenCids.has(r.casCid)) {
        this.duplicatesCount++;
        this.bytesSaved += r.byteSize;
      } else {
        this.seenCids.add(r.casCid);
        unique.push(r);
      }
    }

    const total = records.length;
    const ratio = total > 0 ? parseFloat((this.duplicatesCount / total).toFixed(4)) : 0.0;

    return Object.freeze({
      uniqueRecords: Object.freeze(unique),
      totalInspected: total,
      duplicatesFound: this.duplicatesCount,
      bytesSaved: this.bytesSaved,
      savingsRatio: ratio,
    });
  }

  public reset(): void {
    this.seenCids.clear();
    this.duplicatesCount = 0;
    this.bytesSaved = 0;
  }
}
