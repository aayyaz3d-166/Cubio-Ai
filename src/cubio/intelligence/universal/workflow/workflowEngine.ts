/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F53: Master Universal Workflow Engine
 *
 * Coordinates end-to-end translation of natural language goals into
 * 7-stage workflows and manages step execution lifecycle.
 */

import {
  IUniversalWorkflowEngine,
  StepExecutionResult,
  UniversalWorkflowPlan,
  WorkflowExecutionReport,
} from './types';
import { synthesizeWorkflowPlan } from './workflowPlanner';
import { executeEntireWorkflow, executeWorkflowStep } from './workflowExecutor';

export class CubiOUniversalWorkflowEngine implements IUniversalWorkflowEngine {
  /**
   * Translates a natural language instruction into an executable 7-stage workflow plan.
   */
  public synthesizePlan(userInstruction: string): Readonly<UniversalWorkflowPlan> {
    return synthesizeWorkflowPlan(userInstruction);
  }

  /**
   * Executes a specific step of a workflow plan with authorization checks.
   */
  public async executeStep(
    plan: UniversalWorkflowPlan,
    stepIndex: number,
    authorized: boolean = false
  ): Promise<Readonly<StepExecutionResult>> {
    return executeWorkflowStep(plan, stepIndex, authorized);
  }

  /**
   * Executes all steps of a workflow plan sequentially.
   */
  public async executeWorkflow(
    plan: UniversalWorkflowPlan,
    authorizations: Readonly<Record<string, boolean>> = {}
  ): Promise<Readonly<WorkflowExecutionReport>> {
    return executeEntireWorkflow(plan, authorizations);
  }
}
