/**
 * CUBiO AI — Phase 12: Commercial Access & Entitlement Guard
 * src/cubio/api/security/commercialGuard.ts
 *
 * Pre-execution enforcement gate:
 * AUTH -> ACCOUNT_STATUS -> SUBSCRIPTION -> ENTITLEMENT -> USAGE LIMIT -> CHAT ENGINE
 *
 * Rejects over-limit, suspended, or unentitled requests BEFORE
 * invoking expensive intelligence pipeline execution.
 */

import { Request, Response, NextFunction } from 'express';
import { SubscriptionManager } from '../billing/subscriptionManager';
import { PlanRegistry } from '../billing/planRegistry';
import { UsageLedger } from '../billing/usageLedger';
import { EntitlementCapability } from '../billing/types';

export function requireCommercialEntitlement(requiredCapability: EntitlementCapability = 'CHAT_ACCESS') {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const keyId = (res.locals['keyId'] as string) || 'UNKNOWN';
    const role = (res.locals['role'] as string) || 'user';

    const serverDerivedTenantId = `tenant_${role}_${keyId}`;
    const serverDerivedUserId = `user_${keyId}`;

    const resolvedTenantId =
      role === 'admin' && req.body?.tenantId ? req.body.tenantId : serverDerivedTenantId;
    const resolvedUserId =
      role === 'admin' && req.body?.userId ? req.body.userId : serverDerivedUserId;

    const subscriptionMgr = SubscriptionManager.getInstance();
    const planRegistry = PlanRegistry.getInstance();
    const usageLedger = UsageLedger.getInstance();

    // 1. Account Status Enforcement
    const account = subscriptionMgr.getAccount(resolvedTenantId);
    if (account.status === 'SUSPENDED') {
      res.status(403).json({
        error: 'Forbidden',
        code: 'ACCOUNT_SUSPENDED',
        detail: 'This tenant account has been administratively suspended.',
        tenantId: resolvedTenantId,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (account.status === 'DELETED') {
      res.status(403).json({
        error: 'Forbidden',
        code: 'ACCOUNT_DELETED',
        detail: 'This tenant account has been marked as deleted.',
        tenantId: resolvedTenantId,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 2. Subscription State Machine Check
    const subscription = subscriptionMgr.getSubscription(resolvedTenantId);
    if (
      subscription.status === 'EXPIRED' ||
      subscription.status === 'CANCELED' ||
      subscription.status === 'SUSPENDED'
    ) {
      res.status(403).json({
        error: 'Forbidden',
        code: 'SUBSCRIPTION_INACTIVE',
        detail: `Subscription status is ${subscription.status}. Please renew or upgrade to continue.`,
        tenantId: resolvedTenantId,
        status: subscription.status,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (subscription.status === 'PAST_DUE') {
      res.status(402).json({
        error: 'Payment Required',
        code: 'SUBSCRIPTION_PAST_DUE',
        detail: 'Subscription payment is past due. Please update payment method to resume service.',
        tenantId: resolvedTenantId,
        status: subscription.status,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 3. Entitlement Capability Verification
    const plan = planRegistry.getPlan(subscription.planId);
    if (!plan || !plan.entitlements.includes(requiredCapability)) {
      res.status(403).json({
        error: 'Forbidden',
        code: 'ENTITLEMENT_REQUIRED',
        detail: `Current plan (${subscription.planId}) lacks required entitlement: '${requiredCapability}'.`,
        tenantId: resolvedTenantId,
        planId: subscription.planId,
        requiredCapability,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Check optional feature entitlements (e.g. spatial coordinate usage)
    if (
      req.body?.options &&
      (req.body.options.spatialCoordinate !== undefined || req.body.options.spatialCellId !== undefined)
    ) {
      if (!plan.entitlements.includes('SPATIAL_ACCESS')) {
        res.status(403).json({
          error: 'Forbidden',
          code: 'ENTITLEMENT_REQUIRED',
          detail: `Current plan (${subscription.planId}) lacks required entitlement: 'SPATIAL_ACCESS'.`,
          tenantId: resolvedTenantId,
          planId: subscription.planId,
          requiredCapability: 'SPATIAL_ACCESS',
          timestamp: new Date().toISOString(),
        });
        return;
      }
    }

    // 4. Pre-Execution Usage Limit Check & Atomic Reservation
    const requestId = typeof req.body?.requestId === 'string' ? req.body.requestId.trim() : 'UNKNOWN';
    const maxRequests = plan.limits.maxRequestsPerPeriod;

    // Only reserve if a valid requestId is provided
    if (requestId !== 'UNKNOWN') {
      const reservation = await usageLedger.reserveRequest(
        resolvedTenantId,
        requestId,
        maxRequests,
        resolvedUserId,
        req.body?.conversationId
      );

      if (!reservation.allowed) {
        res.status(429).json({
          error: 'Too Many Requests',
          code: 'USAGE_LIMIT_EXCEEDED',
          detail: reservation.reason || 'Period request quota exceeded.',
          tenantId: resolvedTenantId,
          planId: subscription.planId,
          currentUsage: reservation.currentUsage,
          limit: maxRequests,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.locals['isUsageReplay'] = reservation.isReplay;
    }

    // Attach verified commercial context to res.locals
    res.locals['resolvedTenantId'] = resolvedTenantId;
    res.locals['resolvedUserId'] = resolvedUserId;
    res.locals['planId'] = subscription.planId;
    res.locals['subscriptionStatus'] = subscription.status;
    res.locals['maxRequests'] = maxRequests;

    next();
  };
}
