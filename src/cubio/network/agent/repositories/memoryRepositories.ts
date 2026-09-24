/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-12: In-Memory Agent Repository
 */

import {
  AgentRecord,
  AgentDelegationToken,
  AgentTask,
  AgentLifecycleState,
  AgentType,
} from '../types';
import { IAgentRepository } from './types';

export class MemoryAgentRepository implements IAgentRepository {
  private agentsById: Map<string, AgentRecord> = new Map();
  private delegationsById: Map<string, AgentDelegationToken> = new Map();
  private delegationsByToken: Map<string, string> = new Map(); // token -> delegationId
  private tasksById: Map<string, AgentTask> = new Map();

  // --- AGENT RECORDS ---

  public async saveAgent(agent: AgentRecord): Promise<void> {
    this.agentsById.set(agent.agentId, Object.freeze({ ...agent }));
  }

  public async getAgent(agentId: string): Promise<AgentRecord | undefined> {
    return this.agentsById.get(agentId);
  }

  public async getAgentsByOwner(ownerCubId: string): Promise<readonly AgentRecord[]> {
    const matches: AgentRecord[] = [];
    for (const agt of this.agentsById.values()) {
      if (agt.ownerCubId === ownerCubId) {
        matches.push(agt);
      }
    }
    return Object.freeze(matches);
  }

  public async listAgents(filter: { status?: AgentLifecycleState; agentType?: AgentType } = {}): Promise<readonly AgentRecord[]> {
    const matches: AgentRecord[] = [];
    for (const agt of this.agentsById.values()) {
      if (filter.status && agt.status !== filter.status) continue;
      if (filter.agentType && agt.agentType !== filter.agentType) continue;
      matches.push(agt);
    }
    return Object.freeze(matches);
  }

  public async updateAgentStatus(
    agentId: string,
    status: AgentLifecycleState
  ): Promise<AgentRecord | undefined> {
    const existing = this.agentsById.get(agentId);
    if (!existing) return undefined;

    const updated: AgentRecord = Object.freeze({
      ...existing,
      status,
      updatedAt: Date.now(),
    });

    this.agentsById.set(agentId, updated);
    return updated;
  }

  public async deleteAgent(agentId: string): Promise<boolean> {
    return this.agentsById.delete(agentId);
  }

  // --- DELEGATIONS ---

  public async saveDelegation(delegation: AgentDelegationToken): Promise<void> {
    const frozen = Object.freeze({ ...delegation });
    this.delegationsById.set(delegation.delegationId, frozen);
    this.delegationsByToken.set(delegation.token, delegation.delegationId);
  }

  public async getDelegation(delegationId: string): Promise<AgentDelegationToken | undefined> {
    return this.delegationsById.get(delegationId);
  }

  public async getDelegationByToken(token: string): Promise<AgentDelegationToken | undefined> {
    const id = this.delegationsByToken.get(token);
    return id ? this.delegationsById.get(id) : undefined;
  }

  public async revokeDelegation(delegationId: string): Promise<boolean> {
    const existing = this.delegationsById.get(delegationId);
    if (!existing) return false;

    const updated: AgentDelegationToken = Object.freeze({
      ...existing,
      revoked: true,
    });

    this.delegationsById.set(delegationId, updated);
    return true;
  }

  // --- TASKS ---

  public async saveTask(task: AgentTask): Promise<void> {
    this.tasksById.set(task.taskId, Object.freeze({ ...task }));
  }

  public async getTask(taskId: string): Promise<AgentTask | undefined> {
    return this.tasksById.get(taskId);
  }

  public async getTasksByAgent(agentId: string): Promise<readonly AgentTask[]> {
    const matches: AgentTask[] = [];
    for (const tsk of this.tasksById.values()) {
      if (tsk.agentId === agentId) {
        matches.push(tsk);
      }
    }
    return Object.freeze(matches);
  }
}
