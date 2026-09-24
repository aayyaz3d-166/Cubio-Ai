/**
 * CUBiO AI — 3D Memory Studio
 * AGENT-005 — TheMG (Evidence & Solution Planning Agent)
 * src/cubio/agents/themg/planBuilder.ts
 *
 * Constructs deterministic, gated execution plans complete with verification
 * criteria, rollback procedures, and auto-inclusion of mandatory regression locks.
 */

import * as crypto from 'crypto';
import {
  TheMGPlanningScope,
  TheMGProposedSolution,
  TheMGExecutionPlan,
  TheMGExecutionStep,
} from './types';

export class TheMGPlanBuilder {
  /**
   * Constructs an execution plan for the selected solution.
   */
  public buildExecutionPlan(
    scope: TheMGPlanningScope,
    solution: TheMGProposedSolution
  ): TheMGExecutionPlan {
    const steps: TheMGExecutionStep[] = [];

    // Step 1: Baseline Prerequisite & Regression Verification
    steps.push({
      stepNumber: 1,
      name: 'Verify Baseline Invariants',
      description: 'Audit canonical DB (77,824 B), spatial 369, and permanent actuation lockout.',
      targetFiles: ['data/cubio_studio.db', 'src/core/address369.ts'],
      verificationGate: 'test_phase8_regression_lock.ts',
      rollbackPlan: 'Abort immediately if baseline invariants fail closed.',
      expectedOutcome: 'Baseline confirmed locked with zero drift.',
    });

    // Step 2: Implementation / Modification Step
    steps.push({
      stepNumber: 2,
      name: 'Apply Targeted Implementation',
      description: solution.description,
      targetFiles: [...solution.filesToModify, ...solution.newFilesRequired],
      verificationGate: 'TypeScript Strict Typecheck (--noEmit)',
      rollbackPlan: 'Discard unstaged modifications via git restore.',
      expectedOutcome: 'Typecheck passes with zero errors.',
    });

    // Step 3: Verification & Architectural Gate Execution
    steps.push({
      stepNumber: 3,
      name: 'Execute Verification & Gate Certification',
      description: 'Run targeted test suites and audit outputs with EIA/TGA.',
      targetFiles: [],
      verificationGate: 'Dedicated Agent Verification Suite',
      rollbackPlan: 'Revert code changes and re-run baseline regression.',
      expectedOutcome: 'All architectural gates pass with 100% precision.',
    });

    // Mandatory gates
    const mandatoryGates = [
      'src/test_phase8_regression_lock.ts',
      'IS_ACTUATION_BLOCKED === true',
      'CANONICAL_DB_DELTA === 0',
    ];

    const planPayload = JSON.stringify({
      objective: scope.objective,
      solutionId: solution.solutionId,
      stepCount: steps.length,
      mandatoryGates,
    });

    const planHash = crypto.createHash('sha256').update(planPayload).digest('hex');

    return Object.freeze({
      planId: `PLAN_${scope.taskId}_${planHash.slice(0, 8)}`,
      objective: scope.objective,
      selectedSolutionId: solution.solutionId,
      steps: Object.freeze(steps),
      mandatoryGates: Object.freeze(mandatoryGates),
      estimatedRisk: solution.estimatedRisk,
      planHash,
    });
  }
}
