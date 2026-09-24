/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F63: Master Autonomous Workflow Engine
 *
 * Implements the 10-stage autonomous creation pipeline:
 * Understand -> Plan -> Design -> Generate Code -> Generate Assets -> Run Tests -> Fix Errors -> Build -> Deploy Proposal -> Ask Authorization
 */

import {
  AutonomousWorkflowExecutionReport,
  AutonomousWorkflowPlan,
  IAutonomousWorkflowEngine,
} from './types';
import { AutonomousWorkflowPlanner } from './autonomousWorkflowPlanner';
import { AutonomousWorkflowExecutor } from './autonomousWorkflowExecutor';

export class CubiOAutonomousWorkflowEngine implements IAutonomousWorkflowEngine {
  private planner = new AutonomousWorkflowPlanner();
  private executor = new AutonomousWorkflowExecutor();

  /**
   * Plans a 10-stage autonomous workflow from a natural language goal.
   */
  public planWorkflow(instruction: string): Readonly<AutonomousWorkflowPlan> {
    return this.planner.planWorkflow(instruction);
  }

  /**
   * Executes the 10-stage autonomous workflow with automated self-healing
   * and human authorization checkpoints.
   */
  public async executeWorkflow(
    instruction: string,
    options: { autoAuthorize?: boolean } = {}
  ): Promise<Readonly<AutonomousWorkflowExecutionReport>> {
    const plan = this.planWorkflow(instruction);
    return this.executor.executePlan(plan, options);
  }
}
