/**
 * CubiO — Step 86 Distributed Checkpoint Writer
 */

import { GlobalCheckpointChain } from './globalCheckpointChain';
import { NodeCheckpointManifest, NodeCheckpointDescriptor } from './nodeCheckpointManifest';
import { HundredBillionMilestone, DistributedCheckpointMetadata } from '../types';
import { deterministicHash } from '../../../state/determinism';

export class DistributedCheckpointWriter {
  public readonly globalChain: GlobalCheckpointChain;
  private readonly nodeDescriptors: Map<number, NodeCheckpointDescriptor[]> = new Map();

  constructor(startingCheckpointHash = '0x85A440D5501CE18') {
    this.globalChain = new GlobalCheckpointChain(startingCheckpointHash);
  }

  public recordMilestoneCheckpoint(
    milestone: HundredBillionMilestone,
    globalStep: number,
    cumulativeTokens: number,
    worldSize: number,
    weights: readonly number[],
    trainLoss: number,
    valLoss: number,
    valPerplexity: number,
    globalTokenLedgerHash: string
  ): DistributedCheckpointMetadata {
    const checkpointId = `C86_CHECKPOINT_${milestone}_STEP_${globalStep}`;
    const rankShardHashes: string[] = [];

    const sliceSize = Math.ceil(weights.length / worldSize);
    for (let r = 0; r < worldSize; r++) {
      const slice = weights.slice(r * sliceSize, Math.min(weights.length, (r + 1) * sliceSize));
      const optHash = deterministicHash(`OPT86_STATE_R${r}_STEP_${globalStep}`);
      const desc = NodeCheckpointManifest.createDescriptor(r, globalStep, slice, optHash, globalStep * 100);

      if (!this.nodeDescriptors.has(r)) {
        this.nodeDescriptors.set(r, []);
      }
      this.nodeDescriptors.get(r)!.push(desc);
      rankShardHashes.push(desc.nodeManifestHash);
    }

    const aggWeightsHash = deterministicHash(`GLOBAL86_WEIGHTS_STEP_${globalStep}_LEN_${weights.length}_SUM_${weights.slice(0, 20).join(',')}`);
    const aggOptHash = deterministicHash(`GLOBAL86_OPT_STEP_${globalStep}_WORLD_${worldSize}`);

    return this.globalChain.recordMilestone(
      checkpointId,
      milestone,
      globalStep,
      cumulativeTokens,
      worldSize,
      rankShardHashes,
      aggWeightsHash,
      aggOptHash,
      globalTokenLedgerHash,
      trainLoss,
      valLoss,
      valPerplexity
    );
  }

  public getGlobalChain(): GlobalCheckpointChain {
    return this.globalChain;
  }
}
