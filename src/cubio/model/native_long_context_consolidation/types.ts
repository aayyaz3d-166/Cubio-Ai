/**
 * CUBiO AI — Task 180: Long-Context Memory Consolidation
 * src/cubio/model/native_long_context_consolidation/types.ts
 *
 * Universal contracts, consolidation structures, rollback records, and domain
 * error classes for native long-context memory consolidation.
 *
 * STRICT INVARIANTS:
 * 1. Zero foreign libraries (no LangChain, LlamaIndex, ChromaDB, PyTorch).
 * 2. Primary VDB remains the canonical persistent authority; never silently overwritten.
 * 3. Exact deduplication and OCC revision reconciliation with source lineage tracking.
 * 4. Pre-consolidation detection of duplicates, stale state versions, and contradictions.
 * 5. Bounded consolidation queues (<= 500) and batch sizes (<= 100).
 * 6. Bitwise deterministic rollback to pre-consolidation state.
 * 7. Permanent hardware actuation lockout: IS_ACTUATION_BLOCKED === true.
 */

export const TASK_180_ID = 'CUBIO-TASK-180-LONG-CONTEXT-MEMORY-CONSOLIDATION';
export const IS_ACTUATION_BLOCKED = true;
export const MAX_CONSOLIDATION_QUEUE_SIZE = 500;
export const MAX_CONSOLIDATION_BATCH_SIZE = 100;

export type EpistemicStatus =
  | 'AXIOM'
  | 'FACT'
  | 'DERIVED'
  | 'THEORY'
  | 'OBSERVATION'
  | 'HYPOTHESIS';

/**
 * Candidate item submitted for memory consolidation.
 */
export interface ConsolidationCandidate {
  readonly objectId: string;
  readonly content: string;
  readonly epistemicStatus: EpistemicStatus;
  readonly sourceContextId: string;        // Origin window, tile, or segment ID
  readonly stateVersion: number;           // State version of candidate
  readonly checksum: string;               // Cryptographic SHA-256 canonical checksum
  readonly tenantId: string;               // Tenant owning this memory
  readonly spatialCellId?: number;         // 0..342 discrete 3D HCP lattice cell
  readonly lineageSourceIds: readonly string[]; // Contributing source identifiers
  readonly timestamp: number;              // Timestamp in ms
}

/**
 * Output consolidated entity representing merged canonical memory.
 */
export interface ConsolidatedEntity {
  readonly canonicalObjectId: string;
  readonly tenantId: string;
  readonly canonicalStateVersion: number;
  readonly canonicalChecksum: string;
  readonly epistemicStatus: EpistemicStatus;
  readonly content: string;
  readonly mergedReferencesCount: number;
  readonly constituentSourceIds: readonly string[];
  readonly lineageDigest: string;          // Cryptographic SHA-256 hash of all merged inputs
  readonly consolidatedAt: number;         // Timestamp in ms
  readonly isRollbackAvailable: boolean;
  readonly spatialCellId?: number;
}

/**
 * Rollback snapshot record preserving pre-consolidation state.
 */
export interface ConsolidationRollbackRecord {
  readonly consolidationId: string;
  readonly tenantId: string;
  readonly preConsolidationCandidates: readonly ConsolidationCandidate[];
  readonly consolidatedEntity: ConsolidatedEntity;
  readonly timestamp: number;
}

/**
 * Batch of candidates submitted for atomic consolidation evaluation.
 */
export interface ConsolidationBatch {
  readonly batchId: string;
  readonly tenantId: string;
  readonly candidates: readonly ConsolidationCandidate[];
}

/**
 * Comprehensive result of a consolidation execution.
 */
export interface ConsolidationResult {
  readonly batchId: string;
  readonly tenantId: string;
  readonly consolidatedEntities: readonly ConsolidatedEntity[];
  readonly duplicatesPruned: number;
  readonly contradictionsDetected: number;
  readonly staleSkipped: number;
  readonly batchDigest: string;            // SHA-256 cryptographic digest of batch consolidation
  readonly latencyMs: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Domain Errors
// ─────────────────────────────────────────────────────────────────────────────

export class ConsolidationError extends Error {
  public readonly code: string;

  constructor(message: string, code: string) {
    super(`[LongContextConsolidation] ${message}`);
    this.name = 'ConsolidationError';
    this.code = code;
  }
}

export class ConsolidationQueueOverflowError extends ConsolidationError {
  public readonly currentSize: number;
  public readonly maxSize: number;

  constructor(currentSize: number, maxSize: number) {
    super(
      `Consolidation queue overflow: current size ${currentSize} exceeds capacity ${maxSize}. Enqueue halted fail-closed.`,
      'CONSOLIDATION_QUEUE_OVERFLOW'
    );
    this.name = 'ConsolidationQueueOverflowError';
    this.currentSize = currentSize;
    this.maxSize = maxSize;
  }
}

export class ConsolidationBatchOverflowError extends ConsolidationError {
  public readonly batchSize: number;
  public readonly maxBatchSize: number;

  constructor(batchSize: number, maxBatchSize: number) {
    super(
      `Consolidation batch size ${batchSize} exceeds maximum limit of ${maxBatchSize}. Batch rejected fail-closed.`,
      'CONSOLIDATION_BATCH_OVERFLOW'
    );
    this.name = 'ConsolidationBatchOverflowError';
    this.batchSize = batchSize;
    this.maxBatchSize = maxBatchSize;
  }
}

export class ConsolidationTenantViolationError extends ConsolidationError {
  public readonly callerTenant: string;
  public readonly candidateTenant: string;

  constructor(callerTenant: string, candidateTenant: string) {
    super(
      `Tenant Isolation Violation: Batch tenant "${callerTenant}" attempted consolidating memory owned by "${candidateTenant}". Consolidation blocked fail-closed.`,
      'CONSOLIDATION_TENANT_VIOLATION'
    );
    this.name = 'ConsolidationTenantViolationError';
    this.callerTenant = callerTenant;
    this.candidateTenant = candidateTenant;
  }
}

export class ConsolidationContradictionError extends ConsolidationError {
  public readonly objectId: string;
  public readonly contradictionDetails: string;

  constructor(objectId: string, contradictionDetails: string) {
    super(
      `Consolidation Contradiction Detected on object "${objectId}": ${contradictionDetails}. Consolidation halted fail-closed.`,
      'CONSOLIDATION_CONTRADICTION'
    );
    this.name = 'ConsolidationContradictionError';
    this.objectId = objectId;
    this.contradictionDetails = contradictionDetails;
  }
}

export class StaleConsolidationError extends ConsolidationError {
  public readonly objectId: string;
  public readonly candidateVersion: number;
  public readonly canonicalVersion: number;

  constructor(objectId: string, candidateVersion: number, canonicalVersion: number) {
    super(
      `Stale Consolidation Candidate on object "${objectId}": candidate stateVersion ${candidateVersion} is older than canonical stateVersion ${canonicalVersion}. Stale update rejected fail-closed.`,
      'STALE_CONSOLIDATION_CANDIDATE'
    );
    this.name = 'StaleConsolidationError';
    this.objectId = objectId;
    this.candidateVersion = candidateVersion;
    this.canonicalVersion = canonicalVersion;
  }
}

export class CanonicalOverwriteProhibitedError extends ConsolidationError {
  public readonly objectId: string;
  public readonly attemptedStatus: string;
  public readonly existingStatus: string;

  constructor(objectId: string, attemptedStatus: string, existingStatus: string) {
    super(
      `Canonical Overwrite Prohibited on object "${objectId}": cannot downgrade or overwrite established ${existingStatus} with lower-tier ${attemptedStatus}. Primary VDB authority preserved.`,
      'CANONICAL_OVERWRITE_PROHIBITED'
    );
    this.name = 'CanonicalOverwriteProhibitedError';
    this.objectId = objectId;
    this.attemptedStatus = attemptedStatus;
    this.existingStatus = existingStatus;
  }
}

export class ConsolidationActuationBlockedError extends ConsolidationError {
  public readonly directive: string;

  constructor(directive: string) {
    super(
      `Hardware Actuation Blocked: Memory consolidation layer rejected directive "${directive}". Physical actuation permanently prohibited.`,
      'HARDWARE_ACTUATION_PROHIBITED'
    );
    this.name = 'ConsolidationActuationBlockedError';
    this.directive = directive;
  }
}

export class ConsolidationRollbackError extends ConsolidationError {
  public readonly consolidationId: string;

  constructor(consolidationId: string, reason: string) {
    super(
      `Rollback failed for consolidation "${consolidationId}": ${reason}. Rollback halted fail-closed.`,
      'CONSOLIDATION_ROLLBACK_FAILED'
    );
    this.name = 'ConsolidationRollbackError';
    this.consolidationId = consolidationId;
  }
}
