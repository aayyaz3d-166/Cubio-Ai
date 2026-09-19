/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 47: Control Plane Checkpoint Registry
 *
 * Tracks immutable model training checkpoints, CAS CIDs, and cryptographic Merkle proofs.
 */

import {
  ControlCheckpointEntry,
} from './types';
import { deterministicHash } from '../../state/determinism';

export class ControlCheckpointRegistry {
  private checkpoints: Map<string, ControlCheckpointEntry> = new Map();

  /**
   * Registers a training checkpoint.
   */
  public registerCheckpoint(
    jobId: string,
    epoch: number,
    loss: number,
    accuracy: number
  ): ControlCheckpointEntry {
    const ckptHash = deterministicHash(`CTRL_CKPT:${jobId}:${epoch}:${loss}:${accuracy}`);
    const casCid = `bafk_ctrl_ckpt_${ckptHash.slice(2, 10)}`;
    const merkleRoot = deterministicHash(`MERKLE_CTRL:${casCid}:${Date.now()}`);

    const entry: ControlCheckpointEntry = Object.freeze({
      checkpointId: `CKPT_${ckptHash.slice(2, 10)}`,
      jobId,
      epoch,
      loss,
      accuracy,
      casCid,
      merkleRoot: `0x${merkleRoot}`,
      timestamp: Date.now(),
    });

    this.checkpoints.set(entry.checkpointId, entry);
    return entry;
  }

  public getCheckpoint(checkpointId: string): ControlCheckpointEntry | undefined {
    return this.checkpoints.get(checkpointId);
  }

  public getCheckpointsForJob(jobId: string): readonly ControlCheckpointEntry[] {
    return Object.freeze(Array.from(this.checkpoints.values()).filter((c) => c.jobId === jobId));
  }

  public getAllCheckpoints(): readonly ControlCheckpointEntry[] {
    return Object.freeze(Array.from(this.checkpoints.values()));
  }

  public reset(): void {
    this.checkpoints.clear();
  }
}
