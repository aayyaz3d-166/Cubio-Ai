/**
 * CUBiO AI — Task 178: Cross-Context Reference Resolution
 * src/cubio/model/native_reference_resolution/types.ts
 *
 * Universal contracts, cross-context reference specifications, provenance
 * chains, and domain errors for native cross-context reference resolution.
 *
 * STRICT INVARIANTS:
 * 1. Zero foreign libraries (no LangChain, LlamaIndex, ChromaDB, Pinecone, FAISS, PyTorch).
 * 2. Canonical identity tracking: objectId, chunkId, tenantId, stateVersion, and checksum.
 * 3. Lazy on-demand resolution: only targeted items loaded; unrelated contexts never loaded.
 * 4. Fail-closed validation on missing, stale (OCC mismatch), contradictory, or cross-tenant references.
 * 5. Full provenance chain tracking with cycle detection and depth ceiling (<= 16 hops).
 * 6. Triplicate bitwise determinism: A = B = C, delta = 0.
 * 7. Permanent hardware actuation lockout: IS_ACTUATION_BLOCKED === true.
 */

import { ModelMemoryRecord } from '../native_memory_integration/types.js';

export const TASK_178_ID = 'CUBIO-TASK-178-CROSS-CONTEXT-REFERENCE-RESOLUTION';
export const IS_ACTUATION_BLOCKED = true;
export const MAX_REFERENCE_CHAIN_DEPTH = 16;

/**
 * Types of semantic and structural cross-context reference links.
 */
export type CrossContextReferenceType =
  | 'DIRECT_CITATION'
  | 'TEMPORAL_PREDECESSOR'
  | 'DERIVATION_PARENT'
  | 'SPATIAL_NEIGHBOR'
  | 'CONTRADICTION_ASSERTION';

/**
 * Specification of a cross-context reference link spanning across context windows.
 */
export interface CrossContextReference {
  readonly referenceId: string;
  readonly sourceContextId: string;        // Context window, tile, or segment ID of origin
  readonly targetObjectId: string;         // Canonical VDB object ID
  readonly targetChunkId?: string;         // Specific chunk ID within object
  readonly tenantId: string;               // Tenant owning this reference
  readonly expectedStateVersion: number;   // Expected OCC version for staleness checking
  readonly expectedChecksum: string;       // Expected SHA-256 content checksum
  readonly referenceType: CrossContextReferenceType;
  readonly epistemicStatus?: string;       // e.g. 'AXIOM', 'FACT', 'DERIVED'
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly createdAt: number;              // Timestamp in ms
}

/**
 * Node in a provenance chain recording resolution ancestry.
 */
export interface ProvenanceChainNode {
  readonly referenceId: string;
  readonly sourceContextId: string;
  readonly targetObjectId: string;
  readonly targetChunkId?: string;
  readonly stateVersion: number;
  readonly checksum: string;
  readonly hopIndex: number;
  readonly epistemicStatus?: string;
}

/**
 * Result of a successful reference resolution.
 */
export interface ResolvedReference {
  readonly reference: CrossContextReference;
  readonly resolvedRecord?: ModelMemoryRecord;
  readonly provenanceChain: readonly ProvenanceChainNode[];
  readonly latencyMs: number;
  readonly resolutionDigest: string;       // Cryptographic SHA-256 digest of resolution proof
  readonly isLazyLoaded: boolean;
}

/**
 * Query options for resolving cross-context references.
 */
export interface ResolutionQuery {
  readonly referenceId?: string;
  readonly reference?: CrossContextReference;
  readonly callerTenantId: string;
  readonly materializeContent?: boolean;   // Whether to fetch full VDB payload (default: true)
  readonly maxChainDepth?: number;         // Depth ceiling (default: 16)
  readonly followChains?: boolean;         // Recursively resolve parent references (default: false)
}

// ─────────────────────────────────────────────────────────────────────────────
// Domain Errors
// ─────────────────────────────────────────────────────────────────────────────

export class ReferenceResolutionError extends Error {
  public readonly code: string;

  constructor(message: string, code: string) {
    super(`[CrossContextReferenceResolution] ${message}`);
    this.name = 'ReferenceResolutionError';
    this.code = code;
  }
}

export class MissingReferenceError extends ReferenceResolutionError {
  public readonly targetObjectId: string;

  constructor(targetObjectId: string) {
    super(
      `Missing reference target: canonical object "${targetObjectId}" not found in VDB registry. Resolution halted fail-closed.`,
      'MISSING_REFERENCE_TARGET'
    );
    this.name = 'MissingReferenceError';
    this.targetObjectId = targetObjectId;
  }
}

export class StaleReferenceError extends ReferenceResolutionError {
  public readonly objectId: string;
  public readonly expectedVersion: number;
  public readonly actualVersion: number;

  constructor(objectId: string, expectedVersion: number, actualVersion: number) {
    super(
      `Stale reference detected on object "${objectId}": expected stateVersion ${expectedVersion}, actual VDB version is ${actualVersion}. OCC conflict rejected fail-closed.`,
      'STALE_REFERENCE_OCC_MISMATCH'
    );
    this.name = 'StaleReferenceError';
    this.objectId = objectId;
    this.expectedVersion = expectedVersion;
    this.actualVersion = actualVersion;
  }
}

export class ContradictoryReferenceError extends ReferenceResolutionError {
  public readonly objectId: string;
  public readonly conflictingClaim: string;

  constructor(objectId: string, conflictingClaim: string) {
    super(
      `Contradictory reference detected on object "${objectId}": ${conflictingClaim}. Epistemic conflict rejected fail-closed.`,
      'CONTRADICTORY_REFERENCE_DETECTED'
    );
    this.name = 'ContradictoryReferenceError';
    this.objectId = objectId;
    this.conflictingClaim = conflictingClaim;
  }
}

export class CrossTenantReferenceError extends ReferenceResolutionError {
  public readonly callerTenant: string;
  public readonly targetTenant: string;

  constructor(callerTenant: string, targetTenant: string) {
    super(
      `Cross-Tenant Violation: Caller tenant "${callerTenant}" attempted resolution of reference owned by tenant "${targetTenant}". Access blocked fail-closed.`,
      'CROSS_TENANT_REFERENCE_VIOLATION'
    );
    this.name = 'CrossTenantReferenceError';
    this.callerTenant = callerTenant;
    this.targetTenant = targetTenant;
  }
}

export class CorruptedReferenceChecksumError extends ReferenceResolutionError {
  public readonly objectId: string;
  public readonly expectedChecksum: string;
  public readonly actualChecksum: string;

  constructor(objectId: string, expectedChecksum: string, actualChecksum: string) {
    super(
      `Cryptographic Checksum Corruption on object "${objectId}": expected ${expectedChecksum}, actual calculated ${actualChecksum}. Tamper detected fail-closed.`,
      'CORRUPTED_REFERENCE_CHECKSUM'
    );
    this.name = 'CorruptedReferenceChecksumError';
    this.objectId = objectId;
    this.expectedChecksum = expectedChecksum;
    this.actualChecksum = actualChecksum;
  }
}

export class CircularReferenceError extends ReferenceResolutionError {
  public readonly objectId: string;
  public readonly cyclePath: readonly string[];

  constructor(objectId: string, cyclePath: readonly string[]) {
    super(
      `Circular reference cycle detected involving object "${objectId}": [${cyclePath.join(' -> ')}]. Recursion halted fail-closed.`,
      'CIRCULAR_REFERENCE_CYCLE'
    );
    this.name = 'CircularReferenceError';
    this.objectId = objectId;
    this.cyclePath = cyclePath;
  }
}

export class ChainDepthExceededError extends ReferenceResolutionError {
  public readonly currentDepth: number;
  public readonly maxDepth: number;

  constructor(currentDepth: number, maxDepth: number) {
    super(
      `Reference chain depth ceiling exceeded: current depth ${currentDepth} exceeds maximum allowed depth ${maxDepth}. Traversal halted fail-closed.`,
      'REFERENCE_CHAIN_DEPTH_EXCEEDED'
    );
    this.name = 'ChainDepthExceededError';
    this.currentDepth = currentDepth;
    this.maxDepth = maxDepth;
  }
}

export class ResolutionActuationBlockedError extends ReferenceResolutionError {
  public readonly directive: string;

  constructor(directive: string) {
    super(
      `Hardware Actuation Blocked: Reference resolution layer rejected directive "${directive}". Physical actuation permanently prohibited.`,
      'HARDWARE_ACTUATION_PROHIBITED'
    );
    this.name = 'ResolutionActuationBlockedError';
    this.directive = directive;
  }
}
