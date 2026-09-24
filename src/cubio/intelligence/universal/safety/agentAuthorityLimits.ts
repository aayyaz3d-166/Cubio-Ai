/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F67: Agent Authority Limits
 *
 * Enforces strict ceilings on recursion depth, sub-agent spawning, and resource consumption.
 */

import { AgentAuthorityBounds } from './types';

export class AgentAuthorityLimiter {
  private agentBounds: Map<string, AgentAuthorityBounds> = new Map();

  constructor() {
    this.registerAgentBounds({
      agentId: 'MASTER_COORDINATOR',
      maxCallDepth: 8,
      maxSubAgents: 10,
      maxExecutionTimeMs: 60000,
      allowedPermissions: ['READ_ONLY', 'TOOL_INVOCATION', 'AGENT_SPAWN', 'WORKSPACE_WRITE'],
    });

    this.registerAgentBounds({
      agentId: 'RESEARCH_AGENT',
      maxCallDepth: 4,
      maxSubAgents: 2,
      maxExecutionTimeMs: 30000,
      allowedPermissions: ['READ_ONLY', 'NETWORK_ACCESS', 'TOOL_INVOCATION'],
    });

    this.registerAgentBounds({
      agentId: 'CODING_AGENT',
      maxCallDepth: 6,
      maxSubAgents: 3,
      maxExecutionTimeMs: 45000,
      allowedPermissions: ['READ_ONLY', 'WORKSPACE_WRITE', 'TOOL_INVOCATION'],
    });
  }

  public registerAgentBounds(bounds: AgentAuthorityBounds): void {
    this.agentBounds.set(bounds.agentId, bounds);
  }

  public validateAgentCall(
    agentId: string,
    currentDepth: number,
    currentSubAgentsCount: number
  ): { valid: boolean; reason?: string } {
    const bounds = this.agentBounds.get(agentId);
    if (!bounds) {
      return { valid: false, reason: `Agent "${agentId}" has no registered authority profile (Deny-by-default).` };
    }

    if (currentDepth > bounds.maxCallDepth) {
      return { valid: false, reason: `Agent "${agentId}" exceeded max call depth (${currentDepth} > ${bounds.maxCallDepth}).` };
    }

    if (currentSubAgentsCount > bounds.maxSubAgents) {
      return { valid: false, reason: `Agent "${agentId}" exceeded max spawned sub-agents (${currentSubAgentsCount} > ${bounds.maxSubAgents}).` };
    }

    return { valid: true };
  }
}
