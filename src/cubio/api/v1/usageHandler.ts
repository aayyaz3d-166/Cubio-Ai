/**
 * CUBiO AI — Phase 10: API v1 Usage Handler
 * src/cubio/api/v1/usageHandler.ts
 *
 * GET /api/v1/usage
 *
 * Returns tenant-scoped and user-scoped usage statistics.
 * Strict Isolation: Never exposes another tenant's usage metrics or conversation count.
 */

import { Request, Response } from 'express';
import { CubiOChatEngine } from '../../intelligence/chat/chatEngine';

export interface UsageResponse {
  readonly tenantId: string;
  readonly keyId: string;
  readonly role: string;
  readonly conversationCount: number;
  readonly turnCount: number;
  readonly totalRequests: number;
  readonly timestamp: string;
}

export function usageHandler(req: Request, res: Response): void {
  const keyId = (res.locals['keyId'] as string) || 'UNKNOWN';
  const role = (res.locals['role'] as string) || 'user';

  // Server-authoritative tenant resolution:
  // Non-admins are locked to their own tenant.
  // Admins may optionally inspect a specified tenant, defaulting to their own.
  let resolvedTenantId = `tenant_${role}_${keyId}`;
  if (role === 'admin' && req.query['tenantId'] && typeof req.query['tenantId'] === 'string') {
    resolvedTenantId = req.query['tenantId'];
  }

  const chatEngine = CubiOChatEngine.getInstance();
  const tenantUsage = chatEngine.getTenantUsage(resolvedTenantId);

  const response: UsageResponse = {
    tenantId: resolvedTenantId,
    keyId,
    role,
    conversationCount: tenantUsage.conversationCount,
    turnCount: tenantUsage.turnCount,
    totalRequests: tenantUsage.totalRequests,
    timestamp: new Date().toISOString(),
  };

  res.status(200).json(response);
}
