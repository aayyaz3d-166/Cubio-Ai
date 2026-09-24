/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F64: Long-Horizon Project Agent Types & Contracts
 *
 * 6-Pillar Persistent Multi-Session Lifecycle:
 * Goal -> Plan -> Tasks -> Progress -> Memory -> Next Action
 */

import { CubiODimension } from '../../../types';

export interface LongHorizonGoal {
  readonly goalId: string;
  readonly title: string;
  readonly description: string;
  readonly targetDimension: CubiODimension;
  readonly invariants: readonly string[];
  readonly isFulfilled: boolean;
}

export interface LongHorizonPlan {
  readonly planId: string;
  readonly roadmapMilestones: readonly string[];
  readonly currentMilestoneIndex: number;
  readonly planChecksum: string;
}

export interface LongHorizonTask {
  readonly taskId: string;
  readonly title: string;
  readonly description: string;
  readonly status: 'PENDING' | 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETED';
  readonly dependencies: readonly string[];
  readonly priority: number; // Higher is more urgent
  readonly assignedAgent: string;
}

export interface LongHorizonProgress {
  readonly progressPercent: number; // 0 .. 100
  readonly completedTasks: number;
  readonly totalTasks: number;
  readonly healthScore: number; // 0 .. 100
  readonly velocityScore: number; // 0.0 .. 1.0
}

export interface LongHorizonMemoryState {
  readonly sessionCount: number;
  readonly historicalDecisions: readonly string[];
  readonly episodicSnapshots: readonly string[];
  readonly userPreferences: Readonly<Record<string, unknown>>;
  readonly memoryChecksum: string;
}

export interface ProjectSessionSnapshot {
  readonly sessionId: string;
  readonly projectId: string;
  readonly goal: LongHorizonGoal;
  readonly plan: LongHorizonPlan;
  readonly tasks: readonly LongHorizonTask[];
  readonly progress: LongHorizonProgress;
  readonly memory: LongHorizonMemoryState;
  readonly nextAction: string;
  readonly snapshotChecksum: string;
  readonly createdAt: number;
  readonly updatedAt: number;
}

export interface ILongHorizonProjectAgent {
  initializeProject(
    goal: string,
    description: string,
    invariants?: readonly string[]
  ): Promise<Readonly<ProjectSessionSnapshot>>;
  resumeProject(projectId: string): Promise<Readonly<ProjectSessionSnapshot>>;
  advanceNextAction(
    projectId: string
  ): Promise<
    Readonly<{
      completedTask: LongHorizonTask | null;
      nextAction: string;
      snapshot: ProjectSessionSnapshot;
    }>
  >;
  getProjectHistory(projectId: string): readonly ProjectSessionSnapshot[];
}
