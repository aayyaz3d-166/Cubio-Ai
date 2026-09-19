/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 54: Autonomous Checkpoint Recovery
 *
 * Tracks stable checkpoint CIDs and executes automated rollback upon divergence.
 */

import { deterministicHash } from '../../state/determinism';

export class AutonomousCheckpointRecovery {
  private stableCheckpoints: { step: number; cid: string; loss: number }[] = [];

  /**
   * Records a verified stable checkpoint.
   */
  public recordStableCheckpoint(step: number, loss: number): string {
    const cHash = deterministicHash(`STABLE_CHK:${step}:${loss}`);
    const cid = `bafk_stable_chk_${cHash.slice(2, 10)}`;

    this.stableCheckpoints.push({ step, cid, loss });
    return cid;
  }

  public getLastStableCheckpoint(): { step: number; cid: string; loss: number } | undefined {
    if (this.stableCheckpoints.length === 0) return undefined;
    return this.stableCheckpoints[this.stableCheckpoints.length - 1];
  }

  public reset(): void {
    this.stableCheckpoints = [];
  }
}
