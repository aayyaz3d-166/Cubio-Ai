/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R4: Observable Reality Multi-Object & Relationship Engine — Types
 *
 * Core Principle:
 * Reality != Reality State != Reality Objects != Explicit Relationships != Observations != Model != Geometry != UI
 *
 * Downstream object/relationship mutations NEVER alter authoritative Reality state.
 * Epistemic boundaries strictly preserve uncertainty, provenance, and canonical coordinates [5, 3, 6].
 */

export type RealityObjectType =
  | 'POINT'
  | 'CURVE'
  | 'SURFACE'
  | 'SOLID'
  | 'MESH'
  | 'COMPOSITE'
  | 'UNKNOWN';

export type RealityObjectCertainty = 'EXACT' | 'CONSTRAINED' | 'AMBIGUOUS' | 'UNKNOWN';

export type RealityObjectOrigin = 'OBSERVED' | 'RECONSTRUCTED' | 'DERIVED' | 'AMBIGUOUS';

export type RealityRelationshipType =
  | 'CONTAINS'
  | 'CONTAINED_BY'
  | 'CONNECTED_TO'
  | 'ADJACENT_TO'
  | 'TOUCHES'
  | 'OVERLAPS'
  | 'SEPARATE_FROM'
  | 'ALIGNED_WITH'
  | 'ABOVE'
  | 'BELOW'
  | 'LEFT_OF'
  | 'RIGHT_OF'
  | 'FRONT_OF'
  | 'BEHIND'
  | 'PARENT_OF'
  | 'CHILD_OF'
  | 'CUSTOM';

export type RealityRelationshipEvidence =
  | 'OBSERVED'
  | 'EXPLICITLY_PROVIDED'
  | 'DERIVED_FROM_GEOMETRY'
  | 'DERIVED_FROM_TOPOLOGY'
  | 'UNKNOWN';

export interface RealityObjectIdentity {
  readonly objectId: string;
  readonly targetRealityId: string;
  readonly targetRealityStateId: string;
  readonly schemaVersion: string;
}

export interface RealityObjectGeometryReference {
  readonly geometryType: RealityObjectType;
  readonly geometryReferenceId?: string;
  readonly topologyClassification?: string;
}

export interface RealityObjectObservationReference {
  readonly observationId: string;
  readonly observationChecksum: string;
}

export interface RealityObjectProvenance {
  readonly creatorId: string;
  readonly source: string;
  readonly captureInstrument?: string;
  readonly notes?: string;
}

export interface RealityObjectLineage {
  readonly lineageId: string;
  readonly rootObjectId: string;
  readonly parentObjectId: string | null;
  readonly version: number;
  readonly depth: number;
}

export interface RealityObjectState {
  readonly stateId: string;
  readonly objectId: string;
  readonly version: number;
  readonly coordinates?: readonly [number, number, number];
  readonly dimensions?: readonly [number, number, number];
  readonly certainty: RealityObjectCertainty;
  readonly origin: RealityObjectOrigin;
  readonly checksum: string;
  readonly timestamp: number;
}

export interface RealityObject {
  readonly identity: RealityObjectIdentity;
  readonly name: string;
  readonly objectType: RealityObjectType;
  readonly coordinates?: readonly [number, number, number];
  readonly dimensions?: readonly [number, number, number];
  readonly certainty: RealityObjectCertainty;
  readonly origin: RealityObjectOrigin;
  readonly provenance: RealityObjectProvenance;
  readonly lineage: RealityObjectLineage;
  readonly geometryReference: RealityObjectGeometryReference;
  readonly observationReferences: readonly RealityObjectObservationReference[];
  readonly realityStateChecksum: string;
  readonly objectChecksum: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface RealityRelationshipLineage {
  readonly lineageId: string;
  readonly relationshipId: string;
  readonly version: number;
}

export interface RealityRelationship {
  readonly relationshipId: string;
  readonly sourceObjectId: string;
  readonly targetObjectId: string;
  readonly relationshipType: RealityRelationshipType;
  readonly evidence: RealityRelationshipEvidence;
  readonly certainty: RealityObjectCertainty;
  readonly origin: RealityObjectOrigin;
  readonly provenance: string;
  readonly targetRealityStateId: string;
  readonly observationReferences: readonly string[];
  readonly lineage: RealityRelationshipLineage;
  readonly relationshipChecksum: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface RealityObjectCollection {
  readonly collectionId: string;
  readonly realityStateId: string;
  readonly objects: readonly RealityObject[];
  readonly relationships: readonly RealityRelationship[];
  readonly collectionChecksum: string;
}

export type ObjectDiffFieldStatus = 'CHANGED' | 'UNCHANGED' | 'UNKNOWN';

export interface ObjectDiffField<T> {
  readonly status: ObjectDiffFieldStatus;
  readonly before?: T;
  readonly after?: T;
}

export interface RealityObjectDiff {
  readonly objectAId: string;
  readonly objectBId: string;
  readonly coordinates: ObjectDiffField<readonly [number, number, number]>;
  readonly dimensions: ObjectDiffField<readonly [number, number, number]>;
  readonly certainty: ObjectDiffField<RealityObjectCertainty>;
  readonly origin: ObjectDiffField<RealityObjectOrigin>;
  readonly objectType: ObjectDiffField<RealityObjectType>;
  readonly checksumChanged: boolean;
  readonly isIdentical: boolean;
}

export type ObjectValidationStatus =
  | 'OBJECT_VALID'
  | 'INVALID_OBJECT_ID'
  | 'NON_FINITE_COORDINATES'
  | 'INVALID_DIMENSIONS'
  | 'CHECKSUM_MISMATCH'
  | 'BROKEN_LINEAGE'
  | 'BROKEN_REALITY_REFERENCE'
  | 'DUPLICATE_OBJECT_ID'
  | 'FABRICATED_PROVENANCE';

export interface RealityObjectValidationReport {
  readonly status: ObjectValidationStatus;
  readonly isValid: boolean;
  readonly issues: readonly string[];
  readonly objectId: string;
  readonly reportChecksum: string;
}

export type RelationshipValidationStatus =
  | 'RELATIONSHIP_VALID'
  | 'INVALID_RELATIONSHIP_ID'
  | 'MISSING_SOURCE_OBJECT'
  | 'MISSING_TARGET_OBJECT'
  | 'INVALID_SELF_REFERENCE'
  | 'INVALID_RELATIONSHIP_TYPE'
  | 'CHECKSUM_MISMATCH'
  | 'DUPLICATE_RELATIONSHIP_ID'
  | 'ORPHAN_EDGE';

export interface RealityRelationshipValidationReport {
  readonly status: RelationshipValidationStatus;
  readonly isValid: boolean;
  readonly issues: readonly string[];
  readonly relationshipId: string;
  readonly reportChecksum: string;
}

export interface RealityMultiObjectSnapshot {
  readonly snapshotId: string;
  readonly realityStateId: string;
  readonly realityStateChecksum: string;
  readonly objects: readonly RealityObject[];
  readonly relationships: readonly RealityRelationship[];
  readonly collectionChecksum: string;
  readonly snapshotChecksum: string;
  readonly schemaVersion: string;
  readonly timestamp: number;
}

export interface RealityMultiObjectExecutionSignature {
  readonly realityStateChecksum: string;
  readonly collectionChecksum: string;
  readonly objectCount: number;
  readonly relationshipCount: number;
  readonly executionHash: string;
}

export interface RealityObjectReference {
  readonly referenceId: string;
  readonly objectId: string;
  readonly realityStateId: string;
  readonly domain: 'OBJECT' | 'MODEL' | 'GEOMETRY' | 'WORKSPACE';
  readonly referenceChecksum: string;
}
