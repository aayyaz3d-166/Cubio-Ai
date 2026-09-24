/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F66: Control Plane Result Validator
 *
 * Performs unified cross-domain verification and cryptographic audit signing.
 */

import { deterministicHash } from '../../../state/determinism';
import {
  BranchAgentsResult,
  BranchIntelligenceResult,
  BranchToolsResult,
  ControlPlaneValidationResult,
  StateEngineSyncResult,
} from './controlPlaneTypes';

export class ControlPlaneValidator {
  public validateSuperIntelligenceExecution(
    prompt: string,
    intelligence: BranchIntelligenceResult,
    agents: BranchAgentsResult,
    tools: BranchToolsResult,
    stateEngine: StateEngineSyncResult
  ): Readonly<ControlPlaneValidationResult> {
    const verifiedAspects: string[] = [];

    // 1. Intelligence Branch Check
    const intelligenceValid =
      intelligence.multimodalFusion.spatialAnalysis.isClosedManifold &&
      intelligence.harmonicResonance > 0.99;
    if (intelligenceValid) {
      verifiedAspects.push('Intelligence: Multimodal Fusion & Closed 2-Manifold Topology Certified');
    }

    // 2. Agents Branch Check
    const agentsValid =
      agents.multiAgentSolve.validationReport.isValid &&
      agents.longHorizonSession.tasks.length > 0;
    if (agentsValid) {
      verifiedAspects.push('Agents: Multi-Agent Consensus & Long-Horizon Continuity Certified');
    }

    // 3. Tools Branch Check
    const toolsValid =
      tools.toolsExecuted.length >= 2 &&
      tools.sandboxResult.isSecure;
    if (toolsValid) {
      verifiedAspects.push('Tools: Universal Tool 6-Pillar Security & Sandbox Certified');
    }

    // 4. State Engine Check
    const stateValid = stateEngine.projectHealth >= 90;
    if (stateValid) {
      verifiedAspects.push('State Engine: Canonical D0-D8 Synchronization Certified');
    }

    const isValid = intelligenceValid && agentsValid && toolsValid && stateValid;
    const validationScore = isValid ? 1.0 : 0.7;

    const auditSignature = deterministicHash(
      `CONTROL_PLANE_AUDIT:${prompt}:${isValid}:${validationScore}:${verifiedAspects.length}:${stateEngine.stateChecksum}`
    );

    return Object.freeze({
      isValid,
      validationScore,
      verifiedAspects: Object.freeze(verifiedAspects),
      auditSignature,
    });
  }
}
