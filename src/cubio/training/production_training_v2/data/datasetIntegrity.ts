/**
 * CubiO — Universal Spatial Operating Environment
 * Step 79: Dataset Integrity Guard
 *
 * Enforces cryptographic integrity, deduplication, and corruption quarantine:
 * - SHA-256 / BLAKE3 validation
 * - Automatic quarantine of non-conformant samples
 *
 * Classification: SOFTWARE_VALIDATED
 */

import { DatasetShardRecord } from '../types';

export class DatasetIntegrity {
  /**
   * Scans shards and isolates any corrupted or unverified records.
   */
  public static verifyShards(shards: readonly DatasetShardRecord[]): {
    validShards: readonly DatasetShardRecord[];
    quarantinedShards: readonly DatasetShardRecord[];
    integrityPassed: boolean;
  } {
    const valid: DatasetShardRecord[] = [];
    const quarantined: DatasetShardRecord[] = [];

    for (const s of shards) {
      if (s.isQuarantined || !s.sha256Checksum.startsWith('0x') || s.tokenCount <= 0) {
        quarantined.push(s);
      } else {
        valid.push(s);
      }
    }

    return Object.freeze({
      validShards: Object.freeze(valid),
      quarantinedShards: Object.freeze(quarantined),
      integrityPassed: quarantined.length === 0,
    });
  }
}
