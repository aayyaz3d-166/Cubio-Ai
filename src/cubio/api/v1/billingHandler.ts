/**
 * CUBiO AI — Phase 12: Billing, Account & Commercial Webhook Handlers
 * src/cubio/api/v1/billingHandler.ts
 *
 * REST Endpoints:
 * - GET  /api/v1/account               (Authenticated tenant account snapshot)
 * - GET  /api/v1/billing/plans         (Public canonical plan catalog)
 * - POST /api/v1/billing/checkout      (Initiates checkout link)
 * - POST /api/v1/billing/webhook       (HMAC-verified webhook ingestion)
 * - POST /api/v1/admin/subscription    (Admin-authorized subscription override)
 * - POST /api/v1/admin/usage/correct   (Admin-authorized usage correction)
 * - POST /api/v1/admin/account/status  (Admin-authorized account suspension/activation)
 */

import { Request, Response } from 'express';
import { SubscriptionManager } from '../billing/subscriptionManager';
import { PlanRegistry } from '../billing/planRegistry';
import { UsageLedger } from '../billing/usageLedger';
import { BillingWebhookHandler } from '../billing/webhookHandler';
import { AccountStatus, PlanId, SubscriptionStatus } from '../billing/types';
import { writeAuditEntry } from '../security/auditLogger';

/**
 * GET /api/v1/account
 * Returns authenticated tenant account details, subscription status, plan limits, and usage.
 */
export function accountHandler(req: Request, res: Response): void {
  const keyId = (res.locals['keyId'] as string) || 'UNKNOWN';
  const role = (res.locals['role'] as string) || 'user';

  let resolvedTenantId = `tenant_${role}_${keyId}`;
  if (role === 'admin' && req.query['tenantId'] && typeof req.query['tenantId'] === 'string') {
    resolvedTenantId = req.query['tenantId'];
  }

  const subscriptionMgr = SubscriptionManager.getInstance();
  const planRegistry = PlanRegistry.getInstance();
  const usageLedger = UsageLedger.getInstance();

  const { account, subscription } = subscriptionMgr.getOrCreateAccount(resolvedTenantId);
  const plan = planRegistry.getPlan(subscription.planId);

  const usageSnapshot = usageLedger.getSnapshot(
    resolvedTenantId,
    plan?.limits.maxRequestsPerPeriod || 10,
    plan?.limits.maxTurnsPerPeriod || 20
  );

  res.status(200).json({
    account: {
      tenantId: account.tenantId,
      primaryUserId: account.primaryUserId,
      name: account.name,
      status: account.status,
      createdAt: new Date(account.createdAt).toISOString(),
    },
    subscription: {
      subscriptionId: subscription.subscriptionId,
      planId: subscription.planId,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.currentPeriodStart).toISOString(),
      currentPeriodEnd: new Date(subscription.currentPeriodEnd).toISOString(),
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      providerSubscriptionId: subscription.providerSubscriptionId,
    },
    plan: plan
      ? {
          planId: plan.planId,
          displayName: plan.displayName,
          priceCents: plan.priceCents,
          currency: plan.currency,
          interval: plan.interval,
          limits: plan.limits,
          entitlements: plan.entitlements,
        }
      : null,
    usage: usageSnapshot,
    timestamp: new Date().toISOString(),
  });
}

/**
 * GET /api/v1/billing/plans
 * Returns canonical plan catalog
 */
export function plansHandler(req: Request, res: Response): void {
  const planRegistry = PlanRegistry.getInstance();
  res.status(200).json({
    plans: planRegistry.getAllPlans(),
    timestamp: new Date().toISOString(),
  });
}

/**
 * POST /api/v1/billing/checkout
 * Generates external provider checkout session (Polar / provider)
 */
export function checkoutHandler(req: Request, res: Response): void {
  const keyId = (res.locals['keyId'] as string) || 'UNKNOWN';
  const role = (res.locals['role'] as string) || 'user';
  const tenantId = `tenant_${role}_${keyId}`;

  const targetPlanId = (req.body?.planId as PlanId) || 'PRO';
  const planRegistry = PlanRegistry.getInstance();
  const plan = planRegistry.getPlan(targetPlanId);

  if (!plan) {
    res.status(400).json({
      error: 'Bad Request',
      code: 'INVALID_PLAN_ID',
      detail: `Plan '${targetPlanId}' does not exist.`,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Generates safe provider checkout link
  const checkoutUrl = `https://checkout.polar.sh/c/cubio_${targetPlanId.toLowerCase()}?tenant_id=${encodeURIComponent(
    tenantId
  )}&currency=${plan.currency}`;

  res.status(200).json({
    checkoutUrl,
    tenantId,
    planId: targetPlanId,
    priceCents: plan.priceCents,
    currency: plan.currency,
    timestamp: new Date().toISOString(),
  });
}

/**
 * POST /api/v1/billing/webhook
 * Authenticated billing webhook ingestion (Polar / external provider)
 */
export function webhookHandler(req: Request, res: Response): void {
  const rawBody =
    typeof req.body === 'string'
      ? req.body
      : JSON.stringify(req.body);

  const signature =
    (req.headers['x-polar-signature'] as string) ||
    (req.headers['x-cubio-signature'] as string) ||
    (req.headers['authorization'] as string);

  const handler = BillingWebhookHandler.getInstance();
  const result = handler.processWebhook(rawBody, signature);

  if (!result.success) {
    const isAuthFailure = result.error?.includes('FORGERY') || result.error?.includes('signature');
    const isReplayFailure = result.error?.includes('REPLAY');

    res.status(isAuthFailure ? 401 : isReplayFailure ? 409 : 400).json({
      error: 'Webhook Rejected',
      code: isAuthFailure
        ? 'WEBHOOK_SIGNATURE_INVALID'
        : isReplayFailure
        ? 'WEBHOOK_REPLAY_DETECTED'
        : 'WEBHOOK_PROCESSING_FAILED',
      detail: result.error,
      eventId: result.eventId,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  res.status(200).json({
    received: true,
    duplicate: result.duplicate,
    eventId: result.eventId,
    tenantId: result.tenantId,
    status: result.transitionedStatus,
    planId: result.planId,
    timestamp: new Date().toISOString(),
  });
}

/**
 * POST /api/v1/admin/subscription
 * Protected admin override for tenant subscription & plan
 */
export function adminSubscriptionHandler(req: Request, res: Response): void {
  const { tenantId, planId, status, providerSubscriptionId } = req.body || {};
  const adminKeyId = (res.locals['keyId'] as string) || 'ADMIN';

  if (!tenantId || typeof tenantId !== 'string') {
    res.status(400).json({ error: 'Bad Request', code: 'MISSING_TENANT_ID', detail: 'tenantId is required.' });
    return;
  }

  const subscriptionMgr = SubscriptionManager.getInstance();

  try {
    if (planId) {
      subscriptionMgr.updatePlan(tenantId, planId as PlanId, providerSubscriptionId);
    }
    if (status) {
      subscriptionMgr.transitionSubscriptionStatus(tenantId, status as SubscriptionStatus, providerSubscriptionId);
    }

    const updated = subscriptionMgr.getSubscription(tenantId);

    // Audit log
    writeAuditEntry({
      ts: new Date().toISOString(),
      keyId: adminKeyId,
      role: 'admin',
      method: 'POST',
      path: '/api/v1/admin/subscription',
      status: 200,
      ms: 1,
      ip: req.ip || '127.0.0.1',
      contentLength: 0,
    });

    res.status(200).json({
      success: true,
      subscription: updated,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(400).json({
      error: 'Subscription Update Failed',
      code: 'INVALID_TRANSITION',
      detail: err.message,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * POST /api/v1/admin/usage/correct
 * Protected admin usage correction
 */
export async function adminUsageCorrectionHandler(req: Request, res: Response): Promise<void> {
  const { tenantId, newCount, reason } = req.body || {};
  const adminKeyId = (res.locals['keyId'] as string) || 'ADMIN';

  if (!tenantId || typeof newCount !== 'number' || !reason) {
    res.status(400).json({
      error: 'Bad Request',
      code: 'INVALID_CORRECTION_PARAMS',
      detail: 'tenantId, numeric newCount, and reason are required.',
    });
    return;
  }

  const usageLedger = UsageLedger.getInstance();

  try {
    const correction = await usageLedger.correctUsage(tenantId, newCount, adminKeyId, reason);

    writeAuditEntry({
      ts: new Date().toISOString(),
      keyId: adminKeyId,
      role: 'admin',
      method: 'POST',
      path: '/api/v1/admin/usage/correct',
      status: 200,
      ms: 1,
      ip: req.ip || '127.0.0.1',
      contentLength: 0,
    });

    res.status(200).json({
      success: true,
      correction,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(400).json({
      error: 'Usage Correction Failed',
      code: 'CORRECTION_ERROR',
      detail: err.message,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * POST /api/v1/admin/account/status
 * Protected admin account status control (suspend / activate)
 */
export function adminAccountStatusHandler(req: Request, res: Response): void {
  const { tenantId, status } = req.body || {};
  const adminKeyId = (res.locals['keyId'] as string) || 'ADMIN';

  if (!tenantId || !['ACTIVE', 'SUSPENDED', 'DELETED'].includes(status)) {
    res.status(400).json({
      error: 'Bad Request',
      code: 'INVALID_ACCOUNT_STATUS',
      detail: 'tenantId and valid status (ACTIVE, SUSPENDED, DELETED) are required.',
    });
    return;
  }

  const subscriptionMgr = SubscriptionManager.getInstance();
  const updatedAccount = subscriptionMgr.setAccountStatus(tenantId, status as AccountStatus);

  writeAuditEntry({
    ts: new Date().toISOString(),
    keyId: adminKeyId,
    role: 'admin',
    method: 'POST',
    path: '/api/v1/admin/account/status',
    status: 200,
    ms: 1,
    ip: req.ip || '127.0.0.1',
    contentLength: 0,
  });

  res.status(200).json({
    success: true,
    account: updatedAccount,
    timestamp: new Date().toISOString(),
  });
}
