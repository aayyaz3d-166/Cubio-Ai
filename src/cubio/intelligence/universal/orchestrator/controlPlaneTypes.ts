/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F66: Super Intelligence Master Orchestrator Control Plane Types
 *
 * Single Brain / Control Plane Pipeline:
 * Master Orchestrator -> [Intelligence, Agents, Tools] -> State Engine -> Result Validator
 */

import { CubiODimension } from '../../../types';
import { DimensionalStateNode } from '../dimension/types';
import { MultimodalFusionResult } from '../fusion/types';
import { MultiAgentSolveResult } from '../agent/types';
import { ProjectSessionSnapshot } from '../longHorizon/types';

export interface SuperIntelligenceControlPlaneRequest {
  readonly requestId?: string;
  readonly prompt: string;
  readonly targetDimension?: CubiODimension;
  readonly modalityInputs?: Readonly<Record<string, unknown>>;
  readonly parameters?: Readonly<Record<string, unknown>>;
}

export interface BranchIntelligenceResult {
  readonly multimodalFusion: MultimodalFusionResult;
  readonly dimensionalState: DimensionalStateNode;
  readonly harmonicResonance: number;
}

export interface BranchAgentsResult {
  readonly multiAgentSolve: MultiAgentSolveResult;
  readonly longHorizonSession: ProjectSessionSnapshot;
}

export interface BranchToolsResult {
  readonly toolsExecuted: readonly string[];
  readonly sandboxResult: {
    readonly output: string;
    readonly executionTimeMs: number;
    readonly isSecure: boolean;
  };
}

export interface StateEngineSyncResult {
  readonly stateChecksum: string;
  readonly activeDimension: CubiODimension;
  readonly projectHealth: number;
  readonly progressPercent: number;
}

export interface ControlPlaneValidationResult {
  readonly isValid: boolean;
  readonly validationScore: number;
  readonly verifiedAspects: readonly string[];
  readonly auditSignature: string;
}

export interface SuperIntelligenceControlPlaneResponse {
  readonly controlPlaneId: string;
  readonly prompt: string;
  readonly intelligence: BranchIntelligenceResult;
  readonly agents: BranchAgentsResult;
  readonly tools: BranchToolsResult;
  readonly stateEngine: StateEngineSyncResult;
  readonly validation: ControlPlaneValidationResult;
  readonly finalMasterOutput: string;
  readonly controlPlaneSignature: string;
  readonly totalExecutionTimeMs: number;
  readonly timestamp: number;
}

export interface ICubiOMasterOrchestratorControlPlane {
  orchestrateSuperIntelligence(
    request: SuperIntelligenceControlPlaneRequest
  ): Promise<Readonly<SuperIntelligenceControlPlaneResponse>>;
}
