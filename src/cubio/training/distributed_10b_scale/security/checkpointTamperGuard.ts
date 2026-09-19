/**
 * CubiO — Step 85 Checkpoint Tamper Guard
 * Verifies that checkpoint metadata and parameter payloads match cryptographic hashes.
 */

import { DistributedCheckpointMetadata } from '../types';
import { deterministicHash } from '../../../state/determinism';

export class CheckpointTamperGuard {
  public static verifyCheckpointTamperProof(checkpoint: DistributedCheckpointMetadata): boolean {
    const payload = `${checkpoint.checkpointId}_${checkpoint.milestone}_${checkpoint.globalStep}_${checkpoint.cumulativeTokens}_${checkpoint.aggregatedWeightsHash}_${checkpoint.aggregatedOptimizerHash}_${checkpoint.globalTokenLedgerHash}_${checkpoint.previousGlobalCheckpointHash}`;
    const expected = deterministicHash(payload);
    return checkpoint.globalCheckpointHash === expected;
  }
}
