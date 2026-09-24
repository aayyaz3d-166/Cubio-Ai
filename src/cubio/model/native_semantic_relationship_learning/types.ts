/**
 * CUBiO AI — Task 188: Native Semantic Relationship Learning
 * src/cubio/model/native_semantic_relationship_learning/types.ts
 *
 * Types and interfaces for native semantic relationship learning:
 * - SemanticRelationType
 * - InferredRelationshipCandidate
 * - RelationshipInferenceConfig
 * - RelationshipLearningSummary
 * - Safety errors and invariants
 *
 * STRICT INVARIANTS:
 * 1. Hardware Actuation Lockout: IS_ACTUATION_BLOCKED === true permanently.
 * 2. VDB Primacy: VDB is sole persistent authority; .3dmemory is transport only.
 * 3. Epistemic Anti-Inflation: Inferred claims capped at DERIVED, THEORY, or HYPOTHESIS.
 * 4. Bounded Traversal: Recursion explosion strictly bounded by depth & candidate ceilings.
 * 5. Determinism: 100% native rule-based inference; zero external models or APIs.
 */

import {
  KnowledgeEpistemicStatus,
  KnowledgeRelationType,
} from '../native_knowledge_architecture/types';

export const TASK_188_ID = 'CUBIO-TASK-188-SEMANTIC-RELATIONSHIP-LEARNING';
export const IS_ACTUATION_BLOCKED = true;

/**
 * Supported Semantic Relationship Types.
 */
export type SemanticRelationType =
  | 'IS_A'
  | 'PART_OF'
  | 'DEPENDS_ON'
  | 'CAUSES'
  | 'RELATED_TO'
  | 'DERIVES_FROM'
  | 'MAPS_TO'
  | 'CONSTRAINS'
  | 'LOCATED_IN';

/**
 * Inferred Relationship Candidate structure with derivation lineage.
 */
export interface InferredRelationshipCandidate {
  readonly candidateId: string;
  readonly sourceId: string;
  readonly targetId: string;
  readonly relationType: SemanticRelationType;
  readonly confidence: number;           // [0.0..1.0] discounted per inference rule
  readonly epistemicStatus: KnowledgeEpistemicStatus;
  readonly supportingEvidenceIds: readonly string[];
  readonly derivationRule: string;       // e.g. "TRANSITIVITY_IS_A", "CAUSAL_CHAIN"
  readonly premises: readonly string[];  // IDs of input edges/facts used as premises
  readonly tenantId: string;
  readonly derivationDepth: number;      // 1-indexed hop distance
  readonly checksum: string;             // SHA-256 derivation checksum
  readonly isDirected: boolean;
}

/**
 * Relationship Inference Engine Configuration.
 */
export interface RelationshipInferenceConfig {
  readonly maxInferenceDepth?: number;       // Default 2, hard max 4
  readonly maxCandidates?: number;           // Default 64, hard max 256
  readonly minConfidenceThreshold?: number;  // Default 0.30
  readonly allowCycles?: boolean;            // Default false
  readonly targetRelations?: readonly SemanticRelationType[];
}

/**
 * Relationship Learning Summary Report.
 */
export interface RelationshipLearningSummary {
  readonly tenantId: string;
  readonly inputRelationshipsCount: number;
  readonly inferredCandidatesCount: number;
  readonly rulesTriggered: Readonly<Record<string, number>>;
  readonly epistemicDistribution: Readonly<Record<KnowledgeEpistemicStatus, number>>;
  readonly executionTimeMs: number;
  readonly digest: string;
}

/**
 * Error classes for Semantic Relationship Learning boundaries.
 */
export class SemanticExplosionLimitError extends Error {
  constructor(limitName: string, value: number, ceiling: number) {
    super(
      `[SemanticExplosionLimitError] Bounded limit "${limitName}" exceeded: attempted ${value}, ceiling is ${ceiling}. Fail-closed.`
    );
    this.name = 'SemanticExplosionLimitError';
  }
}

export class SemanticUnsupportedClaimError extends Error {
  constructor(candidateId: string, reason: string) {
    super(
      `[SemanticUnsupportedClaimError] Inferred relationship "${candidateId}" rejected: unsupported claim (${reason}).`
    );
    this.name = 'SemanticUnsupportedClaimError';
  }
}

export class SemanticActuationBlockedError extends Error {
  constructor(directive: string) {
    super(
      `[SemanticActuationBlockedError] Hardware actuation directive "${directive}" detected. Permanently blocked fail-closed.`
    );
    this.name = 'SemanticActuationBlockedError';
  }
}

export class SemanticTenantViolationError extends Error {
  constructor(callerTenant: string, targetTenant: string) {
    super(
      `[SemanticTenantViolationError] Cross-tenant semantic operation rejected: caller "${callerTenant}" cannot access target "${targetTenant}".`
    );
    this.name = 'SemanticTenantViolationError';
  }
}
