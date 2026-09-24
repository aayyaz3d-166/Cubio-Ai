/**
 * CUBiO AI — Task 194: Native Research and Information Synthesis
 * src/cubio/model/native_research_synthesis/types.ts
 *
 * Types, interfaces, summary records, and error classes for
 * native research synthesis, epistemic state partitioning, citation tracking,
 * and anti-fabrication uncertainty representation.
 *
 * STRICT INVARIANTS:
 * 1. Hardware Actuation Lockout: IS_ACTUATION_BLOCKED === true permanently.
 * 2. Anti-Fabrication: Insufficient or contradictory evidence maps explicitly to UNKNOWN.
 * 3. Epistemic Separation: Strict segregation of FACT, DERIVED, THEORY, HYPOTHESIS, UNKNOWN.
 * 4. Citation Lineage: Every conclusion carries deterministic cryptographic source citations.
 * 5. Bounded Context: Operates strictly within Phase 12 memory bounds.
 */

import { KnowledgeEpistemicStatus } from '../native_knowledge_architecture/types';

export const TASK_194_ID = 'CUBIO-TASK-194-RESEARCH-SYNTHESIS';
export const IS_ACTUATION_BLOCKED = true;
export const MAX_SYNTHESIS_CONTEXT_ITEMS = 250;

/**
 * Explicit epistemic states for research conclusions.
 */
export type ResearchEpistemicState =
  | 'FACT'
  | 'DERIVED'
  | 'THEORY'
  | 'HYPOTHESIS'
  | 'UNKNOWN';

/**
 * Structured cryptographic citation attached to an assertion or conclusion.
 */
export interface ResearchCitation {
  readonly citationId: string;
  readonly sourceId: string;
  readonly provenanceId?: string;
  readonly locationUri: string;
  readonly authorOrInstrument: string;
  readonly payloadChecksum: string;
  readonly epistemicTier: KnowledgeEpistemicStatus;
}

/**
 * A formally structured research conclusion.
 */
export interface ResearchConclusion {
  readonly conclusionId: string;
  readonly statement: string;
  readonly subject: string;
  readonly predicate: string;
  readonly object: string;
  readonly epistemicState: ResearchEpistemicState;
  readonly confidence: number;
  readonly citations: readonly ResearchCitation[];
  readonly reasoningLineage: readonly string[];
  readonly evidenceChainIds: readonly string[];
  readonly uncertaintyNotes?: string;
}

/**
 * Query submitted to the research synthesis engine.
 */
export interface ResearchQuery {
  readonly queryId: string;
  readonly tenantId: string;
  readonly topic: string;
  readonly targetSubject?: string;
  readonly targetPredicate?: string;
  readonly maxContextTokens?: number;
}

/**
 * Complete synthesized research dossier.
 */
export interface ResearchSynthesisDossier {
  readonly dossierId: string;
  readonly tenantId: string;
  readonly queryTopic: string;
  readonly conclusionsByState: Record<ResearchEpistemicState, readonly ResearchConclusion[]>;
  readonly allConclusions: readonly ResearchConclusion[];
  readonly contradictionsSurfaced: readonly string[];
  readonly evidenceGaps: readonly string[];
  readonly allCitations: readonly ResearchCitation[];
  readonly synthesisDigest: string;
  readonly generatedAt: number;
}

/**
 * Phase 10 reasoning advisory emitted upon research synthesis completion.
 */
export interface Phase10SynthesisAdvisory {
  readonly advisoryId: string;
  readonly tenantId: string;
  readonly queryTopic: string;
  readonly totalConclusions: number;
  readonly breakdown: Record<ResearchEpistemicState, number>;
  readonly digest: string;
  readonly emittedAt: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Error Classes
// ─────────────────────────────────────────────────────────────────────────────

export class ResearchSynthesisError extends Error {
  constructor(message: string) {
    super(`[TASK-194] Research Synthesis Error: ${message}`);
    this.name = 'ResearchSynthesisError';
  }
}

export class ResearchTenantViolationError extends Error {
  constructor(message: string) {
    super(`[TASK-194] Cross-tenant research synthesis violation: ${message}`);
    this.name = 'ResearchTenantViolationError';
  }
}

export class ResearchActuationBlockedError extends Error {
  constructor(action: string) {
    super(`[TASK-194] Actuation permanently blocked (IS_ACTUATION_BLOCKED = true). Attempted action: ${action}`);
    this.name = 'ResearchActuationBlockedError';
  }
}

export class ResearchContextOverflowError extends Error {
  constructor(count: number, limit: number) {
    super(`[TASK-194] Research context item count ${count} exceeds maximum allowable bound of ${limit}`);
    this.name = 'ResearchContextOverflowError';
  }
}
