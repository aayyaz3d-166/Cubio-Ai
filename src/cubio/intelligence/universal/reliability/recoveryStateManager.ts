/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F68: Recovery State Manager & Workflow Resumer
 *
 * Implements workflow stage checkpointing and seamless resumption from interruptions.
 */

import { deterministicHash } from '../../../state/determinism';
import { WorkflowCheckpoint } from './types';

export class RecoveryStateManager {
  private checkpoints: Map<string, WorkflowCheckpoint> = new Map();

  public saveCheckpoint(
    workflowId: string,
    stageIndex: number,
    totalStages: number,
    stageOutputs: Readonly<Record<string, unknown>>
  ): WorkflowCheckpoint {
    const createdAt = Date.now();
    const checkpointChecksum = deterministicHash(
      `CHECKPOINT:${workflowId}:${stageIndex}:${totalStages}:${JSON.stringify(stageOutputs)}`
    );
    const checkpointId = `CKPT_${checkpointChecksum.slice(2, 10)}`;

    const checkpoint: WorkflowCheckpoint = Object.freeze({
      checkpointId,
      workflowId,
      lastCompletedStageIndex: stageIndex,
      totalStages,
      stageOutputs: Object.freeze({ ...stageOutputs }),
      checkpointChecksum,
      createdAt,
    });

    this.checkpoints.set(checkpointId, checkpoint);
    return checkpoint;
  }

  public getCheckpoint(checkpointId: string): WorkflowCheckpoint | undefined {
    return this.checkpoints.get(checkpointId);
  }

  public getLatestWorkflowCheckpoint(workflowId: string): WorkflowCheckpoint | undefined {
    const matching = Array.from(this.checkpoints.values()).filter((c) => c.workflowId === workflowId);
    if (matching.length === 0) return undefined;
    return matching.sort((a, b) => b.lastCompletedStageIndex - a.lastCompletedStageIndex)[0];
  }
}
