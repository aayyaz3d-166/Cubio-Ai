/**
 * CUBiO AI — Phase 12: Plan Registry & Entitlements
 * src/cubio/api/billing/planRegistry.ts
 *
 * Authoritative source of truth for canonical plans and feature entitlements.
 * Client state or local overrides CANNOT modify or elevate entitlements.
 */

import { PlanDefinition, PlanId, EntitlementCapability } from './types';

export const CANONICAL_PLANS: Record<PlanId, PlanDefinition> = {
  FREE: {
    planId: 'FREE',
    displayName: 'CubiO Free',
    description: 'Community tier for evaluation and lightweight exploration.',
    priceCents: 0,
    currency: 'USD',
    interval: 'FREE',
    limits: {
      maxRequestsPerPeriod: 50,
      maxTurnsPerPeriod: 100,
      maxMessageLength: 2000,
      maxConcurrentRequests: 2,
    },
    entitlements: ['CHAT_ACCESS', 'SPATIAL_ACCESS'],
    isActive: true,
  },
  PRO: {
    planId: 'PRO',
    displayName: 'CubiO Pro',
    description: 'Professional workspace with advanced reasoning and high throughput.',
    priceCents: 2900, // $29/mo
    currency: 'USD',
    interval: 'MONTHLY',
    limits: {
      maxRequestsPerPeriod: 1000,
      maxTurnsPerPeriod: 2000,
      maxMessageLength: 4000,
      maxConcurrentRequests: 4,
    },
    entitlements: [
      'CHAT_ACCESS',
      'SPATIAL_ACCESS',
      'MEMORY_READ',
      'ADVANCED_USAGE',
      'API_ACCESS',
    ],
    isActive: true,
  },
  TEAM: {
    planId: 'TEAM',
    displayName: 'CubiO Team',
    description: 'Collaborative team workspace with shared context and memory partitions.',
    priceCents: 9900, // $99/mo
    currency: 'USD',
    interval: 'MONTHLY',
    limits: {
      maxRequestsPerPeriod: 10000,
      maxTurnsPerPeriod: 20000,
      maxMessageLength: 4000,
      maxConcurrentRequests: 16,
    },
    entitlements: [
      'CHAT_ACCESS',
      'SPATIAL_ACCESS',
      'MEMORY_READ',
      'ADVANCED_USAGE',
      'TEAM_COLLAB',
      'API_ACCESS',
    ],
    isActive: true,
  },
  ENTERPRISE: {
    planId: 'ENTERPRISE',
    displayName: 'CubiO Enterprise',
    description: 'Dedicated isolated deployment with virtually unlimited headroom.',
    priceCents: 49900, // $499/mo
    currency: 'USD',
    interval: 'ANNUAL',
    limits: {
      maxRequestsPerPeriod: 1000000,
      maxTurnsPerPeriod: 2000000,
      maxMessageLength: 4000,
      maxConcurrentRequests: 64,
    },
    entitlements: [
      'CHAT_ACCESS',
      'SPATIAL_ACCESS',
      'MEMORY_READ',
      'ADVANCED_USAGE',
      'TEAM_COLLAB',
      'API_ACCESS',
    ],
    isActive: true,
  },
};

export class PlanRegistry {
  private static instance: PlanRegistry;
  private readonly plans: Map<PlanId, PlanDefinition>;

  private constructor() {
    this.plans = new Map<PlanId, PlanDefinition>();
    for (const [id, def] of Object.entries(CANONICAL_PLANS)) {
      this.plans.set(id as PlanId, Object.freeze({ ...def }));
    }
  }

  public static getInstance(): PlanRegistry {
    if (!PlanRegistry.instance) {
      PlanRegistry.instance = new PlanRegistry();
    }
    return PlanRegistry.instance;
  }

  public getPlan(planId: PlanId): PlanDefinition | null {
    return this.plans.get(planId) || null;
  }

  public getAllPlans(): PlanDefinition[] {
    return Array.from(this.plans.values());
  }

  public hasEntitlement(planId: PlanId, capability: EntitlementCapability): boolean {
    const plan = this.getPlan(planId);
    if (!plan) return false;
    return plan.entitlements.includes(capability);
  }
}
