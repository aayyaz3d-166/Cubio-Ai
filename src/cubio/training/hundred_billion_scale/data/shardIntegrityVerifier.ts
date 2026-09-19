/**
 * CubiO — Step 86 Shard Integrity Verifier
 */

import { HundredBillionDatasetShard } from '../types';
import { deterministicHash } from '../../../state/determinism';

export class ShardIntegrityVerifier {
  public static verifyShard(shard: HundredBillionDatasetShard): boolean {
    if (shard.tokenCount <= 0 || shard.byteSize <= 0) return false;
    const expectedChecksum = deterministicHash(`${shard.shardId}_${shard.tokenCount}_${shard.sampleTextSnippet}_${shard.assignedRank}`);
    return shard.sha256Checksum === expectedChecksum && !shard.isQuarantined;
  }

  public static auditAllShards(shards: readonly HundredBillionDatasetShard[]): {
    totalValid: number;
    totalCorrupted: number;
    allPassed: boolean;
  } {
    let valid = 0;
    let corrupted = 0;

    for (const s of shards) {
      if (this.verifyShard(s)) {
        valid += 1;
      } else {
        corrupted += 1;
      }
    }

    return {
      totalValid: valid,
      totalCorrupted: corrupted,
      allPassed: corrupted === 0 && valid === shards.length,
    };
  }
}
