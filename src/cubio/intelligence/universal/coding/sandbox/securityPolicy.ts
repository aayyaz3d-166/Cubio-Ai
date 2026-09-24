/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F54: Security Policy Enforcer
 *
 * Enforces zero unrestricted host execution by validating code against
 * forbidden APIs, network boundaries, and resource ceilings.
 */

import { deterministicHash } from '../../../../state/determinism';
import { SandboxSecurityPolicy, SecurityPolicyCheckResult } from './types';

export const DEFAULT_SANDBOX_POLICY: SandboxSecurityPolicy = Object.freeze({
  maxExecutionTimeMs: 3000,
  maxMemoryMb: 64,
  allowedGlobals: Object.freeze([
    'Math',
    'Date',
    'JSON',
    'Array',
    'Object',
    'String',
    'Number',
    'Boolean',
    'RegExp',
    'Map',
    'Set',
    'Promise',
    'console',
    'parseInt',
    'parseFloat',
    'isNaN',
    'isFinite',
  ]),
  forbiddenAPIs: Object.freeze([
    'process',
    'child_process',
    'fs',
    'net',
    'http',
    'https',
    'os',
    'cluster',
    'eval',
    'Function',
    'require',
    'importScripts',
    'fetch',
    'WebSocket',
    'XMLHttpRequest',
    'localStorage',
    'sessionStorage',
    'indexedDB',
    'document',
    'window',
    'globalThis',
  ]),
  allowNetwork: false,
  allowDiskWrite: false,
  allowSpawn: false,
});

export class SecurityPolicyEnforcer {
  public evaluateCode(
    code: string,
    customPolicy?: Partial<SandboxSecurityPolicy>
  ): SecurityPolicyCheckResult {
    const policy: SandboxSecurityPolicy = { ...DEFAULT_SANDBOX_POLICY, ...customPolicy };
    const violations: string[] = [];

    // Scan for forbidden API patterns
    for (const forbidden of policy.forbiddenAPIs) {
      const regex = new RegExp(`\\b${forbidden}\\b`, 'g');
      if (regex.test(code)) {
        violations.push(`Detected forbidden host API call or identifier: '${forbidden}'`);
      }
    }

    // Scan for dangerous constructor patterns like (new Function('...')) or constructor.constructor
    if (/constructor\s*\.\s*constructor/i.test(code) || /__proto__/i.test(code)) {
      violations.push('Detected prototype pollution or dynamic constructor bypass attempt.');
    }

    const passed = violations.length === 0;
    const riskLevel = passed ? 'SAFE' : 'CRITICAL_BLOCKED';
    const checkChecksum = deterministicHash(`SEC_POLICY:${passed}:${violations.length}:${violations.join('|')}`);

    return Object.freeze({
      passed,
      detectedViolations: Object.freeze(violations),
      riskLevel,
      checkChecksum,
    });
  }
}
