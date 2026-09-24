/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F66: Master Super Intelligence Orchestrator Control Plane
 *
 * Single Brain / Control Plane Pipeline:
 * Master Orchestrator -> [Intelligence, Agents, Tools] -> State Engine -> Result Validator
 */

import { deterministicHash } from '../../../state/determinism';
import {
  ICubiOMasterOrchestratorControlPlane,
  StateEngineSyncResult,
  SuperIntelligenceControlPlaneRequest,
  SuperIntelligenceControlPlaneResponse,
} from './controlPlaneTypes';
import { IntelligenceBranch } from './branches/intelligenceBranch';
import { AgentsBranch } from './branches/agentsBranch';
import { ToolsBranch } from './branches/toolsBranch';
import { ControlPlaneValidator } from './controlPlaneValidator';
import { CubiOProjectIntelligence2Engine } from '../project/projectIntelligence2Engine';

export class CubiOMasterOrchestratorControlPlane
  implements ICubiOMasterOrchestratorControlPlane
{
  private intelligenceBranch = new IntelligenceBranch();
  private agentsBranch = new AgentsBranch();
  private toolsBranch = new ToolsBranch();
  private validator = new ControlPlaneValidator();
  private projectEngine = new CubiOProjectIntelligence2Engine();

  /**
   * Orchestrates the complete Super Intelligence Control Plane pipeline.
   */
  public async orchestrateSuperIntelligence(
    request: SuperIntelligenceControlPlaneRequest
  ): Promise<Readonly<SuperIntelligenceControlPlaneResponse>> {
    const startTime = Date.now();

    // 1. Tri-Branch Parallel Execution
    const [intelligence, agents, tools] = await Promise.all([
      this.intelligenceBranch.executeBranch(request),
      this.agentsBranch.executeBranch(request),
      this.toolsBranch.executeBranch(request),
    ]);

    // 2. State Engine Convergence (D0-D8)
    const projectReport = await this.projectEngine.analyzeProject('CONTROL_PLANE_STATE');
    const stateEngine: StateEngineSyncResult = Object.freeze({
      stateChecksum: projectReport.reportChecksum,
      activeDimension: request.targetDimension || 'D7',
      projectHealth: projectReport.progress.healthScore,
      progressPercent: projectReport.progress.overallProgressPercent,
    });

    // 3. Result Validator Cross-Domain Audit
    const validation = this.validator.validateSuperIntelligenceExecution(
      request.prompt,
      intelligence,
      agents,
      tools,
      stateEngine
    );

    // 4. Final Master Output Synthesis
    const finalMasterOutput =
      `# 🌌 CubiO Super Intelligence Master Control Plane Response\n\n` +
      `**Request**: "${request.prompt}"\n\n` +
      `### 1. Intelligence Branch\n` +
      `• Intent: ${intelligence.multimodalFusion.voiceTranscription}\n` +
      `• Spatial Topology: ${intelligence.multimodalFusion.spatialAnalysis.vertexCount} vertices, closed manifold (${intelligence.multimodalFusion.spatialAnalysis.isClosedManifold ? 'Yes' : 'No'})\n` +
      `• 3-6-9 Harmonic Resonance: ${(intelligence.harmonicResonance * 100).toFixed(2)}%\n\n` +
      `### 2. Agents Branch\n` +
      `• Multi-Agent Consensus: ${agents.multiAgentSolve.finalAnswer.answerId} (${agents.multiAgentSolve.contributions.length} specialists)\n` +
      `• Long-Horizon State: Session count ${agents.longHorizonSession.memory.sessionCount} (Progress: ${agents.longHorizonSession.progress.progressPercent}%)\n\n` +
      `### 3. Tools Branch\n` +
      `• Tools Executed: [${tools.toolsExecuted.join(', ')}]\n` +
      `• Sandbox Execution: ${tools.sandboxResult.output} (Secure: ${tools.sandboxResult.isSecure ? 'Yes' : 'No'})\n\n` +
      `### 4. State Engine & Validation\n` +
      `• Active Dimension: ${stateEngine.activeDimension} | Health: ${stateEngine.projectHealth}/100\n` +
      `• Validation Status: ${validation.isValid ? '✅ Fully Certified (100%)' : '⚠️ Warning'}`;

    const totalExecutionTimeMs = Math.max(1, Date.now() - startTime);

    const controlPlaneSignature = deterministicHash(
      `CONTROL_PLANE_RESP:${request.prompt}:${intelligence.multimodalFusion.fusionChecksum}:${agents.multiAgentSolve.solveChecksum}:${tools.sandboxResult.output}:${validation.auditSignature}`
    );
    const controlPlaneId = `CP_${controlPlaneSignature.slice(2, 10)}`;

    return Object.freeze({
      controlPlaneId,
      prompt: request.prompt,
      intelligence,
      agents,
      tools,
      stateEngine,
      validation,
      finalMasterOutput,
      controlPlaneSignature,
      totalExecutionTimeMs,
      timestamp: Date.now(),
    });
  }
}
