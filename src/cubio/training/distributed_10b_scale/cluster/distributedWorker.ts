/**
 * CubiO — Step 85 Distributed Worker Node
 * Manages local forward/backward execution, local shard state, and rank communication.
 */

import { ClusterNodeInfo } from '../types';
import { deterministicHash } from '../../../state/determinism';

export class DistributedWorker {
  public readonly rank: number;
  public readonly worldSize: number;
  public readonly nodeInfo: ClusterNodeInfo;
  private localStepCount = 0;
  private localProcessedTokens = 0;

  constructor(nodeInfo: ClusterNodeInfo) {
    this.nodeInfo = nodeInfo;
    this.rank = nodeInfo.nodeRank;
    this.worldSize = nodeInfo.worldSize;
  }

  public recordStepExecution(tokensInBatch: number): void {
    this.localStepCount += 1;
    this.localProcessedTokens += tokensInBatch;
  }

  public getLocalMetrics(): { rank: number; steps: number; processedTokens: number; stateHash: string } {
    return {
      rank: this.rank,
      steps: this.localStepCount,
      processedTokens: this.localProcessedTokens,
      stateHash: deterministicHash(`WORKER_RANK_${this.rank}_STEPS_${this.localStepCount}_TOK_${this.localProcessedTokens}`),
    };
  }
}
