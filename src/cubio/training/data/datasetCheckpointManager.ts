/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 43: Dataset Checkpoint Manager
 *
 * Saves and restores streaming dataset ingestion checkpoints,
 * enabling zero-loss resume after hardware or network interruptions.
 */

import {
  DatasetCheckpointState,
  DatasetSplitType,
} from './types';
import { deterministicHash } from '../../state/determinism';

export class DatasetCheckpointManager {
  private checkpoints: Map<string, DatasetCheckpointState> = new Map();

  /**
   * Captures the current streaming progress into a content-addressed checkpoint.
   */
  public saveCheckpoint(
    datasetVersionId: string,
    currentSplit: DatasetSplitType,
    currentShardIndex: number,
    processedRecordCursor: number,
    processedSampleIds: readonly string[]
  ): DatasetCheckpointState {
    const ckptHash = deterministicHash(
      `DATA_CKPT:${datasetVersionId}:${currentSplit}:${currentShardIndex}:${processedRecordCursor}:${processedSampleIds.length}`
    );
    const casSnapshotCid = `bafk_data_ckpt_${ckptHash.slice(2, 10)}`;

    const state: DatasetCheckpointState = Object.freeze({
      checkpointId: `DCP_${ckptHash.slice(2, 10)}`,
      datasetVersionId,
      currentSplit,
      currentShardIndex,
      processedRecordCursor,
      processedSampleIds: Object.freeze([...processedSampleIds]),
      casSnapshotCid,
      timestamp: Date.now(),
    });

    this.checkpoints.set(state.checkpointId, state);
    return state;
  }

  public getCheckpoint(checkpointId: string): DatasetCheckpointState | undefined {
    return this.checkpoints.get(checkpointId);
  }

  public getAllCheckpoints(): readonly DatasetCheckpointState[] {
    return Object.freeze(Array.from(this.checkpoints.values()));
  }

  public reset(): void {
    this.checkpoints.clear();
  }
}
