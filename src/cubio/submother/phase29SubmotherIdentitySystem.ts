/**
 * ============================================================================
 * CUBiO AI — PHASE 29 TASK 5: DYNAMIC SUBMOTHER IDENTITY SYSTEM
 * src/cubio/submother/phase29SubmotherIdentitySystem.ts
 * ============================================================================
 *
 * Formal identity system for dynamically generated Submother branches.
 *
 * Requirements:
 *   - Unique deterministic identity linked to parent Mother Core request
 *   - Records purpose, formula, state, lifecycle, parent request
 *   - NEVER exposes private Core implementation details
 *   - Lifecycle states: CREATED → ACTIVE → COMPLETED | FAILED → TERMINATED
 *   - Prevents identity collisions
 *   - Prevents unauthorized cross-branch communication
 *   - Full audit trail with SHA-256 hashes
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
// CONSTANTS
// ============================================================================

export const IDENTITY_SYSTEM_VERSION = '29.5.0';
export const IDENTITY_SYSTEM_ID = 'CUBIO_DYNAMIC_SUBMOTHER_IDENTITY_SYSTEM';

/** Maximum identities tracked before forced compaction */
export const MAX_IDENTITY_REGISTRY_SIZE = 1024;

// ============================================================================
// TYPES
// ============================================================================

export type SubmotherBranchPurpose =
  | 'SPATIAL_COMPUTATION'
  | 'EXPANSION_PROCESSING'
  | 'DOMAIN_REASONING'
  | 'PHI_TRANSFORMATION'
  | 'AGGREGATION'
  | 'VALIDATION';

export type SubmotherFormula =
  | 'SPATIAL_PROJECTION'
  | 'EXPANSION_RULE'
  | 'DOMAIN_DELEGATION'
  | 'PHI_TRANSFORM';

export type IdentityLifecycleState =
  | 'CREATED'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'FAILED'
  | 'TERMINATED';

// ============================================================================
// IDENTITY RECORD — Public-facing, NO private Core details
// ============================================================================

export interface SubmotherIdentityRecord {
  /** Unique deterministic identity ID (SM-XXXX-XXXX format) */
  readonly identityId: string;

  /** SHA-256 hash derived from parent request + formula + index */
  readonly identityHash: string;

  /** Parent Mother Core request ID that triggered generation */
  readonly parentRequestId: string;

  /** Purpose of this Submother branch */
  readonly purpose: SubmotherBranchPurpose;

  /** Formula used to generate this branch */
  readonly formula: SubmotherFormula;

  /** Formula parameters (sanitized — no Core internals) */
  readonly formulaParameters: Record<string, number | string>;

  /** Current lifecycle state */
  lifecycleState: IdentityLifecycleState;

  /** Generation depth (0 = direct child of Mother Core) */
  readonly generationDepth: number;

  /** Sequential generation index within parent request */
  readonly generationIndex: number;

  /** ISO 8601 timestamps for lifecycle transitions */
  readonly createdAt: string;
  activatedAt?: string;
  completedAt?: string;
  failedAt?: string;
  terminatedAt?: string;

  /** Isolation token — prevents cross-branch communication */
  readonly isolationToken: string;

  /** Audit digest of the full record */
  readonly recordDigest: string;
}

// ============================================================================
// LIFECYCLE TRANSITION EVENT
// ============================================================================

export interface LifecycleTransitionEvent {
  readonly eventId: string;
  readonly identityId: string;
  readonly fromState: IdentityLifecycleState | 'NONE';
  readonly toState: IdentityLifecycleState;
  readonly reason?: string;
  readonly eventHash: string;
  readonly timestamp: string;
}

// ============================================================================
// CROSS-BRANCH COMMUNICATION ATTEMPT
// ============================================================================

export interface CrossBranchAttempt {
  readonly attemptId: string;
  readonly sourceIdentityId: string;
  readonly targetIdentityId: string;
  readonly attemptType: 'MESSAGE' | 'DATA_SHARE' | 'STATE_READ' | 'DELEGATE';
  readonly verdict: 'BLOCKED';
  readonly reason: string;
  readonly attemptHash: string;
  readonly timestamp: string;
}

// ============================================================================
// IDENTITY GENERATION REQUEST
// ============================================================================

export interface IdentityGenerationRequest {
  readonly parentRequestId: string;
  readonly purpose: SubmotherBranchPurpose;
  readonly formula: SubmotherFormula;
  readonly formulaParameters: Record<string, number | string>;
  readonly generationDepth?: number;
}

// ============================================================================
// SANITIZED CORE DETAIL FILTER
// ============================================================================

const PRIVATE_CORE_PATTERNS: readonly string[] = [
  'CORE_WEIGHT',
  'CORE_GRADIENT',
  'CORE_PARAMETER',
  'CORE_INTERNAL',
  'TRAINING_LOSS',
  'TRAINING_EPOCH',
  'MODEL_ARCHITECTURE',
  'NEURAL_LAYER',
  'ATTENTION_HEAD',
  'EMBEDDING_DIM',
  'CORE_SECRET',
  'PRIVATE_KEY',
  'CORE_CHECKPOINT_HASH',
];

function sanitizeParameters(params: Record<string, number | string>): Record<string, number | string> {
  const sanitized: Record<string, number | string> = {};
  for (const [key, value] of Object.entries(params)) {
    const upperKey = key.toUpperCase();
    const upperVal = String(value).toUpperCase();
    let isPrivate = false;
    for (const pattern of PRIVATE_CORE_PATTERNS) {
      if (upperKey.includes(pattern) || upperVal.includes(pattern)) {
        isPrivate = true;
        break;
      }
    }
    if (!isPrivate) {
      sanitized[key] = value;
    }
    // Private parameters are silently dropped — never exposed
  }
  return sanitized;
}

// ============================================================================
// VALID STATE TRANSITIONS
// ============================================================================

const VALID_TRANSITIONS: Record<IdentityLifecycleState | 'NONE', readonly IdentityLifecycleState[]> = {
  'NONE':       ['CREATED'],
  'CREATED':    ['ACTIVE', 'TERMINATED'],
  'ACTIVE':     ['COMPLETED', 'FAILED', 'TERMINATED'],
  'COMPLETED':  ['TERMINATED'],
  'FAILED':     ['TERMINATED'],
  'TERMINATED': [], // Terminal — no further transitions
};

// ============================================================================
// DYNAMIC SUBMOTHER IDENTITY SYSTEM
// ============================================================================

export class Phase29SubmotherIdentitySystem {
  private static instance: Phase29SubmotherIdentitySystem | null = null;

  private readonly registry: Map<string, SubmotherIdentityRecord> = new Map();
  private readonly lifecycleEvents: LifecycleTransitionEvent[] = [];
  private readonly crossBranchAttempts: CrossBranchAttempt[] = [];
  private readonly requestIndexCounters: Map<string, number> = new Map();
  private totalGenerated = 0;

  private constructor() {
    if (!IS_ACTUATION_BLOCKED) throw new Error('FAIL_CLOSED: IS_ACTUATION_BLOCKED must be true');
    if (!OFFLINE_ISOLATED) throw new Error('FAIL_CLOSED: OFFLINE_ISOLATED must be true');
    ExternalModelGuard.assertNativeOnly('CUBIO-P29-SUBMOTHER-IDENTITY');
  }

  public static getInstance(): Phase29SubmotherIdentitySystem {
    if (!this.instance) {
      this.instance = new Phase29SubmotherIdentitySystem();
    }
    return this.instance;
  }

  public static resetInstance(): void {
    this.instance = null;
  }

  // ==========================================================================
  // IDENTITY GENERATION — Deterministic, collision-free
  // ==========================================================================

  public generateIdentity(request: IdentityGenerationRequest): SubmotherIdentityRecord {
    // Registry size guard
    if (this.registry.size >= MAX_IDENTITY_REGISTRY_SIZE) {
      throw new Error(`[REGISTRY_FULL] Identity registry has reached max capacity (${MAX_IDENTITY_REGISTRY_SIZE}).`);
    }

    // Increment per-request counter
    const reqCount = (this.requestIndexCounters.get(request.parentRequestId) ?? 0) + 1;
    this.requestIndexCounters.set(request.parentRequestId, reqCount);
    this.totalGenerated++;

    const depth = request.generationDepth ?? 0;

    // Deterministic identity seed
    const seed = `${IDENTITY_SYSTEM_ID}:${IDENTITY_SYSTEM_VERSION}:${request.parentRequestId}:${request.formula}:${request.purpose}:${reqCount}:${depth}`;
    const identityHash = crypto.createHash('sha256').update(seed).digest('hex');

    // Human-readable ID: SM-<first8>-<index>
    const identityId = `SM-${identityHash.slice(0, 8).toUpperCase()}-${this.totalGenerated}`;

    // Collision check
    if (this.registry.has(identityId)) {
      throw new Error(`[IDENTITY_COLLISION] Identity '${identityId}' already exists. This should never happen with deterministic generation.`);
    }

    // Isolation token — unique per branch, prevents cross-branch comms
    const isolationToken = crypto.createHash('sha256')
      .update(`ISOLATION:${identityId}:${identityHash}:${Date.now()}`)
      .digest('hex');

    // Sanitize parameters — strip any private Core details
    const sanitizedParams = sanitizeParameters(request.formulaParameters);

    // Compute record digest
    const recordDigest = crypto.createHash('sha256')
      .update(`${identityId}|${identityHash}|${request.parentRequestId}|${request.purpose}|${request.formula}|${JSON.stringify(sanitizedParams)}|${depth}|${reqCount}`)
      .digest('hex');

    const now = new Date().toISOString();

    const record: SubmotherIdentityRecord = {
      identityId,
      identityHash,
      parentRequestId: request.parentRequestId,
      purpose: request.purpose,
      formula: request.formula,
      formulaParameters: sanitizedParams,
      lifecycleState: 'CREATED',
      generationDepth: depth,
      generationIndex: reqCount,
      createdAt: now,
      isolationToken,
      recordDigest,
    };

    this.registry.set(identityId, record);
    this.recordTransition(identityId, 'NONE', 'CREATED', 'Identity generated');

    return record;
  }

  // ==========================================================================
  // LIFECYCLE STATE TRANSITIONS
  // ==========================================================================

  public transitionState(
    identityId: string,
    toState: IdentityLifecycleState,
    reason?: string
  ): SubmotherIdentityRecord {
    const record = this.registry.get(identityId);
    if (!record) {
      throw new Error(`[NOT_FOUND] Identity '${identityId}' not found in registry.`);
    }

    const fromState = record.lifecycleState;

    // Validate transition
    const allowed = VALID_TRANSITIONS[fromState];
    if (!allowed.includes(toState)) {
      throw new Error(
        `[INVALID_TRANSITION] Cannot transition '${identityId}' from '${fromState}' to '${toState}'. Allowed: [${allowed.join(', ')}].`
      );
    }

    // Apply transition
    record.lifecycleState = toState;
    const now = new Date().toISOString();

    switch (toState) {
      case 'ACTIVE':
        record.activatedAt = now;
        break;
      case 'COMPLETED':
        record.completedAt = now;
        break;
      case 'FAILED':
        record.failedAt = now;
        break;
      case 'TERMINATED':
        record.terminatedAt = now;
        break;
    }

    this.recordTransition(identityId, fromState, toState, reason);
    return record;
  }

  // ==========================================================================
  // CROSS-BRANCH COMMUNICATION BLOCKING
  // ==========================================================================

  public attemptCrossBranchCommunication(
    sourceIdentityId: string,
    targetIdentityId: string,
    attemptType: CrossBranchAttempt['attemptType']
  ): CrossBranchAttempt {
    const source = this.registry.get(sourceIdentityId);
    const target = this.registry.get(targetIdentityId);

    // Always blocked
    const reason = this.determineCrossBranchBlockReason(source, target, sourceIdentityId, targetIdentityId);

    const attemptId = `XB-${this.crossBranchAttempts.length + 1}-${Date.now()}`;
    const attemptHash = crypto.createHash('sha256')
      .update(`${attemptId}|${sourceIdentityId}|${targetIdentityId}|${attemptType}|BLOCKED`)
      .digest('hex');

    const attempt: CrossBranchAttempt = {
      attemptId,
      sourceIdentityId,
      targetIdentityId,
      attemptType,
      verdict: 'BLOCKED',
      reason,
      attemptHash,
      timestamp: new Date().toISOString(),
    };

    this.crossBranchAttempts.push(attempt);
    return attempt;
  }

  // ==========================================================================
  // QUERY & INTROSPECTION
  // ==========================================================================

  public getIdentity(identityId: string): SubmotherIdentityRecord | undefined {
    return this.registry.get(identityId);
  }

  public getIdentitiesByParentRequest(parentRequestId: string): SubmotherIdentityRecord[] {
    const results: SubmotherIdentityRecord[] = [];
    for (const [, record] of this.registry) {
      if (record.parentRequestId === parentRequestId) {
        results.push(record);
      }
    }
    return results;
  }

  public getIdentitiesByState(state: IdentityLifecycleState): SubmotherIdentityRecord[] {
    const results: SubmotherIdentityRecord[] = [];
    for (const [, record] of this.registry) {
      if (record.lifecycleState === state) {
        results.push(record);
      }
    }
    return results;
  }

  public getRegistrySize(): number {
    return this.registry.size;
  }

  public getTotalGenerated(): number {
    return this.totalGenerated;
  }

  public getLifecycleEvents(): readonly LifecycleTransitionEvent[] {
    return Object.freeze([...this.lifecycleEvents]);
  }

  public getCrossBranchAttempts(): readonly CrossBranchAttempt[] {
    return Object.freeze([...this.crossBranchAttempts]);
  }

  /** Verify that an isolation token matches the record's token */
  public verifyIsolationToken(identityId: string, token: string): boolean {
    const record = this.registry.get(identityId);
    if (!record) return false;
    return record.isolationToken === token;
  }

  // ==========================================================================
  // PRIVATE
  // ==========================================================================

  private determineCrossBranchBlockReason(
    source: SubmotherIdentityRecord | undefined,
    target: SubmotherIdentityRecord | undefined,
    sourceId: string,
    targetId: string
  ): string {
    if (!source) return `Source identity '${sourceId}' not found`;
    if (!target) return `Target identity '${targetId}' not found`;
    if (source.isolationToken === target.isolationToken) return 'Same isolation token (internal error)';
    if (source.parentRequestId !== target.parentRequestId) {
      return `Cross-request communication blocked: '${source.parentRequestId}' → '${target.parentRequestId}'`;
    }
    return `Cross-branch communication blocked: isolation tokens differ (${source.identityId} ↛ ${target.identityId})`;
  }

  private recordTransition(
    identityId: string,
    fromState: IdentityLifecycleState | 'NONE',
    toState: IdentityLifecycleState,
    reason?: string
  ): void {
    const eventId = `LCE-${this.lifecycleEvents.length + 1}-${Date.now()}`;
    const eventHash = crypto.createHash('sha256')
      .update(`${eventId}|${identityId}|${fromState}|${toState}|${reason ?? ''}`)
      .digest('hex');

    this.lifecycleEvents.push({
      eventId,
      identityId,
      fromState,
      toState,
      reason,
      eventHash,
      timestamp: new Date().toISOString(),
    });
  }
}
