/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F55: Multi-Agent Problem Decomposer
 *
 * Autonomous decomposition of complex user problems into specialized sub-tasks
 * assigned to dedicated agent roles with explicit dependency ordering.
 */

import { deterministicHash } from '../../../state/determinism';
import { UniversalAgentTask, ProblemDecomposition } from './types';

/**
 * Decomposes a user problem prompt into specialized agent tasks.
 */
export function decomposeProblem(problemPrompt: string): Readonly<ProblemDecomposition> {
  const rawProblem = problemPrompt.trim();
  const lower = rawProblem.toLowerCase();
  const problemId = `PROB_${deterministicHash('PROBLEM_DECOMP:' + rawProblem).slice(2, 10)}`;

  let domain = 'General Problem Solving';
  if (/jewelry|ecommerce|shop|cart|store/i.test(lower)) {
    domain = 'E-Commerce & Digital Storefront';
  } else if (/game|3d|spatial|voxel|shader/i.test(lower)) {
    domain = '3D Spatial Interactive Computing';
  } else if (/algorithm|math|369|vortex|matrix/i.test(lower)) {
    domain = 'Mathematical & Algorithmic Architecture';
  } else if (/ai|agent|orchestrat|workflow/i.test(lower)) {
    domain = 'Autonomous Agent System';
  }

  const tasks: UniversalAgentTask[] = [
    {
      taskId: `${problemId}_T1_RESEARCH`,
      role: 'RESEARCH_AGENT',
      title: 'Domain Research & Architecture Formulation',
      description: `Investigate state-of-the-art standards, constraints, and dependencies for ${domain}.`,
      dependencies: [],
      status: 'PENDING',
    },
    {
      taskId: `${problemId}_T2_DESIGN`,
      role: /3d|spatial|tesseract|mesh|geometry|369|voxel/i.test(lower) ? 'SPATIAL_AGENT' : 'DESIGN_AGENT',
      title: /3d|spatial|tesseract|mesh|geometry|369|voxel/i.test(lower) ? 'Spatial Geometry & 4D Manifold Synthesis' : 'Spatial UI/UX & Visual Aesthetic Formulation',
      description: `Synthesize visual hierarchy, typography, spatial geometry, and theme tokens.`,
      dependencies: [`${problemId}_T1_RESEARCH`],
      status: 'PENDING',
    },
    {
      taskId: `${problemId}_T3_CODE`,
      role: 'CODE_AGENT',
      title: 'Algorithmic & Component Implementation',
      description: `Synthesize clean, typed, modular code structures and business logic pipelines.`,
      dependencies: [`${problemId}_T1_RESEARCH`, `${problemId}_T2_DESIGN`],
      status: 'PENDING',
    },
    {
      taskId: `${problemId}_T4_TESTING`,
      role: 'TESTING_AGENT',
      title: 'Automated Verification & Invariance Testing',
      description: `Generate and execute unit tests, boundary validations, and determinism assertions.`,
      dependencies: [`${problemId}_T3_CODE`],
      status: 'PENDING',
    },
    {
      taskId: `${problemId}_T5_CRITIC`,
      role: 'CRITIC_AGENT',
      title: 'Architectural Review & Security Audit',
      description: `Critique proposed code, identify potential bottlenecks, and enforce quality invariants.`,
      dependencies: [`${problemId}_T3_CODE`, `${problemId}_T4_TESTING`],
      status: 'PENDING',
    },
  ];

  const decompositionChecksum = deterministicHash(
    `DECOMP:${problemId}:${domain}:${tasks.length}:${tasks.map((t) => t.taskId).join(',')}`
  );

  return Object.freeze({
    problemId,
    originalProblem: rawProblem,
    normalizedDomain: domain,
    tasks: Object.freeze(tasks.map((t) => Object.freeze(t))),
    totalTasks: tasks.length,
    decompositionChecksum,
  });
}
