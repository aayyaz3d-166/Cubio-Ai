/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F56: Tool Scope Validator
 *
 * Pillar 2: Scope Boundary Validation
 */

import { ToolScope } from '../types';

export class ScopeValidator {
  public validateScope(
    params: Record<string, unknown>,
    scope?: ToolScope
  ): { inScope: boolean; reason?: string } {
    if (!scope || scope.isGlobal) return { inScope: true };

    // Path check
    if (params.path && typeof params.path === 'string' && scope.allowedPaths) {
      const p = params.path;
      const allowed = scope.allowedPaths.some((prefix) => p.startsWith(prefix));
      if (!allowed) {
        return {
          inScope: false,
          reason: `Target path "${p}" is outside authorized scope [${scope.allowedPaths.join(', ')}].`,
        };
      }
    }

    // Domain check
    if (params.url && typeof params.url === 'string' && scope.allowedDomains) {
      const u = params.url;
      const allowed = scope.allowedDomains.some((d) => u.includes(d));
      if (!allowed) {
        return {
          inScope: false,
          reason: `Target URL "${u}" is outside authorized domain scope [${scope.allowedDomains.join(', ')}].`,
        };
      }
    }

    // Table check
    if (params.table && typeof params.table === 'string' && scope.allowedTables) {
      const t = params.table;
      const allowed = scope.allowedTables.includes(t);
      if (!allowed) {
        return {
          inScope: false,
          reason: `Target database table "${t}" is outside authorized tables [${scope.allowedTables.join(', ')}].`,
        };
      }
    }

    return { inScope: true };
  }
}
