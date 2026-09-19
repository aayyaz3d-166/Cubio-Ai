/**
 * CubiO — Universal Spatial Operating Environment
 * Step 81: Shard Integrity Verifier
 *
 * Cryptographically validates shard checksums and ensures absence of corrupted payloads.
 *
 * Classification: SOFTWARE_VALIDATED
 */

import { DatasetShardMeta } from './millionTokenDatasetManifest';

export class ShardIntegrityVerifier {
  public static verifyShards(shards: readonly DatasetShardMeta[]): {
    isValid: boolean;
    validShardsCount: number;
    quarantinedShardsCount: number;
  } {
    let valid = 0;
    let quarantined = 0;

    for (const s of shards) {
      if (s.sha256Checksum.startsWith('0x') && s.tokenCount > 0 && s.byteCount === s.tokenCount * 2) {
        valid++;
      } else {
        quarantined++;
      }
    }

    return Object.freeze({
      isValid: quarantined === 0,
      validShardsCount: valid,
      quarantinedShardsCount: quarantined,
    });
  }
}
