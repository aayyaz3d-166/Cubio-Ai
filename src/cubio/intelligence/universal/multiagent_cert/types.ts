/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F76: Multi-Agent Certification Types & Contracts
 *
 * Covers Master Agent + {Research, Coding, Spatial} -> Validator -> Final Result
 */

export type SpecialistAgentRole = 'MASTER' | 'RESEARCH' | 'CODING' | 'SPATIAL' | 'VALIDATOR';

export interface AgentBusMessage {
  readonly messageId: string;
  readonly senderRole: SpecialistAgentRole;
  readonly recipientRole: SpecialistAgentRole | 'BROADCAST';
  readonly topic: string;
  readonly payload: unknown;
  readonly timestamp: number;
}

export interface AgentTaskProposal {
  readonly agentRole: SpecialistAgentRole;
  readonly proposalId: string;
  readonly content: unknown;
  readonly confidence: number;
  readonly recommendations: readonly string[];
}

export interface SwarmReconciledResult {
  readonly taskTitle: string;
  readonly researchEvidence: readonly string[];
  readonly synthesizedCode: string;
  readonly spatialMesh: {
    readonly vertexCount: number;
    readonly faceCount: number;
    readonly isClosedManifold: boolean;
  };
  readonly validatorAudit: {
    readonly isValid: boolean;
    readonly eulerCharacteristic: number;
    readonly issuesFound: readonly string[];
  };
  readonly executionTimeMs: number;
  readonly checksum: string;
}

export interface IMasterAgentSwarmCoordinator {
  solveWithSwarm(prompt: string): Promise<Readonly<SwarmReconciledResult>>;
}
