/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F67: Tool Authorizer
 *
 * Validates tool invocation requests against actor permissions and sensitivity rules.
 */

import { ControlledPermissionLevel } from './types';
import { PermissionEngine } from './permissionEngine';

export class ToolAuthorizer {
  private sensitiveTools: Set<string> = new Set([
    'fs_write_file',
    'fs_delete_file',
    'terminal_exec',
    'deploy_staging',
    'deploy_production',
    'db_set',
  ]);

  public isToolAllowed(
    agentId: string,
    toolId: string,
    permissionEngine: PermissionEngine,
    hasAuthToken: boolean = false
  ): { allowed: boolean; reason?: string } {
    if (!permissionEngine.checkPermission(agentId, 'TOOL_INVOCATION')) {
      return { allowed: false, reason: `Agent "${agentId}" lacks TOOL_INVOCATION capability.` };
    }

    if (this.sensitiveTools.has(toolId) && !hasAuthToken) {
      return { allowed: false, reason: `Sensitive tool "${toolId}" requires explicit human authorization token.` };
    }

    return { allowed: true };
  }
}
