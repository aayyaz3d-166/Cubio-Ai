/**
 * CUBiO AI — Phase 12: Authoritative Usage Ledger
 * src/cubio/api/billing/usageLedger.ts
 *
 * Thread-safe / mutex-guarded usage metering per tenant and period.
 * Guarantees:
 * - Idempotency by requestId (retries do not increment counters)
 * - Atomic check-and-reserve before intelligence execution
 * - Race-condition immunity: concurrent requests near limit cannot over-allocate
 * - Safe admin usage corrections with audit trail
 */

import {
  UsagePeriodLedger,
  UsageSnapshot,
  UsageCorrectionRecord,
  UsageEvent,
} from './types';

export class UsageLedger {
  private static instance: UsageLedger;
  private readonly ledgers: Map<string, UsagePeriodLedger>;
  private readonly events: UsageEvent[];
  private readonly corrections: UsageCorrectionRecord[];
  private readonly inFlightReservations: Map<string, Set<string>>; // tenantId -> Set<requestId>
  private readonly mutexes: Map<string, Promise<void>>;

  private constructor() {
    this.ledgers = new Map();
    this.events = [];
    this.corrections = [];
    this.inFlightReservations = new Map();
    this.mutexes = new Map();
  }

  public static getInstance(): UsageLedger {
    if (!UsageLedger.instance) {
      UsageLedger.instance = new UsageLedger();
    }
    return UsageLedger.instance;
  }

  /**
   * Acquire an async lock for a tenant to serialize atomic checks
   */
  private async acquireLock(tenantId: string): Promise<() => void> {
    while (this.mutexes.has(tenantId)) {
      await this.mutexes.get(tenantId);
    }
    let resolveLock!: () => void;
    const lockPromise = new Promise<void>((resolve) => {
      resolveLock = resolve;
    });
    this.mutexes.set(tenantId, lockPromise);

    return () => {
      this.mutexes.delete(tenantId);
      resolveLock();
    };
  }

  /**
   * Get or initialize current billing period ledger for tenant
   */
  private getLedger(tenantId: string): UsagePeriodLedger {
    let ledger = this.ledgers.get(tenantId);
    const now = Date.now();
    const periodDurationMs = 30 * 24 * 60 * 60 * 1000;

    if (!ledger || now >= ledger.periodEnd) {
      ledger = {
        tenantId,
        periodStart: now,
        periodEnd: now + periodDurationMs,
        requestCount: 0,
        turnCount: 0,
        totalCharacters: 0,
        processedRequestIds: new Set<string>(),
      };
      this.ledgers.set(tenantId, ledger);
    }

    return ledger;
  }

  /**
   * Pre-Execution Limit Reservation Guard
   * Atomically checks if request is allowed under plan limit.
   * If already processed (idempotent replay), allows without consuming new quota.
   * If near limit, reserves slot so concurrent requests cannot over-allocate.
   */
  public async reserveRequest(
    tenantId: string,
    requestId: string,
    maxRequests: number,
    userId = `user_${tenantId}`,
    conversationId?: string
  ): Promise<{ allowed: boolean; reason?: string; isReplay: boolean; currentUsage: number }> {
    const unlock = await this.acquireLock(tenantId);
    try {
      const ledger = this.getLedger(tenantId);

      // Check for Idempotent Replay
      if (ledger.processedRequestIds.has(requestId)) {
        return {
          allowed: true,
          isReplay: true,
          currentUsage: ledger.requestCount,
        };
      }

      // Check current reservations + committed count
      const inFlight = this.inFlightReservations.get(tenantId) || new Set<string>();
      if (inFlight.has(requestId)) {
        return {
          allowed: true,
          isReplay: true,
          currentUsage: ledger.requestCount + inFlight.size,
        };
      }

      const totalActive = ledger.requestCount + inFlight.size;

      if (totalActive >= maxRequests) {
        return {
          allowed: false,
          reason: `Usage limit reached: ${totalActive}/${maxRequests} requests consumed this period.`,
          isReplay: false,
          currentUsage: totalActive,
        };
      }

      // Atomically reserve
      inFlight.add(requestId);
      this.inFlightReservations.set(tenantId, inFlight);

      return {
        allowed: true,
        isReplay: false,
        currentUsage: totalActive + 1,
      };
    } finally {
      unlock();
    }
  }

  /**
   * Finalize & Commit Usage upon successful intelligence turn
   */
  public async commitRequest(
    tenantId: string,
    requestId: string,
    characters: number,
    userId = `user_${tenantId}`,
    conversationId?: string
  ): Promise<void> {
    const unlock = await this.acquireLock(tenantId);
    try {
      const ledger = this.getLedger(tenantId);
      const inFlight = this.inFlightReservations.get(tenantId);

      // Idempotency: If already committed, do not increment again
      if (ledger.processedRequestIds.has(requestId)) {
        if (inFlight) inFlight.delete(requestId);
        return;
      }

      // Commit count
      ledger.requestCount += 1;
      ledger.turnCount += 1;
      ledger.totalCharacters += Math.max(0, characters);
      ledger.processedRequestIds.add(requestId);

      if (inFlight) {
        inFlight.delete(requestId);
      }

      // Record immutable usage event
      const event: UsageEvent = {
        eventId: `use_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        requestId,
        tenantId,
        userId,
        conversationId,
        metric: 'CHAT_REQUEST',
        quantity: 1,
        timestamp: Date.now(),
        billable: true,
      };
      this.events.push(event);
    } finally {
      unlock();
    }
  }

  /**
   * Release reservation if execution failed before completion
   */
  public async releaseReservation(tenantId: string, requestId: string): Promise<void> {
    const unlock = await this.acquireLock(tenantId);
    try {
      const inFlight = this.inFlightReservations.get(tenantId);
      if (inFlight) {
        inFlight.delete(requestId);
      }
    } finally {
      unlock();
    }
  }

  /**
   * Administrative usage correction with auditable record
   */
  public async correctUsage(
    tenantId: string,
    newCount: number,
    adminUserId: string,
    reason: string
  ): Promise<UsageCorrectionRecord> {
    if (newCount < 0) {
      throw new Error('[USAGE_CORRECTION_ERROR] Usage count cannot be negative.');
    }
    const unlock = await this.acquireLock(tenantId);
    try {
      const ledger = this.getLedger(tenantId);
      const previousCount = ledger.requestCount;
      const adjustedDelta = newCount - previousCount;

      ledger.requestCount = newCount;

      const record: UsageCorrectionRecord = {
        correctionId: `corr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        tenantId,
        adminUserId,
        reason,
        previousCount,
        newCount,
        adjustedDelta,
        timestamp: Date.now(),
      };
      this.corrections.push(record);
      return { ...record };
    } finally {
      unlock();
    }
  }

  /**
   * Read authoritative usage snapshot
   */
  public getSnapshot(tenantId: string, maxRequests: number, maxTurns: number): UsageSnapshot {
    const ledger = this.getLedger(tenantId);
    const inFlight = this.inFlightReservations.get(tenantId)?.size || 0;
    const effectiveRequests = ledger.requestCount + inFlight;

    const remainingRequests = Math.max(0, maxRequests - effectiveRequests);
    const percentUsed = maxRequests > 0 ? Math.min(100, Math.round((effectiveRequests / maxRequests) * 100)) : 0;

    return {
      tenantId,
      periodStart: ledger.periodStart,
      periodEnd: ledger.periodEnd,
      requestCount: effectiveRequests,
      turnCount: ledger.turnCount,
      totalCharacters: ledger.totalCharacters,
      maxRequests,
      maxTurns,
      remainingRequests,
      percentUsed,
    };
  }

  public getCorrections(tenantId: string): UsageCorrectionRecord[] {
    return this.corrections.filter((c) => c.tenantId === tenantId);
  }

  public getEvents(tenantId: string): UsageEvent[] {
    return this.events.filter((e) => e.tenantId === tenantId);
  }

  public resetForTesting(): void {
    this.ledgers.clear();
    this.events.length = 0;
    this.corrections.length = 0;
    this.inFlightReservations.clear();
    this.mutexes.clear();
  }
}
