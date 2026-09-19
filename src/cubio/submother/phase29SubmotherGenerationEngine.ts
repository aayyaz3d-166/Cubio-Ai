/**
 * ============================================================================
 * CUBiO AI — PHASE 29 TASK 4: FORMULAIC SUBMOTHER GENERATION ENGINE
 * src/cubio/submother/phase29SubmotherGenerationEngine.ts
 * ============================================================================
 *
 * Generates Submother computational branches from Mother Core formulas/rules.
 *
 * CRITICAL DISTINCTION:
 *   Submothers are COMPUTATIONAL BRANCHES — NOT independently trained models.
 *   They derive from Mother Core formulas, execute bounded scoped work,
 *   delegate all intelligence back to Mother Core, and are terminated+cleaned
 *   after their task completes.
 *
 * Submothers CANNOT:
 *   - Train their own weights
 *   - Serve independent inference
 *   - Claim intelligence authority
 *   - Recursively spawn beyond MAX_GENERATION_DEPTH
 *   - Exceed resource budgets
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

// ============================================================================
// CONSTANTS & HARD CAPS
// ============================================================================

export const SUBMOTHER_ENGINE_VERSION = '29.4.0';
export const SUBMOTHER_ENGINE_ID = 'CUBIO_FORMULAIC_SUBMOTHER_GENERATION_ENGINE';

/** Maximum concurrent live Submothers at any time */
export const MAX_CONCURRENT_SUBMOTHERS = 8;

/** Maximum recursion depth (Submothers spawning Submothers) */
export const MAX_GENERATION_DEPTH = 3;

/** Maximum total Submothers spawned per parent task */
export const MAX_TOTAL_SPAWNED_PER_TASK = 16;

/** Default execution timeout per Submother (ms) */
export const DEFAULT_EXECUTION_TIMEOUT_MS = 3000;

/** Default memory budget per Submother (bytes) */
export const DEFAULT_MEMORY_BUDGET_BYTES = 1_048_576; // 1 MB

/** Default max output tokens */
export const DEFAULT_MAX_OUTPUT_TOKENS = 4096;

// ============================================================================
// TYPES & CONTRACTS
// ============================================================================

export type SubmotherFormulaType =
  | 'SPATIAL_PROJECTION'
  | 'EXPANSION_RULE'
  | 'DOMAIN_DELEGATION'
  | 'PHI_TRANSFORM';

export type SubmotherLifecycleState =
  | 'PENDING'
  | 'SPAWNED'
  | 'EXECUTING'
  | 'COMPLETED'
  | 'FAILED'
  | 'TIMED_OUT'
  | 'TERMINATED'
  | 'CLEANED';

export interface SubmotherIdentity {
  readonly submotherId: string;
  readonly identityHash: string;
  readonly parentTaskId: string;
  readonly formulaType: SubmotherFormulaType;
  readonly generationIndex: number;
  readonly generationDepth: number;
  readonly createdAt: string;
}

export interface SubmotherExecutionContext {
  readonly maxExecutionMs: number;
  readonly maxMemoryBytes: number;
  readonly maxOutputTokens: number;
  readonly parentTaskId: string;
  readonly formulaType: SubmotherFormulaType;
  readonly formulaParameters: Record<string, number | string>;
  readonly delegatesToMotherCore: true; // Always true — never independent
}

export interface SubmotherExecutionResult {
  readonly submotherId: string;
  readonly status: 'SUCCESS' | 'FAILED' | 'TIMED_OUT';
  readonly output: string;
  readonly executionMs: number;
  readonly memoryUsedBytes: number;
  readonly delegatedToMotherCore: boolean;
  readonly timestamp: string;
}

export interface SubmotherInstance {
  identity: SubmotherIdentity;
  context: SubmotherExecutionContext;
  lifecycleState: SubmotherLifecycleState;
  result?: SubmotherExecutionResult;
  spawnedAt: number;
  terminatedAt?: number;
  cleanedAt?: number;
}

export interface SubmotherGenerationRequest {
  readonly parentTaskId: string;
  readonly formulaType: SubmotherFormulaType;
  readonly formulaParameters: Record<string, number | string>;
  readonly generationDepth?: number;
  readonly customTimeoutMs?: number;
  readonly customMemoryBytes?: number;
}

export interface SubmotherAuditRecord {
  readonly auditId: string;
  readonly submotherId: string;
  readonly action: 'SPAWNED' | 'EXECUTED' | 'TERMINATED' | 'CLEANED' | 'REJECTED';
  readonly reason?: string;
  readonly auditHash: string;
  readonly timestamp: string;
}

// ============================================================================
// FORMULAIC SUBMOTHER GENERATION ENGINE
// ============================================================================

export class Phase29SubmotherGenerationEngine {
  private static instance: Phase29SubmotherGenerationEngine | null = null;

  private readonly liveSubmothers: Map<string, SubmotherInstance> = new Map();
  private readonly taskSpawnCounts: Map<string, number> = new Map();
  private readonly auditLedger: SubmotherAuditRecord[] = [];
  private totalSpawned = 0;

  private constructor() {
    if (!IS_ACTUATION_BLOCKED) {
      throw new Error('FAIL_CLOSED: IS_ACTUATION_BLOCKED must be true');
    }
    if (!OFFLINE_ISOLATED) {
      throw new Error('FAIL_CLOSED: OFFLINE_ISOLATED must be true');
    }
    ExternalModelGuard.assertNativeOnly('CUBIO-P29-SUBMOTHER-ENGINE');
  }

  public static getInstance(): Phase29SubmotherGenerationEngine {
    if (!this.instance) {
      this.instance = new Phase29SubmotherGenerationEngine();
    }
    return this.instance;
  }

  public static resetInstance(): void {
    if (this.instance) {
      // Cleanup all live submothers before reset
      for (const [id] of this.instance.liveSubmothers) {
        this.instance.terminateSubmother(id);
        this.instance.cleanupSubmother(id);
      }
    }
    this.instance = null;
  }

  // ==========================================================================
  // SPAWN — Generate a Submother from Mother Core formula
  // ==========================================================================

  public spawnSubmother(request: SubmotherGenerationRequest): SubmotherInstance {
    const depth = request.generationDepth ?? 0;

    // GUARD 1: Concurrent limit
    const liveCount = this.getLiveConcurrentCount();
    if (liveCount >= MAX_CONCURRENT_SUBMOTHERS) {
      this.recordAudit('REJECTED_CONCURRENT', 'REJECTED', `Concurrent limit reached: ${liveCount}/${MAX_CONCURRENT_SUBMOTHERS}`);
      throw new Error(
        `[RESOURCE_EXHAUSTION] Cannot spawn Submother: concurrent limit reached (${liveCount}/${MAX_CONCURRENT_SUBMOTHERS}).`
      );
    }

    // GUARD 2: Recursion depth
    if (depth >= MAX_GENERATION_DEPTH) {
      this.recordAudit('REJECTED_DEPTH', 'REJECTED', `Depth limit reached: ${depth}/${MAX_GENERATION_DEPTH}`);
      throw new Error(
        `[RECURSION_LIMIT] Cannot spawn Submother: generation depth ${depth} exceeds max ${MAX_GENERATION_DEPTH}.`
      );
    }

    // GUARD 3: Per-task spawn count
    const taskCount = this.taskSpawnCounts.get(request.parentTaskId) ?? 0;
    if (taskCount >= MAX_TOTAL_SPAWNED_PER_TASK) {
      this.recordAudit('REJECTED_TASK_LIMIT', 'REJECTED', `Task ${request.parentTaskId} limit reached: ${taskCount}/${MAX_TOTAL_SPAWNED_PER_TASK}`);
      throw new Error(
        `[TASK_EXHAUSTION] Cannot spawn Submother for task '${request.parentTaskId}': per-task limit reached (${taskCount}/${MAX_TOTAL_SPAWNED_PER_TASK}).`
      );
    }

    // Generate deterministic identity
    this.totalSpawned++;
    const genIndex = this.totalSpawned;
    const identitySeed = `${request.parentTaskId}:${request.formulaType}:${genIndex}:${depth}:${SUBMOTHER_ENGINE_VERSION}`;
    const identityHash = crypto.createHash('sha256').update(identitySeed).digest('hex');
    const submotherId = `SM_${request.formulaType}_${genIndex}_D${depth}`;

    const identity: SubmotherIdentity = {
      submotherId,
      identityHash,
      parentTaskId: request.parentTaskId,
      formulaType: request.formulaType,
      generationIndex: genIndex,
      generationDepth: depth,
      createdAt: new Date().toISOString(),
    };

    const context: SubmotherExecutionContext = {
      maxExecutionMs: request.customTimeoutMs ?? DEFAULT_EXECUTION_TIMEOUT_MS,
      maxMemoryBytes: request.customMemoryBytes ?? DEFAULT_MEMORY_BUDGET_BYTES,
      maxOutputTokens: DEFAULT_MAX_OUTPUT_TOKENS,
      parentTaskId: request.parentTaskId,
      formulaType: request.formulaType,
      formulaParameters: { ...request.formulaParameters },
      delegatesToMotherCore: true, // ALWAYS — never independent
    };

    const instance: SubmotherInstance = {
      identity,
      context,
      lifecycleState: 'SPAWNED',
      spawnedAt: performance.now(),
    };

    this.liveSubmothers.set(submotherId, instance);
    this.taskSpawnCounts.set(request.parentTaskId, taskCount + 1);
    this.recordAudit(submotherId, 'SPAWNED', `Formula: ${request.formulaType}, Depth: ${depth}`);

    return instance;
  }

  // ==========================================================================
  // EXECUTE — Run Submother's bounded computation
  // ==========================================================================

  public executeSubmother(submotherId: string): SubmotherExecutionResult {
    const instance = this.liveSubmothers.get(submotherId);
    if (!instance) {
      throw new Error(`[NOT_FOUND] Submother '${submotherId}' does not exist.`);
    }
    if (instance.lifecycleState !== 'SPAWNED') {
      throw new Error(`[INVALID_STATE] Submother '${submotherId}' is in state '${instance.lifecycleState}', expected 'SPAWNED'.`);
    }

    instance.lifecycleState = 'EXECUTING';
    const startTime = performance.now();

    try {
      // Simulate formula-based computation (bounded, deterministic)
      const output = this.executeFormula(instance);
      const executionMs = Math.round(performance.now() - startTime);

      // Timeout check
      if (executionMs > instance.context.maxExecutionMs) {
        instance.lifecycleState = 'TIMED_OUT';
        const result: SubmotherExecutionResult = {
          submotherId,
          status: 'TIMED_OUT',
          output: '',
          executionMs,
          memoryUsedBytes: 0,
          delegatedToMotherCore: true,
          timestamp: new Date().toISOString(),
        };
        instance.result = result;
        this.recordAudit(submotherId, 'EXECUTED', `TIMED_OUT after ${executionMs}ms`);
        return result;
      }

      // Memory estimation (formula output size)
      const memoryUsed = Buffer.byteLength(output, 'utf-8');

      // Memory budget check
      if (memoryUsed > instance.context.maxMemoryBytes) {
        instance.lifecycleState = 'FAILED';
        const result: SubmotherExecutionResult = {
          submotherId,
          status: 'FAILED',
          output: '',
          executionMs,
          memoryUsedBytes: memoryUsed,
          delegatedToMotherCore: true,
          timestamp: new Date().toISOString(),
        };
        instance.result = result;
        this.recordAudit(submotherId, 'EXECUTED', `MEMORY_EXCEEDED: ${memoryUsed}/${instance.context.maxMemoryBytes}`);
        return result;
      }

      instance.lifecycleState = 'COMPLETED';
      const result: SubmotherExecutionResult = {
        submotherId,
        status: 'SUCCESS',
        output,
        executionMs,
        memoryUsedBytes: memoryUsed,
        delegatedToMotherCore: true,
        timestamp: new Date().toISOString(),
      };
      instance.result = result;
      this.recordAudit(submotherId, 'EXECUTED', `SUCCESS in ${executionMs}ms`);
      return result;

    } catch (err: any) {
      instance.lifecycleState = 'FAILED';
      const executionMs = Math.round(performance.now() - startTime);
      const result: SubmotherExecutionResult = {
        submotherId,
        status: 'FAILED',
        output: '',
        executionMs,
        memoryUsedBytes: 0,
        delegatedToMotherCore: true,
        timestamp: new Date().toISOString(),
      };
      instance.result = result;
      this.recordAudit(submotherId, 'EXECUTED', `FAILED: ${err.message}`);
      return result;
    }
  }

  // ==========================================================================
  // TERMINATE — Stop Submother execution
  // ==========================================================================

  public terminateSubmother(submotherId: string): void {
    const instance = this.liveSubmothers.get(submotherId);
    if (!instance) return;

    if (instance.lifecycleState === 'TERMINATED' || instance.lifecycleState === 'CLEANED') {
      return; // Already terminated
    }

    instance.lifecycleState = 'TERMINATED';
    instance.terminatedAt = performance.now();
    this.recordAudit(submotherId, 'TERMINATED');
  }

  // ==========================================================================
  // CLEANUP — Release all resources and remove from registry
  // ==========================================================================

  public cleanupSubmother(submotherId: string): void {
    const instance = this.liveSubmothers.get(submotherId);
    if (!instance) return;

    if (instance.lifecycleState !== 'TERMINATED') {
      // Auto-terminate before cleanup
      this.terminateSubmother(submotherId);
    }

    instance.lifecycleState = 'CLEANED';
    instance.cleanedAt = performance.now();
    this.liveSubmothers.delete(submotherId);
    this.recordAudit(submotherId, 'CLEANED');
  }

  // ==========================================================================
  // FULL LIFECYCLE — Spawn → Execute → Terminate → Cleanup
  // ==========================================================================

  public runFullLifecycle(request: SubmotherGenerationRequest): SubmotherExecutionResult {
    const instance = this.spawnSubmother(request);
    const result = this.executeSubmother(instance.identity.submotherId);
    this.terminateSubmother(instance.identity.submotherId);
    this.cleanupSubmother(instance.identity.submotherId);
    return result;
  }

  // ==========================================================================
  // QUERY & INTROSPECTION
  // ==========================================================================

  public getSubmother(submotherId: string): SubmotherInstance | undefined {
    return this.liveSubmothers.get(submotherId);
  }

  public getLiveConcurrentCount(): number {
    let count = 0;
    for (const [, inst] of this.liveSubmothers) {
      if (inst.lifecycleState === 'SPAWNED' || inst.lifecycleState === 'EXECUTING') {
        count++;
      }
    }
    return count;
  }

  public getTaskSpawnCount(taskId: string): number {
    return this.taskSpawnCounts.get(taskId) ?? 0;
  }

  public getTotalSpawned(): number {
    return this.totalSpawned;
  }

  public getAuditLedger(): readonly SubmotherAuditRecord[] {
    return Object.freeze([...this.auditLedger]);
  }

  // ==========================================================================
  // PRIVATE — FORMULA EXECUTION
  // ==========================================================================

  private executeFormula(instance: SubmotherInstance): string {
    const params = instance.context.formulaParameters;

    switch (instance.context.formulaType) {
      case 'SPATIAL_PROJECTION': {
        const cellId = Number(params.cellId ?? 0);
        // Formula A: address369 = 26 + cellId
        const address369 = 26 + (cellId % 343);
        const x = cellId % 7;
        const y = Math.floor(cellId / 7) % 7;
        const z = Math.floor(cellId / 49) % 7;
        return JSON.stringify({
          formula: 'SPATIAL_PROJECTION',
          cellId,
          address369,
          coord: { x, y, z },
          delegatedTo: 'MOTHER_CORE',
        });
      }

      case 'EXPANSION_RULE': {
        const rule = String(params.rule ?? 'PHI_TRANSFORM');
        const depth = Number(params.depth ?? 1);
        const PHI = (1 + Math.sqrt(5)) / 2;
        const factor = Math.pow(PHI, depth);
        return JSON.stringify({
          formula: 'EXPANSION_RULE',
          rule,
          depth,
          phiFactor: Number(factor.toFixed(6)),
          delegatedTo: 'MOTHER_CORE',
        });
      }

      case 'DOMAIN_DELEGATION': {
        const domain = String(params.domain ?? 'SPATIAL');
        return JSON.stringify({
          formula: 'DOMAIN_DELEGATION',
          domain,
          resolvedBy: 'MOTHER_CORE',
          delegatedTo: 'MOTHER_CORE',
        });
      }

      case 'PHI_TRANSFORM': {
        const power = Number(params.power ?? 1);
        const PHI = (1 + Math.sqrt(5)) / 2;
        const angle = (2 * Math.PI) / (PHI * PHI);
        const result = Math.pow(PHI, power) * Math.cos(angle * power);
        return JSON.stringify({
          formula: 'PHI_TRANSFORM',
          power,
          phiValue: Number(Math.pow(PHI, power).toFixed(8)),
          transformResult: Number(result.toFixed(8)),
          delegatedTo: 'MOTHER_CORE',
        });
      }

      default:
        throw new Error(`[UNKNOWN_FORMULA] Unrecognized formula type: ${instance.context.formulaType}`);
    }
  }

  // ==========================================================================
  // PRIVATE — AUDIT
  // ==========================================================================

  private recordAudit(
    submotherId: string,
    action: SubmotherAuditRecord['action'],
    reason?: string
  ): void {
    const auditId = `SM_AUDIT_${this.auditLedger.length + 1}_${Date.now()}`;
    const hashInput = `${auditId}|${submotherId}|${action}|${reason ?? ''}`;
    const auditHash = crypto.createHash('sha256').update(hashInput).digest('hex');

    this.auditLedger.push({
      auditId,
      submotherId,
      action,
      reason,
      auditHash,
      timestamp: new Date().toISOString(),
    });
  }
}
