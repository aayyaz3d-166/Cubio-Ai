/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F76: Master Agent Swarm Coordinator
 *
 * Implements Master Agent coordinating parallel specialist agents ({Research, Coding, Spatial} -> Validator).
 */

import { deterministicHash } from '../../../state/determinism';
import {
  IMasterAgentSwarmCoordinator,
  SwarmReconciledResult,
} from './types';
import { AgentMessageBus } from './agentMessageBus';
import { SwarmConflictResolver } from './conflictResolver';
import {
  SwarmCodingAgent,
  SwarmResearchAgent,
  SwarmSpatialAgent,
  SwarmValidatorAgent,
} from './specialistSwarm';

export class CubiOMasterAgentSwarmCoordinator implements IMasterAgentSwarmCoordinator {
  private messageBus = new AgentMessageBus();
  private conflictResolver = new SwarmConflictResolver();
  private researchAgent = new SwarmResearchAgent();
  private codingAgent = new SwarmCodingAgent();
  private spatialAgent = new SwarmSpatialAgent();
  private validatorAgent = new SwarmValidatorAgent();

  public async solveWithSwarm(prompt: string): Promise<Readonly<SwarmReconciledResult>> {
    const startTime = Date.now();

    // 1. Master Agent decomposes and initiates parallel execution
    const [researchProp, codingProp, spatialProp] = await Promise.all([
      this.researchAgent.conductResearch(prompt, this.messageBus),
      this.codingAgent.generateCode(prompt, this.messageBus),
      this.spatialAgent.synthesizeSpatialMesh(prompt, this.messageBus),
    ]);

    // 2. Conflict Resolution & Proposal Merging
    this.conflictResolver.reconcileProposals([
      researchProp,
      codingProp,
      spatialProp,
    ]);

    // 3. Validator Agent Audit
    const meshContent = spatialProp.content as {
      vertexCount: number;
      edgeCount: number;
      faceCount: number;
      isClosedManifold: boolean;
    };

    const validatorAudit = await this.validatorAgent.validateSwarmOutputs(
      researchProp.content as string[],
      codingProp.content as string,
      meshContent
    );

    const executionTimeMs = Math.max(1, Date.now() - startTime);
    const checksum = deterministicHash(
      `SWARM_SOLVE:${prompt}:${validatorAudit.isValid}:${validatorAudit.eulerCharacteristic}`
    );

    return Object.freeze({
      taskTitle: prompt,
      researchEvidence: Object.freeze(researchProp.content as string[]),
      synthesizedCode: codingProp.content as string,
      spatialMesh: {
        vertexCount: meshContent.vertexCount,
        faceCount: meshContent.faceCount,
        isClosedManifold: meshContent.isClosedManifold,
      },
      validatorAudit,
      executionTimeMs,
      checksum,
    });
  }

  public getMessageBus(): AgentMessageBus {
    return this.messageBus;
  }
}
