/**
 * ============================================================================
 * CUBiO AI — PHASE 31 TASK 500: DYNAMIC SUBMOTHER IDENTITY ENGINE
 * src/cubio/submother/phase31DynamicSubmotherIdentityEngine.ts
 * ============================================================================
 *
 * Implements deterministic identities for dynamically generated Submother instances.
 *
 * Core Guarantees & Features:
 *   1. Identity derivation from (tenantId, taskId, domain, contextHash, formulaId, generationDepth).
 *   2. Bit-exact reproducibility: Identical inputs yield identical identity IDs and digests.
 *   3. Zero independent trainable weights or parameters (`independentWeightsCreated: false`).
 *   4. Lifecycle Management: CREATED → ACTIVE → COMPLETED | EXPIRED | TERMINATED.
 *   5. Automatic expiration via TTL timeouts.
 *   6. Dynamic branch reuse: Identical task context and formula parameters can safely reuse identities.
 *   7. Collision detection: Rejects conflicting parameter state mapped to identical identity keys.
 *   8. Multi-tenant namespace isolation: Cross-tenant identity resolution strictly blocked.
 *   9. Cryptographic provenance: SHA-256 digest stamps every identity record.
 *  10. Immutable Audit Ledger: Records all lifecycle changes and blocked manipulation attempts.
 *  11. Permanent Invariants: IS_ACTUATION_BLOCKED === true, OFFLINE_ISOLATED === true.
 *
 * ============================================================================
 */

import * as crypto from 'crypto';
import { performance } from 'perf_hooks';
import {
  IS_ACTUATION_BLOCKED,
  OFFLINE_ISOLATED,
} from '../intelligence/core/coreEngineContract';
import { ExternalModelGuard } from '../model/native_foundation/external_model_guard';
import { CUBIO_NATIVE_MODEL_ID } from '../model/native_foundation/native_model_types';
import { TOTAL_NATIVE_PARAMETERS } from '../core/nativeTrainingIntegration';

// ============================================================================
// CONSTANTS
// ============================================================================

export const IDENTITY_ENGINE_VERSION = '31.500.0';
export const IDENTITY_ENGINE_ID = 'CUBIO_DYNAMIC_SUBMOTHER_IDENTITY_ENGINE';

/** Maximum active identities per tenant */
export const MAX_IDENTITIES_PER_TENANT = 64;

/** Default identity time-to-live in milliseconds (3,000 ms) */
export const DEFAULT_IDENTITY_TTL_MS = 3000;

export type SubmotherIdentityState =
  | 'CREATED'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'EXPIRED'
  | 'TERMINATED';

// ============================================================================
// CONTRACTS
// ============================================================================

export interface IdentityDerivationContext {
  readonly tenantId: string;
  readonly parentTaskId: string;
  readonly domain: string;
  readonly contextPayload: string;
  readonly formulaId: string;
  readonly formulaParameters: Record<string, any>;
  readonly generationDepth: number;
  readonly customTtlMs?: number;
}

export interface SubmotherIdentityRecord {
  readonly identityId: string;
  readonly identityHash: string;
  readonly tenantId: string;
  readonly parentTaskId: string;
  readonly domain: string;
  readonly contextHash: string;
  readonly formulaId: string;
  readonly formulaParametersHash: string;
  readonly generationDepth: number;
  readonly createdAt: number;
  readonly expiresAt: number;
  readonly isolationToken: string;
  readonly motherCoreModelId: string;
  readonly motherCoreParameters: number;
  readonly independentWeightsCreated: false;
  state: SubmotherIdentityState;
  reuseCount: number;
  lastAccessedAt: number;
}

export interface IdentityAuditRecord {
  readonly auditId: string;
  readonly action: 'CREATE' | 'LOOKUP' | 'REUSE' | 'EXPIRE' | 'TERMINATE' | 'COLLISION_DETECTED' | 'UNAUTHORIZED_ATTEMPT';
  readonly identityId: string;
  readonly tenantId: string;
  readonly reason?: string;
  readonly auditHash: string;
  readonly timestamp: string;
}

// ============================================================================
// DYNAMIC SUBMOTHER IDENTITY ENGINE IMPLEMENTATION
// ============================================================================

export class Phase31DynamicSubmotherIdentityEngine {
  private static instance: Phase31DynamicSubmotherIdentityEngine | null = null;

  private readonly identities: Map<string, SubmotherIdentityRecord> = new Map();
  private readonly tenantIndex: Map<string, Set<string>> = new Map(); // tenantId -> Set<identityId>
  private readonly auditLedger: IdentityAuditRecord[] = [];

  private totalCreated = 0;
  private totalReused = 0;
  private totalExpired = 0;
  private totalTerminated = 0;
  private collisionsDetected = 0;
  private unauthorizedAttempts = 0;

  private constructor() {
    if (!IS_ACTUATION_BLOCKED) throw new Error('FAIL_CLOSED: IS_ACTUATION_BLOCKED must be true');
    if (!OFFLINE_ISOLATED) throw new Error('FAIL_CLOSED: OFFLINE_ISOLATED must be true');
    ExternalModelGuard.assertNativeOnly('CUBIO-P31-IDENTITY-ENGINE');
  }

  public static getInstance(): Phase31DynamicSubmotherIdentityEngine {
    if (!this.instance) {
      this.instance = new Phase31DynamicSubmotherIdentityEngine();
    }
    return this.instance;
  }

  public static resetInstance(): void {
    if (this.instance) {
      this.instance.clearAll();
    }
    this.instance = null;
  }

  /**
   * Computes the deterministic identity key and hash.
   */
  public computeDeterministicIdentityKey(ctx: IdentityDerivationContext): { identityId: string; identityHash: string; contextHash: string; paramsHash: string } {
    const contextHash = crypto.createHash('sha256').update(ctx.contextPayload || '').digest('hex');
    const sortedKeys = Object.keys(ctx.formulaParameters || {}).sort();
    const repr = sortedKeys.map(k => `${k}=${ctx.formulaParameters[k]}`).join('&');
    const paramsHash = crypto.createHash('sha256').update(repr).digest('hex');

    const seed = `${ctx.tenantId}::${ctx.parentTaskId}::${ctx.domain}::${contextHash}::${ctx.formulaId}::${paramsHash}::${ctx.generationDepth}`;
    const identityHash = crypto.createHash('sha256').update(seed).digest('hex');
    const identityId = `SMID_${ctx.domain}_${identityHash.slice(0, 16).toUpperCase()}_D${ctx.generationDepth}`;

    return { identityId, identityHash, contextHash, paramsHash };
  }

  /**
   * Derives, generates, or reuses a deterministic identity.
   */
  public deriveOrReuseIdentity(ctx: IdentityDerivationContext): { record: SubmotherIdentityRecord; isReused: boolean } {
    this.sweepExpiredIdentities();

    // ── GUARD 1: Input Validation ──
    if (!ctx.tenantId || typeof ctx.tenantId !== 'string' || ctx.tenantId.trim().length === 0) {
      throw new Error('FAIL_CLOSED: Missing or invalid tenantId');
    }
    if (!ctx.parentTaskId || typeof ctx.parentTaskId !== 'string' || ctx.parentTaskId.trim().length === 0) {
      throw new Error('FAIL_CLOSED: Missing or invalid parentTaskId');
    }
    if (!ctx.formulaId || typeof ctx.formulaId !== 'string') {
      throw new Error('FAIL_CLOSED: Missing or invalid formulaId');
    }

    // ── GUARD 2: Concurrency & Tenant Limits ──
    const tenantSet = this.tenantIndex.get(ctx.tenantId) ?? new Set();
    if (tenantSet.size >= MAX_IDENTITIES_PER_TENANT) {
      this.unauthorizedAttempts++;
      this.recordAudit('UNAUTHORIZED_ATTEMPT', 'UNKNOWN', ctx.tenantId, `TENANT_LIMIT_EXCEEDED: Exceeded max ${MAX_IDENTITIES_PER_TENANT} identities`);
      throw new Error(`[RESOURCE_EXHAUSTION] Tenant '${ctx.tenantId}' reached limit of ${MAX_IDENTITIES_PER_TENANT} active identities`);
    }

    const { identityId, identityHash, contextHash, paramsHash } = this.computeDeterministicIdentityKey(ctx);

    // ── CHECK EXISTING IDENTITIES FOR REUSE OR COLLISION ──
    const existing = this.identities.get(identityId);
    if (existing) {
      // Collision detection: Check if parameters or tenant differ
      if (existing.tenantId !== ctx.tenantId || existing.formulaParametersHash !== paramsHash) {
        this.collisionsDetected++;
        this.recordAudit('COLLISION_DETECTED', identityId, ctx.tenantId, 'IDENTITY_COLLISION: Hash matched but parameters differed');
        throw new Error(`[IDENTITY_COLLISION] Hash collision detected for identity '${identityId}'`);
      }

      // Check if active or reusable
      const now = performance.now();
      if (existing.state === 'ACTIVE' || existing.state === 'CREATED' || existing.state === 'COMPLETED') {
        existing.reuseCount++;
        existing.lastAccessedAt = now;
        existing.state = 'ACTIVE';
        this.totalReused++;
        this.recordAudit('REUSE', identityId, ctx.tenantId, `Identity reused (count: ${existing.reuseCount})`);
        return { record: existing, isReused: true };
      }
    }

    // ── CREATE NEW DETERMINISTIC IDENTITY ──
    const now = performance.now();
    const ttl = ctx.customTtlMs ?? DEFAULT_IDENTITY_TTL_MS;
    const isolationToken = crypto.randomBytes(16).toString('hex');

    const newRecord: SubmotherIdentityRecord = {
      identityId,
      identityHash,
      tenantId: ctx.tenantId,
      parentTaskId: ctx.parentTaskId,
      domain: ctx.domain,
      contextHash,
      formulaId: ctx.formulaId,
      formulaParametersHash: paramsHash,
      generationDepth: ctx.generationDepth,
      createdAt: now,
      expiresAt: now + ttl,
      isolationToken,
      motherCoreModelId: CUBIO_NATIVE_MODEL_ID,
      motherCoreParameters: TOTAL_NATIVE_PARAMETERS,
      independentWeightsCreated: false,
      state: 'ACTIVE',
      reuseCount: 0,
      lastAccessedAt: now,
    };

    this.identities.set(identityId, newRecord);
    if (!this.tenantIndex.has(ctx.tenantId)) {
      this.tenantIndex.set(ctx.tenantId, new Set());
    }
    this.tenantIndex.get(ctx.tenantId)!.add(identityId);

    this.totalCreated++;
    this.recordAudit('CREATE', identityId, ctx.tenantId, `Identity created for domain ${ctx.domain}`);
    return { record: newRecord, isReused: false };
  }

  /**
   * Looks up an existing identity with strict tenant isolation.
   */
  public lookupIdentity(identityId: string, tenantId: string): SubmotherIdentityRecord | undefined {
    this.sweepExpiredIdentities();

    const record = this.identities.get(identityId);
    if (!record) {
      return undefined;
    }

    // Tenant Isolation Check
    if (record.tenantId !== tenantId) {
      this.unauthorizedAttempts++;
      this.recordAudit('UNAUTHORIZED_ATTEMPT', identityId, tenantId, 'CROSS_TENANT_ACCESS_BLOCKED');
      return undefined; // Fail-closed: Never reveal cross-tenant identities
    }

    record.lastAccessedAt = performance.now();
    this.recordAudit('LOOKUP', identityId, tenantId, 'Identity lookup successful');
    return record;
  }

  /**
   * Explicitly terminates an identity.
   */
  public terminateIdentity(identityId: string, tenantId: string): boolean {
    const record = this.lookupIdentity(identityId, tenantId);
    if (!record) return false;

    record.state = 'TERMINATED';
    this.totalTerminated++;
    this.identities.delete(identityId);
    this.tenantIndex.get(tenantId)?.delete(identityId);

    this.recordAudit('TERMINATE', identityId, tenantId, 'Explicitly terminated');
    return true;
  }

  /**
   * Sweeps and transitions expired identities based on TTL.
   */
  public sweepExpiredIdentities(): number {
    const now = performance.now();
    let swept = 0;

    for (const [id, record] of this.identities) {
      if (record.state === 'ACTIVE' && now > record.expiresAt) {
        record.state = 'EXPIRED';
        this.identities.delete(id);
        this.tenantIndex.get(record.tenantId)?.delete(id);
        this.totalExpired++;
        swept++;
        this.recordAudit('EXPIRE', id, record.tenantId, `TTL expired (elapsed: ${Math.round(now - record.createdAt)}ms)`);
      }
    }

    return swept;
  }

  public clearAll(): void {
    this.identities.clear();
    this.tenantIndex.clear();
  }

  public getActiveCount(): number {
    return this.identities.size;
  }

  public getMetrics(): {
    totalCreated: number;
    totalReused: number;
    totalExpired: number;
    totalTerminated: number;
    collisionsDetected: number;
    unauthorizedAttempts: number;
    activeCount: number;
  } {
    return {
      totalCreated: this.totalCreated,
      totalReused: this.totalReused,
      totalExpired: this.totalExpired,
      totalTerminated: this.totalTerminated,
      collisionsDetected: this.collisionsDetected,
      unauthorizedAttempts: this.unauthorizedAttempts,
      activeCount: this.identities.size,
    };
  }

  public getAuditLedger(): readonly IdentityAuditRecord[] {
    return Object.freeze([...this.auditLedger]);
  }

  private recordAudit(
    action: IdentityAuditRecord['action'],
    identityId: string,
    tenantId: string,
    reason?: string
  ): void {
    const auditId = `ID_AUDIT_${this.auditLedger.length + 1}_${Date.now()}`;
    const hashSeed = `${auditId}|${action}|${identityId}|${tenantId}|${reason || ''}`;
    const auditHash = crypto.createHash('sha256').update(hashSeed).digest('hex');

    this.auditLedger.push({
      auditId,
      action,
      identityId,
      tenantId,
      reason,
      auditHash,
      timestamp: new Date().toISOString(),
    });
  }
}
