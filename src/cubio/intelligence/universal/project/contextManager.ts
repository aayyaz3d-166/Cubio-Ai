/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F52: Project Context & Health Manager ($D_7$)
 *
 * Technology stack identification, project health evaluation,
 * and high-signal contextual header formatting for downstream AI reasoning.
 */

import { deterministicHash } from '../../../state/determinism';
import {
  ProjectDependencyGraph,
  ProjectHealthReport,
  ProjectStructureReport,
  ProjectTechnologyStack,
} from './types';

/**
 * Detects technology stack from project files and dependencies.
 */
export function detectProjectTechnologyStack(
  files: Readonly<Record<string, string>>
): Readonly<ProjectTechnologyStack> {
  const filePaths = Object.keys(files);
  const frameworks = new Set<string>();
  const spatialLibraries = new Set<string>();
  let primaryLanguage = 'typescript';
  let buildTool = 'vite';
  let testRunner = 'vitest';

  for (const path of filePaths) {
    const content = files[path] || '';
    if (/three|three\/examples|@types\/three/i.test(content)) {
      spatialLibraries.add('Three.js');
    }
    if (/glsl|raymarch|shader|voxel/i.test(content)) {
      spatialLibraries.add('GLSL / WebGL');
    }
    if (/katex/i.test(content)) {
      spatialLibraries.add('KaTeX');
    }
    if (/react|jsx|tsx/i.test(content)) {
      frameworks.add('React');
    }
    if (/lucide-react/i.test(content)) {
      frameworks.add('Lucide Icons');
    }
    if (/package\.json/i.test(path)) {
      if (content.includes('"vite"')) buildTool = 'Vite';
      if (content.includes('"vitest"')) testRunner = 'Vitest';
      if (content.includes('"jest"')) testRunner = 'Jest';
    }
    if (path.endsWith('.py')) primaryLanguage = 'python';
    if (path.endsWith('.rs')) primaryLanguage = 'rust';
  }

  return Object.freeze({
    primaryLanguage,
    secondaryLanguages: Object.freeze(['glsl', 'json', 'markdown']),
    frameworks: Object.freeze(Array.from(frameworks)),
    buildTool,
    testRunner,
    spatialLibraries: Object.freeze(Array.from(spatialLibraries)),
    packageManager: 'npm',
  });
}

/**
 * Evaluates architectural health, modularity, and test ratios for a project.
 */
export function evaluateProjectHealthReport(
  structure: ProjectStructureReport,
  graph: ProjectDependencyGraph
): Readonly<ProjectHealthReport> {
  const totalFiles = Math.max(1, structure.totalFiles);
  const testFiles = structure.purposeDistribution.TEST || 0;
  const docFiles = structure.purposeDistribution.DOCUMENTATION || 0;

  const testFileRatio = Number((testFiles / totalFiles).toFixed(2));
  const documentationRatio = Number((docFiles / totalFiles).toFixed(2));
  const circularDependencyCount = graph.circularDependencies.length;

  // Modularity Index: higher when dependencies are evenly distributed without deep bottlenecks
  const modularityIndex = Number(Math.max(0.5, Math.min(1.0, 1.0 - (circularDependencyCount * 0.15))).toFixed(2));

  // Health Score (0 - 100)
  let healthScore = 90;
  if (circularDependencyCount > 0) healthScore -= circularDependencyCount * 10;
  if (testFileRatio > 0.1) healthScore += 5;
  if (structure.purposeDistribution.SOURCE_CODE > 0) healthScore += 5;
  healthScore = Math.max(0, Math.min(100, healthScore));

  const recommendations: string[] = [];
  if (circularDependencyCount > 0) {
    recommendations.push('Decouple circular dependencies using dependency injection or shared interfaces.');
  }
  if (testFileRatio < 0.15) {
    recommendations.push('Increase automated unit and invariant test coverage.');
  }
  if (recommendations.length === 0) {
    recommendations.push('Project architecture is well-structured with high modularity.');
  }

  const healthChecksum = deterministicHash(`HEALTH:${healthScore}:${modularityIndex}:${circularDependencyCount}`);

  return Object.freeze({
    healthScore,
    modularityIndex,
    circularDependencyCount,
    testFileRatio,
    documentationRatio,
    recommendations: Object.freeze(recommendations),
    healthChecksum,
  });
}

/**
 * Formats a condensed, high-signal project context header prompt for AI code synthesis.
 */
export function formatProjectContextHeader(
  projectId: string,
  goal: string,
  techStack: ProjectTechnologyStack,
  structure: ProjectStructureReport,
  graph: ProjectDependencyGraph
): string {
  const hubs = graph.hubModules.slice(0, 3).join(', ') || 'root';
  const spatialPart = techStack.spatialLibraries.length > 0 ? ` | Spatial: ${techStack.spatialLibraries.join(', ')}` : '';
  return `// [CubiO Project Context: ${projectId} | Goal: "${goal}" | Primary: ${techStack.primaryLanguage} | Frameworks: ${techStack.frameworks.join(', ') || 'Vanilla'}${spatialPart} | Files: ${structure.totalFiles} | Hub Modules: ${hubs}]`;
}
