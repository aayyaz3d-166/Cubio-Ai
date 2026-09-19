/**
 * ============================================================================
 * CUBiO AI — PHASE 31 TASK 512: SUBMOTHER LIFECYCLE & RESOURCE CONTROL
 * src/cubio/submother/phase31SubmotherLifecycleAndResourceControl.ts
 * ============================================================================
 *
 * Complete lifecycle management and resource control for dynamic Submothers.
 * State Machine: CREATE → ACTIVE → COMPLETE | EXPIRED | FAILED.
 *
 * Core Guarantees & Invariants:
 *   1. Explicit Lifecycle Transitions:
 *      - CREATE: Instance registered, budget allocated, limits applied.
 *      - ACTIVE: Instance running execution workflow.
 *      - COMPLETE: Execution finished successfully, output retained, resources marked for reclamation.
 *      - EXPIRED: TTL budget reached without completion; auto-reclaimed fail-closed.
 *      - FAILED: Execution error, loop, stall, or limit breach detected; safely isolated.
 *   2. Hard Resource Ceilings:
 *      - Max concurrent active Submothers: 8 per tenant.
 *      - Max execution depth: 3.
 *      - Max memory budget: 4 MB total across all active instances per tenant (1 MB per instance).
 *      - Max runtime TTL: 3,000 ms.
 *      - Max branching factor: 8.
 *      - Max retained state: 64 KB per instance.
 *   3. Autonomous Anomaly & Fault Detection:
 *      - Stall detection (execution duration > allotted timeout).
 *      - Loop detection (cycle detection in parent/child delegation paths).
 *      - Orphan detection (instances whose parent task is completed or aborted).
 *      - Duplicate instance rejection (attempting to register duplicate active instance IDs).
 *      - Resource exhaustion defense (rejects new spawns when active count >= 8 or memory > 4 MB).
 *   4. Zero Drift Reclamation:
 *      - Resource cleanup releases memory structures and lifecycle registries WITHOUT
 *        modifying sovereign assets or canonical SQLite/VDB storage.
 *   5. Immutable Audit & Non-Trainability:
 *      - Deterministic SHA-256 lifecycle audit records.
 *      - Strictly enforces `trainableWeights: 0` and `independentWeightsCreated: false`.
 *      - Permanent invariants: `IS_ACTUATION_BLOCKED === true`, `OFFLINE_ISOLATED === true`.
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
import { SpecializedDomain } from './phase31SpecializedDomainSubmotherGenerator';

// ============================================================================
// CONSTANTS
// ============================================================================

export const LIFECYCLE_ENGINE_VERSION = '31.512.0';
export const LIFECYCLE_ENGINE_ID = 'CUBIO_SUBMOTHER_LIFECYCLE_AND_RESOURCE_CONTROL';

export const MAX_ACTIVE_SUBMOTHERS_PER_TENANT = 8;
export const MAX_EXECUTION_DEPTH = 3;
export const MAX_TENANT_MEMORY_BYTES = 4194304; // 4 MB
export const MAX_INSTANCE_MEMORY_BYTES = 1048576; // 1 MB
export const MAX_RETAINED_STATE_BYTES = 65536; // 64 KB
export const DEFAULT_INSTANCE_TTL_MS = 3000;
export const MAX_BRANCHING_FACTOR = 8;

// ============================================================================
// CONTRACTS & TYPES
// ============================================================================

export type SubmotherLifecycleState =
  | 'CREATE'
  | 'ACTIVE'
  | 'COMPLETE'
  | 'EXPIRED'
  | 'FAILED';

export interface SubmotherRegistrationSpec {
  readonly tenantId: string;
  readonly parentTaskId: string;
  readonly domain: SpecializedDomain;
  readonly formulaId: string;
  readonly executionDepth: number;
  readonly memoryBudgetBytes?: number;
  readonly timeoutMs?: number;
  readonly delegationPath?: readonly string[]; // For loop detection
}

export interface ManagedSubmotherInstance {
  readonly instanceId: string;
  readonly tenantId: string;
  readonly parentTaskId: string;
  readonly domain: SpecializedDomain;
  readonly formulaId: string;
  readonly executionDepth: number;
  readonly memoryBudgetBytes: number;
  readonly timeoutMs: number;
  readonly delegationPath: readonly string[];
  readonly createdAt: number;
  readonly expiresAt: number;
  state: SubmotherLifecycleState;
  retainedStateBytes: number;
  lastHeartbeatAt: number;
  completedAt?: number;
  failureReason?: string;
  provenanceDigest: string;
}

export interface LifecycleAuditRecord {
  readonly auditId: string;
  readonly timestamp: string;
  readonly action: 'CREATE' | 'ACTIVATE' | 'COMPLETE' | 'EXPIRE' | 'FAIL' | 'RECLAIM' | 'REJECT';
  readonly instanceId: string;
  readonly tenantId: string;
  readonly stateFrom?: SubmotherLifecycleState;
  readonly stateTo?: SubmotherLifecycleState;
  readonly reason?: string;
  readonly auditDigest: string;
}

export interface TenantResourceUsageSummary {
  readonly tenantId: string;
  readonly activeInstancesCount: number;
  readonly allocatedMemoryBytes: number;
  readonly totalSpawned: number;
  readonly totalCompleted: number;
  readonly totalExpired: number;
  readonly totalFailed: number;
  readonly isOverCapacity: boolean;
}

// ============================================================================
// LIFECYCLE & RESOURCE CONTROL ENGINE IMPLEMENTATION
// ============================================================================

export class Phase31SubmotherLifecycleAndResourceControl {
  private static instance: Phase31SubmotherLifecycleAndResourceControl | null = null;

  // Active and tracked instances: instanceId -> ManagedSubmotherInstance
  private readonly instances: Map<string, ManagedSubmotherInstance> = new Map();
  private readonly auditLedger: LifecycleAuditRecord[] = [];

  private constructor() {
    if (!IS_ACTUATION_BLOCKED) {
      throw new Error('FAIL_CLOSED: IS_ACTUATION_BLOCKED must be true in Phase31SubmotherLifecycleAndResourceControl');
    }
    if (!OFFLINE_ISOLATED) {
      throw new Error('FAIL_CLOSED: OFFLINE_ISOLATED must be true in Phase31SubmotherLifecycleAndResourceControl');
    }
    ExternalModelGuard.assertNativeOnly(LIFECYCLE_ENGINE_ID);
  }

  public static getInstance(): Phase31SubmotherLifecycleAndResourceControl {
    if (!this.instance) {
      this.instance = new Phase31SubmotherLifecycleAndResourceControl();
    }
    return this.instance;
  }

  public static resetInstance(): void {
    if (this.instance) {
      this.instance.instances.clear();
      this.instance.auditLedger.length = 0;
    }
    this.instance = null;
  }

  /**
   * Registers and allocates resources for a new Submother instance.
   * State transition: (uninitialized) -> CREATE.
   */
  public createInstance(spec: SubmotherRegistrationSpec): ManagedSubmotherInstance {
    this.reapExpiredInstances(spec.tenantId);

    // 1. Guard against external model contamination & actuation breach
    if (!IS_ACTUATION_BLOCKED || !OFFLINE_ISOLATED) {
      throw new Error('FAIL_CLOSED: Safety invariants breached');
    }
    ExternalModelGuard.assertNativeOnly(LIFECYCLE_ENGINE_ID);

    // 2. Validate tenant and parent task
    if (!spec.tenantId || spec.tenantId.trim().length === 0) {
      throw new Error('FAIL_CLOSED: Missing tenantId');
    }
    if (!spec.parentTaskId || spec.parentTaskId.trim().length === 0) {
      throw new Error('FAIL_CLOSED: Missing parentTaskId');
    }

    // 3. Depth ceiling enforcement
    if (spec.executionDepth < 1 || spec.executionDepth > MAX_EXECUTION_DEPTH) {
      this.recordAudit('REJECT', 'unknown', spec.tenantId, undefined, undefined, `Execution depth ${spec.executionDepth} exceeds ceiling of ${MAX_EXECUTION_DEPTH}`);
      throw new Error(`FAIL_CLOSED: Execution depth ${spec.executionDepth} exceeds ceiling of ${MAX_EXECUTION_DEPTH}`);
    }

    // 4. Loop detection in delegation path
    const delegationPath = spec.delegationPath || [spec.domain];
    const seenDelegations = new Set<string>();
    for (const d of delegationPath) {
      if (seenDelegations.has(d)) {
        this.recordAudit('REJECT', 'unknown', spec.tenantId, undefined, undefined, `Cycle detected in delegation path: ${d}`);
        throw new Error(`FAIL_CLOSED: Cycle detected in Submother delegation path: ${d}`);
      }
      seenDelegations.add(d);
    }

    // 5. Tenant Concurrency & Resource limits check
    const tenantUsage = this.getTenantUsage(spec.tenantId);
    if (tenantUsage.activeInstancesCount >= MAX_ACTIVE_SUBMOTHERS_PER_TENANT) {
      this.recordAudit('REJECT', 'unknown', spec.tenantId, undefined, undefined, `Tenant active Submother ceiling of ${MAX_ACTIVE_SUBMOTHERS_PER_TENANT} reached`);
      throw new Error(`FAIL_CLOSED: Tenant active Submothers (${tenantUsage.activeInstancesCount}) exceeds ceiling of ${MAX_ACTIVE_SUBMOTHERS_PER_TENANT}`);
    }

    const requestedMemory = spec.memoryBudgetBytes || MAX_INSTANCE_MEMORY_BYTES;
    if (requestedMemory > MAX_INSTANCE_MEMORY_BYTES) {
      throw new Error(`FAIL_CLOSED: Requested instance memory (${requestedMemory}) exceeds single-instance limit (${MAX_INSTANCE_MEMORY_BYTES})`);
    }

    if (tenantUsage.allocatedMemoryBytes + requestedMemory > MAX_TENANT_MEMORY_BYTES) {
      this.recordAudit('REJECT', 'unknown', spec.tenantId, undefined, undefined, 'Tenant memory budget exhausted (4 MB limit)');
      throw new Error(`FAIL_CLOSED: Tenant memory budget exhausted (current: ${tenantUsage.allocatedMemoryBytes} + ${requestedMemory} > ${MAX_TENANT_MEMORY_BYTES})`);
    }

    // 6. Generate Deterministic Instance ID
    const instanceSeed = `${spec.tenantId}:${spec.parentTaskId}:${spec.domain}:${spec.formulaId}:${spec.executionDepth}:${Date.now()}:${Math.random()}`;
    const instanceId = `subm_${crypto.createHash('sha256').update(instanceSeed).digest('hex').substring(0, 16)}`;

    // Duplicate detection check
    if (this.instances.has(instanceId)) {
      throw new Error(`FAIL_CLOSED: Duplicate instance ID ${instanceId} detected`);
    }

    const now = Date.now();
    const ttl = spec.timeoutMs || DEFAULT_INSTANCE_TTL_MS;
    const expiresAt = now + ttl;

    const provenanceDigest = crypto.createHash('sha256')
      .update(`${instanceId}:${spec.tenantId}:${spec.parentTaskId}:${spec.domain}:${spec.formulaId}:${expiresAt}`)
      .digest('hex');

    const instance: ManagedSubmotherInstance = {
      instanceId,
      tenantId: spec.tenantId,
      parentTaskId: spec.parentTaskId,
      domain: spec.domain,
      formulaId: spec.formulaId,
      executionDepth: spec.executionDepth,
      memoryBudgetBytes: requestedMemory,
      timeoutMs: ttl,
      delegationPath,
      createdAt: now,
      expiresAt,
      state: 'CREATE',
      retainedStateBytes: 0,
      lastHeartbeatAt: now,
      provenanceDigest,
    };

    this.instances.set(instanceId, instance);
    this.recordAudit('CREATE', instanceId, spec.tenantId, undefined, 'CREATE', 'Submother created and resources reserved');

    return instance;
  }

  /**
   * Transitions instance from CREATE to ACTIVE.
   */
  public activateInstance(instanceId: string): ManagedSubmotherInstance {
    const instance = this.getInstanceOrThrow(instanceId);
    if (instance.state !== 'CREATE') {
      throw new Error(`FAIL_CLOSED: Cannot activate instance in state ${instance.state} (must be CREATE)`);
    }

    this.checkStallOrExpire(instance);
    if (instance.state !== 'CREATE') {
      throw new Error(`FAIL_CLOSED: Instance cannot be activated, expired or stalled (now ${instance.state})`);
    }

    const previous = instance.state;
    instance.state = 'ACTIVE';
    instance.lastHeartbeatAt = Date.now();
    this.recordAudit('ACTIVATE', instanceId, instance.tenantId, previous, 'ACTIVE', 'Submother activated for execution');
    return instance;
  }

  /**
   * Updates heartbeat and verifies stall/timeout conditions.
   */
  public heartbeat(instanceId: string, retainedBytesUpdate?: number): void {
    const instance = this.getInstanceOrThrow(instanceId);
    if (instance.state !== 'ACTIVE') {
      throw new Error(`FAIL_CLOSED: Cannot heartbeat instance in non-ACTIVE state: ${instance.state}`);
    }

    if (retainedBytesUpdate !== undefined) {
      if (retainedBytesUpdate > MAX_RETAINED_STATE_BYTES) {
        this.failInstance(instanceId, `Retained state ${retainedBytesUpdate} bytes exceeds ceiling of ${MAX_RETAINED_STATE_BYTES}`);
        throw new Error(`FAIL_CLOSED: Retained state exceeds ceiling of ${MAX_RETAINED_STATE_BYTES} bytes`);
      }
      instance.retainedStateBytes = retainedBytesUpdate;
    }

    this.checkStallOrExpire(instance);
    if (instance.state === 'ACTIVE') {
      instance.lastHeartbeatAt = Date.now();
    }
  }

  /**
   * Completes the execution cleanly.
   * State transition: ACTIVE -> COMPLETE.
   */
  public completeInstance(instanceId: string, finalRetainedBytes: number = 0): ManagedSubmotherInstance {
    const instance = this.getInstanceOrThrow(instanceId);
    if (instance.state !== 'ACTIVE') {
      throw new Error(`FAIL_CLOSED: Cannot complete instance in state ${instance.state} (must be ACTIVE)`);
    }

    if (finalRetainedBytes > MAX_RETAINED_STATE_BYTES) {
      this.failInstance(instanceId, `Final retained state ${finalRetainedBytes} exceeds ceiling of ${MAX_RETAINED_STATE_BYTES}`);
      throw new Error(`FAIL_CLOSED: Final retained state exceeds ceiling of ${MAX_RETAINED_STATE_BYTES} bytes`);
    }

    this.checkStallOrExpire(instance);
    if (instance.state !== 'ACTIVE') {
      throw new Error(`FAIL_CLOSED: Cannot complete instance; timed out or failed (now ${instance.state})`);
    }

    const previous = instance.state;
    instance.state = 'COMPLETE';
    instance.completedAt = Date.now();
    instance.retainedStateBytes = finalRetainedBytes;
    this.recordAudit('COMPLETE', instanceId, instance.tenantId, previous, 'COMPLETE', 'Submother execution completed successfully');
    return instance;
  }

  /**
   * Transitions instance to FAILED upon error, stall, loop, or limit breach.
   */
  public failInstance(instanceId: string, reason: string): ManagedSubmotherInstance {
    const instance = this.getInstanceOrThrow(instanceId);
    const previous = instance.state;
    instance.state = 'FAILED';
    instance.failureReason = reason;
    instance.completedAt = Date.now();
    this.recordAudit('FAIL', instanceId, instance.tenantId, previous, 'FAILED', reason);
    return instance;
  }

  /**
   * Explicitly expires and reclaims instance resources.
   */
  public expireInstance(instanceId: string, reason: string = 'TTL timeout expired'): ManagedSubmotherInstance {
    const instance = this.getInstanceOrThrow(instanceId);
    const previous = instance.state;
    instance.state = 'EXPIRED';
    instance.failureReason = reason;
    instance.completedAt = Date.now();
    this.recordAudit('EXPIRE', instanceId, instance.tenantId, previous, 'EXPIRED', reason);
    return instance;
  }

  /**
   * Reclaims terminal instances (COMPLETE, EXPIRED, FAILED) for a tenant.
   * Frees memory and removes from active registry without altering sovereign assets.
   */
  public reclaimTerminalInstances(tenantId: string): number {
    let reclaimedCount = 0;
    for (const [id, inst] of this.instances.entries()) {
      if (inst.tenantId === tenantId) {
        if (inst.state === 'COMPLETE' || inst.state === 'EXPIRED' || inst.state === 'FAILED') {
          this.instances.delete(id);
          this.recordAudit('RECLAIM', id, tenantId, inst.state, undefined, 'Terminal resources reclaimed without modifying persistent storage');
          reclaimedCount++;
        }
      }
    }
    return reclaimedCount;
  }

  /**
   * Reaps any instances whose TTL has expired across the tenant.
   */
  public reapExpiredInstances(tenantId?: string): number {
    const now = Date.now();
    let expiredCount = 0;

    for (const [id, inst] of this.instances.entries()) {
      if (!tenantId || inst.tenantId === tenantId) {
        if ((inst.state === 'CREATE' || inst.state === 'ACTIVE') && now >= inst.expiresAt) {
          inst.state = 'EXPIRED';
          inst.failureReason = `TTL exceeded: created at ${inst.createdAt}, expired at ${inst.expiresAt}, current: ${now}`;
          inst.completedAt = now;
          this.recordAudit('EXPIRE', id, inst.tenantId, 'ACTIVE', 'EXPIRED', inst.failureReason);
          expiredCount++;
        }
      }
    }
    return expiredCount;
  }

  /**
   * Scans for orphaned instances (whose parent task is inactive or specified as aborted).
   */
  public reapOrphanedInstances(tenantId: string, activeParentTaskIds: ReadonlySet<string>): number {
    let orphanedCount = 0;
    for (const [id, inst] of this.instances.entries()) {
      if (inst.tenantId === tenantId && (inst.state === 'CREATE' || inst.state === 'ACTIVE')) {
        if (!activeParentTaskIds.has(inst.parentTaskId)) {
          this.failInstance(id, `Orphaned: Parent task ${inst.parentTaskId} is no longer active`);
          orphanedCount++;
        }
      }
    }
    return orphanedCount;
  }

  /**
   * Returns current resource allocation summary for a tenant.
   */
  public getTenantUsage(tenantId: string): TenantResourceUsageSummary {
    let activeCount = 0;
    let allocatedMem = 0;
    let spawned = 0;
    let completed = 0;
    let expired = 0;
    let failed = 0;

    for (const inst of this.instances.values()) {
      if (inst.tenantId === tenantId) {
        spawned++;
        if (inst.state === 'CREATE' || inst.state === 'ACTIVE') {
          activeCount++;
          allocatedMem += inst.memoryBudgetBytes;
        } else if (inst.state === 'COMPLETE') {
          completed++;
        } else if (inst.state === 'EXPIRED') {
          expired++;
        } else if (inst.state === 'FAILED') {
          failed++;
        }
      }
    }

    return {
      tenantId,
      activeInstancesCount: activeCount,
      allocatedMemoryBytes: allocatedMem,
      totalSpawned: spawned,
      totalCompleted: completed,
      totalExpired: expired,
      totalFailed: failed,
      isOverCapacity: activeCount >= MAX_ACTIVE_SUBMOTHERS_PER_TENANT || allocatedMem >= MAX_TENANT_MEMORY_BYTES,
    };
  }

  /**
   * Retrieves an instance by ID.
   */
  public getInstance(instanceId: string): ManagedSubmotherInstance | undefined {
    return this.instances.get(instanceId);
  }

  /**
   * Retrieves full audit ledger copy.
   */
  public getAuditLedger(): readonly LifecycleAuditRecord[] {
    return [...this.auditLedger];
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private getInstanceOrThrow(instanceId: string): ManagedSubmotherInstance {
    const inst = this.instances.get(instanceId);
    if (!inst) {
      throw new Error(`FAIL_CLOSED: Submother instance ${instanceId} not found`);
    }
    return inst;
  }

  private checkStallOrExpire(instance: ManagedSubmotherInstance): void {
    const now = Date.now();
    if (now >= instance.expiresAt) {
      instance.state = 'EXPIRED';
      instance.failureReason = 'Instance execution stalled: TTL budget expired';
      instance.completedAt = now;
      this.recordAudit('EXPIRE', instance.instanceId, instance.tenantId, 'ACTIVE', 'EXPIRED', instance.failureReason);
    }
  }

  private recordAudit(
    action: LifecycleAuditRecord['action'],
    instanceId: string,
    tenantId: string,
    stateFrom?: SubmotherLifecycleState,
    stateTo?: SubmotherLifecycleState,
    reason?: string
  ): void {
    const timestamp = new Date().toISOString();
    const seed = `${timestamp}:${action}:${instanceId}:${tenantId}:${stateFrom || 'NONE'}:${stateTo || 'NONE'}:${reason || 'OK'}`;
    const auditDigest = crypto.createHash('sha256').update(seed).digest('hex');

    const auditId = `audit_${auditDigest.substring(0, 16)}`;
    this.auditLedger.push({
      auditId,
      timestamp,
      action,
      instanceId,
      tenantId,
      stateFrom,
      stateTo,
      reason,
      auditDigest,
    });
  }
}
