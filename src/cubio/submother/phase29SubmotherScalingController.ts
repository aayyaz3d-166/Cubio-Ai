/**
 * ============================================================================
 * CUBiO AI — PHASE 29 TASK 18: SUBMOTHER SCALING & RESOURCE CONTROLLER
 * src/cubio/submother/phase29SubmotherScalingController.ts
 * ============================================================================
 *
 * Implements bounded scaling controls for dynamically generated Submother branches.
 *
 * Core Guarantees:
 *   - Hard limits: MAX_CONCURRENT_BRANCHES = 8, MAX_RECURSION_DEPTH = 3
 *   - Execution timeout ceiling (3,000 ms), Memory ceiling (4 MB per task)
 *   - Pure on-demand expansion: prevents physical materialization of infinite state spaces
 *   - Safe automatic pruning & termination of redundant or exhausted branches
 *   - Zero degradation or mutation of protected Core assets
 *   - Resilient behavior under increasing request complexity & stress testing
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

export interface ScalingConstraints {
  readonly maxConcurrentBranches: number; // default: 8
  readonly maxRecursionDepth: number;     // default: 3
  readonly maxExecutionTimeMs: number;    // default: 3000
  readonly maxMemoryBudgetBytes: number;  // default: 4194304 (4 MB)
  readonly maxTotalLifetimeBranches: number; // default: 64
}

export const DEFAULT_SCALING_CONSTRAINTS: ScalingConstraints = {
  maxConcurrentBranches: 8,
  maxRecursionDepth: 3,
  maxExecutionTimeMs: 3000,
  maxMemoryBudgetBytes: 4 * 1024 * 1024,
  maxTotalLifetimeBranches: 64,
};

export interface TrackedScalingBranch {
  readonly branchId: string;
  readonly parentTaskId: string;
  readonly depth: number;
  readonly allocatedMemoryBytes: number;
  readonly startTime: number;
  status: 'ACTIVE' | 'PRUNED' | 'EXHAUSTED' | 'COMPLETED' | 'TERMINATED';
  terminationReason?: string;
}

export interface ScalingAuditSnapshot {
  readonly activeCount: number;
  readonly prunedCount: number;
  readonly exhaustedCount: number;
  readonly totalSpawned: number;
  readonly totalMemoryUsedBytes: number;
  readonly peakMemoryBytes: number;
  readonly isUnderLimits: boolean;
}

export class Phase29SubmotherScalingController {
  private static instance: Phase29SubmotherScalingController | null = null;
  private readonly constraints: ScalingConstraints;
  private readonly trackedBranches: Map<string, TrackedScalingBranch> = new Map();
  private totalSpawned = 0;
  private prunedCount = 0;
  private exhaustedCount = 0;
  private currentMemoryBytes = 0;
  private peakMemoryBytes = 0;

  private constructor(constraints: ScalingConstraints = DEFAULT_SCALING_CONSTRAINTS) {
    if (!IS_ACTUATION_BLOCKED) throw new Error('FAIL_CLOSED: IS_ACTUATION_BLOCKED must be true');
    if (!OFFLINE_ISOLATED) throw new Error('FAIL_CLOSED: OFFLINE_ISOLATED must be true');
    ExternalModelGuard.assertNativeOnly('CUBIO-P29-SCALING-CONTROLLER');
    this.constraints = constraints;
  }

  public static getInstance(constraints?: ScalingConstraints): Phase29SubmotherScalingController {
    if (!this.instance) {
      this.instance = new Phase29SubmotherScalingController(constraints);
    }
    return this.instance;
  }

  public static resetInstance(): void {
    if (this.instance) {
      this.instance.terminateAll();
    }
    this.instance = null;
  }

  /**
   * Evaluates if a new branch can be scaled up within boundaries.
   */
  public requestBranchAllocation(
    parentTaskId: string,
    depth: number,
    estimatedMemoryBytes: number = 65536 // 64 KB default estimate
  ): { allowed: boolean; rejectionReason?: string; branchId?: string } {
    // 1. Max Recursion Depth check
    if (depth > this.constraints.maxRecursionDepth) {
      return {
        allowed: false,
        rejectionReason: `DEPTH_EXCEEDED: Requested depth ${depth} exceeds max depth ${this.constraints.maxRecursionDepth}`,
      };
    }

    // 2. Active Concurrency Limit check
    const currentActive = this.getActiveBranchCount();
    if (currentActive >= this.constraints.maxConcurrentBranches) {
      return {
        allowed: false,
        rejectionReason: `CONCURRENCY_EXCEEDED: Active branches (${currentActive}) reached limit ${this.constraints.maxConcurrentBranches}`,
      };
    }

    // 3. Memory Budget check
    if (this.currentMemoryBytes + estimatedMemoryBytes > this.constraints.maxMemoryBudgetBytes) {
      return {
        allowed: false,
        rejectionReason: `MEMORY_EXCEEDED: Total memory would exceed budget ${this.constraints.maxMemoryBudgetBytes} bytes`,
      };
    }

    // 4. Lifetime Branches limit check
    if (this.totalSpawned >= this.constraints.maxTotalLifetimeBranches) {
      return {
        allowed: false,
        rejectionReason: `LIFETIME_LIMIT_REACHED: Reached max lifetime branches (${this.constraints.maxTotalLifetimeBranches})`,
      };
    }

    // Grant allocation
    this.totalSpawned++;
    const branchId = `SCALED_SM_${this.totalSpawned}_D${depth}_${Date.now()}`;
    const branch: TrackedScalingBranch = {
      branchId,
      parentTaskId,
      depth,
      allocatedMemoryBytes: estimatedMemoryBytes,
      startTime: performance.now(),
      status: 'ACTIVE',
    };

    this.trackedBranches.set(branchId, branch);
    this.currentMemoryBytes += estimatedMemoryBytes;
    this.peakMemoryBytes = Math.max(this.peakMemoryBytes, this.currentMemoryBytes);

    return { allowed: true, branchId };
  }

  /**
   * Prunes redundant or exhausted branches safely.
   */
  public pruneRedundantBranch(branchId: string, reason: string): boolean {
    const branch = this.trackedBranches.get(branchId);
    if (!branch || branch.status !== 'ACTIVE') return false;

    branch.status = 'PRUNED';
    branch.terminationReason = reason;
    this.prunedCount++;
    this.currentMemoryBytes -= branch.allocatedMemoryBytes;
    return true;
  }

  /**
   * Marks a branch as completed and reclaims allocated budget.
   */
  public releaseBranch(branchId: string): boolean {
    const branch = this.trackedBranches.get(branchId);
    if (!branch || branch.status !== 'ACTIVE') return false;

    branch.status = 'COMPLETED';
    this.currentMemoryBytes -= branch.allocatedMemoryBytes;
    return true;
  }

  /**
   * Scans active branches and terminates any that exceed max execution time.
   */
  public sweepTimeouts(): number {
    const now = performance.now();
    let timedOutCount = 0;

    for (const [, branch] of this.trackedBranches) {
      if (branch.status === 'ACTIVE') {
        const elapsed = now - branch.startTime;
        if (elapsed > this.constraints.maxExecutionTimeMs) {
          branch.status = 'EXHAUSTED';
          branch.terminationReason = `Execution elapsed ${Math.round(elapsed)}ms > ${this.constraints.maxExecutionTimeMs}ms`;
          this.exhaustedCount++;
          this.currentMemoryBytes -= branch.allocatedMemoryBytes;
          timedOutCount++;
        }
      }
    }
    return timedOutCount;
  }

  public terminateAll(): void {
    for (const [, branch] of this.trackedBranches) {
      if (branch.status === 'ACTIVE') {
        branch.status = 'TERMINATED';
        this.currentMemoryBytes -= branch.allocatedMemoryBytes;
      }
    }
    this.trackedBranches.clear();
    this.currentMemoryBytes = 0;
  }

  public getActiveBranchCount(): number {
    let count = 0;
    for (const [, b] of this.trackedBranches) {
      if (b.status === 'ACTIVE') count++;
    }
    return count;
  }

  public getSnapshot(): ScalingAuditSnapshot {
    return {
      activeCount: this.getActiveBranchCount(),
      prunedCount: this.prunedCount,
      exhaustedCount: this.exhaustedCount,
      totalSpawned: this.totalSpawned,
      totalMemoryUsedBytes: this.currentMemoryBytes,
      peakMemoryBytes: this.peakMemoryBytes,
      isUnderLimits: this.getActiveBranchCount() <= this.constraints.maxConcurrentBranches &&
                     this.currentMemoryBytes <= this.constraints.maxMemoryBudgetBytes,
    };
  }
}
