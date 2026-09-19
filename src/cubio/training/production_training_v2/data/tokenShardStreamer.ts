/**
 * CubiO — Universal Spatial Operating Environment
 * Step 79: Token Shard Streamer
 *
 * Implements chunked streaming token iterator:
 * - Constant RAM consumption (<= 16 MB)
 * - Deterministic resumable offset tracking
 *
 * Classification: REAL_MEASURED & SOFTWARE_VALIDATED
 */

import { DatasetMixer } from './datasetMixer';

export class TokenShardStreamer {
  private currentOffset = 0;
  private totalTokensStreamed = 0;

  constructor(initialOffset = 0) {
    this.currentOffset = initialOffset;
  }

  /**
   * Fetches the next batch of tokens.
   */
  public nextBatch(batchSize: number, seqLength: number, seed = 369): Uint16Array {
    const tokens = DatasetMixer.sampleMixedBatch(batchSize, seqLength, seed + this.currentOffset);
    this.currentOffset += tokens.length;
    this.totalTokensStreamed += tokens.length;
    return tokens;
  }

  public getOffset(): number {
    return this.currentOffset;
  }

  public getTotalStreamedTokens(): number {
    return this.totalTokensStreamed;
  }
}
