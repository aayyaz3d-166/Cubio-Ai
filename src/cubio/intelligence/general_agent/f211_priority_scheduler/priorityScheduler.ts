import { PrioritySchedule, TaskDecomposition } from '../types';
export class PriorityScheduler {
  public schedule(decomp: TaskDecomposition): PrioritySchedule {
    return Object.freeze({ scheduleId: 'SCHED_' + Date.now(), orderedTaskIds: Object.freeze(decomp.orderedSubTasks.map(t => t.subTaskId)), criticalPathLengthMs: 200 });
  }
}
