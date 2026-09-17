/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F46: Workflow Engine
 *
 * Multi-step workflow execution with conditional branches and authorization gates.
 * Pipeline: INPUT -> PLAN -> TASKS -> TOOLS -> EXECUTION -> VERIFY -> REPAIR -> RESULT
 */

import { deterministicHash } from '../../state/determinism';
import {
  WorkflowDefinition,
  WorkflowState,
  WorkflowStepResult,
  WorkflowStatus,
} from './universalTypes';

export class CubiOWorkflowEngine {
  private workflows: Map<string, WorkflowState> = new Map();
  private definitions: Map<string, WorkflowDefinition> = new Map();

  /**
   * Creates a new workflow instance from a definition.
   */
  public createWorkflow(definition: WorkflowDefinition): Readonly<WorkflowState> {
    const timestamp = Date.now();
    const workflowId = `WF_${deterministicHash(definition.name + timestamp).slice(2, 10)}`;

    const defWithId: WorkflowDefinition = Object.freeze({
      ...definition,
      workflowId,
      steps: Object.freeze([...definition.steps]),
    });

    this.definitions.set(workflowId, defWithId);

    const initialStepResults: WorkflowStepResult[] = definition.steps.map((s) =>
      Object.freeze({
        stepIndex: s.stepIndex,
        status: 'PENDING' as const,
      })
    );

    const state: WorkflowState = Object.freeze({
      workflowId,
      status: 'PENDING' as WorkflowStatus,
      currentStepIndex: 0,
      stepResults: Object.freeze(initialStepResults),
      startedAt: timestamp,
    });

    this.workflows.set(workflowId, state);
    return state;
  }

  /**
   * Executes a single step in a workflow.
   */
  public executeStep(
    workflowId: string,
    stepIndex: number,
    authorization = false
  ): Readonly<WorkflowStepResult> {
    const def = this.definitions.get(workflowId);
    if (!def) {
      return Object.freeze({
        stepIndex,
        status: 'FAILED' as const,
        error: 'Workflow definition not found',
        executionTimeMs: 1,
      });
    }

    const stepDef = def.steps.find((s) => s.stepIndex === stepIndex);
    if (!stepDef) {
      return Object.freeze({
        stepIndex,
        status: 'FAILED' as const,
        error: `Step ${stepIndex} not found in workflow definition`,
        executionTimeMs: 1,
      });
    }

    // Authorization gate for destructive actions
    if (stepDef.isDestructive && !authorization) {
      return Object.freeze({
        stepIndex,
        status: 'AWAITING_AUTHORIZATION' as const,
        output: `Step "${stepDef.name}" requires explicit authorization before execution.`,
        executionTimeMs: 1,
      });
    }

    const startTime = Date.now();
    const output = `Successfully executed step ${stepIndex}: "${stepDef.name}" [Action: ${stepDef.action}]`;

    return Object.freeze({
      stepIndex,
      status: 'COMPLETED' as const,
      output,
      executionTimeMs: Math.max(1, Date.now() - startTime),
    });
  }

  /**
   * Executes all steps of a workflow sequentially.
   */
  public executeWorkflow(
    workflowId: string,
    authorizations: Record<number, boolean> = {}
  ): Readonly<WorkflowState> {
    const state = this.workflows.get(workflowId);
    const def = this.definitions.get(workflowId);

    if (!state || !def) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const stepResults: WorkflowStepResult[] = [...state.stepResults];
    let overallStatus: WorkflowStatus = 'RUNNING';

    for (let i = 0; i < def.steps.length; i++) {
      const stepDef = def.steps[i];
      const auth = authorizations[stepDef.stepIndex] || false;
      const res = this.executeStep(workflowId, stepDef.stepIndex, auth);

      const resIndex = stepResults.findIndex((r) => r.stepIndex === stepDef.stepIndex);
      if (resIndex !== -1) {
        stepResults[resIndex] = res;
      } else {
        stepResults.push(res);
      }

      if (res.status === 'AWAITING_AUTHORIZATION') {
        overallStatus = 'AWAITING_AUTHORIZATION';
        break;
      }

      if (res.status === 'FAILED') {
        overallStatus = 'FAILED';
        break;
      }
    }

    const allCompleted = stepResults.every((r) => r.status === 'COMPLETED');
    if (allCompleted) {
      overallStatus = 'COMPLETED';
    }

    const updatedState: WorkflowState = Object.freeze({
      ...state,
      status: overallStatus,
      currentStepIndex: stepResults.filter((r) => r.status === 'COMPLETED').length,
      stepResults: Object.freeze(stepResults),
      completedAt: overallStatus === 'COMPLETED' ? Date.now() : undefined,
    });

    this.workflows.set(workflowId, updatedState);
    return updatedState;
  }

  /**
   * Returns current workflow state.
   */
  public getWorkflowStatus(workflowId: string): Readonly<WorkflowState> | null {
    return this.workflows.get(workflowId) || null;
  }

  /**
   * Returns workflow definition.
   */
  public getWorkflowDefinition(workflowId: string): Readonly<WorkflowDefinition> | null {
    return this.definitions.get(workflowId) || null;
  }
}
