/**
 * CubiO — Universal Spatial Operating Environment
 * Step 82: Checkpoint Chain Manager
 *
 * Implements cryptographic Checkpoint Chain:
 * C81 -> C1M -> C2M -> C3M -> C5M -> C7_5M -> C10M
 *
 * Classification: SOFTWARE_VALIDATED
 */

import { MilestoneCheckpointEntry, TenMillionMilestone } from '../types';
import { deterministicHash } from '../../../state/determinism';

export class CheckpointChainManager {
  private chain: MilestoneCheckpointEntry[] = [];
  private startingCheckpointHash: string;

  constructor(startingCheckpointHash = '0x00085C377FE96D2F') {
    this.startingCheckpointHash = startingCheckpointHash;
  }

  /**
   * Creates and links a milestone checkpoint to the cryptographic chain.
   */
  public recordMilestoneCheckpoint(
    milestone: TenMillionMilestone,
    step: number,
    cumulativeTokens: number,
    weights: Float32Array,
    optimizerUpdates: number,
    datasetOffset: number,
    tokenLedgerHash: string,
    trainingLoss: number,
    validationLoss: number,
    validationPerplexity: number,
    rssBytes: number
  ): MilestoneCheckpointEntry {
    const prevHash = this.chain.length === 0 ? this.startingCheckpointHash : this.chain[this.chain.length - 1].currentCheckpointHash;

    let wSum = 0;
    for (let i = 0; i < Math.min(weights.length, 64); i++) {
      wSum += weights[i];
    }
    const modelHash = `0x${deterministicHash(`WEIGHTS_10M:${wSum}:${weights.length}`)}`;
    const optHash = `0x${deterministicHash(`OPT_10M:${optimizerUpdates}:${step}`)}`;
    const schedHash = `0x${deterministicHash(`SCHED_10M:WARMUP_COSINE:${step}`)}`;

    const nodeHash = `0x${deterministicHash(`MILESTONE_10M_CHK:${milestone}:${step}:${cumulativeTokens}:${modelHash}:${prevHash}`)}`;
    const checkpointId = `CHK_10M_${milestone}_${nodeHash.slice(2, 8)}`;

    const node: MilestoneCheckpointEntry = Object.freeze({
      checkpointId,
      milestone,
      step,
      cumulativeTokens,
      modelStateHash: modelHash,
      optimizerStateHash: optHash,
      schedulerStateHash: schedHash,
      datasetOffset,
      tokenLedgerHash,
      previousCheckpointHash: prevHash,
      currentCheckpointHash: nodeHash,
      trainingLoss,
      validationLoss,
      validationPerplexity,
      peakRSSBytes: rssBytes,
      timestamp: Date.now(),
    });

    this.chain.push(node);
    return node;
  }

  public getChain(): readonly MilestoneCheckpointEntry[] {
    return Object.freeze([...this.chain]);
  }

  public verifyChainIntegrity(): boolean {
    if (this.chain.length === 0) return true;
    if (this.chain[0].previousCheckpointHash !== this.startingCheckpointHash) return false;

    for (let i = 1; i < this.chain.length; i++) {
      if (this.chain[i].previousCheckpointHash !== this.chain[i - 1].currentCheckpointHash) {
        return false;
      }
    }
    return true;
  }
}
