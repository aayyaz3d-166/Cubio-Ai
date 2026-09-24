/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F64: Master Long-Horizon Project Agent
 *
 * Coordinates multi-session state continuity across 6 core pillars:
 * Goal -> Plan -> Tasks -> Progress -> Memory -> Next Action
 */

import { deterministicHash } from '../../../state/determinism';
import {
  ILongHorizonProjectAgent,
  LongHorizonTask,
  ProjectSessionSnapshot,
} from './types';
import { LongHorizonPlanner } from './longHorizonPlanner';
import { LongHorizonMemoryStore } from './longHorizonMemoryStore';
import { NextActionScheduler } from './nextActionScheduler';

export class CubiOLongHorizonProjectAgent implements ILongHorizonProjectAgent {
  private planner = new LongHorizonPlanner();
  private memoryStore = new LongHorizonMemoryStore();
  private scheduler = new NextActionScheduler();

  /**
   * Initializes a brand-new project with persistent multi-session state.
   */
  public async initializeProject(
    goal: string,
    description: string,
    invariants: readonly string[] = []
  ): Promise<Readonly<ProjectSessionSnapshot>> {
    const planned = this.planner.planInitialProject(goal, description, invariants);
    const progress = this.scheduler.computeProgress(planned.tasks);
    const memory = this.memoryStore.createInitialMemoryState(`Project initialized: "${goal}"`);
    const { nextAction } = this.scheduler.scheduleNextAction(planned.tasks);

    const projectId = `PROJ_${planned.goal.goalId.slice(5)}`;
    const sessionId = `SESS_${deterministicHash(`${projectId}:1:${Date.now()}`).slice(2, 10)}`;

    const snapshotChecksum = deterministicHash(
      `SNAPSHOT:${projectId}:${sessionId}:${planned.plan.planChecksum}:${progress.progressPercent}:${memory.memoryChecksum}`
    );

    const snapshot: ProjectSessionSnapshot = Object.freeze({
      sessionId,
      projectId,
      goal: planned.goal,
      plan: planned.plan,
      tasks: planned.tasks,
      progress,
      memory,
      nextAction,
      snapshotChecksum,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    this.memoryStore.saveSnapshot(snapshot);
    return snapshot;
  }

  /**
   * Resumes project state seamlessly from the latest memory snapshot.
   */
  public async resumeProject(projectId: string): Promise<Readonly<ProjectSessionSnapshot>> {
    const latest = this.memoryStore.getLatestSnapshot(projectId);
    if (!latest) {
      throw new Error(`Cannot resume project: No existing snapshot found for projectId "${projectId}".`);
    }

    const memory = this.memoryStore.evolveMemoryState(
      latest.memory,
      `Project resumed across session boundary.`,
      `SESSION_${latest.memory.sessionCount + 1}_RESUME`
    );

    const progress = this.scheduler.computeProgress(latest.tasks);
    const { nextAction } = this.scheduler.scheduleNextAction(latest.tasks);
    const sessionId = `SESS_${deterministicHash(`${projectId}:${memory.sessionCount}:${Date.now()}`).slice(2, 10)}`;

    const snapshotChecksum = deterministicHash(
      `SNAPSHOT:${projectId}:${sessionId}:${latest.plan.planChecksum}:${progress.progressPercent}:${memory.memoryChecksum}`
    );

    const resumedSnapshot: ProjectSessionSnapshot = Object.freeze({
      ...latest,
      sessionId,
      memory,
      progress,
      nextAction,
      snapshotChecksum,
      updatedAt: Date.now(),
    });

    this.memoryStore.saveSnapshot(resumedSnapshot);
    return resumedSnapshot;
  }

  /**
   * Advances the current unblocked task, updates progress, evolves memory,
   * and calculates the next optimal action.
   */
  public async advanceNextAction(
    projectId: string
  ): Promise<
    Readonly<{
      completedTask: LongHorizonTask | null;
      nextAction: string;
      snapshot: ProjectSessionSnapshot;
    }>
  > {
    const latest = this.memoryStore.getLatestSnapshot(projectId);
    if (!latest) {
      throw new Error(`Cannot advance project: No existing snapshot found for projectId "${projectId}".`);
    }

    const { targetTask } = this.scheduler.scheduleNextAction(latest.tasks);
    if (!targetTask) {
      return Object.freeze({
        completedTask: null,
        nextAction: latest.nextAction,
        snapshot: latest,
      });
    }

    // Mark current target task as COMPLETED
    const updatedTasks: LongHorizonTask[] = latest.tasks.map((t) =>
      t.taskId === targetTask.taskId ? Object.freeze({ ...t, status: 'COMPLETED' as const }) : t
    );

    const progress = this.scheduler.computeProgress(updatedTasks);
    const memory = this.memoryStore.evolveMemoryState(
      latest.memory,
      `Completed task [${targetTask.taskId}] "${targetTask.title}".`,
      `SESSION_${latest.memory.sessionCount}_STEP`
    );

    const isAllFulfilled = updatedTasks.every((t) => t.status === 'COMPLETED');
    const updatedGoal = Object.freeze({ ...latest.goal, isFulfilled: isAllFulfilled });

    const { nextAction } = this.scheduler.scheduleNextAction(updatedTasks);
    const sessionId = latest.sessionId;

    const snapshotChecksum = deterministicHash(
      `SNAPSHOT:${projectId}:${sessionId}:${latest.plan.planChecksum}:${progress.progressPercent}:${memory.memoryChecksum}`
    );

    const newSnapshot: ProjectSessionSnapshot = Object.freeze({
      sessionId,
      projectId,
      goal: updatedGoal,
      plan: latest.plan,
      tasks: Object.freeze(updatedTasks),
      progress,
      memory,
      nextAction,
      snapshotChecksum,
      createdAt: latest.createdAt,
      updatedAt: Date.now(),
    });

    this.memoryStore.saveSnapshot(newSnapshot);

    return Object.freeze({
      completedTask: targetTask,
      nextAction,
      snapshot: newSnapshot,
    });
  }

  public getProjectHistory(projectId: string): readonly ProjectSessionSnapshot[] {
    return this.memoryStore.getHistory(projectId);
  }
}
