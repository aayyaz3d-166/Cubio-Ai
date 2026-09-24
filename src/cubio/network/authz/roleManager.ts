/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-03: Network Role Manager (RBAC)
 *
 * Manages role assignments to sovereign CubiO IDs and evaluates standard role capabilities.
 */

import { NetworkRole, NetworkPermission } from './types';

export class CubiORoleManager {
  private roleAssignments: Map<string, NetworkRole> = new Map();

  private static defaultRolePermissions: Record<NetworkRole, readonly NetworkPermission[]> = {
    SUPER_ADMIN: [
      'NETWORK_READ',
      'NETWORK_WRITE',
      'STATE_READ',
      'STATE_MUTATE',
      'SPACE_CREATE',
      'SPACE_DELETE',
      'SERVICE_INVOKE',
      'SERVICE_REGISTER',
      'SERVICE_ADMIN',
      'MAIL_SEND',
      'FILE_TRANSFER',
      'STORAGE_READ',
      'STORAGE_WRITE',
      'STORAGE_DELETE',
      'STORAGE_ADMIN',
      'KEY_ROTATE',
      'ADMIN_MANAGE',
      'DEVICE_PROVISION',
      'DEVICE_MANAGE',
      'DEVICE_REVOKE',
      'AGENT_CREATE',
      'AGENT_DELEGATE',
      'AGENT_MANAGE',
      'SEARCH_EXECUTE',
      'SEARCH_INDEX',
      'CHANNEL_PUBLISH',
      'CHANNEL_SUBSCRIBE',
      'CHANNEL_MANAGE',
      'GATEWAY_ADMIN',
      'GATEWAY_ROUTE',
      'FEDERATION_ADMIN',
      'FEDERATION_JOIN',
      'FEDERATION_ROUTE',
      'AUDIT_READ',
      'AUDIT_ADMIN',
      'METRICS_READ',
      'BILLING_PURCHASE',
      'BILLING_ADMIN',
      'ENTITLEMENT_READ',
      'DEVELOPER_ADMIN',
      'DEVELOPER_PROJECT_CREATE',
      'DEVELOPER_KEY_MANAGE',
      'ACCOUNT_EDIT',
      'ACCOUNT_DELETE',
    ],
    SPACE_OWNER: [
      'NETWORK_READ',
      'NETWORK_WRITE',
      'STATE_READ',
      'STATE_MUTATE',
      'SPACE_CREATE',
      'SPACE_DELETE',
      'SERVICE_INVOKE',
      'SERVICE_REGISTER',
      'MAIL_SEND',
      'FILE_TRANSFER',
      'STORAGE_READ',
      'STORAGE_WRITE',
      'STORAGE_DELETE',
      'KEY_ROTATE',
      'DEVICE_PROVISION',
      'DEVICE_MANAGE',
      'AGENT_CREATE',
      'AGENT_DELEGATE',
      'SEARCH_EXECUTE',
      'CHANNEL_PUBLISH',
      'CHANNEL_SUBSCRIBE',
      'CHANNEL_MANAGE',
      'GATEWAY_ROUTE',
      'FEDERATION_ROUTE',
      'AUDIT_READ',
      'METRICS_READ',
      'BILLING_PURCHASE',
      'ENTITLEMENT_READ',
      'DEVELOPER_PROJECT_CREATE',
      'DEVELOPER_KEY_MANAGE',
      'ACCOUNT_EDIT',
    ],
    CONTRIBUTOR: [
      'NETWORK_READ',
      'STATE_READ',
      'STATE_MUTATE',
      'SERVICE_INVOKE',
      'MAIL_SEND',
      'FILE_TRANSFER',
      'STORAGE_READ',
      'STORAGE_WRITE',
      'STORAGE_DELETE',
      'DEVICE_PROVISION',
      'AGENT_CREATE',
      'SEARCH_EXECUTE',
      'CHANNEL_PUBLISH',
      'CHANNEL_SUBSCRIBE',
      'GATEWAY_ROUTE',
      'FEDERATION_ROUTE',
      'AUDIT_READ',
      'METRICS_READ',
      'BILLING_PURCHASE',
      'ENTITLEMENT_READ',
      'DEVELOPER_PROJECT_CREATE',
      'DEVELOPER_KEY_MANAGE',
      'ACCOUNT_EDIT',
    ],
    AI_AGENT: [
      'NETWORK_READ',
      'STATE_READ',
      'STATE_MUTATE',
      'SERVICE_INVOKE',
      'STORAGE_READ',
      'STORAGE_WRITE',
      'SEARCH_EXECUTE',
      'CHANNEL_PUBLISH',
      'CHANNEL_SUBSCRIBE',
      'GATEWAY_ROUTE',
      'FEDERATION_ROUTE',
      'METRICS_READ',
    ],
    OBSERVER: [
      'NETWORK_READ',
      'STATE_READ',
      'STORAGE_READ',
      'SEARCH_EXECUTE',
      'CHANNEL_SUBSCRIBE',
      'GATEWAY_ROUTE',
      'AUDIT_READ',
      'METRICS_READ',
    ],
    GUEST: [
      'NETWORK_READ',
      'SEARCH_EXECUTE',
    ],
  };

  /**
   * Assigns a role to a sovereign CubiO ID.
   */
  public assignRole(cubId: string, role: NetworkRole): void {
    this.roleAssignments.set(cubId.trim(), role);
  }

  /**
   * Gets the assigned role for an identity (defaults to GUEST).
   */
  public getRole(cubId: string): NetworkRole {
    return this.roleAssignments.get(cubId.trim()) || 'GUEST';
  }

  /**
   * Checks if a role inherently grants a given permission.
   */
  public hasPermission(role: NetworkRole, permission: NetworkPermission): boolean {
    const perms = CubiORoleManager.defaultRolePermissions[role] || [];
    return perms.includes(permission) || perms.includes('*');
  }

  /**
   * Lists all permissions granted to a role.
   */
  public getPermissions(role: NetworkRole): readonly NetworkPermission[] {
    return CubiORoleManager.defaultRolePermissions[role] || [];
  }
}
