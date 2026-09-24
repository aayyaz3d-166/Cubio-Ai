/**
 * CUBiO AI — Task 192: Native Knowledge Contradiction Detection and Resolution
 * src/cubio/model/native_knowledge_contradiction/types.ts
 *
 * Types, interfaces, summary records, and error classes for
 * native knowledge contradiction detection, epistemic resolution, and quarantine preservation.
 *
 * STRICT INVARIANTS:
 * 1. Hardware Actuation Lockout: IS_ACTUATION_BLOCKED === true permanently.
 * 2. Zero Silent Overwrites: Conflicting records with insufficient or tied authority
 *    are quarantined rather than overwritten.
 * 3. Epistemic Hierarchy Authority: Resolution occurs strictly according to epistemic weights
 *    and verified evidence proofs.
 * 4. Multi-Tenant Isolation: Cross-tenant comparison is strictly forbidden.
 * 5. Deterministic Preservation: Quarantined records preserve both conflicting versions with checksums.
 */

import {
  KnowledgeEpistemicStatus,
  KnowledgeEntity,
  KnowledgeFact,
  Relationship,
  Evidence,
} from '../native_knowledge_architecture/types';

export const TASK_192_ID = 'CUBIO-TASK-192-KNOWLEDGE-CONTRADICTION-RESOLUTION';
export const IS_ACTUATION_BLOCKED = true;
export const MAX_CONTRADICTION_SCAN_LIMIT = 500;

export type ContradictionConflictType =
  | 'FACT_CONFLICT'
  | 'RELATIONSHIP_CONFLICT'
  | 'EVIDENCE_CONFLICT'
  | 'HISTORICAL_STATE_CONFLICT'
  | 'EPISTEMIC_CONFLICT';

export type ContradictionSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type ResolutionStrategy =
  | 'DECISIVE_EPISTEMIC_SUPERIORITY'
  | 'EMPIRICAL_EVIDENCE_SUPERIORITY'
  | 'HISTORICAL_OCC_ORDERING'
  | 'PRESERVE_AND_QUARANTINE';

/**
 * Descriptor of a detected conflict between knowledge records.
 */
export interface ConflictRecord {
  readonly conflictId: string;
  readonly tenantId: string;
  readonly conflictType: ContradictionConflictType;
  readonly severity: ContradictionSeverity;
  readonly conflictingRecordIds: readonly string[];
  readonly records: readonly unknown[];
  readonly reason: string;
  readonly detectedAt: number;
}

/**
 * Result of a deterministic resolution attempt.
 */
export interface ResolutionResult {
  readonly conflictId: string;
  readonly resolved: boolean;
  readonly strategyApplied: ResolutionStrategy;
  readonly winningRecordId?: string;
  readonly quarantineId?: string;
  readonly resolutionProofNotes: string;
  readonly resolvedRecord?: unknown;
}

/**
 * Explicit quarantined knowledge record when resolution cannot be proven.
 */
export interface QuarantineRecord {
  readonly quarantineId: string;
  readonly tenantId: string;
  readonly conflictType: ContradictionConflictType;
  readonly conflictingRecordIds: readonly string[];
  readonly conflictingRecords: readonly unknown[];
  readonly quarantineState: 'CONTRADICTION_QUARANTINED';
  readonly reason: string;
  readonly checksum: string;
  readonly quarantinedAt: number;
}

/**
 * Historical state record for checking OCC fork contradictions.
 */
export interface HistoricalStateRecord {
  readonly canonicalId: string;
  readonly tenantId: string;
  readonly stateVersion: number;
  readonly checksum: string;
  readonly payloadHash: string;
  readonly timestamp: number;
}

/**
 * Contradiction audit report summary.
 */
export interface ContradictionAuditReport {
  readonly tenantId: string;
  readonly scannedCount: number;
  readonly detectedConflicts: number;
  readonly resolvedCount: number;
  readonly quarantinedCount: number;
  readonly conflictTypeBreakdown: Record<ContradictionConflictType, number>;
  readonly digest: string;
}

/**
 * Phase 10 reasoning advisory emitted on contradiction detection/resolution.
 */
export interface Phase10ContradictionAdvisory {
  readonly advisoryId: string;
  readonly tenantId: string;
  readonly conflictType: ContradictionConflictType;
  readonly severity: ContradictionSeverity;
  readonly resolutionStatus: 'RESOLVED' | 'QUARANTINED';
  readonly reasonTrail: readonly string[];
  readonly affectedIds: readonly string[];
  readonly emittedAt: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Error Classes
// ─────────────────────────────────────────────────────────────────────────────

export class KnowledgeContradictionResolutionError extends Error {
  constructor(public readonly conflictId: string, message: string) {
    super(`[TASK-192] Knowledge Contradiction Resolution Error for conflict '${conflictId}': ${message}`);
    this.name = 'KnowledgeContradictionResolutionError';
  }
}

export class KnowledgeSilentOverwriteForbiddenError extends Error {
  constructor(public readonly recordId: string, message: string) {
    super(`[TASK-192] Silent Overwrite Strictly Forbidden for record '${recordId}': ${message}`);
    this.name = 'KnowledgeSilentOverwriteForbiddenError';
  }
}

export class KnowledgeContradictionTenantViolationError extends Error {
  constructor(message: string) {
    super(`[TASK-192] Cross-tenant knowledge comparison strictly forbidden: ${message}`);
    this.name = 'KnowledgeContradictionTenantViolationError';
  }
}

export class KnowledgeContradictionActuationBlockedError extends Error {
  constructor(action: string) {
    super(`[TASK-192] Actuation permanently blocked (IS_ACTUATION_BLOCKED = true). Attempted action: ${action}`);
    this.name = 'KnowledgeContradictionActuationBlockedError';
  }
}
