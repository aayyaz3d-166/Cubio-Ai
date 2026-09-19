/**
 * CubiO — Step 85 Node Checkpoint Manifest
 * Descriptors for per-node local parameter, gradient, and optimizer state slices.
 */

import { deterministicHash } from '../../../state/determinism';

export interface NodeCheckpointDescriptor {
  readonly rank: number;
  readonly step: number;
  readonly paramShardHash: string;
  readonly optimizerShardHash: string;
  readonly tokenLedgerOffset: number;
  readonly nodeManifestHash: string;
  readonly timestamp: number;
}

export class NodeCheckpointManifest {
  public static createDescriptor(
    rank: number,
    step: number,
    paramSlice: readonly number[],
    optimizerHash: string,
    ledgerOffset: number
  ): NodeCheckpointDescriptor {
    const paramShardHash = deterministicHash(`NODE_PARAM_R${rank}_STEP_${step}_LEN_${paramSlice.length}_SUM_${paramSlice.reduce((a, b) => a + b, 0)}`);
    const nodeManifestHash = deterministicHash(`${rank}_${step}_${paramShardHash}_${optimizerHash}_${ledgerOffset}`);

    return Object.freeze({
      rank,
      step,
      paramShardHash,
      optimizerShardHash: optimizerHash,
      tokenLedgerOffset: ledgerOffset,
      nodeManifestHash,
      timestamp: Date.now(),
    });
  }
}
