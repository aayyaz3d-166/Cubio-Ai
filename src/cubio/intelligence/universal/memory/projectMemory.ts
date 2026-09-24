/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F56: Tier 3 — Project Memory Store ($D_7$)
 *
 * Project-level contextual memory: active goals, architectural decisions, and artifacts.
 */

import { ProjectMemoryState } from './types';

export class ProjectMemoryStore {
  private projects: Map<string, ProjectMemoryState> = new Map();

  public saveProjectContext(state: ProjectMemoryState): void {
    this.projects.set(
      state.projectId,
      Object.freeze({
        projectId: state.projectId,
        goal: state.goal,
        activeFiles: Object.freeze([...state.activeFiles]),
        decisions: Object.freeze([...state.decisions]),
        artifacts: Object.freeze([...state.artifacts]),
      })
    );
  }

  public getProjectContext(projectId: string): Readonly<ProjectMemoryState> | null {
    return this.projects.get(projectId) || null;
  }
}
