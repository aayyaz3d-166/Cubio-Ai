/**
 * 3D Memory Studio — Funnel 73
 * Boot Phase Manager
 *
 * Tracks individual phase progression and calculates deterministic completion percentages.
 */

import { BootPhase, BootPhaseRecord } from '../types';
import { INITIAL_PHASE_RECORDS, ORDERED_BOOT_PHASES } from './bootPhase';

export class BootPhaseManager {
  private phaseRecords: Map<BootPhase, BootPhaseRecord> = new Map();

  constructor() {
    for (const record of INITIAL_PHASE_RECORDS) {
      this.phaseRecords.set(record.phase, {
        ...record,
        status: 'PENDING',
      });
    }
  }

  public reset(): void {
    for (const record of this.phaseRecords.values()) {
      record.status = 'PENDING';
      record.startedAt = undefined;
      record.completedAt = undefined;
      record.durationMs = undefined;
      record.error = undefined;
    }
  }

  public setPhaseTimeout(phase: BootPhase, timeoutMs: number): void {
    const record = this.phaseRecords.get(phase);
    if (record) {
      record.timeoutMs = timeoutMs;
    }
  }

  public markPhaseInProgress(phase: BootPhase): void {
    const record = this.phaseRecords.get(phase);
    if (record) {
      record.status = 'IN_PROGRESS';
      record.startedAt = performance.now();
    }
  }

  public markPhaseCompleted(phase: BootPhase, durationMs?: number): void {
    const record = this.phaseRecords.get(phase);
    if (record) {
      record.status = 'COMPLETED';
      record.completedAt = performance.now();
      record.durationMs = durationMs ?? (record.startedAt ? record.completedAt - record.startedAt : 0);
    }
  }

  public markPhaseFailed(phase: BootPhase, error: string, durationMs?: number): void {
    const record = this.phaseRecords.get(phase);
    if (record) {
      record.status = 'FAILED';
      record.completedAt = performance.now();
      record.durationMs = durationMs ?? (record.startedAt ? record.completedAt - record.startedAt : 0);
      record.error = error;
    }
  }

  public getPhaseRecord(phase: BootPhase): BootPhaseRecord | undefined {
    return this.phaseRecords.get(phase);
  }

  public getAllPhaseRecords(): readonly BootPhaseRecord[] {
    return ORDERED_BOOT_PHASES.map((p) => this.phaseRecords.get(p)!).filter(Boolean);
  }

  public getPercentage(): number {
    const total = ORDERED_BOOT_PHASES.length;
    if (total === 0) return 100;
    const completed = Array.from(this.phaseRecords.values()).filter(
      (r) => r.status === 'COMPLETED' || r.status === 'SKIPPED'
    ).length;
    return Math.round((completed / total) * 100);
  }
}
