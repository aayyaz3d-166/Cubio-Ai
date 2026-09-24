import { OrchestrationReport, ProgressSnapshot } from '../types';
export class ProgressMonitor {
  public snapshot(orch: OrchestrationReport): ProgressSnapshot {
    const pct = (orch.subTasksCompleted / orch.subTasksTotal) * 100;
    return Object.freeze({ snapshotId: 'PROG_' + Date.now(), completionPercent: pct, stallDetected: false, estimatedRemainingMs: 0 });
  }
}
