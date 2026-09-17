/**
 * CubiO AI — FUNNEL 06: Authentication & Authorization Middleware
 *
 * Validates Bearer API key, enforces RBAC role checks, attaches
 * credential to res.locals for downstream audit logging.
 *
 * Security:
 * - Fails CLOSED: missing/invalid token → 401
 * - Insufficient role → 403
 * - Never exposes token/key in error responses or logs
 */

import { Request, Response, NextFunction } from 'express';
import { ApiKeyValidator, ApiRole, ValidatedApiCredential } from './apiKeyValidator';

// Singleton validator — loaded once at startup
const validator = new ApiKeyValidator();

/**
 * Role hierarchy: admin > user > readonly
 */
const ROLE_RANK: Record<ApiRole, number> = {
  admin: 3,
  user: 2,
  readonly: 1,
};

function hasRole(actual: ApiRole, required: ApiRole): boolean {
  return ROLE_RANK[actual] >= ROLE_RANK[required];
}

/**
 * Require authentication. Validates Bearer token and attaches credential to res.locals.
 */
export function requireAuth() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const bearerToken = ApiKeyValidator.extractBearer(req.headers['authorization']);
    const credential: ValidatedApiCredential | null = validator.validate(bearerToken || '');

    if (!credential) {
      res.status(401).json({
        error: 'Unauthorized',
        code: 'INVALID_OR_MISSING_TOKEN',
        detail: 'Provide a valid Bearer token in the Authorization header.',
      });
      return;
    }

    // Attach to res.locals (never to req body / response)
    res.locals['keyId'] = credential.keyId;
    res.locals['role'] = credential.role;
    next();
  };
}

/**
 * Require a minimum role level.
 */
export function requireRole(minRole: ApiRole) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const role = res.locals['role'] as ApiRole | undefined;
    if (!role || !hasRole(role, minRole)) {
      res.status(403).json({
        error: 'Forbidden',
        code: 'INSUFFICIENT_ROLE',
        detail: 'Your API key does not have the required role for this operation.',
        required: minRole,
      });
      return;
    }
    next();
  };
}

export { validator as apiKeyValidator };
