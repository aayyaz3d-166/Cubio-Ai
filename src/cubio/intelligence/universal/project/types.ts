/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F62: Project Intelligence 2.0 Types & Contracts
 *
 * Comprehensive holistic understanding across 7 dimensions:
 * 1. Files
 * 2. Architecture
 * 3. Tasks
 * 4. Goals
 * 5. Dependencies
 * 6. Decisions
 * 7. Progress
 */

import { CubiODimension } from '../../../types';
import {
  ProjectContext,
  ProjectFile,
  ProjectTask,
  ProjectArtifact,
  ProjectDecision,
} from '../universalTypes';

export type FilePurpose =
  | 'SOURCE_CODE'
  | 'TEST'
  | 'CONFIG'
  | 'SCHEMA'
  | 'DOCUMENTATION'
  | 'ASSET'
  | 'BUILD_OUTPUT'
  | 'UNKNOWN';

export interface ProjectFileNode {
  readonly path: string;
  readonly filename: string;
  readonly extension: string;
  readonly purpose: FilePurpose;
  readonly language?: string;
  readonly sizeBytes: number;
  readonly lineCount: number;
  readonly depth: number;
  readonly isEntryPoint: boolean;
  readonly imports: readonly string[];
  readonly exports: readonly string[];
  readonly fileChecksum: string;
}

export interface DependencyEdge {
  readonly sourcePath: string;
  readonly targetPath: string;
  readonly specifier: string;
  readonly isExternal: boolean;
}

export interface ProjectDependencyGraph {
  readonly nodes: readonly ProjectFileNode[];
  readonly edges: readonly DependencyEdge[];
  readonly circularDependencies: readonly (readonly string[])[];
  readonly rootModules: readonly string[];
  readonly hubModules: readonly string[];
  readonly maxDependencyDepth: number;
  readonly graphChecksum: string;
}

export interface ProjectStructureReport {
  readonly totalFiles: number;
  readonly totalDirectories: number;
  readonly totalLines: number;
  readonly purposeDistribution: Readonly<Record<FilePurpose, number>>;
  readonly entryPoints: readonly string[];
  readonly structureChecksum: string;
}

export interface ArchitectureReport {
  readonly layers: readonly { readonly name: string; readonly modulesCount: number }[];
  readonly modularityIndex: number; // 0.0 .. 1.0
  readonly certifiedIsolationPassed: boolean;
  readonly architectureChecksum: string;
}

export interface ProjectGoal {
  readonly goalId: string;
  readonly title: string;
  readonly description: string;
  readonly targetDimension: CubiODimension;
  readonly milestones: readonly string[];
  readonly isCompleted: boolean;
  readonly progressPercent: number;
}

export interface ProjectDecisionRecord {
  readonly decisionId: string;
  readonly title: string;
  readonly status: 'PROPOSED' | 'ACCEPTED' | 'SUPERSEDED' | 'REJECTED';
  readonly context: string;
  readonly decision: string;
  readonly consequences: readonly string[];
  readonly timestamp: number;
}

export interface ProjectProgressMetrics {
  readonly overallProgressPercent: number; // 0 .. 100
  readonly milestonesCompleted: number;
  readonly milestonesTotal: number;
  readonly activeTasksCount: number;
  readonly completedTasksCount: number;
  readonly healthScore: number; // 0 .. 100
  readonly velocityScore: number; // 0.0 .. 1.0
  readonly recommendedNextAction: string;
}

export interface ProjectIntelligence2Report {
  readonly projectId: string;
  readonly goal: string;
  readonly status: string;
  readonly activeDimension: CubiODimension;
  readonly files: ProjectStructureReport;
  readonly architecture: ArchitectureReport;
  readonly tasks: readonly ProjectTask[];
  readonly goals: readonly ProjectGoal[];
  readonly dependencies: ProjectDependencyGraph;
  readonly decisions: readonly ProjectDecisionRecord[];
  readonly progress: ProjectProgressMetrics;
  readonly reportChecksum: string;
  readonly timestamp: number;
}

export interface ProjectTechnologyStack {
  readonly primaryLanguage: string;
  readonly secondaryLanguages: readonly string[];
  readonly frameworks: readonly string[];
  readonly buildTool?: string;
  readonly testRunner?: string;
  readonly spatialLibraries: readonly string[];
  readonly packageManager?: string;
}

export interface ProjectHealthReport {
  readonly healthScore: number; // 0 .. 100
  readonly modularityIndex: number; // 0.0 .. 1.0
  readonly circularDependencyCount: number;
  readonly testFileRatio: number; // 0.0 .. 1.0
  readonly documentationRatio: number;
  readonly recommendations: readonly string[];
  readonly healthChecksum: string;
}

export interface ProjectContextSummary {
  readonly projectId: string;
  readonly goal: string;
  readonly status: string;
  readonly activeDimension: CubiODimension;
  readonly techStack: ProjectTechnologyStack;
  readonly structureSummary: ProjectStructureReport;
  readonly healthReport: ProjectHealthReport;
  readonly activeTasksCount: number;
  readonly completedTasksCount: number;
  readonly totalArtifactsCount: number;
  readonly totalDecisionsCount: number;
  readonly contextHeaderPrompt: string;
  readonly summaryChecksum: string;
  readonly timestamp: number;
}

export interface IUniversalProjectEngine {
  analyzeStructure(files: Readonly<Record<string, string | number>>): Readonly<ProjectStructureReport>;
  buildDependencyGraph(files: Readonly<Record<string, string>>): Readonly<ProjectDependencyGraph>;
  detectTechnologyStack(files: Readonly<Record<string, string>>): Readonly<ProjectTechnologyStack>;
  evaluateProjectHealth(structure: ProjectStructureReport, graph: ProjectDependencyGraph): Readonly<ProjectHealthReport>;
  createProjectContext(goal: string, dimension?: CubiODimension): Readonly<ProjectContext>;
  getProjectSummary(projectId: string, files?: Readonly<Record<string, string>>): Readonly<ProjectContextSummary> | null;
}

export interface IProjectIntelligence2Engine {
  analyzeProject(projectId?: string): Promise<Readonly<ProjectIntelligence2Report>>;
  createTask(task: Omit<ProjectTask, 'taskId'>): ProjectTask;
  updateTaskStatus(taskId: string, status: ProjectTask['status']): boolean;
  recordDecision(decision: Omit<ProjectDecisionRecord, 'decisionId' | 'timestamp'>): ProjectDecisionRecord;
  addGoal(goal: Omit<ProjectGoal, 'goalId' | 'progressPercent' | 'isCompleted'>): ProjectGoal;
}
