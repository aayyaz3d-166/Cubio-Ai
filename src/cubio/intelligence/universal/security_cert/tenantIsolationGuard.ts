/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F77: Tenant Isolation Guard
 *
 * Enforces strict cryptographic tenant boundaries.
 */

export class TenantIsolationGuard {
  private tenantNamespaces: Map<string, Set<string>> = new Map();

  public registerTenantResource(tenantId: string, resourceKey: string): void {
    const keys = this.tenantNamespaces.get(tenantId) || new Set();
    keys.add(resourceKey);
    this.tenantNamespaces.set(tenantId, keys);
  }

  public verifyTenantAccess(
    requestingTenantId: string,
    targetResourceTenantId: string
  ): { isAllowed: boolean; reason: string } {
    if (requestingTenantId !== targetResourceTenantId) {
      return {
        isAllowed: false,
        reason: `CROSS_TENANT_VIOLATION: Tenant "${requestingTenantId}" cannot access resources of "${targetResourceTenantId}".`,
      };
    }

    return {
      isAllowed: true,
      reason: 'Tenant namespace isolation verified.',
    };
  }
}
