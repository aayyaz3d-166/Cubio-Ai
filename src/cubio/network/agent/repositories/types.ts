/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-12: Agent Repository Interfaces
 */

import {
  AgentRecord,
  AgentDelegationToken,
  AgentTask,
  AgentLifecycleState,
  AgentType,
} from '../types';

export interface IAgentRepository {
  // Agent records
  saveAgent(agent: AgentRecord): Promise<void>;
  getAgent(agentId: string): Promise<AgentRecord | undefined>;
  getAgentsByOwner(ownerCubId: string): Promise<readonly AgentRecord[]>;
  listAgents(filter?: { status?: AgentLifecycleState; agentType?: AgentType }): Promise<readonly AgentRecord[]>;
  updateAgentStatus(agentId: string, status: AgentLifecycleState): Promise<AgentRecord | undefined>;
  deleteAgent(agentId: string): Promise<boolean>;

  // Delegation Tokens
  saveDelegation(delegation: AgentDelegationToken): Promise<void>;
  getDelegation(delegationId: string): Promise<AgentDelegationToken | undefined>;
  getDelegationByToken(token: string): Promise<AgentDelegationToken | undefined>;
  revokeDelegation(delegationId: string): Promise<boolean>;

  // Tasks
  saveTask(task: AgentTask): Promise<void>;
  getTask(taskId: string): Promise<AgentTask | undefined>;
  getTasksByAgent(agentId: string): Promise<readonly AgentTask[]>;
}
