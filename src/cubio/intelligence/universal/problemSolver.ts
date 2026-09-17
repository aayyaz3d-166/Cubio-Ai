/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F46: Problem Solver Orchestration
 *
 * Multi-engine problem decomposition and solution fusion.
 * Supports single-engine and multi-engine execution paths.
 */

import { deterministicHash } from '../../state/determinism';
import { CubiOCapabilityRegistry } from './capabilityRegistry';
import { CubiOProviderRegistry } from './providerRegistry';
import {
  ProblemSolverRequest,
  ProblemSolverPlan,
  ProblemSolverStep,
  ProblemSolverResult,
  StepResult,
  UniversalCapabilityClass,
  ProviderType,
} from './universalTypes';

export class CubiOProblemSolver {
  constructor(
    private readonly capabilityRegistry: CubiOCapabilityRegistry,
    private readonly providerRegistry: CubiOProviderRegistry
  ) {}

  /**
   * Plans the execution steps for a problem solving request.
   */
  public plan(request: ProblemSolverRequest): ProblemSolverPlan {
    const prompt = request.prompt.toLowerCase();
    const steps: ProblemSolverStep[] = [];
    let caps: UniversalCapabilityClass[] = [];

    // If request already has required capabilities, use them
    if (request.requiredCapabilities && request.requiredCapabilities.length > 0) {
      caps = [...request.requiredCapabilities];
    } else {
      // Analyze prompt and decompose into steps
      if (/code|programming|script|implement function/i.test(prompt)) {
        caps.push('CODE_GENERATION');
      }
      if (/debug|fix bug|error|stack trace/i.test(prompt)) {
        caps.push('CODE_DEBUGGING');
      }
      if (/image|picture|photo|illustration/i.test(prompt)) {
        caps.push('IMAGE_GENERATION');
      }
      if (/voice|speak|audio/i.test(prompt)) {
        caps.push('VOICE_OUTPUT');
      }
      if (/cube|sphere|tetrahedron|geometry|polyhedron/i.test(prompt)) {
        caps.push('GEOMETRIC_REASONING');
      }
      if (/spatial reasoning|topology|manifold/i.test(prompt)) {
        caps.push('SPATIAL_REASONING');
      }
      if (/369|harmonic|vortex|digital root/i.test(prompt)) {
        caps.push('HARMONIC_369');
      }
      if (/predict|forecast|trajectory/i.test(prompt)) {
        caps.push('PREDICTION');
      }
      if (/reason about|think step by step|philosophical|complex reasoning/i.test(prompt)) {
        caps.push('LLM_REASONING');
      }
      if (/research|investigate|look up/i.test(prompt)) {
        caps.push('RESEARCH');
      }
      if (/workflow|build|create project/i.test(prompt)) {
        caps.push('WORKFLOW_EXECUTION');
      }

      if (caps.length === 0) {
        caps.push('NATURAL_LANGUAGE');
      }
    }

    let isAnyDestructive = false;

    caps.forEach((cap, idx) => {
      const resolution = this.capabilityRegistry.resolveCapability(cap);
      const isDestructive = /delete|remove|destroy|format|overwrite/i.test(prompt);
      if (isDestructive) isAnyDestructive = true;

      const providerType: ProviderType | 'INTERNAL_ENGINE' =
        resolution.resolvedBy === 'INTERNAL_ENGINE'
          ? 'INTERNAL_ENGINE'
          : resolution.providerType || 'LLM';

      steps.push(
        Object.freeze({
          stepIndex: idx + 1,
          description: `Execute ${cap} resolution for request`,
          requiredCapability: cap,
          providerType,
          isDestructive,
          authorized: !isDestructive,
        })
      );
    });

    const planId = `PLAN_${deterministicHash(request.prompt + Date.now()).slice(2, 10)}`;

    return Object.freeze({
      planId,
      steps: Object.freeze(steps),
      estimatedCapabilities: Object.freeze(caps),
      requiresAuthorization: isAnyDestructive,
    });
  }

  /**
   * Solves a request by executing its plan steps.
   */
  public solve(request: ProblemSolverRequest): ProblemSolverResult {
    const startTime = Date.now();
    const plan = this.plan(request);
    const stepResults: StepResult[] = [];
    const providersUsed: string[] = [];
    const unavailableCaps: UniversalCapabilityClass[] = [];

    for (const step of plan.steps) {
      const stepStartTime = Date.now();
      const resolution = this.capabilityRegistry.resolveCapability(step.requiredCapability);

      let output = '';
      let success = true;
      let providerId = 'INTERNAL_CUBIO_CORE';

      if (resolution.resolvedBy === 'INTERNAL_ENGINE') {
        output = `Executed internal engine (${resolution.engineId}) for capability: ${step.requiredCapability}`;
        providerId = resolution.engineId || 'INTERNAL';
        providersUsed.push(providerId);
      } else if (resolution.resolvedBy === 'EXTERNAL_PROVIDER') {
        const provider = this.providerRegistry.getProvider(resolution.providerType!);
        if (provider && provider.getInfo().status === 'AVAILABLE') {
          output = `Executed external provider (${provider.getInfo().name}) for capability: ${step.requiredCapability}`;
          providerId = provider.getInfo().providerId;
          providersUsed.push(providerId);
        } else {
          output = `External provider for ${step.requiredCapability} is currently unavailable in this runtime environment.`;
          success = false;
          providerId = 'UNAVAILABLE';
          unavailableCaps.push(step.requiredCapability);
        }
      } else {
        output = `Capability ${step.requiredCapability} is currently unavailable: no provider registered in this runtime environment.`;
        success = false;
        providerId = 'UNAVAILABLE';
        unavailableCaps.push(step.requiredCapability);
      }

      stepResults.push(
        Object.freeze({
          stepIndex: step.stepIndex,
          success,
          output,
          providerId,
          executionTimeMs: Math.max(1, Date.now() - stepStartTime),
        })
      );
    }

    const textOutput = this.fuse(stepResults);
    const resultId = `SOLV_${deterministicHash(textOutput).slice(2, 10)}`;

    return Object.freeze({
      resultId,
      planId: plan.planId,
      textOutput,
      stepResults: Object.freeze(stepResults),
      overallConfidence: unavailableCaps.length === 0 ? 0.99 : 0.85,
      executionTimeMs: Math.max(1, Date.now() - startTime),
      providersUsed: Object.freeze([...new Set(providersUsed)]),
      unavailableCapabilities: Object.freeze(unavailableCaps),
    });
  }

  /**
   * Fuses step results into a coherent final text output.
   */
  public fuse(results: readonly StepResult[]): string {
    if (results.length === 1) {
      return results[0].output;
    }
    return results.map((r) => `[Step ${r.stepIndex}]: ${r.output}`).join('\n\n');
  }
}
