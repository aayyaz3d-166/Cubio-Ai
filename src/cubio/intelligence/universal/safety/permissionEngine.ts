/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F67: Permission Engine (Deny-by-Default)
 *
 * Implements a zero-trust, capability-based permission engine where all actions
 * are denied by default unless explicitly granted to the actor.
 */

import { ControlledPermissionLevel } from './types';

export class PermissionEngine {
  private grantedPermissions: Map<string, Set<ControlledPermissionLevel>> = new Map();

  constructor() {
    // Default system agent permissions
    this.grantPermission('MASTER_ORCHESTRATOR', 'READ_ONLY');
    this.grantPermission('MASTER_ORCHESTRATOR', 'TOOL_INVOCATION');
    this.grantPermission('MASTER_ORCHESTRATOR', 'AGENT_SPAWN');

    this.grantPermission('MASTER_COORDINATOR', 'READ_ONLY');
    this.grantPermission('MASTER_COORDINATOR', 'WORKSPACE_WRITE');
    this.grantPermission('MASTER_COORDINATOR', 'TOOL_INVOCATION');
    this.grantPermission('MASTER_COORDINATOR', 'AGENT_SPAWN');
  }

  public grantPermission(agentId: string, permission: ControlledPermissionLevel): void {
    const existing = this.grantedPermissions.get(agentId) || new Set();
    existing.add(permission);
    this.grantedPermissions.set(agentId, existing);
  }

  public revokePermission(agentId: string, permission: ControlledPermissionLevel): void {
    const existing = this.grantedPermissions.get(agentId);
    if (existing) {
      existing.delete(permission);
    }
  }

  public checkPermission(agentId: string, requiredPermission: ControlledPermissionLevel): boolean {
    const perms = this.grantedPermissions.get(agentId);
    if (!perms) return false; // Strict deny-by-default
    return perms.has(requiredPermission);
  }
}
