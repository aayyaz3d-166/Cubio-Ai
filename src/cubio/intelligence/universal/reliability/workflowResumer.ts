/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F68: Workflow Resumer
 *
 * Resumes workflow execution from saved checkpoints.
 */

import { RecoveryStateManager } from './recoveryStateManager';
import { WorkflowCheckpoint } from './types';

export class WorkflowResumer {
  constructor(private recoveryManager: RecoveryStateManager) {}

  public resumeWorkflowFromCheckpoint(checkpointId: string): {
    canResume: boolean;
    startFromStageIndex: number;
    completedOutputs: Readonly<Record<string, unknown>>;
    checkpoint: WorkflowCheckpoint;
  } {
    const checkpoint = this.recoveryManager.getCheckpoint(checkpointId);
    if (!checkpoint) {
      throw new Error(`Checkpoint "${checkpointId}" not found for resumption.`);
    }

    const startFromStageIndex = checkpoint.lastCompletedStageIndex + 1;
    const canResume = startFromStageIndex < checkpoint.totalStages;

    return {
      canResume,
      startFromStageIndex,
      completedOutputs: checkpoint.stageOutputs,
      checkpoint,
    };
  }
}
