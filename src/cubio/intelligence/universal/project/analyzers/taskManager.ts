/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F62: Task Manager (Dimension 3)
 */

import { deterministicHash } from '../../../../state/determinism';
import { ProjectTask } from '../../universalTypes';

export class TaskManager {
  private tasks: Map<string, ProjectTask> = new Map();

  constructor() {
    this.seedDefaultTasks();
  }

  private seedDefaultTasks() {
    const defaultTasks: ProjectTask[] = [
      {
        taskId: 'TASK_01_CORE',
        description: 'Core Engine Initialization: Initialize foundational state and runtime loop.',
        assignedCapability: 'CODE_GENERATION',
        status: 'COMPLETED',
        dependencies: [],
      },
      {
        taskId: 'TASK_02_SPATIAL',
        description: 'Spatial 3D/4D Transformation Layer: Implement coordinate transformations and tesseract projections.',
        assignedCapability: 'SPATIAL_REASONING',
        status: 'COMPLETED',
        dependencies: ['TASK_01_CORE'],
      },
      {
        taskId: 'TASK_03_AUTONOMOUS',
        description: 'Autonomous Project Intelligence 2.0: Deliver 7-dimension project understanding framework.',
        assignedCapability: 'CODE_DEBUGGING',
        status: 'IN_PROGRESS',
        dependencies: ['TASK_02_SPATIAL'],
      },
    ];

    for (const t of defaultTasks) {
      this.tasks.set(t.taskId, t);
    }
  }

  public getTasks(): readonly ProjectTask[] {
    return Object.freeze(Array.from(this.tasks.values()));
  }

  public createTask(task: Omit<ProjectTask, 'taskId'>): ProjectTask {
    const taskId = `TASK_${deterministicHash(`${task.description}:${Date.now()}`).slice(2, 10)}`;
    const created: ProjectTask = Object.freeze({
      ...task,
      taskId,
    });
    this.tasks.set(taskId, created);
    return created;
  }

  public updateTaskStatus(taskId: string, status: ProjectTask['status']): boolean {
    const existing = this.tasks.get(taskId);
    if (!existing) return false;

    this.tasks.set(
      taskId,
      Object.freeze({
        ...existing,
        status,
      })
    );
    return true;
  }
}
