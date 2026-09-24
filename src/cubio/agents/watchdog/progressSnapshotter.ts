/**
 * CUBiO AI — 3D Memory Studio
 * AGENT-006 — BTWA (Background Task Watchdog Agent) v2 Supervisor
 * src/cubio/agents/watchdog/progressSnapshotter.ts
 *
 * Automatic progress snapshots capturing process metrics,
 * execution stage, log bytes, and child count with cryptographic integrity.
 */

import * as crypto from 'crypto';
import { ProgressSnapshot, ProcessActivitySample, WatchedTask } from './types';

export class ProgressSnapshotter {
  /**
   * Captures an immutable progress snapshot for a monitored task.
   */
  public static takeSnapshot(
    task: WatchedTask,
    sample: ProcessActivitySample,
    progressPercent: number = 0
  ): ProgressSnapshot {
    const timestamp = sample.timestamp || Date.now();
    const snapshotId = `SNAP-${task.taskId}-${timestamp.toString(36)}`;
    const stage = sample.currentStage || task.runtimeStage || 'EXECUTION';
    const cpuPercent = sample.metrics?.cpuPercent || 0;
    const memoryBytes = sample.metrics?.memoryWorkingSetBytes || 0;

    const payload = JSON.stringify({
      snapshotId,
      taskId: task.taskId,
      timestamp,
      stage,
      progressPercent,
      logBytes: sample.logByteSize,
      activeChildCount: sample.activeChildPids.length,
      cpuPercent,
      memoryBytes,
    });

    const snapshotHash = crypto.createHash('sha256').update(payload).digest('hex');

    return Object.freeze({
      snapshotId,
      taskId: task.taskId,
      timestamp,
      stage,
      progressPercent,
      logBytes: sample.logByteSize,
      activeChildCount: sample.activeChildPids.length,
      cpuPercent,
      memoryBytes,
      snapshotHash,
    });
  }
}
