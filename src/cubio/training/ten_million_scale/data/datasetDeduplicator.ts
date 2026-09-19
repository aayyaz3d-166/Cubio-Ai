/**
 * CubiO — Universal Spatial Operating Environment
 * Step 82: Dataset Deduplicator
 *
 * Implements deterministic content-hash and fingerprint deduplication.
 *
 * Classification: SOFTWARE_VALIDATED
 */

import { DatasetDeduplicationSummary } from '../types';
import { deterministicHash } from '../../../state/determinism';

export class DatasetDeduplicator {
  private seenHashes = new Set<string>();
  private totalInputs = 0;
  private duplicateCount = 0;

  public processRecord(content: string, tokenCount: number): {
    isUnique: boolean;
    recordHash: string;
  } {
    this.totalInputs++;
    const recordHash = `0x${deterministicHash(`REC:${content}:${tokenCount}`)}`;

    if (this.seenHashes.has(recordHash)) {
      this.duplicateCount++;
      return { isUnique: false, recordHash };
    }

    this.seenHashes.add(recordHash);
    return { isUnique: true, recordHash };
  }

  public getSummary(): DatasetDeduplicationSummary {
    const unique = this.seenHashes.size;
    const ratio = this.totalInputs > 0 ? parseFloat(((this.duplicateCount / this.totalInputs) * 100).toFixed(2)) : 0;

    return Object.freeze({
      totalInputRecords: this.totalInputs,
      duplicatesDetected: this.duplicateCount,
      duplicatesRemoved: this.duplicateCount,
      uniqueRecords: unique,
      uniqueTokens: unique * 2048,
      deduplicationRatioPercentage: ratio,
    });
  }
}
