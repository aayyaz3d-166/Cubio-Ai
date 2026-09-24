/**
 * CUBiO AI — Task 185: Native Knowledge Acquisition & Ingestion Pipeline
 * src/cubio/model/native_knowledge_acquisition/types.ts
 *
 * Types and interfaces for native deterministic knowledge acquisition:
 * - RawKnowledgeDocument
 * - Extracted Candidates (Entity, Fact, Concept, Evidence)
 * - Ingestion Configuration & Metrics
 * - IngestionBatchReceipt
 *
 * STRICT INVARIANTS:
 * 1. Hardware Actuation Lockout: IS_ACTUATION_BLOCKED === true permanently.
 * 2. VDB Primacy: VDB is sole persistent authority; no external databases.
 * 3. Determinism: 100% native deterministic parsing; zero external AI/LLMs.
 * 4. Tenant Isolation & Lineage: Full provenance and strict tenant validation.
 */

import {
  KnowledgeEpistemicStatus,
  KnowledgeRelationType,
} from '../native_knowledge_architecture/types';

export const TASK_185_ID = 'CUBIO-TASK-185-KNOWLEDGE-ACQUISITION-INGESTION';
export const IS_ACTUATION_BLOCKED = true;

/**
 * Raw unstructured or semi-structured knowledge document for ingestion.
 */
export interface RawKnowledgeDocument {
  readonly documentId: string;
  readonly tenantId: string;
  readonly content: string;
  readonly mimeType?: string;
  readonly sourceUri?: string;
  readonly checksum: string;        // SHA-256 of raw content
  readonly timestamp: number;
}

/**
 * Extracted candidate entity prior to validation.
 */
export interface CandidateEntity {
  readonly candidateId: string;
  readonly name: string;
  readonly category: string;
  readonly address369: number;
  readonly epistemicStatus: KnowledgeEpistemicStatus;
  readonly confidence: number;      // [0.0..1.0]
  readonly properties?: Readonly<Record<string, unknown>>;
  readonly rawExcerpt: string;
}

/**
 * Extracted candidate fact ($S, P, O$) prior to validation.
 */
export interface CandidateFact {
  readonly candidateId: string;
  readonly subject: string;
  readonly predicate: string;
  readonly object: string;
  readonly address369: number;
  readonly epistemicStatus: KnowledgeEpistemicStatus;
  readonly confidence: number;
  readonly rawExcerpt: string;
}

/**
 * Extracted candidate semantic concept prior to validation.
 */
export interface CandidateConcept {
  readonly candidateId: string;
  readonly label: string;
  readonly domain: string;
  readonly definition: string;
  readonly address369: number;
  readonly epistemicStatus: KnowledgeEpistemicStatus;
  readonly confidence: number;
  readonly rawExcerpt: string;
}

/**
 * Extracted candidate evidence assertion.
 */
export interface CandidateEvidence {
  readonly candidateId: string;
  readonly sourceType: 'DIRECT_OBSERVATION' | 'EMPIRICAL_MEASUREMENT' | 'DEDUCTIVE_PROOF';
  readonly content: string;
  readonly confidence: number;
  readonly spatialCellId?: number;
}

/**
 * Composite container of all extracted candidates from a raw document.
 */
export interface ExtractedKnowledgeCandidates {
  readonly documentId: string;
  readonly tenantId: string;
  readonly entities: readonly CandidateEntity[];
  readonly facts: readonly CandidateFact[];
  readonly concepts: readonly CandidateConcept[];
  readonly evidences: readonly CandidateEvidence[];
  readonly extractionChecksum: string;
}

/**
 * Configuration options for extraction.
 */
export interface ExtractionConfig {
  readonly maxCandidates?: number;
  readonly minConfidenceThreshold?: number;
  readonly defaultAddress369?: number;
  readonly targetDomain?: string;
  readonly allowedPredicates?: readonly string[];
}

/**
 * Candidate validation verdict.
 */
export interface CandidateValidationVerdict {
  readonly isValid: boolean;
  readonly candidateId: string;
  readonly violations: readonly string[];
  readonly assignedEpistemicStatus: KnowledgeEpistemicStatus;
  readonly adjustedConfidence: number;
}

/**
 * Cryptographically sealed receipt for an ingestion batch.
 */
export interface IngestionBatchReceipt {
  readonly batchId: string;
  readonly tenantId: string;
  readonly documentId: string;
  readonly sourceChecksum: string;
  readonly entitiesRegistered: number;
  readonly factsRegistered: number;
  readonly conceptsRegistered: number;
  readonly evidencesRegistered: number;
  readonly batchHash: string;
  readonly timestamp: number;
  readonly executionTimeMs: number;
}

/**
 * Error classes for ingestion safety boundaries.
 */
export class IngestionActuationBlockedError extends Error {
  constructor(directive: string) {
    super(`[IngestionActuationBlockedError] Hardware actuation directive "${directive}" detected in ingestion stream. Permanently rejected fail-closed.`);
    this.name = 'IngestionActuationBlockedError';
  }
}

export class IngestionBufferOverflowError extends Error {
  constructor(bufferBytes: number, maxBytes: number) {
    super(`[IngestionBufferOverflowError] Ingestion buffer exceeded safe memory ceiling: ${bufferBytes} B > ${maxBytes} B.`);
    this.name = 'IngestionBufferOverflowError';
  }
}

export class IngestionValidationError extends Error {
  constructor(candidateId: string, reason: string) {
    super(`[IngestionValidationError] Candidate "${candidateId}" failed validation: ${reason}.`);
    this.name = 'IngestionValidationError';
  }
}
