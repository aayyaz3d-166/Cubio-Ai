/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-03: Fine-Grained Policy Engine (ABAC & Resource Policies)
 *
 * Evaluates access requests using pattern-matched resource policies and RBAC roles.
 */

import { CubiORoleManager } from './roleManager';
import { AccessRequest, AccessDecision, ResourcePolicy, NetworkRole } from './types';

export class CubiOPolicyEngine {
  private policies: Map<string, ResourcePolicy> = new Map();
  private roleManager: CubiORoleManager;

  constructor(roleManager?: CubiORoleManager) {
    this.roleManager = roleManager || new CubiORoleManager();
  }

  public getRoleManager(): CubiORoleManager {
    return this.roleManager;
  }

  /**
   * Adds a resource policy.
   */
  public addPolicy(policy: ResourcePolicy): void {
    this.policies.set(policy.policyId, Object.freeze({ ...policy }));
  }

  /**
   * Removes a resource policy.
   */
  public removePolicy(policyId: string): boolean {
    return this.policies.delete(policyId);
  }

  /**
   * Lists all active policies sorted by priority.
   */
  public listPolicies(): readonly ResourcePolicy[] {
    return Object.freeze(
      Array.from(this.policies.values()).sort((a, b) => (b.priority || 0) - (a.priority || 0))
    );
  }

  /**
   * Evaluates an access request against active policies and assigned roles.
   */
  public evaluate(request: AccessRequest): Readonly<AccessDecision> {
    const cubId = request.cubId.trim();
    const action = request.action.trim().toUpperCase();
    const resourceUri = request.resourceUri.trim().toUpperCase();
    const role: NetworkRole = request.role || this.roleManager.getRole(cubId);
    const now = Date.now();

    const policies = this.listPolicies();

    // 1. Check for explicit matching DENY policies (DENY overrides)
    for (const policy of policies) {
      if (policy.effect === 'DENY' && this.isPolicyMatch(policy, resourceUri, action, cubId, role)) {
        return Object.freeze({
          allowed: false,
          cubId,
          action,
          resourceUri,
          reason: `Explicit DENY policy '${policy.policyId}' matched.`,
          matchedPolicyId: policy.policyId,
          decidedAt: now,
        });
      }
    }

    // 2. Check for explicit matching ALLOW policies
    for (const policy of policies) {
      if (policy.effect === 'ALLOW' && this.isPolicyMatch(policy, resourceUri, action, cubId, role)) {
        return Object.freeze({
          allowed: true,
          cubId,
          action,
          resourceUri,
          reason: `Explicit ALLOW policy '${policy.policyId}' matched.`,
          matchedPolicyId: policy.policyId,
          decidedAt: now,
        });
      }
    }

    // 3. Fallback to Role-Based Access Control
    const hasRolePerm = this.roleManager.hasPermission(role, action);
    if (hasRolePerm) {
      return Object.freeze({
        allowed: true,
        cubId,
        action,
        resourceUri,
        reason: `Role '${role}' inherently permits action '${action}'.`,
        decidedAt: now,
      });
    }

    // Default DENY
    return Object.freeze({
      allowed: false,
      cubId,
      action,
      resourceUri,
      reason: `Default DENY: Role '${role}' lacks permission '${action}' and no ALLOW policy matched.`,
      decidedAt: now,
    });
  }

  /**
   * Helper to check if a policy matches the request.
   */
  private isPolicyMatch(
    policy: ResourcePolicy,
    resourceUri: string,
    action: string,
    cubId: string,
    role: NetworkRole
  ): boolean {
    // 1. Action check
    const actionMatches =
      policy.actions.includes('*') ||
      policy.actions.map((a) => a.toUpperCase()).includes(action);
    if (!actionMatches) return false;

    // 2. Resource pattern check
    if (!this.matchesPattern(resourceUri, policy.resourcePattern)) {
      return false;
    }

    // 3. Principal checks (if specified)
    if (policy.principalCubIds && policy.principalCubIds.length > 0) {
      if (!policy.principalCubIds.includes(cubId)) {
        return false;
      }
    }

    if (policy.principalRoles && policy.principalRoles.length > 0) {
      if (!policy.principalRoles.includes(role)) {
        return false;
      }
    }

    return true;
  }

  private matchesPattern(resourceUri: string, pattern: string): boolean {
    const upperPattern = pattern.trim().toUpperCase();
    if (upperPattern === '*' || upperPattern === resourceUri) return true;

    if (upperPattern.endsWith('*')) {
      const prefix = upperPattern.slice(0, -1);
      return resourceUri.startsWith(prefix);
    }

    return false;
  }
}
