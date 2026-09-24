/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F53: Universal Workflow Planner
 *
 * Translates natural-language instructions into structured 7-stage executable workflows:
 * Plan -> Design -> Code -> Assets -> Testing -> Build -> Deployment.
 */

import { deterministicHash } from '../../../state/determinism';
import { UniversalWorkflowPlan, UniversalWorkflowStep, WorkflowStage } from './types';

/**
 * Synthesizes a structured multi-stage workflow plan from a natural language goal.
 */
export function synthesizeWorkflowPlan(userInstruction: string): Readonly<UniversalWorkflowPlan> {
  const rawGoal = userInstruction.trim();
  const lowerGoal = rawGoal.toLowerCase();
  const planId = `PLAN_${deterministicHash('WORKFLOW_GOAL:' + rawGoal).slice(2, 10)}`;

  let topic = 'Application';
  if (/jewelry|jewel|gem|gold/i.test(lowerGoal)) {
    topic = 'Luxury Jewelry E-Commerce Platform';
  } else if (/game|3d|spatial|voxel/i.test(lowerGoal)) {
    topic = '3D Spatial Interactive Game';
  } else if (/dashboard|analytics|admin/i.test(lowerGoal)) {
    topic = 'Real-time Analytical Dashboard';
  } else if (/portfolio|showcase/i.test(lowerGoal)) {
    topic = 'Spatial Portfolio Showcase';
  } else {
    topic = rawGoal;
  }

  const stages: WorkflowStage[] = ['PLAN', 'DESIGN', 'CODE', 'ASSETS', 'TESTING', 'BUILD', 'DEPLOYMENT'];
  const steps: UniversalWorkflowStep[] = [
    {
      stepId: `${planId}_S1_PLAN`,
      stepIndex: 1,
      stage: 'PLAN',
      name: `Architectural Blueprint for ${topic}`,
      description: `Define system architecture, component hierarchy, state models, and dependency tree for ${topic}.`,
      action: 'PLAN_ARCHITECTURE',
      requiredCapabilities: ['PROJECT_ASSISTANCE', 'NATURAL_LANGUAGE'],
      isDestructive: false,
      requiresAuthorization: false,
      dependencies: [],
      expectedArtifactType: 'ARCHITECTURE_SPEC',
    },
    {
      stepId: `${planId}_S2_DESIGN`,
      stepIndex: 2,
      stage: 'DESIGN',
      name: `UI/UX Wireframes & Aesthetic Design System`,
      description: `Formulate color palette, typography tokens, spatial layouts, and responsive component mockups.`,
      action: 'SYNTHESIZE_DESIGN_SYSTEM',
      requiredCapabilities: ['VISION', 'NATURAL_LANGUAGE'],
      isDestructive: false,
      requiresAuthorization: false,
      dependencies: [`${planId}_S1_PLAN`],
      expectedArtifactType: 'DESIGN_TOKENS',
    },
    {
      stepId: `${planId}_S3_CODE`,
      stepIndex: 3,
      stage: 'CODE',
      name: `Core Application Component & Logic Implementation`,
      description: `Generate type-safe TypeScript/React components, state stores, and business logic pipelines.`,
      action: 'GENERATE_APPLICATION_CODE',
      requiredCapabilities: ['CODE_GENERATION', 'LLM_REASONING'],
      isDestructive: false,
      requiresAuthorization: false,
      dependencies: [`${planId}_S2_DESIGN`],
      expectedArtifactType: 'SOURCE_CODE_FILES',
    },
    {
      stepId: `${planId}_S4_ASSETS`,
      stepIndex: 4,
      stage: 'ASSETS',
      name: `Procedural Asset & Visual Artifact Generation`,
      description: `Synthesize SVG graphics, 3D spatial models, texture maps, and acoustic resonant soundscapes.`,
      action: 'SYNTHESIZE_ASSETS',
      requiredCapabilities: ['IMAGE_GENERATION', 'SPATIAL_REASONING'],
      isDestructive: false,
      requiresAuthorization: false,
      dependencies: [`${planId}_S3_CODE`],
      expectedArtifactType: 'ASSET_BUNDLE',
    },
    {
      stepId: `${planId}_S5_TESTING`,
      stepIndex: 5,
      stage: 'TESTING',
      name: `Automated Unit, Invariance & Integration Testing`,
      description: `Execute comprehensive Vitest suites, boundary validation, and zero-variance determinism checks.`,
      action: 'RUN_TEST_SUITES',
      requiredCapabilities: ['CODE_ANALYSIS', 'CODE_DEBUGGING'],
      isDestructive: false,
      requiresAuthorization: false,
      dependencies: [`${planId}_S4_ASSETS`],
      expectedArtifactType: 'TEST_REPORT',
    },
    {
      stepId: `${planId}_S6_BUILD`,
      stepIndex: 6,
      stage: 'BUILD',
      name: `Production Bundling, Optimization & Minification`,
      description: `Compile TypeScript, bundle assets with Vite, verify tree-shaking and generate production dist.`,
      action: 'EXECUTE_PRODUCTION_BUILD',
      requiredCapabilities: ['WORKFLOW_EXECUTION'],
      isDestructive: false,
      requiresAuthorization: false,
      dependencies: [`${planId}_S5_TESTING`],
      expectedArtifactType: 'BUILD_ARTIFACT',
    },
    {
      stepId: `${planId}_S7_DEPLOYMENT`,
      stepIndex: 7,
      stage: 'DEPLOYMENT',
      name: `Production Edge Deployment & Domain Activation`,
      description: `Deploy production distribution to edge CDN, configure TLS/DNS, and verify live endpoints.`,
      action: 'DEPLOY_TO_PRODUCTION',
      requiredCapabilities: ['WORKFLOW_EXECUTION'],
      isDestructive: true,
      requiresAuthorization: true,
      dependencies: [`${planId}_S6_BUILD`],
      expectedArtifactType: 'DEPLOYMENT_MANIFEST',
    },
  ];

  const planChecksum = deterministicHash(
    `PLAN:${rawGoal}:${topic}:${steps.length}:${steps.map((s) => s.stepId).join(',')}`
  );

  return Object.freeze({
    planId,
    userGoal: rawGoal,
    normalizedGoal: topic,
    stages: Object.freeze(stages),
    steps: Object.freeze(steps.map((s) => Object.freeze(s))),
    totalSteps: steps.length,
    planChecksum,
    createdAt: Date.now(),
  });
}
