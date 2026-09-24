/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F63: Autonomous Workflow Planner
 *
 * Decomposes natural language instructions into 10 explicit autonomous execution stages:
 * Understand -> Plan -> Design -> Generate Code -> Generate Assets -> Run Tests -> Fix Errors -> Build -> Deploy Proposal -> Ask Authorization
 */

import { deterministicHash } from '../../../state/determinism';
import { AutonomousWorkflowPlan, AutonomousWorkflowStep } from './types';

export class AutonomousWorkflowPlanner {
  public planWorkflow(userInstruction: string): Readonly<AutonomousWorkflowPlan> {
    const rawInstruction = userInstruction.trim();
    const lower = rawInstruction.toLowerCase();
    const planId = `AUTOPLAN_${deterministicHash('AUTONOMOUS_WORKFLOW:' + rawInstruction).slice(2, 10)}`;

    let domain = 'Full-Stack Spatial Web Application';
    if (/jewelry|jewel|gem|gold|anguthi|gehna/i.test(lower)) {
      domain = 'Luxury Jewelry E-Commerce & 3D Showcase Storefront';
    } else if (/game|voxel|metaverse|3d/i.test(lower)) {
      domain = '3D Spatial Interactive Game Experience';
    } else if (/dashboard|analytics|admin/i.test(lower)) {
      domain = 'Real-time Analytical Spatial Dashboard';
    }

    const steps: AutonomousWorkflowStep[] = [
      {
        stepId: `${planId}_S01_UNDERSTAND`,
        stepIndex: 1,
        stage: 'UNDERSTAND',
        name: 'Requirement Extraction & Intent Parsing',
        description: `Parse user intent for "${rawInstruction}" and establish domain constraints for ${domain}.`,
        action: 'PARSE_INTENT',
        isDestructive: false,
        requiresAuthorization: false,
      },
      {
        stepId: `${planId}_S02_PLAN`,
        stepIndex: 2,
        stage: 'PLAN',
        name: 'Architectural Blueprint & Milestone Breakdown',
        description: `Define system architecture, state models, database schema, and component dependency tree.`,
        action: 'PLAN_ARCHITECTURE',
        isDestructive: false,
        requiresAuthorization: false,
      },
      {
        stepId: `${planId}_S03_DESIGN`,
        stepIndex: 3,
        stage: 'DESIGN',
        name: 'Spatial UI/UX & Chromatic Design System',
        description: `Formulate Gold/Obsidian aesthetic, typography tokens, responsive 3D viewport, and theme constants.`,
        action: 'SYNTHESIZE_DESIGN_SYSTEM',
        isDestructive: false,
        requiresAuthorization: false,
      },
      {
        stepId: `${planId}_S04_CODE`,
        stepIndex: 4,
        stage: 'GENERATE_CODE',
        name: 'React TypeScript & Storefront Code Generation',
        description: `Synthesize type-safe TypeScript components, cart state hooks, and 3D jewelry viewer canvas.`,
        action: 'GENERATE_COMPONENTS_AND_LOGIC',
        isDestructive: false,
        requiresAuthorization: false,
      },
      {
        stepId: `${planId}_S05_ASSETS`,
        stepIndex: 5,
        stage: 'GENERATE_ASSETS',
        name: '3D Meshes & Visual Media Generation',
        description: `Generate procedural 3D jewelry geometries, gemstone shaders, and luxury promotional banners.`,
        action: 'SYNTHESIZE_ASSETS',
        isDestructive: false,
        requiresAuthorization: false,
      },
      {
        stepId: `${planId}_S06_TESTS`,
        stepIndex: 6,
        stage: 'RUN_TESTS',
        name: 'Automated Vitest Suite Execution',
        description: `Execute unit tests covering cart transitions, pricing mathematics, and rendering invariants.`,
        action: 'EXECUTE_TEST_SUITE',
        isDestructive: false,
        requiresAuthorization: false,
      },
      {
        stepId: `${planId}_S07_FIX`,
        stepIndex: 7,
        stage: 'FIX_ERRORS',
        name: 'Automated Self-Healing & Hot-Patching',
        description: `Diagnose lint/type warnings or test anomalies and apply automated self-healing patches.`,
        action: 'SELF_HEAL_AND_PATCH',
        isDestructive: false,
        requiresAuthorization: false,
      },
      {
        stepId: `${planId}_S08_BUILD`,
        stepIndex: 8,
        stage: 'BUILD',
        name: 'Production Bundle Compilation & Tree-Shaking',
        description: `Compile optimized production assets, minify JavaScript chunks, and extract CSS bundles.`,
        action: 'COMPILE_PRODUCTION_BUILD',
        isDestructive: false,
        requiresAuthorization: false,
      },
      {
        stepId: `${planId}_S09_DEPLOY`,
        stepIndex: 9,
        stage: 'DEPLOY_PROPOSAL',
        name: 'Edge Staging Deployment Proposal',
        description: `Generate edge CDN deployment manifest, SSL configuration, and staging preview URL.`,
        action: 'GENERATE_DEPLOYMENT_PROPOSAL',
        isDestructive: false,
        requiresAuthorization: false,
      },
      {
        stepId: `${planId}_S10_AUTH`,
        stepIndex: 10,
        stage: 'ASK_AUTHORIZATION',
        name: 'Sovereign Human Authorization Gate',
        description: `Request explicit human sign-off before committing production release to public domain.`,
        action: 'PROMPT_HUMAN_AUTHORIZATION',
        isDestructive: true,
        requiresAuthorization: true,
      },
    ];

    const totalSteps = steps.length;
    const planChecksum = deterministicHash(
      `AUTOPLAN:${rawInstruction}:${domain}:${totalSteps}`
    );

    return Object.freeze({
      planId,
      userInstruction: rawInstruction,
      domain,
      steps: Object.freeze(steps),
      totalSteps,
      planChecksum,
      createdAt: Date.now(),
    });
  }
}
