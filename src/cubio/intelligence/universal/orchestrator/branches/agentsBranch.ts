/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F66: Agents Branch
 *
 * Coordinates Multi-Agent Problem Solver (F60/F61) and Long-Horizon Project Agent (F64).
 */

import { BranchAgentsResult, SuperIntelligenceControlPlaneRequest } from '../controlPlaneTypes';
import { CubiOMultiAgentProblemSolverEngine } from '../../agent/pipeline/multiAgentProblemSolverEngine';
import { CubiOLongHorizonProjectAgent } from '../../longHorizon/longHorizonProjectAgent';

export class AgentsBranch {
  private multiAgentEngine = new CubiOMultiAgentProblemSolverEngine();
  private longHorizonAgent = new CubiOLongHorizonProjectAgent();

  public async executeBranch(
    request: SuperIntelligenceControlPlaneRequest
  ): Promise<Readonly<BranchAgentsResult>> {
    const multiAgentSolve = await this.multiAgentEngine.solveProblem(request.prompt);
    const longHorizonSession = await this.longHorizonAgent.initializeProject(
      request.prompt,
      'Control Plane Managed Project'
    );

    return Object.freeze({
      multiAgentSolve,
      longHorizonSession,
    });
  }
}
