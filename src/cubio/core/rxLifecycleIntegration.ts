/**
 * CUBiO AI — Task 10: RX Lifecycle Integration
 * src/cubio/core/rxLifecycleIntegration.ts
 *
 * Integrates the F10 RX Lifecycle:
 *   RX0 (Birth) → RX1 (Superposition) → RX2 (Interaction) → RX3 (Awareness Growth) → RX4 (Evolution) → RX5 (Exit)
 * into the canonical CUBiO memory architecture.
 *
 * Core Principles:
 * 1. STORE ONCE, REFERENCE EVERYWHERE:
 *    - RX lifecycle is an ephemeral execution model operating against canonical references.
 *    - objectId is the permanent canonical entity identifier.
 *    - lifecycleId is an ephemeral execution session identifier.
 *    - transitionSequence (0..N) tracks lifecycle steps and is strictly separated from canonical stateVersion.
 * 2. CANONICAL VERSION SAFETY:
 *    - Enforces Optimistic Concurrency Control (OCC) against canonical baseStateVersion.
 *    - If canonical object stateVersion advances while lifecycle is running, stale promotion is rejected.
 * 3. STATE-T OWNERSHIP:
 *    - Canonical state mutations / promotions pass through the authoritative State-T / canonical version machinery.
 * 4. TENANT ISOLATION:
 *    - lifecycle.tenantId === canonicalObject.tenantId. Cross-tenant access throws TENANT_MISMATCH_CONFLICT.
 * 5. SPATIAL AUTHORITY:
 *    - Coordinates and address369 resolve strictly via src/core/address369.ts (cellId = x + 7y + 49z, 26 + cellId).
 * 6. BOUNDED MEMORY & RX5 CLEANUP:
 *    - Active lifecycle contexts and runtime transition histories are strictly capped (<= 256 entries).
 *    - Advancing to RX5 marks the lifecycle as EXITED and cleans up transient resources without mutating VDB.
 * 7. ACTUATION LOCK:
 *    - IS_ACTUATION_BLOCKED = true permanently asserted.
 */

import {
  CanonicalIdentityKey,
  calculateCanonicalChecksum,
  createNextVersion,
} from './canonicalIdentity';
import {
  validateCellId,
  cellIdToCoordinate,
  cellIdToAddress369,
} from '../../core/address369';
import { IS_ACTUATION_BLOCKED } from '../intelligence/core/coreEngineContract';
import { RxStage, AwarenessLevel } from '../f10/lifecycle/rxTypes';
import { RxGlobalCounter } from '../f10/lifecycle/rxGlobalCounter';
import { StateTLifecycle } from '../../stateT/StateT';
import {
  IntegratedReferenceEngine,
  INTEGRATION_ERRORS,
} from './integratedReferences';

// ── RX LIFECYCLE STAGES & DESCRIPTIONS ──────────────────────────────────────

export const RX_STAGE_NAMES: Readonly<Record<RxStage, string>> = Object.freeze({
  0: 'Birth',
  1: 'Superposition',
  2: 'Interaction',
  3: 'Awareness Growth',
  4: 'Evolution',
  5: 'Exit',
});

// ── ERROR CODES ─────────────────────────────────────────────────────────────

export const RX_LIFECYCLE_ERRORS = {
  STALE_BASE_VERSION: 'STALE_BASE_VERSION',
  TENANT_MISMATCH_CONFLICT: 'TENANT_MISMATCH_CONFLICT',
  INVALID_LIFECYCLE_TRANSITION: 'INVALID_LIFECYCLE_TRANSITION',
  LIFECYCLE_ALREADY_EXITED: 'LIFECYCLE_ALREADY_EXITED',
  LIFECYCLE_NOT_FOUND: 'LIFECYCLE_NOT_FOUND',
  ACTUATION_BLOCKED_VIOLATION: 'ACTUATION_BLOCKED_VIOLATION',
} as const;

// ── REFERENCE INTERFACES ────────────────────────────────────────────────────

export interface RxLifecycleReference {
  readonly objectId: string;
  readonly tenantId: string;
  readonly stateVersion: number;
  readonly cellId?: number;
  readonly sourceChecksum: string;
}

export interface RxTransitionReference {
  readonly lifecycleId: string;
  readonly objectId: string;
  readonly fromStage: RxStage;
  readonly toStage: RxStage;
  readonly sequence: number;
  readonly awarenessLevel: AwarenessLevel;
  readonly stateVersion: number;
  readonly timestamp: number;
  readonly transitionHash: string;
}

export interface RxLifecycleContext {
  readonly lifecycleId: string;
  readonly reference: RxLifecycleReference;
  readonly currentStage: RxStage;
  readonly awarenessLevel: AwarenessLevel;
  readonly transitionSequence: number;
  readonly baseStateVersion: number;
  readonly isExited: boolean;
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly lastAccessedAt: number;
}

// ── RX LIFECYCLE INTEGRATION ENGINE ─────────────────────────────────────────

export class RxLifecycleIntegrationEngine {
  public static readonly DEFAULT_MAX_ACTIVE_LIFECYCLES = 256;
  public static readonly DEFAULT_MAX_HISTORY_PER_LIFECYCLE = 256;

  public readonly maxActiveLifecycles: number;
  public readonly maxHistoryPerLifecycle: number;

  // Bounded active lifecycle cache: lifecycleId -> RxLifecycleContext
  private readonly activeLifecycles: Map<string, RxLifecycleContext> = new Map();

  // Bounded transition history: lifecycleId -> RxTransitionReference[]
  private readonly lifecycleHistories: Map<string, RxTransitionReference[]> = new Map();

  // Reference to integrated State-T transition authority
  private readonly stateTEngine: IntegratedReferenceEngine;

  constructor(
    maxActiveLifecycles: number = RxLifecycleIntegrationEngine.DEFAULT_MAX_ACTIVE_LIFECYCLES,
    maxHistoryPerLifecycle: number = RxLifecycleIntegrationEngine.DEFAULT_MAX_HISTORY_PER_LIFECYCLE,
    stateTEngine: IntegratedReferenceEngine = new IntegratedReferenceEngine()
  ) {
    this.maxActiveLifecycles = Math.max(1, maxActiveLifecycles);
    this.maxHistoryPerLifecycle = Math.max(1, maxHistoryPerLifecycle);
    this.stateTEngine = stateTEngine;
  }

  public static verifyActuationLock(): void {
    if (IS_ACTUATION_BLOCKED !== true) {
      throw new Error(RX_LIFECYCLE_ERRORS.ACTUATION_BLOCKED_VIOLATION);
    }
  }

  // --------------------------------------------------------------------------
  // LIFECYCLE CREATION (RX0 — Birth)
  // --------------------------------------------------------------------------

  /**
   * Initializes a new RX lifecycle execution session (RX0 Birth) for a canonical object.
   * Does NOT mutate canonical state or duplicate payloads.
   */
  public birthLifecycle(
    canonical: { readonly identity: CanonicalIdentityKey; readonly payload?: Record<string, unknown> },
    customLifecycleId?: string
  ): RxLifecycleContext {
    RxLifecycleIntegrationEngine.verifyActuationLock();

    const identity = canonical.identity;
    if (identity.cellId !== undefined) {
      validateCellId(identity.cellId);
    }

    // Evict oldest active lifecycle if cache limit reached
    if (this.activeLifecycles.size >= this.maxActiveLifecycles) {
      this.evictOldestLifecycle();
    }

    const globalSeq = RxGlobalCounter.nextGlobalRx();
    const lifecycleId = customLifecycleId || `RX-LIFE-${identity.objectId}-${globalSeq}`;
    const now = Date.now();

    const reference: RxLifecycleReference = Object.freeze({
      objectId: identity.objectId,
      tenantId: identity.tenantId,
      stateVersion: identity.stateVersion,
      ...(identity.cellId !== undefined ? { cellId: identity.cellId } : {}),
      sourceChecksum: identity.checksum,
    });

    const context: RxLifecycleContext = Object.freeze({
      lifecycleId,
      reference,
      currentStage: 0 as RxStage,
      awarenessLevel: 0 as AwarenessLevel,
      transitionSequence: 0,
      baseStateVersion: identity.stateVersion,
      isExited: false,
      createdAt: now,
      updatedAt: now,
      lastAccessedAt: now,
    });

    this.activeLifecycles.set(lifecycleId, context);

    // Initial transition record for birth
    const initialTransition: RxTransitionReference = Object.freeze({
      lifecycleId,
      objectId: identity.objectId,
      fromStage: 0,
      toStage: 0,
      sequence: 0,
      awarenessLevel: 0,
      stateVersion: identity.stateVersion,
      timestamp: now,
      transitionHash: calculateCanonicalChecksum({ lifecycleId, stage: 0, seq: 0 }),
    });

    this.lifecycleHistories.set(lifecycleId, [initialTransition]);
    return context;
  }

  // --------------------------------------------------------------------------
  // LIFECYCLE STAGE TRANSITION (RX0 → RX1 → RX2 → RX3 → RX4 → RX5)
  // --------------------------------------------------------------------------

  /**
   * Advances the RX lifecycle to the next stage.
   * - Enforces monotonic forward progression (cannot regress).
   * - Advances transitionSequence (0 -> 1 -> 2...) WITHOUT incrementing canonical stateVersion.
   * - Enforces tenant isolation.
   * - If nextStage === 5 (Exit), marks as exited and cleans up transient resources.
   */
  public transitionLifecycleStage(
    lifecycleId: string,
    nextStage: RxStage,
    requestedTenantId: string,
    newAwareness?: AwarenessLevel
  ): RxLifecycleContext {
    RxLifecycleIntegrationEngine.verifyActuationLock();

    const currentContext = this.activeLifecycles.get(lifecycleId);
    if (!currentContext) {
      throw new Error(`${RX_LIFECYCLE_ERRORS.LIFECYCLE_NOT_FOUND}: ${lifecycleId}`);
    }

    if (currentContext.isExited) {
      throw new Error(`${RX_LIFECYCLE_ERRORS.LIFECYCLE_ALREADY_EXITED}: ${lifecycleId}`);
    }

    // Tenant Isolation
    if (requestedTenantId !== currentContext.reference.tenantId) {
      throw new Error(
        `${RX_LIFECYCLE_ERRORS.TENANT_MISMATCH_CONFLICT}: Tenant "${requestedTenantId}" does not match lifecycle tenant "${currentContext.reference.tenantId}".`
      );
    }

    // Valid progression: cannot regress
    if (nextStage < currentContext.currentStage) {
      throw new Error(
        `${RX_LIFECYCLE_ERRORS.INVALID_LIFECYCLE_TRANSITION}: Cannot regress from RX${currentContext.currentStage} to RX${nextStage}.`
      );
    }

    const nextAwareness = newAwareness !== undefined ? newAwareness : currentContext.awarenessLevel;
    const nextSeq = currentContext.transitionSequence + 1;
    const now = Date.now();
    const isExit = nextStage === 5;

    const nextContext: RxLifecycleContext = Object.freeze({
      lifecycleId: currentContext.lifecycleId,
      reference: currentContext.reference, // Same canonical state reference!
      currentStage: nextStage,
      awarenessLevel: nextAwareness,
      transitionSequence: nextSeq,
      baseStateVersion: currentContext.baseStateVersion,
      isExited: isExit,
      createdAt: currentContext.createdAt,
      updatedAt: now,
      lastAccessedAt: now,
    });

    // Record transition history
    const transitionRecord: RxTransitionReference = Object.freeze({
      lifecycleId,
      objectId: currentContext.reference.objectId,
      fromStage: currentContext.currentStage,
      toStage: nextStage,
      sequence: nextSeq,
      awarenessLevel: nextAwareness,
      stateVersion: currentContext.reference.stateVersion,
      timestamp: now,
      transitionHash: calculateCanonicalChecksum({
        lifecycleId,
        from: currentContext.currentStage,
        to: nextStage,
        seq: nextSeq,
      }),
    });

    const history = this.lifecycleHistories.get(lifecycleId) || [];
    if (history.length >= this.maxHistoryPerLifecycle) {
      history.shift(); // Evict oldest runtime transition
    }
    history.push(transitionRecord);
    this.lifecycleHistories.set(lifecycleId, history);

    if (isExit) {
      // RX5 Cleanup: release from active lifecycle cache
      this.activeLifecycles.delete(lifecycleId);
    } else {
      this.activeLifecycles.set(lifecycleId, nextContext);
    }

    return nextContext;
  }

  // --------------------------------------------------------------------------
  // CANONICAL PROMOTION (RX4 Evolution -> Canonical VDB Commit)
  // --------------------------------------------------------------------------

  /**
   * Promotes an evolved RX lifecycle result (typically from RX4 Evolution) into canonical VDB state.
   * Enforces:
   * - OCC Version check: currentCanonical.identity.stateVersion === lifecycle.baseStateVersion
   * - Tenant isolation: currentCanonical.identity.tenantId === lifecycle.reference.tenantId
   * - Authority: Routes through State-T transition authority
   * - Increments canonical stateVersion: V_k -> V_{k+1}
   * - Recomputes deterministic checksum
   */
  public promoteLifecycleToCanonical(
    lifecycleId: string,
    currentCanonical: {
      readonly identity: CanonicalIdentityKey;
      readonly currentLifecycle: StateTLifecycle;
      readonly payload: Record<string, unknown>;
    },
    evolutionUpdates: {
      newPayloadFields?: Record<string, unknown>;
      targetCellId?: number;
    }
  ): {
    readonly nextCanonicalIdentity: CanonicalIdentityKey;
    readonly nextPayload: Record<string, unknown>;
    readonly updatedContext: RxLifecycleContext;
  } {
    RxLifecycleIntegrationEngine.verifyActuationLock();

    const context = this.activeLifecycles.get(lifecycleId);
    if (!context) {
      throw new Error(`${RX_LIFECYCLE_ERRORS.LIFECYCLE_NOT_FOUND}: ${lifecycleId}`);
    }

    // Tenant Isolation
    if (context.reference.tenantId !== currentCanonical.identity.tenantId) {
      throw new Error(
        `${RX_LIFECYCLE_ERRORS.TENANT_MISMATCH_CONFLICT}: Canonical tenant "${currentCanonical.identity.tenantId}" does not match lifecycle tenant "${context.reference.tenantId}".`
      );
    }

    // OCC Check: Reject stale base versions
    if (currentCanonical.identity.stateVersion !== context.baseStateVersion) {
      throw new Error(
        `${RX_LIFECYCLE_ERRORS.STALE_BASE_VERSION}: Canonical state version (${currentCanonical.identity.stateVersion}) does not match lifecycle base version (${context.baseStateVersion}).`
      );
    }

    // Delegate canonical state transition to authoritative State-T engine
    const stateTResult = this.stateTEngine.executeStateTTransition(currentCanonical, {
      objectId: currentCanonical.identity.objectId,
      tenantId: currentCanonical.identity.tenantId,
      baseStateVersion: currentCanonical.identity.stateVersion,
      nextLifecycle: StateTLifecycle.STATE_COMMITTED,
      targetCellId: evolutionUpdates.targetCellId,
      payloadUpdate: {
        ...(evolutionUpdates.newPayloadFields || {}),
        rxEvolutionPromotedAt: Date.now(),
        promotedFromLifecycleId: lifecycleId,
      },
    });

    // Update lifecycle reference to reflect promoted canonical version
    const updatedReference: RxLifecycleReference = Object.freeze({
      objectId: stateTResult.nextCanonicalIdentity.objectId,
      tenantId: stateTResult.nextCanonicalIdentity.tenantId,
      stateVersion: stateTResult.nextCanonicalIdentity.stateVersion,
      ...(stateTResult.nextCanonicalIdentity.cellId !== undefined
        ? { cellId: stateTResult.nextCanonicalIdentity.cellId }
        : {}),
      sourceChecksum: stateTResult.nextCanonicalIdentity.checksum,
    });

    const updatedContext: RxLifecycleContext = Object.freeze({
      ...context,
      reference: updatedReference,
      baseStateVersion: stateTResult.nextCanonicalIdentity.stateVersion,
      updatedAt: Date.now(),
      lastAccessedAt: Date.now(),
    });

    this.activeLifecycles.set(lifecycleId, updatedContext);

    return {
      nextCanonicalIdentity: stateTResult.nextCanonicalIdentity,
      nextPayload: stateTResult.nextPayload,
      updatedContext,
    };
  }

  // --------------------------------------------------------------------------
  // BOUNDED MEMORY & CACHE MANAGEMENT
  // --------------------------------------------------------------------------

  private evictOldestLifecycle(): void {
    let oldestId: string | null = null;
    let oldestTime = Infinity;

    for (const [id, ctx] of this.activeLifecycles.entries()) {
      if (ctx.lastAccessedAt < oldestTime) {
        oldestTime = ctx.lastAccessedAt;
        oldestId = id;
      }
    }

    if (oldestId) {
      this.activeLifecycles.delete(oldestId);
    }
  }

  public getActiveLifecycle(lifecycleId: string): RxLifecycleContext | undefined {
    const ctx = this.activeLifecycles.get(lifecycleId);
    if (ctx) {
      const updated = Object.freeze({ ...ctx, lastAccessedAt: Date.now() });
      this.activeLifecycles.set(lifecycleId, updated);
      return updated;
    }
    return undefined;
  }

  public getActiveLifecycleCount(): number {
    return this.activeLifecycles.size;
  }

  public getTransitionHistory(lifecycleId: string): readonly RxTransitionReference[] {
    return this.lifecycleHistories.get(lifecycleId) || [];
  }

  public clearAllCaches(): void {
    this.activeLifecycles.clear();
    this.lifecycleHistories.clear();
  }
}
