/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 47: Control Plane Training Job Manager
 *
 * Manages training job lifecycle transitions across all 10 states:
 * CREATED, QUEUED, INITIALIZING, RUNNING, PAUSED, CHECKPOINTING,
 * RECOVERING, COMPLETED, FAILED, CANCELLED.
 */

import {
  TrainingJobConfig,
  TrainingJobRecord,
  TrainingJobState,
} from './types';
import { deterministicHash } from '../../state/determinism';

export class TrainingJobManager {
  private jobs: Map<string, TrainingJobRecord> = new Map();

  /**
   * Creates a new training job in CREATED state.
   */
  public createJob(config: TrainingJobConfig): TrainingJobRecord {
    const jobHash = deterministicHash(`JOB_INIT:${config.jobId}:${config.jobName}:${config.modelProfile}`);
    const jobManifestCid = `bafk_job_manifest_${jobHash.slice(2, 10)}`;

    const record: TrainingJobRecord = Object.freeze({
      jobId: config.jobId,
      config,
      state: 'CREATED',
      currentEpoch: 0,
      currentLoss: 1.0,
      crossModalAccuracy: 0.5,
      startTime: Date.now(),
      lastUpdateTime: Date.now(),
      jobManifestCid,
    });

    this.jobs.set(config.jobId, record);
    return record;
  }

  /**
   * Transitions job state.
   */
  public transitionState(
    jobId: string,
    nextState: TrainingJobState,
    updates: Partial<Omit<TrainingJobRecord, 'jobId' | 'config' | 'state' | 'jobManifestCid'>> = {}
  ): TrainingJobRecord {
    const existing = this.jobs.get(jobId);
    if (!existing) {
      throw new Error(`Job not found: ${jobId}`);
    }

    const updated: TrainingJobRecord = Object.freeze({
      ...existing,
      ...updates,
      state: nextState,
      lastUpdateTime: Date.now(),
    });

    this.jobs.set(jobId, updated);
    return updated;
  }

  public getJob(jobId: string): TrainingJobRecord | undefined {
    return this.jobs.get(jobId);
  }

  public getAllJobs(): readonly TrainingJobRecord[] {
    return Object.freeze(Array.from(this.jobs.values()));
  }

  public reset(): void {
    this.jobs.clear();
  }
}
