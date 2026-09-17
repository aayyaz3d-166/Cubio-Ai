/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel F11: Spatial World Model & Reasoning Layer
 * Core Type Definitions
 *
 * Epistemic Invariants:
 * - ΔReality = 0 (Physical Reality remains immutable)
 * - Determinism: σ² = 0
 * - Inferred relations are strictly DERIVED and never promoted to OBSERVED.
 */

// ─── Entity Classifications ───
export type WorldEntityType =
  | 'OBJECT'
  | 'REGION'
  | 'CONTAINER'
  | 'SPATIAL_ENTITY'
  | 'ABSTRACT_ENTITY';

export type WorldEntityOrigin =
  | 'OBSERVED'
  | 'RECONSTRUCTED'
  | 'DERIVED'
  | 'USER_CONSTRUCTED'
  | 'HYPOTHETICAL'
  | 'INFERRED'
  | 'IMPORTED'
  | 'UNKNOWN';

export type WorldEntityCertainty =
  | 'EXACT'
  | 'CONSTRAINED'
  | 'ESTIMATED'
  | 'HYPOTHETICAL'
  | 'UNKNOWN';

// ─── Evidence & Epistemic Status ───
export type EvidenceType =
  | 'OBSERVED'
  | 'EXPLICITLY_PROVIDED'
  | 'DERIVED_FROM_GEOMETRY'
  | 'DERIVED_FROM_TOPOLOGY'
  | 'DERIVED_FROM_RELATIONSHIP_CHAIN'
  | 'DERIVED_FROM_WORLD_MODEL'
  | 'PREDICTED'
  | 'UNKNOWN'
  | 'AMBIGUOUS';

// ─── Spatial Relationship Types ───
export type WorldRelationType =
  | 'ABOVE'
  | 'BELOW'
  | 'LEFT_OF'
  | 'RIGHT_OF'
  | 'FRONT_OF'
  | 'BEHIND'
  | 'NEAR'
  | 'FAR'
  | 'ADJACENT'
  | 'DISJOINT'
  | 'OVERLAPS'
  | 'CONTAINS'
  | 'INSIDE'
  | 'INTERSECTS'
  | 'CONNECTED_TO'
  | 'BETWEEN'
  | 'ALIGNED_WITH'
  | 'CENTERED_ON';

export type RelationCategory = 'DIRECT' | 'INFERRED' | 'HYPOTHETICAL';

export type ConstraintEvaluationStatus = 'SATISFIED' | 'VIOLATED' | 'UNKNOWN' | 'AMBIGUOUS';

export type WorldModelSyncStatus = 'SYNCED' | 'STALE' | 'RESYNC_REQUIRED' | 'RESYNCED';

// ─── Provenance & Lineage ───
export interface WorldProvenance {
  readonly actorId: string;
  readonly reason: string;
  readonly sourceDomain: 'REALITY' | 'WORKSPACE' | 'GEOMETRY' | 'F10_INTENT' | 'WORLD_MODEL' | 'REASONING';
  readonly timestamp: number;
}

export interface WorldLineage {
  readonly lineageId: string;
  readonly realityStateId: string;
  readonly workspaceObjectId?: string | null;
  readonly geometryId?: string | null;
  readonly worldEntityId: string;
  readonly parentEntityId?: string | null;
  readonly derivationSource?: string | null;
  readonly version: number;
}

// ─── Core World Entity ───
export interface WorldEntity {
  readonly entityId: string;
  readonly name: string;
  readonly entityType: WorldEntityType;
  readonly origin: WorldEntityOrigin;
  readonly certainty: WorldEntityCertainty;
  readonly provenance: WorldProvenance;
  readonly lineage: WorldLineage;
  readonly coordinates?: readonly [number, number, number];
  readonly dimensions?: {
    readonly width: number;
    readonly height: number;
    readonly depth: number;
    readonly radius?: number;
  };
  readonly transform?: {
    readonly translation: readonly [number, number, number];
    readonly rotation: readonly [number, number, number];
    readonly scale: readonly [number, number, number];
  };
  readonly properties: Readonly<Record<string, any>>;
  readonly parentEntityId?: string | null;
  readonly entityChecksum: string;
}

// ─── Evidence & Relationships ───
export interface Evidence {
  readonly evidenceId: string;
  readonly evidenceType: EvidenceType;
  readonly sourceFactIds: readonly string[];
  readonly method: string;
  readonly description: string;
  readonly evidenceChecksum: string;
}

export interface EvidenceChain {
  readonly chainId: string;
  readonly steps: readonly Evidence[];
  readonly isRootedInReality: boolean;
  readonly chainChecksum: string;
}

export interface WorldRelation {
  readonly relationId: string;
  readonly sourceEntityId: string;
  readonly targetEntityId: string;
  readonly relationType: WorldRelationType;
  readonly category: RelationCategory;
  readonly evidence: Evidence;
  readonly confidence: number; // 0.0 - 1.0
  readonly parameters?: Readonly<Record<string, any>>;
  readonly relationChecksum: string;
}

// ─── Inference & Reasoning Rules ───
export interface InferenceRule {
  readonly ruleId: string;
  readonly ruleName: string;
  readonly premiseRelations: readonly WorldRelationType[];
  readonly conclusionRelation: WorldRelationType;
  readonly evidenceType: EvidenceType;
  readonly isTransitive: boolean;
  readonly description: string;
}

export interface Inference {
  readonly inferenceId: string;
  readonly ruleId: string;
  readonly derivedRelation: WorldRelation;
  readonly sourceRelationIds: readonly string[];
  readonly reasoningPath: readonly string[];
  readonly evidence: Evidence;
  readonly confidence: number;
  readonly lineage: WorldLineage;
  readonly inferenceChecksum: string;
}

export interface ReasoningStep {
  readonly stepIndex: number;
  readonly premiseDescription: string;
  readonly ruleUsed: string;
  readonly intermediateConclusion: string;
  readonly evidence: Evidence;
}

export interface ReasoningTrace {
  readonly traceId: string;
  readonly query: string;
  readonly steps: readonly ReasoningStep[];
  readonly finalConclusion: string;
  readonly evidenceChain: EvidenceChain;
  readonly realityMutation: 0;
  readonly traceChecksum: string;
}

// ─── Spatial Queries & Results ───
export type SpatialQueryType =
  | 'OBJECTS_RELATION'
  | 'BETWEEN'
  | 'SUPERLATIVE'
  | 'PATH'
  | 'CHANGES'
  | 'EXPLANATION'
  | 'CONNECTED'
  | 'GENERAL';

export interface SpatialQuery {
  readonly queryId: string;
  readonly queryType: SpatialQueryType;
  readonly sourceText: string;
  readonly targetEntityId?: string | null;
  readonly referenceEntityId?: string | null;
  readonly secondaryReferenceEntityId?: string | null;
  readonly relationType?: WorldRelationType | null;
  readonly superlative?: 'LEFTMOST' | 'RIGHTMOST' | 'HIGHEST' | 'LOWEST' | 'NEAREST' | null;
}

export interface SpatialQueryResult {
  readonly queryId: string;
  readonly status: 'SUCCESS' | 'AMBIGUOUS' | 'NOT_FOUND' | 'UNKNOWN';
  readonly matchedEntityIds: readonly string[];
  readonly relations: readonly WorldRelation[];
  readonly inferences: readonly Inference[];
  readonly explanation: string;
  readonly reasoningTrace: ReasoningTrace | null;
  readonly evidence: Evidence | null;
  readonly confidence: number;
  readonly realityMutation: 0;
  readonly resultChecksum: string;
}

// ─── Constraints & Evaluation ───
export interface SpatialConstraint {
  readonly constraintId: string;
  readonly subjectEntityId: string;
  readonly relationType: WorldRelationType;
  readonly targetEntityId: string;
  readonly secondaryTargetEntityId?: string;
  readonly description: string;
}

export interface ConstraintEvaluation {
  readonly constraintId: string;
  readonly status: ConstraintEvaluationStatus;
  readonly reason: string;
  readonly evidence: Evidence | null;
}

// ─── Spatial Planning & Counterfactuals ───
export interface SpatialPlan {
  readonly planId: string;
  readonly goalDescription: string;
  readonly targetEntityId: string;
  readonly referenceEntityId?: string;
  readonly requiredOperation: string;
  readonly expectedPosition: readonly [number, number, number];
  readonly affectedRelations: readonly WorldRelation[];
  readonly constraints: readonly SpatialConstraint[];
  readonly isExecutable: boolean;
  readonly status: 'PLAN_READY' | 'REJECTED' | 'INVALID';
  readonly planChecksum: string;
}

export interface CounterfactualState {
  readonly counterfactualId: string;
  readonly originalModelChecksum: string;
  readonly hypotheticalChangeDescription: string;
  readonly originalRelations: readonly WorldRelation[];
  readonly hypotheticalRelations: readonly WorldRelation[];
  readonly addedRelations: readonly WorldRelation[];
  readonly removedRelations: readonly WorldRelation[];
  readonly changedRelations: readonly {
    readonly original: WorldRelation;
    readonly updated: WorldRelation;
  }[];
  readonly realityUnchanged: true;
  readonly realityMutation: 0;
}

// ─── Diff & Versions ───
export interface EntityChange {
  readonly entityId: string;
  readonly changeType: 'CREATED' | 'REMOVED' | 'CHANGED' | 'UNCHANGED';
  readonly details?: string;
}

export interface RelationChange {
  readonly relationId: string;
  readonly changeType: 'CREATED' | 'REMOVED' | 'CHANGED' | 'UNCHANGED';
  readonly details?: string;
}

export interface WorldModelDiff {
  readonly diffId: string;
  readonly previousVersion: number;
  readonly currentVersion: number;
  readonly entityChanges: readonly EntityChange[];
  readonly relationChanges: readonly RelationChange[];
  readonly isIdentical: boolean;
}

// ─── Master World Model ───
export interface WorldModel {
  readonly modelId: string;
  readonly version: number;
  readonly realityStateId: string;
  readonly workspaceId: string;
  readonly entities: Readonly<Record<string, WorldEntity>>;
  readonly relations: readonly WorldRelation[];
  readonly inferences: readonly Inference[];
  readonly constraints: readonly SpatialConstraint[];
  readonly realityChecksum: string;
  readonly workspaceChecksum: string;
  readonly modelChecksum: string;
  readonly graphChecksum: string;
  readonly syncStatus: WorldModelSyncStatus;
  readonly timestamp: number;
}

// ─── Snapshots, Validation & Execution Signatures ───
export interface WorldModelSnapshot {
  readonly snapshotId: string;
  readonly model: WorldModel;
  readonly reasoningTraces: readonly ReasoningTrace[];
  readonly schemaVersion: 'R11_SNAPSHOT_V1';
  readonly timestamp: number;
}

export type WorldModelValidationStatus =
  | 'VALID'
  | 'DUPLICATE_ID'
  | 'MISSING_ENTITY'
  | 'ORPHAN_RELATION'
  | 'CIRCULAR_LINEAGE'
  | 'NON_FINITE_VALUE'
  | 'INVALID_CONFIDENCE'
  | 'UNAUTHORIZED_EVIDENCE_PROMOTION'
  | 'CHECKSUM_MISMATCH'
  | 'UNKNOWN_ERROR';

export interface WorldModelValidationReport {
  readonly isValid: boolean;
  readonly status: WorldModelValidationStatus;
  readonly issues: readonly string[];
  readonly reportChecksum: string;
}

export interface F11CausalityEvent {
  readonly eventId: string;
  readonly operation: string;
  readonly domain: string;
  readonly realityChecksumBefore: string;
  readonly realityChecksumAfter: string;
  readonly isRealityInvariant: boolean;
  readonly sequence: number;
  readonly timestamp: number;
}

export interface WorldModelExecutionSignature {
  readonly realityChecksum: string;
  readonly modelChecksum: string;
  readonly graphChecksum: string;
  readonly inferenceChecksum: string;
  readonly entityCount: number;
  readonly relationCount: number;
  readonly inferenceCount: number;
  readonly queryCount: number;
  readonly modelVersion: number;
  readonly syncStatus: string;
  readonly isCausalityValid: boolean;
  readonly executionHash: string;
}
