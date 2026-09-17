/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F46: Project Intelligence
 *
 * Project context management: goals, files, tasks, artifacts, decisions, and state.
 * Clearly separates Conversation Context (F25) from Project Context (F46).
 */

import { deterministicHash } from '../../state/determinism';
import {
  ProjectContext,
  ProjectFile,
  ProjectTask,
  ProjectArtifact,
  ProjectDecision,
  UniversalCapabilityClass,
} from './universalTypes';

export class CubiOProjectIntelligence {
  private projects: Map<string, ProjectContext> = new Map();

  /**
   * Creates a new project context.
   */
  public createProject(goal: string): Readonly<ProjectContext> {
    const timestamp = Date.now();
    const projectId = `PROJ_${deterministicHash(goal + timestamp).slice(2, 10)}`;

    const project: ProjectContext = Object.freeze({
      projectId,
      goal,
      createdAt: timestamp,
      updatedAt: timestamp,
      status: 'ACTIVE' as const,
      files: Object.freeze([]),
      tasks: Object.freeze([]),
      artifacts: Object.freeze([]),
      decisions: Object.freeze([]),
      state: Object.freeze({}),
    });

    this.projects.set(projectId, project);
    return project;
  }

  /**
   * Gets an existing project context by ID.
   */
  public getProjectContext(projectId: string): Readonly<ProjectContext> | null {
    return this.projects.get(projectId) || null;
  }

  /**
   * Updates top-level project fields.
   */
  public updateProject(
    projectId: string,
    update: Partial<Pick<ProjectContext, 'goal' | 'status' | 'state'>>
  ): Readonly<ProjectContext> | null {
    const existing = this.projects.get(projectId);
    if (!existing) return null;

    const updated: ProjectContext = Object.freeze({
      ...existing,
      goal: update.goal || existing.goal,
      status: update.status || existing.status,
      state: update.state ? Object.freeze({ ...existing.state, ...update.state }) : existing.state,
      updatedAt: Date.now(),
    });

    this.projects.set(projectId, updated);
    return updated;
  }

  /**
   * Adds a task to a project.
   */
  public addTask(
    projectId: string,
    description: string,
    dependencies: readonly string[] = [],
    assignedCapability?: UniversalCapabilityClass
  ): Readonly<ProjectTask> | null {
    const project = this.projects.get(projectId);
    if (!project) return null;

    const taskId = `TASK_${deterministicHash(projectId + description + Date.now()).slice(2, 10)}`;
    const task: ProjectTask = Object.freeze({
      taskId,
      description,
      status: 'PENDING' as const,
      dependencies: Object.freeze([...dependencies]),
      assignedCapability,
    });

    const updated: ProjectContext = Object.freeze({
      ...project,
      tasks: Object.freeze([...project.tasks, task]),
      updatedAt: Date.now(),
    });

    this.projects.set(projectId, updated);
    return task;
  }

  /**
   * Completes a task in a project.
   */
  public completeTask(projectId: string, taskId: string): boolean {
    const project = this.projects.get(projectId);
    if (!project) return false;

    const taskIndex = project.tasks.findIndex((t) => t.taskId === taskId);
    if (taskIndex === -1) return false;

    const updatedTasks = [...project.tasks];
    updatedTasks[taskIndex] = Object.freeze({
      ...updatedTasks[taskIndex],
      status: 'COMPLETED' as const,
    });

    const updated: ProjectContext = Object.freeze({
      ...project,
      tasks: Object.freeze(updatedTasks),
      updatedAt: Date.now(),
    });

    this.projects.set(projectId, updated);
    return true;
  }

  /**
   * Adds an artifact to a project.
   */
  public addArtifact(
    projectId: string,
    type: string,
    description: string,
    data?: unknown
  ): Readonly<ProjectArtifact> | null {
    const project = this.projects.get(projectId);
    if (!project) return null;

    const artifactId = `ART_${deterministicHash(projectId + type + description + Date.now()).slice(2, 10)}`;
    const artifact: ProjectArtifact = Object.freeze({
      artifactId,
      type,
      description,
      createdAt: Date.now(),
      data,
    });

    const updated: ProjectContext = Object.freeze({
      ...project,
      artifacts: Object.freeze([...project.artifacts, artifact]),
      updatedAt: Date.now(),
    });

    this.projects.set(projectId, updated);
    return artifact;
  }

  /**
   * Adds a recorded decision to a project.
   */
  public addDecision(
    projectId: string,
    description: string,
    rationale: string
  ): Readonly<ProjectDecision> | null {
    const project = this.projects.get(projectId);
    if (!project) return null;

    const decisionId = `DEC_${deterministicHash(projectId + description + Date.now()).slice(2, 10)}`;
    const decision: ProjectDecision = Object.freeze({
      decisionId,
      description,
      rationale,
      decidedAt: Date.now(),
    });

    const updated: ProjectContext = Object.freeze({
      ...project,
      decisions: Object.freeze([...project.decisions, decision]),
      updatedAt: Date.now(),
    });

    this.projects.set(projectId, updated);
    return decision;
  }

  /**
   * Adds a file reference to a project.
   */
  public addFile(
    projectId: string,
    path: string,
    type: string
  ): Readonly<ProjectFile> | null {
    const project = this.projects.get(projectId);
    if (!project) return null;

    const fileId = `FILE_${deterministicHash(projectId + path).slice(2, 10)}`;
    const file: ProjectFile = Object.freeze({
      fileId,
      path,
      type,
      addedAt: Date.now(),
    });

    const updated: ProjectContext = Object.freeze({
      ...project,
      files: Object.freeze([...project.files, file]),
      updatedAt: Date.now(),
    });

    this.projects.set(projectId, updated);
    return file;
  }

  /**
   * Lists all existing projects.
   */
  public listProjects(): readonly ProjectContext[] {
    return Object.freeze(Array.from(this.projects.values()));
  }
}
