/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F52: Master Universal Project Intelligence Engine
 *
 * Coordinates file structure scanning, dependency graph construction,
 * technology stack detection, project health auditing, and D7 context management.
 */

import { deterministicHash } from '../../../state/determinism';
import { CubiODimension } from '../../../types';
import { ProjectContext } from '../universalTypes';
import { CubiOProjectIntelligence } from '../projectIntelligence';
import {
  IUniversalProjectEngine,
  ProjectContextSummary,
  ProjectDependencyGraph,
  ProjectHealthReport,
  ProjectStructureReport,
  ProjectTechnologyStack,
} from './types';
import { analyzeProjectStructure } from './structureAnalyzer';
import { buildProjectDependencyGraph } from './dependencyAnalyzer';
import {
  detectProjectTechnologyStack,
  evaluateProjectHealthReport,
  formatProjectContextHeader,
} from './contextManager';

export class CubiOUniversalProjectEngine implements IUniversalProjectEngine {
  private readonly projectIntelligence: CubiOProjectIntelligence;

  constructor(projectIntelligence?: CubiOProjectIntelligence) {
    this.projectIntelligence = projectIntelligence || new CubiOProjectIntelligence();
  }

  /**
   * Analyzes project file hierarchy and purpose distributions.
   */
  public analyzeStructure(
    files: Readonly<Record<string, string | number>>
  ): Readonly<ProjectStructureReport> {
    return analyzeProjectStructure(files);
  }

  /**
   * Builds directed dependency graphs and checks for circular dependencies.
   */
  public buildDependencyGraph(
    files: Readonly<Record<string, string>>
  ): Readonly<ProjectDependencyGraph> {
    return buildProjectDependencyGraph(files);
  }

  /**
   * Detects frameworks, libraries, and language standards.
   */
  public detectTechnologyStack(
    files: Readonly<Record<string, string>>
  ): Readonly<ProjectTechnologyStack> {
    return detectProjectTechnologyStack(files);
  }

  /**
   * Audits modularity index and architectural health score.
   */
  public evaluateProjectHealth(
    structure: ProjectStructureReport,
    graph: ProjectDependencyGraph
  ): Readonly<ProjectHealthReport> {
    return evaluateProjectHealthReport(structure, graph);
  }

  /**
   * Creates a new $D_7$ project context.
   */
  public createProjectContext(
    goal: string,
    dimension: CubiODimension = 'D7'
  ): Readonly<ProjectContext> {
    return this.projectIntelligence.createProject(goal);
  }

  /**
   * Generates a comprehensive ProjectContextSummary.
   */
  public getProjectSummary(
    projectId: string,
    files: Readonly<Record<string, string>> = {}
  ): Readonly<ProjectContextSummary> | null {
    const project = this.projectIntelligence.getProjectContext(projectId);
    if (!project) return null;

    const structure = this.analyzeStructure(files);
    const graph = this.buildDependencyGraph(files);
    const techStack = this.detectTechnologyStack(files);
    const health = this.evaluateProjectHealth(structure, graph);

    const activeTasksCount = project.tasks.filter((t) => t.status === 'PENDING' || t.status === 'IN_PROGRESS').length;
    const completedTasksCount = project.tasks.filter((t) => t.status === 'COMPLETED').length;

    const contextHeaderPrompt = formatProjectContextHeader(
      projectId,
      project.goal,
      techStack,
      structure,
      graph
    );

    const summaryChecksum = deterministicHash(
      `PROJ_SUMMARY:${projectId}:${structure.structureChecksum}:${graph.graphChecksum}:${health.healthChecksum}`
    );

    return Object.freeze({
      projectId,
      goal: project.goal,
      status: project.status,
      activeDimension: 'D7' as const,
      techStack,
      structureSummary: structure,
      healthReport: health,
      activeTasksCount,
      completedTasksCount,
      totalArtifactsCount: project.artifacts.length,
      totalDecisionsCount: project.decisions.length,
      contextHeaderPrompt,
      summaryChecksum,
      timestamp: Date.now(),
    });
  }
}
