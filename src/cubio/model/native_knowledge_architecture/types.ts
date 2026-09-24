/**
 * CUBiO AI — Task 184: Native Knowledge Architecture
 * src/cubio/model/native_knowledge_architecture/types.ts
 *
 * Canonical data structures for sovereign knowledge representation:
 * - KnowledgeEntity
 * - KnowledgeFact
 * - Concept
 * - Relationship
 * - Evidence
 * - Provenance
 *
 * STRICT INVARIANTS:
 * 1. Hardware Actuation Lockout: IS_ACTUATION_BLOCKED === true permanently.
 * 2. Sole Knowledge Store: Primary VDB is authoritative; .3dmemory is transport only.
 * 3. Spatial Identity: Direct binding to 343 cell lattice and 369 Euler address space.
 * 4. Tenant Isolation & OCC: Monotonic state versioning and strict cross-tenant rejection.
 */

import { Coordinate3D } from '../../../types/memory';

export const TASK_184_ID = 'CUBIO-TASK-184-NATIVE-KNOWLEDGE-ARCHITECTURE';
export const IS_ACTUATION_BLOCKED = true;

/**
 * Epistemic status hierarchy in CUBiO AI sovereign runtime:
 * AXIOM (1.00) > FACT (0.90) > DERIVED (0.80) > THEORY (0.65) > OBSERVATION (0.45) > HYPOTHESIS (0.25)
 */
export type KnowledgeEpistemicStatus =
  | 'AXIOM'
  | 'FACT'
  | 'DERIVED'
  | 'THEORY'
  | 'OBSERVATION'
  | 'HYPOTHESIS';

export const EPISTEMIC_WEIGHTS: Readonly<Record<KnowledgeEpistemicStatus, number>> = Object.freeze({
  AXIOM: 1.00,
  FACT: 0.90,
  DERIVED: 0.80,
  THEORY: 0.65,
  OBSERVATION: 0.45,
  HYPOTHESIS: 0.25,
});

/**
 * Canonical Knowledge Entity representing discrete entities grounded in 3D space.
 */
export interface KnowledgeEntity {
  readonly entityId: string;
  readonly name: string;
  readonly category: string;
  readonly address369: number;       // [0..368] from address369 system
  readonly cellId343?: number;       // [0..342] if spatial
  readonly coordinate3D?: Coordinate3D; // {x, y, z} in [0..6]
  readonly tenantId: string;
  readonly stateVersion: number;     // Monotonically increasing OCC version
  readonly checksum: string;         // SHA-256 canonical hash
  readonly epistemicStatus: KnowledgeEpistemicStatus;
  readonly properties?: Readonly<Record<string, unknown>>;
  readonly createdAt: number;
  readonly updatedAt: number;
}

/**
 * Semantic Concept defining taxonomical, abstract, or domain knowledge.
 */
export interface Concept {
  readonly conceptId: string;
  readonly label: string;
  readonly domain: string;
  readonly definition: string;
  readonly address369: number;
  readonly cellId343?: number;
  readonly coordinate3D?: Coordinate3D;
  readonly tenantId: string;
  readonly stateVersion: number;
  readonly checksum: string;
  readonly epistemicStatus: KnowledgeEpistemicStatus;
  readonly attributes?: Readonly<Record<string, unknown>>;
  readonly createdAt: number;
  readonly updatedAt: number;
}

/**
 * Relationship Types for semantic adjacency and knowledge graphs.
 */
export type KnowledgeRelationType =
  | 'IS_A'
  | 'PART_OF'
  | 'CAUSES'
  | 'DERIVES_FROM'
  | 'MAPS_TO'
  | 'CONSTRAINS'
  | 'EQUAL_TO'
  | 'CORRELATES_WITH'
  | 'LOCATED_IN';

/**
 * Directed or undirected relationship between entities or concepts.
 */
export interface Relationship {
  readonly relationshipId: string;
  readonly sourceId: string;
  readonly targetId: string;
  readonly relationType: KnowledgeRelationType;
  readonly weight: number;           // [0.0..1.0]
  readonly bidirectional: boolean;
  readonly tenantId: string;
  readonly stateVersion: number;
  readonly checksum: string;
  readonly epistemicStatus: KnowledgeEpistemicStatus;
  readonly evidenceIds: readonly string[];
  readonly provenanceUri?: string;
  readonly createdAt: number;
  readonly updatedAt: number;
}

/**
 * Grounding Evidence supporting facts and assertions.
 */
export type EvidenceSourceType =
  | 'DIRECT_OBSERVATION'
  | 'DEDUCTIVE_PROOF'
  | 'EMPIRICAL_MEASUREMENT'
  | 'CANONICAL_AXIOM';

export interface Evidence {
  readonly evidenceId: string;
  readonly sourceType: EvidenceSourceType;
  readonly content: string;
  readonly sourceChecksum: string;
  readonly confidence: number;       // [0.0..1.0]
  readonly epistemicStatus: KnowledgeEpistemicStatus;
  readonly tenantId: string;
  readonly spatialCellId?: number;
  readonly lineage: readonly string[];
  readonly timestamp: number;
}

/**
 * Derivation step in a formal Provenance record.
 */
export interface DerivationStep {
  readonly stepIndex: number;
  readonly rule: string;
  readonly inputIds: readonly string[];
  readonly outputChecksum: string;
}

/**
 * Provenance structure recording complete derivation chains.
 */
export interface Provenance {
  readonly provenanceId: string;
  readonly targetId: string;
  readonly rootSourceIds: readonly string[];
  readonly derivationSteps: readonly DerivationStep[];
  readonly compositeHash: string;
  readonly tenantId: string;
  readonly timestamp: number;
}

/**
 * Knowledge Fact linking subject, predicate, and object with confidence and epistemic grounding.
 */
export interface KnowledgeFact {
  readonly factId: string;
  readonly subjectId: string;
  readonly predicate: string;
  readonly objectId: string;
  readonly epistemicStatus: KnowledgeEpistemicStatus;
  readonly confidence: number;       // [0.0..1.0]
  readonly address369: number;
  readonly cellId343?: number;
  readonly tenantId: string;
  readonly stateVersion: number;
  readonly checksum: string;
  readonly evidenceIds: readonly string[];
  readonly provenanceId?: string;
  readonly createdAt: number;
  readonly updatedAt: number;
}

/**
 * Lightweight Zero-Copy Reference Descriptor for RAM-efficient querying.
 */
export interface KnowledgeReferenceDescriptor {
  readonly objectId: string;
  readonly objectType: 'ENTITY' | 'CONCEPT' | 'FACT' | 'RELATIONSHIP';
  readonly tenantId: string;
  readonly address369: number;
  readonly cellId343?: number;
  readonly stateVersion: number;
  readonly checksum: string;
  readonly epistemicStatus: KnowledgeEpistemicStatus;
  readonly preview: string;
}

/**
 * Knowledge State Machine Lifecycle Transitions.
 */
export type KnowledgeLifecycleAction =
  | 'PROPOSE'        // Register unverified observation or speculative hypothesis (V=1)
  | 'CORROBORATE'    // Attach verified evidence, increasing confidence
  | 'DERIVE'         // Deduce through symbolic logic / proof
  | 'CANONICALIZE'   // Elevate to canonical FACT or AXIOM
  | 'REVISE'         // Update content/attributes with monotonic OCC version increment
  | 'DEPRECATE';     // Mark retired or superseded without destroying lineage

export interface KnowledgeStateTransitionEvent {
  readonly objectId: string;
  readonly objectType: 'ENTITY' | 'CONCEPT' | 'FACT' | 'RELATIONSHIP';
  readonly fromStatus: KnowledgeEpistemicStatus;
  readonly toStatus: KnowledgeEpistemicStatus;
  readonly fromVersion: number;
  readonly toVersion: number;
  readonly action: KnowledgeLifecycleAction;
  readonly tenantId: string;
  readonly justification: string;
  readonly timestamp: number;
}

/**
 * Error classes for Knowledge Architecture safety boundaries.
 */
export class KnowledgeActuationBlockedError extends Error {
  constructor(directive: string) {
    super(`[KnowledgeActuationBlockedError] Hardware actuation command "${directive}" permanently blocked fail-closed.`);
    this.name = 'KnowledgeActuationBlockedError';
  }
}

export class KnowledgeTenantViolationError extends Error {
  constructor(callerTenant: string, targetTenant: string) {
    super(`[KnowledgeTenantViolationError] Cross-tenant knowledge access prohibited: caller "${callerTenant}" cannot access target "${targetTenant}".`);
    this.name = 'KnowledgeTenantViolationError';
  }
}

export class KnowledgeOCCCollisionError extends Error {
  constructor(objectId: string, expectedVersion: number, actualVersion: number) {
    super(`[KnowledgeOCCCollisionError] OCC version collision on object "${objectId}": expected ${expectedVersion}, found ${actualVersion}.`);
    this.name = 'KnowledgeOCCCollisionError';
  }
}

export class KnowledgeEpistemicDowngradeError extends Error {
  constructor(objectId: string, fromStatus: KnowledgeEpistemicStatus, toStatus: KnowledgeEpistemicStatus) {
    super(`[KnowledgeEpistemicDowngradeError] Illegal epistemic demotion on object "${objectId}": cannot downgrade ${fromStatus} to ${toStatus}.`);
    this.name = 'KnowledgeEpistemicDowngradeError';
  }
}

export class KnowledgeIntegrityError extends Error {
  constructor(objectId: string, expectedHash: string, actualHash: string) {
    super(`[KnowledgeIntegrityError] Checksum mismatch on knowledge object "${objectId}": expected ${expectedHash}, computed ${actualHash}.`);
    this.name = 'KnowledgeIntegrityError';
  }
}
