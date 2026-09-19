/**
 * CubiO — Step 86 Global Dataset Deduplicator
 */

import { GlobalDeduplicationReport, HundredBillionDatasetShard } from '../types';
import { deterministicHash } from '../../../state/determinism';

export class DatasetDeduplicator {
  private readonly seenHashes: Set<string> = new Set();
  private totalScanned = 0;
  private duplicateCount = 0;
  private crossNodeDuplicates = 0;

  public deduplicateShards(shards: readonly HundredBillionDatasetShard[]): {
    uniqueShards: readonly HundredBillionDatasetShard[];
    report: GlobalDeduplicationReport;
  } {
    const unique: HundredBillionDatasetShard[] = [];

    for (const shard of shards) {
      this.totalScanned += shard.recordCount;
      const contentHash = deterministicHash(`${shard.stream}_${shard.sampleTextSnippet}`);

      if (this.seenHashes.has(contentHash)) {
        this.duplicateCount += shard.recordCount;
        this.crossNodeDuplicates += 1;
      } else {
        this.seenHashes.add(contentHash);
        unique.push(shard);
      }
    }

    const uniqueRecords = this.totalScanned - this.duplicateCount;
    const tokensPreserved = unique.reduce((acc, s) => acc + s.tokenCount, 0);
    const dedupEff = this.totalScanned > 0 ? (uniqueRecords / this.totalScanned) * 100 : 100;

    const report: GlobalDeduplicationReport = Object.freeze({
      totalRecordsScanned: this.totalScanned,
      uniqueRecordsRetained: uniqueRecords,
      duplicateRecordsPruned: this.duplicateCount,
      crossNodeDuplicatesDetected: this.crossNodeDuplicates,
      deduplicationEfficiencyPercent: dedupEff,
      tokensPreservedAfterDedup: tokensPreserved,
    });

    return {
      uniqueShards: Object.freeze(unique),
      report,
    };
  }
}
