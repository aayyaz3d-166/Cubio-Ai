/**
 * CUBiO AI — Phase 12: API v1 Router
 * src/cubio/api/v1/router.ts
 *
 * Mounts all versioned /api/v1/ routes with appropriate security,
 * authentication, RBAC, commercial entitlement, and rate/usage policies.
 */

import { Router } from 'express';
import { requireAuth, requireRole } from '../security/authMiddleware';
import { requireCommercialEntitlement } from '../security/commercialGuard';
import { chatHandler } from './chatHandler';
import { healthHandler, readinessHandler } from './healthHandler';
import { modelsHandler } from './modelsHandler';
import { usageHandler } from './usageHandler';
import {
  accountHandler,
  plansHandler,
  checkoutHandler,
  webhookHandler,
  adminSubscriptionHandler,
  adminUsageCorrectionHandler,
  adminAccountStatusHandler,
} from './billingHandler';
import {
  queryHandler,
  memoryHandler,
  contextHandler,
  sessionHandler,
  feedbackHandler,
  metricsHandler,
} from './mvpHandlers';

export function createV1Router(): Router {
  const router = Router();

  // Public system probes (No auth required)
  router.get('/health', healthHandler);
  router.get('/readiness', readinessHandler);
  router.get('/models', modelsHandler);
  router.get('/billing/plans', plansHandler);
  router.get('/metrics', metricsHandler);

  // Billing Webhook (Cryptographically validated by signature)
  router.post('/billing/webhook', webhookHandler);

  // Authenticated operational endpoints
  router.get('/usage', requireAuth(), usageHandler);
  router.get('/account', requireAuth(), accountHandler);
  router.post('/billing/checkout', requireAuth(), checkoutHandler);
  router.get('/memory', requireAuth(), memoryHandler);
  router.get('/context', requireAuth(), contextHandler);
  router.post('/session', requireAuth(), sessionHandler);
  router.post('/feedback', requireAuth(), feedbackHandler);

  // Primary authoritative intelligence endpoints (Requires minimum 'user' role)
  router.post('/chat', requireAuth(), requireRole('user'), chatHandler);
  router.post('/query', requireAuth(), requireRole('user'), queryHandler);

  // Protected Administrative Operations (Requires 'admin' role)
  router.post('/admin/subscription', requireAuth(), requireRole('admin'), adminSubscriptionHandler);
  router.post('/admin/usage/correct', requireAuth(), requireRole('admin'), adminUsageCorrectionHandler);
  router.post('/admin/account/status', requireAuth(), requireRole('admin'), adminAccountStatusHandler);

  return router;
}

export const v1Router = createV1Router();
