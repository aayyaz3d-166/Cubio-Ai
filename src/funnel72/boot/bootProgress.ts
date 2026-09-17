/**
 * 3D Memory Studio — Funnel 72
 * Boot Progress Tracker
 */

import { BootStageId, StageState } from '../types';
import { ORDERED_BOOT_STAGES, BOOT_STAGE_DESCRIPTORS } from './bootStages';

export class BootProgressTracker {
  private readonly stages: Map<BootStageId, StageState> = new Map();

  constructor() {
    this.reset();
  }

  public reset(): void {
    this.stages.clear();
    for (const d of BOOT_STAGE_DESCRIPTORS) {
      this.stages.set(d.id, {
        id: d.id,
        status: 'PENDING',
        timestamp: Date.now(),
      });
    }
  }

  public setStageRunning(stage: BootStageId): void {
    const s = this.stages.get(stage);
    if (s) {
      s.status = 'RUNNING';
      s.timestamp = Date.now();
    }
  }

  public setStageReady(stage: BootStageId, durationMs?: number): void {
    const s = this.stages.get(stage);
    if (s) {
      s.status = 'READY';
      s.durationMs = durationMs;
      s.timestamp = Date.now();
    }
  }

  public setStageFailed(stage: BootStageId, error: string, durationMs?: number): void {
    const s = this.stages.get(stage);
    if (s) {
      s.status = 'FAILED';
      s.error = error;
      s.durationMs = durationMs;
      s.timestamp = Date.now();
    }
  }

  public setStageSkipped(stage: BootStageId): void {
    const s = this.stages.get(stage);
    if (s) {
      s.status = 'SKIPPED';
      s.timestamp = Date.now();
    }
  }

  public getStageState(stage: BootStageId): StageState | undefined {
    return this.stages.get(stage);
  }

  public getAllStageStates(): readonly StageState[] {
    return ORDERED_BOOT_STAGES.map((id) => this.stages.get(id)!).filter(Boolean);
  }

  public getPercentage(): number {
    const total = ORDERED_BOOT_STAGES.length;
    if (total === 0) return 100;
    const completed = Array.from(this.stages.values()).filter(
      (s) => s.status === 'READY' || s.status === 'SKIPPED'
    ).length;
    return Math.round((completed / total) * 100);
  }

  public getCompletedStages(): readonly BootStageId[] {
    return Array.from(this.stages.values())
      .filter((s) => s.status === 'READY')
      .map((s) => s.id);
  }

  public getFailedStages(): readonly BootStageId[] {
    return Array.from(this.stages.values())
      .filter((s) => s.status === 'FAILED')
      .map((s) => s.id);
  }

  public getSkippedStages(): readonly BootStageId[] {
    return Array.from(this.stages.values())
      .filter((s) => s.status === 'SKIPPED')
      .map((s) => s.id);
  }
}
