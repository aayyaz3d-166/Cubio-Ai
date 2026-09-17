/**
 * CUBiO AI — Phase 12: Billing Webhook Handler & Security
 * src/cubio/api/billing/webhookHandler.ts
 *
 * Secure webhook ingestion for Polar and external billing providers.
 * Enforces:
 * - Cryptographic HMAC-SHA256 signature validation
 * - Timestamp freshness check (anti-replay window: 300 seconds)
 * - Event ID deduplication (same webhook twice = single state transition)
 * - Authoritative state synchronization with SubscriptionManager
 */

import * as crypto from 'crypto';
import { BillingWebhookPayload, SubscriptionStatus, PlanId } from './types';
import { SubscriptionManager } from './subscriptionManager';

export interface WebhookProcessingResult {
  readonly success: boolean;
  readonly duplicate: boolean;
  readonly eventId: string;
  readonly tenantId: string;
  readonly transitionedStatus?: SubscriptionStatus;
  readonly planId?: PlanId;
  readonly error?: string;
}

export class BillingWebhookHandler {
  private static instance: BillingWebhookHandler;
  private readonly processedEventIds: Set<string>;
  private readonly webhookSecret: string;

  private constructor() {
    this.processedEventIds = new Set<string>();
    this.webhookSecret = process.env.CUBIO_WEBHOOK_SECRET || process.env.POLAR_WEBHOOK_SECRET || 'cubio_dev_webhook_secret_fixed';
  }

  public static getInstance(): BillingWebhookHandler {
    if (!BillingWebhookHandler.instance) {
      BillingWebhookHandler.instance = new BillingWebhookHandler();
    }
    return BillingWebhookHandler.instance;
  }

  /**
   * Compute HMAC-SHA256 signature over raw string body
   */
  public generateSignature(rawBody: string, secret = this.webhookSecret): string {
    return crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');
  }

  /**
   * Verify HMAC-SHA256 signature using timing-safe comparison
   */
  public verifySignature(rawBody: string, providedSignature: string | undefined): boolean {
    if (!providedSignature || typeof providedSignature !== 'string') return false;

    const expectedSignature = this.generateSignature(rawBody);

    try {
      const bufExpected = Buffer.from(expectedSignature, 'hex');
      const bufProvided = Buffer.from(providedSignature, 'hex');

      if (bufExpected.length !== bufProvided.length) return false;
      return crypto.timingSafeEqual(bufExpected, bufProvided);
    } catch {
      return false;
    }
  }

  /**
   * Process incoming webhook event with full cryptographic and idempotency verification
   */
  public processWebhook(
    rawBody: string,
    signature: string | undefined
  ): WebhookProcessingResult {
    // 1. Signature Verification
    if (!this.verifySignature(rawBody, signature)) {
      return {
        success: false,
        duplicate: false,
        eventId: 'UNKNOWN',
        tenantId: 'UNKNOWN',
        error: '[WEBHOOK_FORGERY_DETECTED] Invalid or missing cryptographic signature.',
      };
    }

    // 2. Parse & Validate Payload
    let payload: BillingWebhookPayload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return {
        success: false,
        duplicate: false,
        eventId: 'PARSE_ERROR',
        tenantId: 'UNKNOWN',
        error: '[WEBHOOK_PAYLOAD_ERROR] Request body is not valid JSON.',
      };
    }

    const { eventId, eventType, tenantId, planId, providerSubscriptionId, timestamp } = payload;

    if (!eventId || !eventType || !tenantId) {
      return {
        success: false,
        duplicate: false,
        eventId: eventId || 'MISSING',
        tenantId: tenantId || 'MISSING',
        error: '[WEBHOOK_VALIDATION_ERROR] Missing required eventId, eventType, or tenantId.',
      };
    }

    // 3. Timestamp Freshness & Replay Attack Defense (Max 300s clock skew)
    const now = Date.now();
    const ageSeconds = Math.abs(now - (timestamp || now)) / 1000;
    if (ageSeconds > 300) {
      return {
        success: false,
        duplicate: false,
        eventId,
        tenantId,
        error: `[WEBHOOK_REPLAY_REJECTED] Event timestamp skew (${ageSeconds.toFixed(1)}s) exceeds max allowed 300s window.`,
      };
    }

    // 4. Event ID Idempotency Check
    if (this.processedEventIds.has(eventId)) {
      return {
        success: true,
        duplicate: true,
        eventId,
        tenantId,
      };
    }

    // Mark event ID as processed
    this.processedEventIds.add(eventId);

    // 5. Authoritative State Synchronization
    const subscriptionMgr = SubscriptionManager.getInstance();

    try {
      let transitionedStatus: SubscriptionStatus | undefined;

      switch (eventType) {
        case 'subscription.active':
        case 'order.paid':
          if (planId) {
            subscriptionMgr.updatePlan(tenantId, planId, providerSubscriptionId);
          }
          subscriptionMgr.transitionSubscriptionStatus(tenantId, 'ACTIVE', providerSubscriptionId);
          transitionedStatus = 'ACTIVE';
          break;

        case 'subscription.past_due':
          subscriptionMgr.transitionSubscriptionStatus(tenantId, 'PAST_DUE', providerSubscriptionId);
          transitionedStatus = 'PAST_DUE';
          break;

        case 'subscription.canceled':
          subscriptionMgr.transitionSubscriptionStatus(tenantId, 'CANCELED', providerSubscriptionId);
          transitionedStatus = 'CANCELED';
          break;

        case 'subscription.expired':
          subscriptionMgr.transitionSubscriptionStatus(tenantId, 'EXPIRED', providerSubscriptionId);
          transitionedStatus = 'EXPIRED';
          break;

        case 'subscription.created':
          // Acknowledge creation
          transitionedStatus = 'ACTIVE';
          break;

        default:
          break;
      }

      return {
        success: true,
        duplicate: false,
        eventId,
        tenantId,
        transitionedStatus,
        planId,
      };
    } catch (err: any) {
      return {
        success: false,
        duplicate: false,
        eventId,
        tenantId,
        error: err.message || 'Error updating subscription state.',
      };
    }
  }

  public resetForTesting(): void {
    this.processedEventIds.clear();
  }
}
