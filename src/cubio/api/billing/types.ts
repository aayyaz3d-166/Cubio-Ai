/**
 * CUBiO AI — Phase 12: Auth, Usage & Billing Core Types
 * src/cubio/api/billing/types.ts
 *
 * Master specification for canonical identity, plans, entitlements,
 * subscription state machine, authoritative usage metering, and billing events.
 */

export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'DELETED';

export type PlanId = 'FREE' | 'PRO' | 'TEAM' | 'ENTERPRISE';

export type SubscriptionStatus =
  | 'TRIAL'
  | 'ACTIVE'
  | 'PAST_DUE'
  | 'CANCELED'
  | 'EXPIRED'
  | 'SUSPENDED';

export type EntitlementCapability =
  | 'CHAT_ACCESS'
  | 'SPATIAL_ACCESS'
  | 'MEMORY_READ'
  | 'ADVANCED_USAGE'
  | 'TEAM_COLLAB'
  | 'API_ACCESS';

export interface PlanLimits {
  readonly maxRequestsPerPeriod: number;
  readonly maxTurnsPerPeriod: number;
  readonly maxMessageLength: number;
  readonly maxConcurrentRequests: number;
}

export interface PlanDefinition {
  readonly planId: PlanId;
  readonly displayName: string;
  readonly description: string;
  readonly priceCents: number;
  readonly currency: string;
  readonly interval: 'MONTHLY' | 'ANNUAL' | 'FREE';
  readonly limits: PlanLimits;
  readonly entitlements: readonly EntitlementCapability[];
  readonly isActive: boolean;
}

export interface SubscriptionRecord {
  readonly subscriptionId: string;
  readonly tenantId: string;
  readonly userId: string;
  readonly planId: PlanId;
  readonly status: SubscriptionStatus;
  readonly currentPeriodStart: number;
  readonly currentPeriodEnd: number;
  readonly cancelAtPeriodEnd: boolean;
  readonly providerSubscriptionId?: string;
  readonly createdAt: number;
  readonly updatedAt: number;
}

export interface TenantAccountRecord {
  readonly tenantId: string;
  readonly primaryUserId: string;
  readonly name: string;
  readonly status: AccountStatus;
  readonly subscriptionId: string;
  readonly planId: PlanId;
  readonly createdAt: number;
  readonly updatedAt: number;
}

export interface UsagePeriodLedger {
  readonly tenantId: string;
  readonly periodStart: number;
  readonly periodEnd: number;
  requestCount: number;
  turnCount: number;
  totalCharacters: number;
  readonly processedRequestIds: Set<string>;
}

export interface UsageSnapshot {
  readonly tenantId: string;
  readonly periodStart: number;
  readonly periodEnd: number;
  readonly requestCount: number;
  readonly turnCount: number;
  readonly totalCharacters: number;
  readonly maxRequests: number;
  readonly maxTurns: number;
  readonly remainingRequests: number;
  readonly percentUsed: number;
}

export interface UsageEvent {
  readonly eventId: string;
  readonly requestId: string;
  readonly tenantId: string;
  readonly userId: string;
  readonly conversationId?: string;
  readonly metric: 'CHAT_REQUEST' | 'CHAT_TURN';
  readonly quantity: number;
  readonly timestamp: number;
  readonly billable: boolean;
}

export interface UsageCorrectionRecord {
  readonly correctionId: string;
  readonly tenantId: string;
  readonly adminUserId: string;
  readonly reason: string;
  readonly previousCount: number;
  readonly newCount: number;
  readonly adjustedDelta: number;
  readonly timestamp: number;
}

export interface BillingWebhookPayload {
  readonly eventId: string;
  readonly eventType:
    | 'subscription.created'
    | 'subscription.active'
    | 'subscription.past_due'
    | 'subscription.canceled'
    | 'subscription.expired'
    | 'order.paid';
  readonly tenantId: string;
  readonly planId?: PlanId;
  readonly providerSubscriptionId: string;
  readonly status: SubscriptionStatus;
  readonly currentPeriodStart: number;
  readonly currentPeriodEnd: number;
  readonly timestamp: number;
}
