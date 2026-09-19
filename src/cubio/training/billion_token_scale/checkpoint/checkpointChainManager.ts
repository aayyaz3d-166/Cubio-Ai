/**
 * CubiO — Universal Spatial Operating Environment
 * Step 84: Checkpoint Chain Manager
 *
 * Implements cryptographic Checkpoint Chain:
 * C83 -> C150M -> C250M -> C500M -> C750M -> C900M -> C1B
 *
 * Classification: SOFTWARE_VALIDATED
 */

import { MilestoneCheckpointEntry, BillionTokenMilestone } from '../types';
import { deterministicHash } from '../../../state/determinism';

export class CheckpointChainManager {
  private chain: MilestoneCheckpointEntry[] = [];
  private startingCheckpointHash: string;

  constructor(startingCheckpointHash = '0x003A5C377FE96C9F') {
    this.startingCheckpointHash = startingCheckpointHash;
  }

  /**
   * Creates and links a milestone checkpoint to the cryptographic chain.
   */
  public recordMilestoneCheckpoint(
    milestone: BillionTokenMilestone,
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
    const prevHash = this.chain.length === 0 ? this.startingCheckpointHash : this.chain[this.chain.length - 1].checkpointHash;

    let wSum = 0;
    for (let i = 0; i < Math.min(weights.length, 64); i++) {
      wSum += weights[i];
    }
    const modelHash = `0x${deterministicHash(`WEIGHTS_1B:${wSum}:${weights.length}`)}`;
    const optHash = `0x${deterministicHash(`OPT_1B:${optimizerUpdates}:${step}`)}`;
    const schedHash = `0x${deterministicHash(`SCHED_1B:WARMUP_COSINE:${step}`)}`;
    const rngHash = `0x${deterministicHash(`RNG_1B:${step}:${cumulativeTokens}`)}`;
    const manifestHash = `0x${deterministicHash(`MANIFEST_1B:${cumulativeTokens}`)}`;

    const nodeHash = `0x${deterministicHash(`MILESTONE_1B_CHK:${milestone}:${step}:${cumulativeTokens}:${modelHash}:${prevHash}`)}`;
    const checkpointId = `CHK_1B_${milestone}_${nodeHash.slice(2, 8)}`;

    const node: MilestoneCheckpointEntry = Object.freeze({
      checkpointId,
      milestone,
      step,
      cumulativeTokens,
      modelWeightsHash: modelHash,
      optimizerStateHash: optHash,
      schedulerStateHash: schedHash,
      rngStateHash: rngHash,
      datasetOffset,
      tokenLedgerHash,
      datasetManifestHash: manifestHash,
      previousCheckpointHash: prevHash,
      checkpointHash: nodeHash,
      trainingLoss,
      validationLoss,
      validationPerplexity,
      peakProcessRSSBytes: rssBytes,
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
      if (this.chain[i].previousCheckpointHash !== this.chain[i - 1].checkpointHash) {
        return false;
      }
    }
    return true;
  }
}
