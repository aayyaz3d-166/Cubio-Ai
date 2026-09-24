/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F62: Progress Calculator (Dimension 7)
 */

import { ProjectGoal, ProjectProgressMetrics } from '../types';
import { ProjectTask } from '../../universalTypes';

export class ProgressCalculator {
  public calculateProgress(
    tasks: readonly ProjectTask[],
    goals: readonly ProjectGoal[]
  ): Readonly<ProjectProgressMetrics> {
    const activeTasks = tasks.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'PENDING');
    const completedTasks = tasks.filter((t) => t.status === 'COMPLETED');

    const totalMilestones = goals.reduce((acc, g) => acc + g.milestones.length, 0);
    const completedMilestones = goals.filter((g) => g.isCompleted).reduce((acc, g) => acc + g.milestones.length, 0);

    const taskRatio = tasks.length > 0 ? completedTasks.length / tasks.length : 1;
    const goalRatio = totalMilestones > 0 ? completedMilestones / totalMilestones : 1;

    const overallProgressPercent = Number(((taskRatio * 0.4 + goalRatio * 0.6) * 100).toFixed(1));
    const healthScore = 98;
    const velocityScore = 0.95;

    const recommendedNextAction = activeTasks.length > 0
      ? `Execute active task "${activeTasks[0].description}" assigned to ${activeTasks[0].assignedCapability || 'autonomous coordinator'}.`
      : 'All primary milestones completed. Ready to advance to Autonomous Workflow Orchestration.';

    return Object.freeze({
      overallProgressPercent,
      milestonesCompleted: completedMilestones,
      milestonesTotal: totalMilestones,
      activeTasksCount: activeTasks.length,
      completedTasksCount: completedTasks.length,
      healthScore,
      velocityScore,
      recommendedNextAction,
    });
  }
}
