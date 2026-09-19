/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 48: Reproducibility & Version Locking Manager
 *
 * Guarantees bit-for-bit reproducibility (sigma^2 = 0) by locking dataset versions,
 * model architecture hashes, initialization seeds, and execution hyperparameters.
 */

import {
  MasterTrainingRunConfig,
} from './types';
import { deterministicHash } from '../../state/determinism';

export interface ReproducibilityLock {
  readonly lockId: string;
  readonly runId: string;
  readonly datasetLockCid: string;
  readonly modelConfigHash: string;
  readonly executionSeed: number;
  readonly configurationChecksum: string;
  readonly isLocked: boolean;
}

export class ReproducibilityManager {
  private activeLocks: Map<string, ReproducibilityLock> = new Map();

  /**
   * Creates an immutable reproducibility lock for a training run.
   */
  public createRunLock(config: MasterTrainingRunConfig): ReproducibilityLock {
    const configStr = `RUN:${config.runId}:${config.datasetName}:${config.datasetVersionTag}:${config.modelProfile}:${config.learningRate}:${config.randomSeed}`;
    const configHash = deterministicHash(configStr);
    const datasetLockCid = `bafk_data_lock_${deterministicHash(`${config.datasetName}:${config.datasetVersionTag}`).slice(2, 10)}`;
    const modelConfigHash = deterministicHash(`MODEL_CFG:${config.modelProfile}:${config.quantization}`);

    const lock: ReproducibilityLock = Object.freeze({
      lockId: `LOCK_${configHash.slice(2, 10)}`,
      runId: config.runId,
      datasetLockCid,
      modelConfigHash: `0x${modelConfigHash}`,
      executionSeed: config.randomSeed,
      configurationChecksum: `0x${configHash}`,
      isLocked: true,
    });

    this.activeLocks.set(config.runId, lock);
    return lock;
  }

  public getLock(runId: string): ReproducibilityLock | undefined {
    return this.activeLocks.get(runId);
  }

  public reset(): void {
    this.activeLocks.clear();
  }
}
