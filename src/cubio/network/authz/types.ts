/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-03: CubiO Authorization (Types & Policies)
 *
 * Formal specification for RBAC / ABAC policies, granular permissions,
 * resource policies, and access decisions.
 *
 * ARCHITECTURAL INVARIANT:
 * - NET-03 authorizes: "What is this authenticated entity allowed to do?"
 * - Consumes sovereign CUB-XXXXXXXX from NET-01 and verified sessions from NET-02.
 */

export type NetworkRole =
  | 'SUPER_ADMIN'
  | 'SPACE_OWNER'
  | 'CONTRIBUTOR'
  | 'AI_AGENT'
  | 'OBSERVER'
  | 'GUEST';

export type NetworkPermission =
  | 'NETWORK_READ'
  | 'NETWORK_WRITE'
  | 'STATE_READ'
  | 'STATE_MUTATE'
  | 'SPACE_CREATE'
  | 'SPACE_DELETE'
  | 'SERVICE_INVOKE'
  | 'SERVICE_REGISTER'
  | 'SERVICE_ADMIN'
  | 'MAIL_SEND'
  | 'FILE_TRANSFER'
  | 'STORAGE_READ'
  | 'STORAGE_WRITE'
  | 'STORAGE_DELETE'
  | 'STORAGE_ADMIN'
  | 'KEY_ROTATE'
  | 'ADMIN_MANAGE'
  | 'DEVICE_PROVISION'
  | 'DEVICE_MANAGE'
  | 'DEVICE_REVOKE'
  | 'AGENT_CREATE'
  | 'AGENT_DELEGATE'
  | 'AGENT_MANAGE'
  | 'SEARCH_EXECUTE'
  | 'SEARCH_INDEX'
  | 'CHANNEL_PUBLISH'
  | 'CHANNEL_SUBSCRIBE'
  | 'CHANNEL_MANAGE'
  | 'GATEWAY_ADMIN'
  | 'GATEWAY_ROUTE'
  | 'FEDERATION_ADMIN'
  | 'FEDERATION_JOIN'
  | 'FEDERATION_ROUTE'
  | 'AUDIT_READ'
  | 'AUDIT_ADMIN'
  | 'METRICS_READ'
  | 'BILLING_PURCHASE'
  | 'BILLING_ADMIN'
  | 'ENTITLEMENT_READ'
  | 'DEVELOPER_ADMIN'
  | 'DEVELOPER_PROJECT_CREATE'
  | 'DEVELOPER_KEY_MANAGE'
  | 'ACCOUNT_EDIT'
  | 'ACCOUNT_DELETE'
  | string;

export interface ResourcePolicy {
  readonly policyId: string;
  readonly resourcePattern: string; // e.g. "CUBIO://NETWORK/0/*", "CUBIO://NETWORK/0/01/00003/*"
  readonly effect: 'ALLOW' | 'DENY';
  readonly actions: readonly string[]; // ['STATE_READ', 'SERVICE_INVOKE']
  readonly principalCubIds?: readonly string[]; // Specific CUB-XXXXXXXX IDs
  readonly principalRoles?: readonly NetworkRole[]; // Specific roles
  readonly priority?: number; // Higher number evaluated first
}

export interface AccessRequest {
  readonly cubId: string; // Sovereign CUB-XXXXXXXX
  readonly action: string; // e.g. "SERVICE_INVOKE", "STATE_MUTATE"
  readonly resourceUri: string; // Destination coordinate URI
  readonly role?: NetworkRole;
  readonly context?: Readonly<Record<string, any>>;
}

export interface AccessDecision {
  readonly allowed: boolean;
  readonly cubId: string;
  readonly action: string;
  readonly resourceUri: string;
  readonly reason: string;
  readonly matchedPolicyId?: string;
  readonly decidedAt: number;
}
