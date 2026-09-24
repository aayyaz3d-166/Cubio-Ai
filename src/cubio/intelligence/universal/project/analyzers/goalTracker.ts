/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F62: Goal Tracker (Dimension 4)
 */

import { deterministicHash } from '../../../../state/determinism';
import { ProjectGoal } from '../types';

export class GoalTracker {
  private goals: Map<string, ProjectGoal> = new Map();

  constructor() {
    this.seedDefaultGoals();
  }

  private seedDefaultGoals() {
    const defaultGoals: ProjectGoal[] = [
      {
        goalId: 'GOAL_01_SUPER_INTELLIGENCE',
        title: 'Universal Multimodal Super Intelligence',
        description: 'Complete 8-phase intelligence architecture from LLM, Vision, Voice, Code, Research, to Native 369.',
        targetDimension: 'D7',
        milestones: ['F46 Architecture Lock', 'F55 Research Intelligence', 'F57 Native Spatial', 'F60 Multi-Agent'],
        isCompleted: true,
        progressPercent: 100,
      },
      {
        goalId: 'GOAL_02_AUTONOMOUS_PROJECTS',
        title: 'Autonomous Project Intelligence 2.0',
        description: 'Automated understanding of files, architecture, tasks, goals, dependencies, decisions, progress.',
        targetDimension: 'D7',
        milestones: ['F62 Project Intelligence 2.0', 'F63 Autonomous Workflow Execution'],
        isCompleted: false,
        progressPercent: 60,
      },
    ];

    for (const g of defaultGoals) {
      this.goals.set(g.goalId, g);
    }
  }

  public getGoals(): readonly ProjectGoal[] {
    return Object.freeze(Array.from(this.goals.values()));
  }

  public addGoal(
    goal: Omit<ProjectGoal, 'goalId' | 'progressPercent' | 'isCompleted'>
  ): ProjectGoal {
    const goalId = `GOAL_${deterministicHash(`${goal.title}:${Date.now()}`).slice(2, 10)}`;
    const created: ProjectGoal = Object.freeze({
      ...goal,
      goalId,
      progressPercent: 0,
      isCompleted: false,
    });
    this.goals.set(goalId, created);
    return created;
  }
}
