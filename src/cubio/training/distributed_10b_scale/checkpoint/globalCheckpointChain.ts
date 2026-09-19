/**
 * CubiO — Step 85 Global Checkpoint Chain
 * Cryptographically links all milestone checkpoints across Step 84 -> Step 85 (1B -> 10B+).
 */

import { DistributedCheckpointMetadata, TenBillionMilestone } from '../types';
import { deterministicHash } from '../../../state/determinism';

export class GlobalCheckpointChain {
  private readonly checkpoints: DistributedCheckpointMetadata[] = [];
  private currentHash: string;

  constructor(startingCheckpointHash = '0x098A440D5501CE18') { // Step 84 final checkpoint hash
    this.currentHash = startingCheckpointHash;
  }

  public recordMilestone(
    checkpointId: string,
    milestone: TenBillionMilestone,
    globalStep: number,
    cumulativeTokens: number,
    worldSize: number,
    rankShardHashes: readonly string[],
    aggregatedWeightsHash: string,
    aggregatedOptimizerHash: string,
    globalTokenLedgerHash: string,
    trainLoss: number,
    valLoss: number,
    valPerplexity: number
  ): DistributedCheckpointMetadata {
    const prevHash = this.currentHash;
    const payload = `${checkpointId}_${milestone}_${globalStep}_${cumulativeTokens}_${aggregatedWeightsHash}_${aggregatedOptimizerHash}_${globalTokenLedgerHash}_${prevHash}`;
    this.currentHash = deterministicHash(payload);

    const cp: DistributedCheckpointMetadata = Object.freeze({
      checkpointId,
      milestone,
      globalStep,
      cumulativeTokens,
      worldSize,
      rankShardHashes,
      aggregatedWeightsHash,
      aggregatedOptimizerHash,
      globalTokenLedgerHash,
      previousGlobalCheckpointHash: prevHash,
      globalCheckpointHash: this.currentHash,
      trainLoss,
      valLoss,
      valPerplexity,
      timestamp: Date.now(),
      executionClassification: 'REAL_EXECUTED',
    });

    this.checkpoints.push(cp);
    return cp;
  }

  public getCheckpoints(): readonly DistributedCheckpointMetadata[] {
    return Object.freeze([...this.checkpoints]);
  }

  public getCurrentHash(): string {
    return this.currentHash;
  }

  public verifyChainIntegrity(): boolean {
    if (this.checkpoints.length === 0) return true;
    for (let i = 0; i < this.checkpoints.length; i++) {
      const cp = this.checkpoints[i];
      const prevHash = i === 0 ? cp.previousGlobalCheckpointHash : this.checkpoints[i - 1].globalCheckpointHash;
      if (cp.previousGlobalCheckpointHash !== prevHash) return false;

      const expectedPayload = `${cp.checkpointId}_${cp.milestone}_${cp.globalStep}_${cp.cumulativeTokens}_${cp.aggregatedWeightsHash}_${cp.aggregatedOptimizerHash}_${cp.globalTokenLedgerHash}_${prevHash}`;
      const expectedHash = deterministicHash(expectedPayload);
      if (cp.globalCheckpointHash !== expectedHash) return false;
    }
    return true;
  }
}
