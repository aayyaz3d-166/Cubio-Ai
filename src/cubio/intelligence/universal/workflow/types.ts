/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F63: Autonomous Workflow Engine Types
 *
 * 10-Stage Autonomous Pipeline:
 * Understand -> Plan -> Design -> Generate Code -> Generate Assets -> Run Tests -> Fix Errors -> Build -> Deploy Proposal -> Ask Authorization
 */

import { UniversalCapabilityClass } from '../universalTypes';

export type WorkflowStage =
  | 'PLAN'
  | 'DESIGN'
  | 'CODE'
  | 'ASSETS'
  | 'TESTING'
  | 'BUILD'
  | 'DEPLOYMENT'
  | 'MONITORING';

export type AutonomousWorkflowStage =
  | 'UNDERSTAND'
  | 'PLAN'
  | 'DESIGN'
  | 'GENERATE_CODE'
  | 'GENERATE_ASSETS'
  | 'RUN_TESTS'
  | 'FIX_ERRORS'
  | 'BUILD'
  | 'DEPLOY_PROPOSAL'
  | 'ASK_AUTHORIZATION';

export type WorkflowExecutionStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'AWAITING_AUTHORIZATION'
  | 'SKIPPED';

export interface UniversalWorkflowStep {
  readonly stepId: string;
  readonly stepIndex: number;
  readonly stage: WorkflowStage;
  readonly name: string;
  readonly description: string;
  readonly action: string;
  readonly requiredCapabilities: readonly UniversalCapabilityClass[];
  readonly isDestructive: boolean;
  readonly requiresAuthorization: boolean;
  readonly dependencies: readonly string[];
  readonly expectedArtifactType?: string;
}

export interface UniversalWorkflowPlan {
  readonly planId: string;
  readonly userGoal: string;
  readonly normalizedGoal: string;
  readonly stages: readonly WorkflowStage[];
  readonly steps: readonly UniversalWorkflowStep[];
  readonly totalSteps: number;
  readonly planChecksum: string;
  readonly createdAt: number;
}

export interface StepExecutionResult {
  readonly stepId: string;
  readonly stepIndex: number;
  readonly stage: WorkflowStage | AutonomousWorkflowStage;
  readonly status: WorkflowExecutionStatus;
  readonly output: string;
  readonly artifactCreated?: string;
  readonly executionTimeMs: number;
  readonly completedAt?: number;
  readonly error?: string;
}

export interface WorkflowExecutionReport {
  readonly planId: string;
  readonly overallStatus: WorkflowExecutionStatus;
  readonly currentStepIndex: number;
  readonly completedStepsCount: number;
  readonly stepResults: readonly StepExecutionResult[];
  readonly totalExecutionTimeMs: number;
  readonly reportChecksum: string;
}

export interface AutonomousWorkflowStep {
  readonly stepId: string;
  readonly stepIndex: number;
  readonly stage: AutonomousWorkflowStage;
  readonly name: string;
  readonly description: string;
  readonly action: string;
  readonly isDestructive: boolean;
  readonly requiresAuthorization: boolean;
}

export interface AutonomousWorkflowPlan {
  readonly planId: string;
  readonly userInstruction: string;
  readonly domain: string;
  readonly steps: readonly AutonomousWorkflowStep[];
  readonly totalSteps: number;
  readonly planChecksum: string;
  readonly createdAt: number;
}

export interface DeploymentProposal {
  readonly stagingUrl: string;
  readonly bundleSizeKb: number;
  readonly sslEnabled: boolean;
  readonly edgeRegions: readonly string[];
  readonly manifestChecksum: string;
}

export interface AutonomousWorkflowExecutionReport {
  readonly planId: string;
  readonly userInstruction: string;
  readonly domain: string;
  readonly stepResults: readonly StepExecutionResult[];
  readonly overallStatus: WorkflowExecutionStatus;
  readonly deploymentProposal?: DeploymentProposal;
  readonly authorizationRequested: boolean;
  readonly isAuthorized: boolean;
  readonly totalExecutionTimeMs: number;
  readonly reportChecksum: string;
  readonly timestamp: number;
}

export interface IUniversalWorkflowEngine {
  synthesizePlan(userInstruction: string): UniversalWorkflowPlan;
  executeStep(plan: UniversalWorkflowPlan, stepIndex: number, authorized?: boolean): Promise<StepExecutionResult>;
  executeWorkflow(plan: UniversalWorkflowPlan, authorizations?: Readonly<Record<string, boolean>>): Promise<WorkflowExecutionReport>;
}

export interface IAutonomousWorkflowEngine {
  planWorkflow(instruction: string): Readonly<AutonomousWorkflowPlan>;
  executeWorkflow(
    instruction: string,
    options?: { autoAuthorize?: boolean }
  ): Promise<Readonly<AutonomousWorkflowExecutionReport>>;
}
