/**
 * CUBiO AI — Task 11: Rxiver Protocol & Governance Integration
 * src/cubio/core/rxiverIntegration.ts
 *
 * Implements the Rxiver Governance / Validation / Integrity Integration Layer:
 *
 *                 CANONICAL OBJECT (VDB)
 *                           │
 *                  Canonical Identity Key
 *           (objectId, tenantId, stateVersion, checksum)
 *                           │
 *              ┌────────────┴────────────┐
 *              ↓                         ↓
 *        RX Lifecycle                 State-T
 *              │                         │
 *              └───────────┬─────────────┘
 *                          ↓
 *                       Rxiver
 *                Governance & Integrity
 *                          │
 *              ┌───────────┼───────────┐
 *              ↓           ↓           ↓
 *          Integrity   Transition    Policy
 *          Validation  Validation   Decision
 *              │           │           │
 *              └───────────┴───────────┘
 *                          ↓
 *                 VALID / REJECTED / STALE / CONFLICT
 *                          ↓
 *                  Canonical Commit
 *
 * Core Invariants:
 * 1. Rxiver is a GOVERNANCE / INTEGRITY layer, NOT a database, state machine, or identity authority.
 * 2. Rxiver references canonical identity keys (objectId, tenantId, stateVersion, sourceChecksum).
 * 3. Never copies full canonical payload into validator contexts.
 * 4. Fails closed: unvalidated states or missing governance are strictly non-authorizing.
 * 5. Version safety: Stale validation decisions (validatedStateVersion !== currentStateVersion) are rejected.
 * 6. Checksum integrity: Computes deterministic SHA-256 digests; tampering yields REJECTED.
 * 7. Tenant isolation: Mismatched tenantId throws TENANT_MISMATCH_CONFLICT.
 * 8. Actuation lock: IS_ACTUATION_BLOCKED = true permanently asserted.
 */

import {
  CanonicalIdentityKey,
  calculateCanonicalChecksum,
} from './canonicalIdentity';
import {
  validateCellId,
  cellIdToCoordinate,
  cellIdToAddress369,
} from '../../core/address369';
import { IS_ACTUATION_BLOCKED } from '../intelligence/core/coreEngineContract';
import { RxStage } from '../f10/lifecycle/rxTypes';
import { StateTLifecycle } from '../../stateT/StateT';
import {
  IntegratedReferenceEngine,
  INTEGRATION_ERRORS,
} from './integratedReferences';
import {
  RxLifecycleIntegrationEngine,
  RX_LIFECYCLE_ERRORS,
} from './rxLifecycleIntegration';

// ── ERROR CODES ─────────────────────────────────────────────────────────────

export const RXIVER_ERRORS = {
  STALE_BASE_VERSION: 'STALE_BASE_VERSION',
  TENANT_MISMATCH_CONFLICT: 'TENANT_MISMATCH_CONFLICT',
  INTEGRITY_CHECKSUM_FAILURE: 'INTEGRITY_CHECKSUM_FAILURE',
  GOVERNANCE_POLICY_VIOLATION: 'GOVERNANCE_POLICY_VIOLATION',
  ACTUATION_BLOCKED_VIOLATION: 'ACTUATION_BLOCKED_VIOLATION',
  INVALID_SPATIAL_CELL: 'INVALID_SPATIAL_CELL',
} as const;

// ── RXIVER DECISION & STATUS ────────────────────────────────────────────────

export type RxiverDecisionStatus = 'VALID' | 'REJECTED' | 'STALE' | 'CONFLICT';

export interface RxiverReference {
  readonly objectId: string;
  readonly tenantId: string;
  readonly stateVersion: number;
  readonly sourceChecksum: string;
  readonly lifecycleId?: string;
  readonly cellId?: number;
}

export interface RxiverDecision {
  readonly decisionId: string;
  readonly objectId: string;
  readonly tenantId: string;
  readonly stateVersion: number;
  readonly sourceChecksum: string;
  readonly status: RxiverDecisionStatus;
  readonly reasonCode: string;
  readonly validatorVersion: string;
  readonly evaluatedAt: number;
  readonly decisionHash: string;
}

export interface RxiverEventReference {
  readonly eventId: string;
  readonly objectId: string;
  readonly tenantId: string;
  readonly stateVersion: number;
  readonly decisionId: string;
  readonly eventType: string;
  readonly timestamp: number;
}

// ── RXIVER GOVERNANCE ENGINE ────────────────────────────────────────────────

export class RxiverGovernanceEngine {
  public static readonly DEFAULT_MAX_DECISIONS = 256;
  public static readonly DEFAULT_MAX_EVENTS = 256;
  public static readonly OPERATOR_VERSION = 'RXIVER-GOV-2.0-CANONICAL';

  public readonly maxDecisions: number;
  public readonly maxEvents: number;

  // Bounded decision cache: decisionId -> RxiverDecision
  private readonly decisionCache: Map<string, RxiverDecision> = new Map();

  // Bounded event log
  private readonly eventHistory: RxiverEventReference[] = [];

  // Internal decision sequence counter
  private decisionSequence: number = 0;

  constructor(
    maxDecisions: number = RxiverGovernanceEngine.DEFAULT_MAX_DECISIONS,
    maxEvents: number = RxiverGovernanceEngine.DEFAULT_MAX_EVENTS
  ) {
    this.maxDecisions = Math.max(1, maxDecisions);
    this.maxEvents = Math.max(1, maxEvents);
  }

  public static verifyActuationLock(): void {
    if (IS_ACTUATION_BLOCKED !== true) {
      throw new Error(RXIVER_ERRORS.ACTUATION_BLOCKED_VIOLATION);
    }
  }

  // --------------------------------------------------------------------------
  // 1. CANONICAL STATE & INTEGRITY VALIDATION
  // --------------------------------------------------------------------------

  /**
   * Validates canonical entity integrity and governance policy.
   * Fails closed: any mismatch or corruption results in REJECTED / CONFLICT / STALE.
   */
  public validateCanonicalEntity(
    canonical: {
      readonly identity: CanonicalIdentityKey;
      readonly payload: Record<string, unknown>;
    },
    requestedTenantId: string,
    expectedStateVersion?: number
  ): RxiverDecision {
    RxiverGovernanceEngine.verifyActuationLock();

    const identity = canonical.identity;
    this.decisionSequence++;
    const decId = `RXV-DEC-${this.decisionSequence}-${identity.objectId}`;
    const now = Date.now();

    // 1. Tenant Isolation Check
    if (requestedTenantId !== identity.tenantId) {
      const decision = this.recordDecision({
        decisionId: decId,
        objectId: identity.objectId,
        tenantId: requestedTenantId,
        stateVersion: identity.stateVersion,
        sourceChecksum: identity.checksum,
        status: 'CONFLICT',
        reasonCode: RXIVER_ERRORS.TENANT_MISMATCH_CONFLICT,
        validatorVersion: RxiverGovernanceEngine.OPERATOR_VERSION,
        evaluatedAt: now,
      });
      return decision;
    }

    // 2. Version Freshness / OCC Check
    if (expectedStateVersion !== undefined && expectedStateVersion !== identity.stateVersion) {
      const decision = this.recordDecision({
        decisionId: decId,
        objectId: identity.objectId,
        tenantId: identity.tenantId,
        stateVersion: identity.stateVersion,
        sourceChecksum: identity.checksum,
        status: 'STALE',
        reasonCode: RXIVER_ERRORS.STALE_BASE_VERSION,
        validatorVersion: RxiverGovernanceEngine.OPERATOR_VERSION,
        evaluatedAt: now,
      });
      return decision;
    }

    // 3. Cryptographic Checksum Integrity Check
    const expectedChecksum = calculateCanonicalChecksum(canonical.payload);
    if (expectedChecksum !== identity.checksum) {
      const decision = this.recordDecision({
        decisionId: decId,
        objectId: identity.objectId,
        tenantId: identity.tenantId,
        stateVersion: identity.stateVersion,
        sourceChecksum: identity.checksum,
        status: 'REJECTED',
        reasonCode: RXIVER_ERRORS.INTEGRITY_CHECKSUM_FAILURE,
        validatorVersion: RxiverGovernanceEngine.OPERATOR_VERSION,
        evaluatedAt: now,
      });
      return decision;
    }

    // 4. Spatial Bounds Check (if spatial cell present)
    if (identity.cellId !== undefined) {
      try {
        validateCellId(identity.cellId);
        cellIdToCoordinate(identity.cellId);
        cellIdToAddress369(identity.cellId);
      } catch {
        const decision = this.recordDecision({
          decisionId: decId,
          objectId: identity.objectId,
          tenantId: identity.tenantId,
          stateVersion: identity.stateVersion,
          sourceChecksum: identity.checksum,
          status: 'REJECTED',
          reasonCode: RXIVER_ERRORS.INVALID_SPATIAL_CELL,
          validatorVersion: RxiverGovernanceEngine.OPERATOR_VERSION,
          evaluatedAt: now,
        });
        return decision;
      }
    }

    // All Governance Invariants Passed
    const decision = this.recordDecision({
      decisionId: decId,
      objectId: identity.objectId,
      tenantId: identity.tenantId,
      stateVersion: identity.stateVersion,
      sourceChecksum: identity.checksum,
      status: 'VALID',
      reasonCode: 'ALL_GOVERNANCE_RULES_SATISFIED',
      validatorVersion: RxiverGovernanceEngine.OPERATOR_VERSION,
      evaluatedAt: now,
    });

    return decision;
  }

  // --------------------------------------------------------------------------
  // 2. RX LIFECYCLE GOVERNANCE VALIDATION
  // --------------------------------------------------------------------------

  /**
   * Validates an RX Lifecycle stage transition without owning stage semantics.
   * Ensures the lifecycle context references an authentic canonical entity and version.
   */
  public validateLifecycleEvent(
    canonical: { readonly identity: CanonicalIdentityKey; readonly payload: Record<string, unknown> },
    lifecycleId: string,
    currentStage: RxStage,
    nextStage: RxStage,
    requestedTenantId: string
  ): RxiverDecision {
    RxiverGovernanceEngine.verifyActuationLock();

    // Verify canonical state first
    const baseDecision = this.validateCanonicalEntity(canonical, requestedTenantId);
    if (baseDecision.status !== 'VALID') {
      return baseDecision;
    }

    this.decisionSequence++;
    const decId = `RXV-LIFE-${this.decisionSequence}-${lifecycleId}`;
    const now = Date.now();

    // Governance policy: stage cannot regress
    if (nextStage < currentStage) {
      return this.recordDecision({
        decisionId: decId,
        objectId: canonical.identity.objectId,
        tenantId: canonical.identity.tenantId,
        stateVersion: canonical.identity.stateVersion,
        sourceChecksum: canonical.identity.checksum,
        status: 'REJECTED',
        reasonCode: 'RX_REGRESSION_POLICY_VIOLATION',
        validatorVersion: RxiverGovernanceEngine.OPERATOR_VERSION,
        evaluatedAt: now,
      });
    }

    return this.recordDecision({
      decisionId: decId,
      objectId: canonical.identity.objectId,
      tenantId: canonical.identity.tenantId,
      stateVersion: canonical.identity.stateVersion,
      sourceChecksum: canonical.identity.checksum,
      status: 'VALID',
      reasonCode: 'RX_LIFECYCLE_STAGE_AUTHORIZED',
      validatorVersion: RxiverGovernanceEngine.OPERATOR_VERSION,
      evaluatedAt: now,
    });
  }

  // --------------------------------------------------------------------------
  // 3. STATE-T TRANSITION GOVERNANCE GATE
  // --------------------------------------------------------------------------

  /**
   * Evaluates mandatory pre-commit governance for a State-T transition.
   * If governance fails, canonical commit is blocked.
   */
  public evaluateStateTTransitionGovernance(
    canonical: { readonly identity: CanonicalIdentityKey; readonly payload: Record<string, unknown> },
    fromState: StateTLifecycle,
    toState: StateTLifecycle,
    requestedTenantId: string
  ): { readonly authorized: boolean; readonly decision: RxiverDecision } {
    RxiverGovernanceEngine.verifyActuationLock();

    const decision = this.validateCanonicalEntity(canonical, requestedTenantId);
    if (decision.status !== 'VALID') {
      return { authorized: false, decision };
    }

    // Prohibit transitions into corrupt/invalid states under normal operation
    if (toState === StateTLifecycle.STATE_CORRUPTED || toState === StateTLifecycle.HARD_STOP) {
      this.decisionSequence++;
      const blockDec = this.recordDecision({
        decisionId: `RXV-STT-${this.decisionSequence}-${canonical.identity.objectId}`,
        objectId: canonical.identity.objectId,
        tenantId: canonical.identity.tenantId,
        stateVersion: canonical.identity.stateVersion,
        sourceChecksum: canonical.identity.checksum,
        status: 'REJECTED',
        reasonCode: 'TARGET_LIFECYCLE_FORBIDDEN_BY_POLICY',
        validatorVersion: RxiverGovernanceEngine.OPERATOR_VERSION,
        evaluatedAt: Date.now(),
      });
      return { authorized: false, decision: blockDec };
    }

    return { authorized: true, decision };
  }

  // --------------------------------------------------------------------------
  // 4. BOUNDED DECISION CACHE & EVENT LOG MANAGEMENT
  // --------------------------------------------------------------------------

  private recordDecision(params: {
    decisionId: string;
    objectId: string;
    tenantId: string;
    stateVersion: number;
    sourceChecksum: string;
    status: RxiverDecisionStatus;
    reasonCode: string;
    validatorVersion: string;
    evaluatedAt: number;
  }): RxiverDecision {
    const decisionHash = calculateCanonicalChecksum({
      id: params.decisionId,
      obj: params.objectId,
      v: params.stateVersion,
      st: params.status,
      rc: params.reasonCode,
    });

    const decision: RxiverDecision = Object.freeze({
      ...params,
      decisionHash,
    });

    // Bounded decision cache
    if (this.decisionCache.size >= this.maxDecisions) {
      const firstKey = this.decisionCache.keys().next().value;
      if (firstKey) this.decisionCache.delete(firstKey);
    }
    this.decisionCache.set(params.decisionId, decision);

    // Bounded event log
    const event: RxiverEventReference = Object.freeze({
      eventId: `EVT-${params.decisionId}`,
      objectId: params.objectId,
      tenantId: params.tenantId,
      stateVersion: params.stateVersion,
      decisionId: params.decisionId,
      eventType: `GOVERNANCE_${params.status}`,
      timestamp: params.evaluatedAt,
    });

    if (this.eventHistory.length >= this.maxEvents) {
      this.eventHistory.shift();
    }
    this.eventHistory.push(event);

    return decision;
  }

  public getDecision(decisionId: string): RxiverDecision | undefined {
    return this.decisionCache.get(decisionId);
  }

  public getDecisionCount(): number {
    return this.decisionCache.size;
  }

  public getEventCount(): number {
    return this.eventHistory.length;
  }

  public clearAll(): void {
    this.decisionCache.clear();
    this.eventHistory.length = 0;
  }
}
