/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-12: Master Agent / AI Network Engine
 *
 * Implements sovereign agent creation, capability scoping,
 * delegation tokens, permission boundaries, and audited execution.
 *
 * CRITICAL ARCHITECTURAL INVARIANT:
 * - Agents operate under explicit authorization and MUST NOT inherit unrestricted user privileges.
 * - Delegated permissions must be a strict subset of the principal's permissions.
 * - High-risk administrative permissions are strictly forbidden for agents.
 */

import { deterministicHash } from '../../state/determinism';
import { CubiOIdentityRegistry } from '../identity/identityRegistry';
import { CubiOAuthEngine } from '../auth/authEngine';
import { CubiOPolicyEngine } from '../authz/policyEngine';
import { CubiORoleManager } from '../authz/roleManager';
import { CubiOStorageEngine } from '../storage/storageEngine';
import { CubiOServiceEngine } from '../service/serviceEngine';
import { NetworkPermission } from '../authz/types';
import {
  AgentRecord,
  AgentDelegationToken,
  AgentTask,
  AgentExecutionAuditRecord,
  CreateAgentInput,
  CreateDelegationInput,
  ExecuteAgentTaskInput,
} from './types';
import { IAgentRepository } from './repositories/types';
import { MemoryAgentRepository } from './repositories/memoryRepositories';

export class CubiOAgentEngine {
  private repository: IAgentRepository;
  private identityRegistry?: CubiOIdentityRegistry;
  private authEngine?: CubiOAuthEngine;
  private policyEngine?: CubiOPolicyEngine;
  private roleManager?: CubiORoleManager;
  private storageEngine?: CubiOStorageEngine;
  private serviceEngine?: CubiOServiceEngine;

  public static readonly FORBIDDEN_AGENT_PERMISSIONS = new Set<string>([
    'KEY_ROTATE',
    'ACCOUNT_DELETE',
    'ADMIN_MANAGE',
    'SERVICE_ADMIN',
    'DEVICE_REVOKE',
    'SUPER_ADMIN',
  ]);

  constructor(options: {
    repository?: IAgentRepository;
    identityRegistry?: CubiOIdentityRegistry;
    authEngine?: CubiOAuthEngine;
    policyEngine?: CubiOPolicyEngine;
    roleManager?: CubiORoleManager;
    storageEngine?: CubiOStorageEngine;
    serviceEngine?: CubiOServiceEngine;
  } = {}) {
    this.repository = options.repository || new MemoryAgentRepository();
    this.identityRegistry = options.identityRegistry;
    this.authEngine = options.authEngine;
    this.policyEngine = options.policyEngine;
    this.roleManager = options.roleManager;
    this.storageEngine = options.storageEngine;
    this.serviceEngine = options.serviceEngine;
  }

  public getRepository(): IAgentRepository {
    return this.repository;
  }

  /**
   * Helper: Authenticates session / token and extracts sovereign caller CUB-ID.
   */
  public async authenticateCaller(tokenOrSession: string): Promise<string> {
    if (!this.authEngine) {
      if (tokenOrSession.startsWith('CUB-')) {
        return tokenOrSession;
      }
      throw new Error('Authentication engine not configured in AgentEngine.');
    }

    let verification;
    if (tokenOrSession.startsWith('CUBTOK.')) {
      verification = await this.authEngine.verifyToken(tokenOrSession);
    } else {
      verification = await this.authEngine.verifySession(tokenOrSession);
    }

    if (!verification.isValid || !verification.identity) {
      throw new Error(`Agent Authentication failed: ${verification.error || 'Invalid session'}`);
    }

    return verification.identity.cubId;
  }

  /**
   * Creates and registers a new sovereign AI agent under explicit authorization boundaries.
   */
  public async createAgent(
    tokenOrSession: string,
    input: CreateAgentInput
  ): Promise<Readonly<AgentRecord>> {
    // 1. Authenticate principal (NET-02)
    const ownerCubId = await this.authenticateCaller(tokenOrSession);

    // 2. Verify principal in NET-01
    if (this.identityRegistry && !this.identityRegistry.has(ownerCubId)) {
      throw new Error(`Agent Creation Error: Sovereign Identity '${ownerCubId}' not found in NET-01 registry.`);
    }

    // 3. Evaluate NET-03 authorization for AGENT_CREATE
    if (this.policyEngine) {
      const decision = this.policyEngine.evaluate({
        cubId: ownerCubId,
        action: 'AGENT_CREATE',
        resourceUri: 'CUBIO://NETWORK/0/01/00000/SECURITY',
      });

      if (!decision.allowed) {
        throw new Error(`Authorization Denied: Identity '${ownerCubId}' lacks permission 'AGENT_CREATE'.`);
      }
    }

    // 4. Validate requested permissions against forbidden list
    for (const perm of input.allowedPermissions) {
      if (CubiOAgentEngine.FORBIDDEN_AGENT_PERMISSIONS.has(perm)) {
        throw new Error(`Agent Security Violation: Permission '${perm}' is forbidden for autonomous AI agents.`);
      }
    }

    // 5. Ensure requested permissions are a subset of principal's role capabilities
    if (this.roleManager) {
      const principalRole = this.roleManager.getRole(ownerCubId);
      const principalPerms = new Set(this.roleManager.getPermissions(principalRole));

      for (const perm of input.allowedPermissions) {
        if (!principalPerms.has(perm) && principalRole !== 'SUPER_ADMIN') {
          throw new Error(`Agent Privilege Escalation Rejected: Principal lacks permission '${perm}' requested for agent.`);
        }
      }
    }

    const now = Date.now();
    const agentId = `AGT_${deterministicHash(`${ownerCubId}:${input.name}:${now}`).slice(2, 18)}`;

    const agent: AgentRecord = Object.freeze({
      agentId,
      name: input.name.trim(),
      description: input.description.trim(),
      agentType: input.agentType,
      ownerCubId,
      status: 'READY',
      allowedPermissions: Object.freeze([...input.allowedPermissions]),
      capabilities: Object.freeze([...input.capabilities]),
      modelUri: input.modelUri || 'model://cubio-spatial-v1',
      systemPrompt: input.systemPrompt || 'You are an autonomous CubiO spatial assistant.',
      createdAt: now,
      updatedAt: now,
      metadata: input.metadata ? Object.freeze({ ...input.metadata }) : undefined,
    });

    await this.repository.saveAgent(agent);

    // Register agent in NET-03 Role Manager with restricted role AI_AGENT
    if (this.roleManager) {
      this.roleManager.assignRole(agentId, 'AI_AGENT');
    }

    return agent;
  }

  /**
   * Issues a time-limited delegation token from a principal to an agent.
   */
  public async issueDelegationToken(
    tokenOrSession: string,
    input: CreateDelegationInput
  ): Promise<Readonly<AgentDelegationToken>> {
    const callerCubId = await this.authenticateCaller(tokenOrSession);
    const agent = await this.repository.getAgent(input.agentId);

    if (!agent) {
      throw new Error(`Agent Delegation Error: Agent '${input.agentId}' not found.`);
    }

    if (agent.ownerCubId !== callerCubId) {
      throw new Error(`Security Violation: Caller '${callerCubId}' does not own agent '${input.agentId}'.`);
    }

    if (agent.status !== 'READY' && agent.status !== 'EXECUTING') {
      throw new Error(`Agent Delegation Error: Cannot delegate to agent in '${agent.status}' state.`);
    }

    // Verify delegated permissions are a subset of agent's allowed permissions
    const agentAllowedSet = new Set(agent.allowedPermissions);
    for (const perm of input.delegatedPermissions) {
      if (!agentAllowedSet.has(perm)) {
        throw new Error(`Agent Delegation Violation: Permission '${perm}' exceeds agent allowed scope.`);
      }
    }

    const now = Date.now();
    const duration = input.durationMs || 3600 * 1000; // 1 hour default TTL
    const expiresAt = now + duration;
    const delegationId = `DEL_${deterministicHash(`${agent.agentId}:${callerCubId}:${now}`).slice(2, 18)}`;
    const token = `DELTOK_${deterministicHash(`${delegationId}:${expiresAt}`).slice(2, 26)}`;

    const delegation: AgentDelegationToken = Object.freeze({
      delegationId,
      agentId: agent.agentId,
      principalCubId: callerCubId,
      token,
      delegatedPermissions: Object.freeze([...input.delegatedPermissions]),
      allowedResourcePatterns: Object.freeze([...(input.allowedResourcePatterns || ['*'])]),
      issuedAt: now,
      expiresAt,
      revoked: false,
    });

    await this.repository.saveDelegation(delegation);
    return delegation;
  }

  /**
   * Executes a controlled task using a delegation token.
   */
  public async executeTask(
    delegationTokenString: string,
    input: ExecuteAgentTaskInput
  ): Promise<Readonly<AgentTask>> {
    const startTime = Date.now();
    const delegation = await this.repository.getDelegationByToken(delegationTokenString);

    if (!delegation) {
      throw new Error('Agent Execution Error: Invalid or unrecognized delegation token.');
    }

    if (delegation.revoked) {
      throw new Error('Agent Execution Error: Delegation token has been revoked.');
    }

    if (Date.now() > delegation.expiresAt) {
      throw new Error('Agent Execution Error: Delegation token has expired.');
    }

    if (delegation.agentId !== input.agentId) {
      throw new Error('Agent Execution Error: Delegation token is bound to a different agent.');
    }

    const agent = await this.repository.getAgent(input.agentId);
    if (!agent || agent.status === 'TERMINATED' || agent.status === 'SUSPENDED') {
      throw new Error(`Agent Execution Error: Agent is unavailable (${agent?.status || 'NOT_FOUND'}).`);
    }

    const taskId = `TSK_${deterministicHash(`${input.agentId}:${startTime}`).slice(2, 18)}`;
    const auditRecords: AgentExecutionAuditRecord[] = [];

    // Evaluate target action against delegation boundary
    if (input.targetAction) {
      const isActionPermitted = delegation.delegatedPermissions.includes(input.targetAction as NetworkPermission);
      const auditStep: AgentExecutionAuditRecord = Object.freeze({
        stepId: `AUD_${deterministicHash(`${taskId}:${input.targetAction}:${Date.now()}`).slice(2, 18)}`,
        action: input.targetAction,
        targetResource: input.targetResourceUri || '*',
        allowed: isActionPermitted,
        timestamp: Date.now(),
        durationMs: 2,
        reason: isActionPermitted ? 'Permitted by delegation token' : 'Action not included in delegation token permissions',
      });

      auditRecords.push(auditStep);

      if (!isActionPermitted) {
        const failedTask: AgentTask = Object.freeze({
          taskId,
          agentId: input.agentId,
          principalCubId: delegation.principalCubId,
          taskPrompt: input.taskPrompt,
          delegationToken: delegationTokenString,
          status: 'FAILED',
          error: `Permission Denied: Agent attempted action '${input.targetAction}' outside delegated boundary.`,
          startedAt: startTime,
          completedAt: Date.now(),
          executionAuditHistory: Object.freeze(auditRecords),
        });

        await this.repository.saveTask(failedTask);
        return failedTask;
      }
    }

    // Execute simulated work
    const completedTask: AgentTask = Object.freeze({
      taskId,
      agentId: input.agentId,
      principalCubId: delegation.principalCubId,
      taskPrompt: input.taskPrompt,
      delegationToken: delegationTokenString,
      status: 'COMPLETED',
      inputData: input.inputData,
      outputData: Object.freeze({
        result: 'Task executed within explicit authorization boundary',
        agent: agent.name,
        principal: delegation.principalCubId,
        computedHash: deterministicHash(`${taskId}:${input.taskPrompt}`),
      }),
      startedAt: startTime,
      completedAt: Date.now(),
      executionAuditHistory: Object.freeze(auditRecords),
    });

    await this.repository.saveTask(completedTask);
    return completedTask;
  }

  /**
   * Revokes an active delegation token.
   */
  public async revokeDelegation(
    tokenOrSession: string,
    delegationId: string
  ): Promise<boolean> {
    const callerCubId = await this.authenticateCaller(tokenOrSession);
    const delegation = await this.repository.getDelegation(delegationId);

    if (!delegation) return false;

    if (delegation.principalCubId !== callerCubId) {
      throw new Error('Security Violation: Only the delegating principal can revoke this token.');
    }

    return this.repository.revokeDelegation(delegationId);
  }

  /**
   * Terminates an agent.
   */
  public async terminateAgent(
    tokenOrSession: string,
    agentId: string
  ): Promise<boolean> {
    const callerCubId = await this.authenticateCaller(tokenOrSession);
    const agent = await this.repository.getAgent(agentId);

    if (!agent) return false;

    if (agent.ownerCubId !== callerCubId) {
      throw new Error('Security Violation: Only the agent creator can terminate this agent.');
    }

    const updated = await this.repository.updateAgentStatus(agentId, 'TERMINATED');
    return !!updated;
  }

  /**
   * Retrieves an agent record.
   */
  public async getAgent(
    tokenOrSession: string,
    agentId: string
  ): Promise<Readonly<AgentRecord>> {
    const callerCubId = await this.authenticateCaller(tokenOrSession);
    const agent = await this.repository.getAgent(agentId);

    if (!agent) {
      throw new Error(`Agent '${agentId}' not found.`);
    }

    if (agent.ownerCubId !== callerCubId) {
      if (this.policyEngine) {
        const decision = this.policyEngine.evaluate({
          cubId: callerCubId,
          action: 'AGENT_MANAGE',
          resourceUri: 'CUBIO://NETWORK/0/01/00000/SECURITY',
        });
        if (!decision.allowed) {
          throw new Error('Access Denied: Caller is not authorized to view this agent.');
        }
      }
    }

    return agent;
  }

  /**
   * Lists agents owned by the caller.
   */
  public async listMyAgents(tokenOrSession: string): Promise<readonly AgentRecord[]> {
    const ownerCubId = await this.authenticateCaller(tokenOrSession);
    return this.repository.getAgentsByOwner(ownerCubId);
  }

  /**
   * Lists tasks executed by an agent.
   */
  public async getTasksByAgent(
    tokenOrSession: string,
    agentId: string
  ): Promise<readonly AgentTask[]> {
    const callerCubId = await this.authenticateCaller(tokenOrSession);
    const agent = await this.repository.getAgent(agentId);

    if (!agent || agent.ownerCubId !== callerCubId) {
      throw new Error('Access Denied: Caller is not authorized to view agent tasks.');
    }

    return this.repository.getTasksByAgent(agentId);
  }
}
