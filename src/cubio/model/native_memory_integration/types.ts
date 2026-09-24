/**
 * CUBiO AI — Task 165: Native Model Memory Integration
 * src/cubio/model/native_memory_integration/types.ts
 *
 * Universal type contracts, domain errors, and persistent record interfaces
 * for integrating the scaled native model with CUBiO's persistent memory architecture.
 *
 * STRICT INVARIANTS:
 * 1. VDB is the PRIMARY persistent working database and source of canonical memory.
 * 2. .3dmemory is strictly for checkpoint, backup, and streaming transport (never primary).
 * 3. Context retrieval operates through canonical memory references rather than bulk payload duplication.
 * 4. Optimistic Concurrency Control (OCC) governs every canonical state mutation; stale writes rejected fail-closed.
 * 5. Bounded LRU working caches with lazy on-demand deserialization.
 * 6. Strict multi-tenant isolation and anti-pollution epistemic promotion guards.
 * 7. Permanent hardware actuation lockout: IS_ACTUATION_BLOCKED === true.
 */

export const TASK_165_ID = 'CUBIO-TASK-165-NATIVE-MODEL-MEMORY-INTEGRATION';
export const IS_ACTUATION_BLOCKED = true;
export const DEFAULT_TENANT_ID = 'root_tenant';

// =============================================================================
// DOMAIN ERRORS
// =============================================================================

export class ModelMemoryError extends Error {
  public readonly code: string;
  public readonly timestamp: number;

  constructor(message: string, code = 'MODEL_MEMORY_ERROR') {
    super(`[ModelMemory] ${message}`);
    this.name = 'ModelMemoryError';
    this.code = code;
    this.timestamp = Date.now();
  }
}

export class ModelMemoryOCCConflictError extends ModelMemoryError {
  public readonly objectId: string;
  public readonly expectedVersion: number;
  public readonly actualVersion: number;

  constructor(objectId: string, expectedVersion: number, actualVersion: number) {
    super(
      `OCC conflict on object "${objectId}": expected version ${expectedVersion}, actual version is ${actualVersion}. Stale mutation rejected fail-closed.`,
      'MODEL_MEMORY_OCC_CONFLICT'
    );
    this.name = 'ModelMemoryOCCConflictError';
    this.objectId = objectId;
    this.expectedVersion = expectedVersion;
    this.actualVersion = actualVersion;
  }
}

export class ModelMemoryTenantViolationError extends ModelMemoryError {
  public readonly callerTenant: string;
  public readonly ownerTenant: string;

  constructor(message: string, callerTenant: string, ownerTenant: string) {
    super(
      `Tenant Isolation Violation: ${message} (Caller: "${callerTenant}", Owner: "${ownerTenant}"). Cross-tenant access blocked fail-closed.`,
      'MODEL_MEMORY_TENANT_VIOLATION'
    );
    this.name = 'ModelMemoryTenantViolationError';
    this.callerTenant = callerTenant;
    this.ownerTenant = ownerTenant;
  }
}

export class ModelMemoryIntegrityError extends ModelMemoryError {
  public readonly objectId: string;

  constructor(objectId: string, details: string) {
    super(
      `Cryptographic integrity violation on record "${objectId}": ${details}`,
      'MODEL_MEMORY_INTEGRITY_VIOLATION'
    );
    this.name = 'ModelMemoryIntegrityError';
    this.objectId = objectId;
  }
}

export class IllegalCanonicalKnowledgePromotionError extends ModelMemoryError {
  public readonly objectId: string;
  public readonly reason: string;

  constructor(objectId: string, reason: string) {
    super(
      `Illegal canonical knowledge promotion on "${objectId}": ${reason}`,
      'ILLEGAL_CANONICAL_PROMOTION'
    );
    this.name = 'IllegalCanonicalKnowledgePromotionError';
    this.objectId = objectId;
    this.reason = reason;
  }
}

export class ModelMemoryActuationBlockedError extends ModelMemoryError {
  public readonly directive: string;

  constructor(directive: string) {
    super(
      `Permanent Hardware Actuation Blocked: Memory integration layer rejected directive "${directive}" fail-closed.`,
      'HARDWARE_ACTUATION_PROHIBITED'
    );
    this.name = 'ModelMemoryActuationBlockedError';
    this.directive = directive;
  }
}

// =============================================================================
// PERSISTENT DATA CONTRACTS & INTERFACES
// =============================================================================

/**
 * Lightweight canonical memory reference pointing to persistent VDB storage.
 */
export interface CanonicalMemoryReference {
  readonly objectId: string;
  readonly tenantId: string;
  readonly domain: string;
  readonly stateVersion: number;
  readonly checksum: string;
  readonly spatialCellId?: number; // 0..342 for 3D HCP spatial lattice
  readonly contentLength: number;
  readonly summary: string;
  readonly timestamp: string;
}

/**
 * Authoritative persistent record stored in primary VDB.
 */
export interface ModelMemoryRecord {
  readonly reference: CanonicalMemoryReference;
  readonly content: string;
  readonly epistemicStatus: string; // e.g. 'FACT', 'AXIOM', 'DERIVED', 'HYPOTHESIS', etc.
  readonly isCanonicalKnowledge: boolean;
  readonly isActuationBlocked: boolean;
  readonly sourcePointer?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

/**
 * Filter for selective VDB querying.
 */
export interface ModelMemoryQuery {
  readonly tenantId: string;
  readonly domain?: string;
  readonly spatialCellId?: number;
  readonly keywords?: readonly string[];
  readonly onlyCanonical?: boolean;
  readonly limit?: number;
}

/**
 * Request payload for OCC record mutations.
 */
export interface ModelMemoryMutation {
  readonly objectId: string;
  readonly tenantId: string;
  readonly expectedVersion: number;
  readonly newContent: string;
  readonly newSpatialCellId?: number;
  readonly newEpistemicStatus?: string;
  readonly promoteToCanonical?: boolean;
}

/**
 * Working memory LRU cache statistics.
 */
export interface ModelMemoryCacheStats {
  readonly cacheCapacity: number;
  readonly currentSize: number;
  readonly cacheHits: number;
  readonly cacheMisses: number;
  readonly evictionCount: number;
}

/**
 * Checkpoint payload for .3dmemory transport format.
 */
export interface ModelMemoryCheckpoint {
  readonly checkpointId: string;
  readonly tenantId: string;
  readonly recordCount: number;
  readonly stateVersion: number;
  readonly stateHash: string;
  readonly vdbSynced: boolean;
  readonly serializedPayload: string;
  readonly timestamp: number;
}
