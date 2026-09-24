import { GoalSpec, TaskDecomposition } from '../types';
export class TaskDecomposer {
  public decomposeGoal(goal: GoalSpec): TaskDecomposition {
    const tasks = [
      { subTaskId: 'ST_RESEARCH', name: 'Research pendant styles', dependencies: [] as string[], estimatedMinutes: 5, status: 'PENDING' as const },
      { subTaskId: 'ST_CAD_PLAN', name: 'Create CAD plan', dependencies: ['ST_RESEARCH'], estimatedMinutes: 10, status: 'PENDING' as const },
      { subTaskId: 'ST_GEOMETRY', name: 'Generate 3D geometry', dependencies: ['ST_CAD_PLAN'], estimatedMinutes: 15, status: 'PENDING' as const },
      { subTaskId: 'ST_VALIDATE', name: 'Validate mesh integrity', dependencies: ['ST_GEOMETRY'], estimatedMinutes: 3, status: 'PENDING' as const },
      { subTaskId: 'ST_RENDER', name: 'Photorealistic render', dependencies: ['ST_VALIDATE'], estimatedMinutes: 8, status: 'PENDING' as const },
      { subTaskId: 'ST_MFG_CHECK', name: 'Manufacturing constraint check', dependencies: ['ST_VALIDATE'], estimatedMinutes: 5, status: 'PENDING' as const },
      { subTaskId: 'ST_PACKAGE', name: 'Package deliverables', dependencies: ['ST_RENDER', 'ST_MFG_CHECK'], estimatedMinutes: 3, status: 'PENDING' as const },
    ];
    return Object.freeze({ decompositionId: 'DECOMP_' + Date.now(), goalId: goal.goalId, orderedSubTasks: Object.freeze(tasks.map(t => Object.freeze({...t, dependencies: Object.freeze(t.dependencies)}))), totalEstimatedMinutes: 49 });
  }
}
