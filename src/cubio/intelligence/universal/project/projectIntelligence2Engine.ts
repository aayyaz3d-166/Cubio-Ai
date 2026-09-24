/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F62: Master Project Intelligence 2.0 Engine
 *
 * Implements holistic project understanding across 7 dimensions:
 * 1. Files
 * 2. Architecture
 * 3. Tasks
 * 4. Goals
 * 5. Dependencies
 * 6. Decisions
 * 7. Progress
 */

import { deterministicHash } from '../../../state/determinism';
import { ProjectTask } from '../universalTypes';
import {
  IProjectIntelligence2Engine,
  ProjectDecisionRecord,
  ProjectGoal,
  ProjectIntelligence2Report,
} from './types';
import { FilesAnalyzer } from './analyzers/filesAnalyzer';
import { ArchitectureAnalyzer } from './analyzers/architectureAnalyzer';
import { TaskManager } from './analyzers/taskManager';
import { GoalTracker } from './analyzers/goalTracker';
import { DecisionRecorder } from './analyzers/decisionRecorder';
import { ProgressCalculator } from './analyzers/progressCalculator';
import { buildProjectDependencyGraph } from './dependencyAnalyzer';

export class CubiOProjectIntelligence2Engine implements IProjectIntelligence2Engine {
  private filesAnalyzer = new FilesAnalyzer();
  private archAnalyzer = new ArchitectureAnalyzer();
  private taskManager = new TaskManager();
  private goalTracker = new GoalTracker();
  private decisionRecorder = new DecisionRecorder();
  private progressCalc = new ProgressCalculator();

  public async analyzeProject(projectId: string = 'CUBIO_UNIVERSAL_SPATIAL_OS'): Promise<Readonly<ProjectIntelligence2Report>> {
    // 1. Files
    const filesResult = this.filesAnalyzer.analyzeFiles();

    // 2. Architecture
    const architecture = this.archAnalyzer.analyzeArchitecture();

    // 3. Tasks
    const tasks = this.taskManager.getTasks();

    // 4. Goals
    const goals = this.goalTracker.getGoals();

    // 5. Dependencies
    const filesMap: Record<string, string> = {};
    for (const f of filesResult.files) {
      filesMap[f.path] = f.imports.map((i) => `import '${i}';`).join('\n');
    }
    const dependencies = buildProjectDependencyGraph(filesMap);

    // 6. Decisions
    const decisions = this.decisionRecorder.getDecisions();

    // 7. Progress
    const progress = this.progressCalc.calculateProgress(tasks, goals);

    const reportChecksum = deterministicHash(
      `PROJ_INTEL_2:${projectId}:${filesResult.structureReport.structureChecksum}:${architecture.architectureChecksum}:${progress.overallProgressPercent}:${decisions.length}`
    );

    return Object.freeze({
      projectId,
      goal: 'Universal Spatial Operating Environment & Multimodal Super Intelligence',
      status: 'ACTIVE_RESONANCE',
      activeDimension: 'D7',
      files: filesResult.structureReport,
      architecture,
      tasks,
      goals,
      dependencies,
      decisions,
      progress,
      reportChecksum,
      timestamp: Date.now(),
    });
  }

  public createTask(task: Omit<ProjectTask, 'taskId'>): ProjectTask {
    return this.taskManager.createTask(task);
  }

  public updateTaskStatus(taskId: string, status: ProjectTask['status']): boolean {
    return this.taskManager.updateTaskStatus(taskId, status);
  }

  public recordDecision(
    decision: Omit<ProjectDecisionRecord, 'decisionId' | 'timestamp'>
  ): ProjectDecisionRecord {
    return this.decisionRecorder.recordDecision(decision);
  }

  public addGoal(
    goal: Omit<ProjectGoal, 'goalId' | 'progressPercent' | 'isCompleted'>
  ): ProjectGoal {
    return this.goalTracker.addGoal(goal);
  }
}
