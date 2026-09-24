/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F67: API Scope Guard
 *
 * Enforces outbound domain allowlists and restricted HTTP verbs.
 */

import { ApiScopeCheckResult, ApiScopeConfig } from './types';

export class ApiScopeGuard {
  private defaultConfig: ApiScopeConfig = {
    allowedDomains: ['cubio.space', 'api.cubio.space', 'staging-preview.cubio.space', 'raw.githubusercontent.com', 'localhost'],
    allowedMethods: ['GET', 'POST'],
  };

  public validateUrl(
    targetUrl: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    config: ApiScopeConfig = this.defaultConfig
  ): Readonly<ApiScopeCheckResult> {
    try {
      const urlObj = new URL(targetUrl);
      const hostname = urlObj.hostname.toLowerCase();

      const isDomainAllowed = config.allowedDomains.some((d) =>
        hostname === d.toLowerCase() || hostname.endsWith(`.${d.toLowerCase()}`)
      );

      if (!isDomainAllowed) {
        return Object.freeze({
          allowed: false,
          domain: hostname,
          error: `Outbound Network Violation: Domain "${hostname}" is not in the authorized allowlist.`,
        });
      }

      if (!config.allowedMethods.includes(method)) {
        return Object.freeze({
          allowed: false,
          domain: hostname,
          error: `HTTP Method Violation: Method "${method}" is not permitted for domain "${hostname}".`,
        });
      }

      return Object.freeze({
        allowed: true,
        domain: hostname,
      });
    } catch {
      return Object.freeze({
        allowed: false,
        domain: 'INVALID_URL',
        error: `Malformed URL: "${targetUrl}" could not be parsed.`,
      });
    }
  }
}
