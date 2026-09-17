/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F56: Tool Permission Controller
 *
 * Pillar 1: Permission Enforcement
 */

import { ToolPermissionLevel, UniversalToolDefinition } from '../types';

export class PermissionController {
  public checkPermission(
    tool: UniversalToolDefinition,
    grantedPermissions: ReadonlySet<ToolPermissionLevel>
  ): boolean {
    if (tool.permissionLevel === 'READ_ONLY') return true;
    return grantedPermissions.has(tool.permissionLevel);
  }
}
