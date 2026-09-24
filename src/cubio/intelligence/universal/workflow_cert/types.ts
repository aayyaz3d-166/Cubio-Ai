/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F75: Autonomous Workflow Certification Types & Contracts
 *
 * Covers 7 Stages: Goal -> Planner -> Task Graph -> Tool Execution -> Validation -> Correction -> Completion
 * with Mandatory Human Approval Gates.
 */

export interface AutonomousWorkflowGoal {
  readonly goalId: string;
  readonly prompt: string;
  readonly targetDomain: string;
  readonly timestamp: number;
}

export type AutonomousDAGNodeStatus =
  | 'PENDING'
  | 'EXECUTING'
  | 'VALIDATING'
  | 'CORRECTING'
  | 'COMPLETED'
  | 'HELD_AT_GATE';

export interface AutonomousDAGNode {
  readonly nodeId: string;
  readonly title: string;
  readonly dependencies: readonly string[];
  readonly status: AutonomousDAGNodeStatus;
  readonly actionType: string;
  readonly output?: unknown;
}

export interface AutonomousValidationReport {
  readonly isValid: boolean;
  readonly passedTests: number;
  readonly totalTests: number;
  readonly errorsDetected: readonly string[];
  readonly selfHealingApplied: boolean;
  readonly healingFixesCount: number;
}

export interface AutonomousWorkflowExecutionResult {
  readonly workflowId: string;
  readonly goal: string;
  readonly totalDAGNodes: number;
  readonly completedDAGNodes: number;
  readonly generatedFiles: readonly { readonly path: string; readonly sizeBytes: number }[];
  readonly validationReport: AutonomousValidationReport;
  readonly requiresHumanApproval: boolean;
  readonly isApproved: boolean;
  readonly stagingUrl: string;
  readonly executionTimeMs: number;
  readonly checksum: string;
}

export interface IMasterAutonomousWorkflowCoordinator {
  executeAutonomousWorkflow(prompt: string): Promise<Readonly<AutonomousWorkflowExecutionResult>>;
  authorizeWorkflowRelease(
    workflowId: string,
    token: string
  ): Promise<Readonly<AutonomousWorkflowExecutionResult>>;
}
