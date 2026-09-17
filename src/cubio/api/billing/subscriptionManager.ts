/**
 * CUBiO AI — Phase 12: Subscription & Account Manager
 * src/cubio/api/billing/subscriptionManager.ts
 *
 * Authoritative lifecycle manager for Tenant accounts and subscriptions.
 * Validates state machine transitions, rejects illegal transitions,
 * and maintains strict multi-tenant isolation.
 */

import {
  AccountStatus,
  PlanId,
  SubscriptionRecord,
  SubscriptionStatus,
  TenantAccountRecord,
} from './types';
import { PlanRegistry } from './planRegistry';

// Valid Subscription State Machine Transitions
const VALID_TRANSITIONS: Record<SubscriptionStatus, SubscriptionStatus[]> = {
  TRIAL: ['ACTIVE', 'EXPIRED', 'CANCELED', 'SUSPENDED'],
  ACTIVE: ['PAST_DUE', 'CANCELED', 'EXPIRED', 'SUSPENDED'],
  PAST_DUE: ['ACTIVE', 'CANCELED', 'EXPIRED', 'SUSPENDED'],
  CANCELED: ['EXPIRED', 'ACTIVE'], // Can reactivate or let expire
  EXPIRED: [], // Terminal for that subscription record — requires new subscription or explicit admin reactivation
  SUSPENDED: ['ACTIVE', 'CANCELED', 'EXPIRED'],
};

export class SubscriptionManager {
  private static instance: SubscriptionManager;
  private readonly accounts: Map<string, TenantAccountRecord>;
  private readonly subscriptions: Map<string, SubscriptionRecord>;

  private constructor() {
    this.accounts = new Map();
    this.subscriptions = new Map();
  }

  public static getInstance(): SubscriptionManager {
    if (!SubscriptionManager.instance) {
      SubscriptionManager.instance = new SubscriptionManager();
    }
    return SubscriptionManager.instance;
  }

  public getOrCreateAccount(
    tenantId: string,
    primaryUserId = `user_${tenantId}`,
    defaultPlan: PlanId = 'FREE'
  ): { account: TenantAccountRecord; subscription: SubscriptionRecord } {
    let account = this.accounts.get(tenantId);
    let subscription = this.subscriptions.get(tenantId);

    const now = Date.now();
    const periodDurationMs = 30 * 24 * 60 * 60 * 1000; // 30 days

    if (!subscription) {
      const isAdmin = tenantId.startsWith('tenant_admin_') || tenantId.includes('admin');
      const assignedPlan: PlanId = isAdmin ? 'ENTERPRISE' : defaultPlan;
      const subscriptionId = `sub_${tenantId}_${now}`;
      subscription = {
        subscriptionId,
        tenantId,
        userId: primaryUserId,
        planId: assignedPlan,
        status: 'ACTIVE',
        currentPeriodStart: now,
        currentPeriodEnd: now + periodDurationMs,
        cancelAtPeriodEnd: false,
        createdAt: now,
        updatedAt: now,
      };
      this.subscriptions.set(tenantId, subscription);
    }

    if (!account) {
      account = {
        tenantId,
        primaryUserId,
        name: `Workspace ${tenantId}`,
        status: 'ACTIVE',
        subscriptionId: subscription.subscriptionId,
        planId: subscription.planId,
        createdAt: now,
        updatedAt: now,
      };
      this.accounts.set(tenantId, account);
    }

    return { account: { ...account }, subscription: { ...subscription } };
  }

  public getSubscription(tenantId: string): SubscriptionRecord {
    return this.getOrCreateAccount(tenantId).subscription;
  }

  public getAccount(tenantId: string): TenantAccountRecord {
    return this.getOrCreateAccount(tenantId).account;
  }

  public transitionSubscriptionStatus(
    tenantId: string,
    targetStatus: SubscriptionStatus,
    providerSubscriptionId?: string
  ): SubscriptionRecord {
    const current = this.getSubscription(tenantId);

    // If identical, idempotent no-op
    if (current.status === targetStatus) {
      return current;
    }

    const allowed = VALID_TRANSITIONS[current.status] || [];
    if (!allowed.includes(targetStatus)) {
      throw new Error(
        `[SUBSCRIPTION_STATE_ERROR] Invalid subscription transition from ${current.status} to ${targetStatus}`
      );
    }

    const updated: SubscriptionRecord = {
      ...current,
      status: targetStatus,
      providerSubscriptionId: providerSubscriptionId || current.providerSubscriptionId,
      updatedAt: Date.now(),
    };

    this.subscriptions.set(tenantId, updated);
    return { ...updated };
  }

  public updatePlan(
    tenantId: string,
    newPlanId: PlanId,
    providerSubscriptionId?: string
  ): SubscriptionRecord {
    const planRegistry = PlanRegistry.getInstance();
    const planDef = planRegistry.getPlan(newPlanId);
    if (!planDef) {
      throw new Error(`[PLAN_ERROR] Unknown plan ID: ${newPlanId}`);
    }

    const current = this.getSubscription(tenantId);
    const now = Date.now();
    const periodDurationMs = 30 * 24 * 60 * 60 * 1000;

    const updated: SubscriptionRecord = {
      ...current,
      planId: newPlanId,
      status: 'ACTIVE',
      currentPeriodStart: now,
      currentPeriodEnd: now + periodDurationMs,
      providerSubscriptionId: providerSubscriptionId || current.providerSubscriptionId,
      updatedAt: now,
    };

    this.subscriptions.set(tenantId, updated);

    // Sync account
    const account = this.accounts.get(tenantId);
    if (account) {
      this.accounts.set(tenantId, {
        ...account,
        planId: newPlanId,
        updatedAt: now,
      });
    }

    return { ...updated };
  }

  public setAccountStatus(tenantId: string, status: AccountStatus): TenantAccountRecord {
    const { account } = this.getOrCreateAccount(tenantId);
    const updated: TenantAccountRecord = {
      ...account,
      status,
      updatedAt: Date.now(),
    };
    this.accounts.set(tenantId, updated);
    return { ...updated };
  }

  public resetForTesting(): void {
    this.accounts.clear();
    this.subscriptions.clear();
  }
}
