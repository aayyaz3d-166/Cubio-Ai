/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R5: Observable Reality Spatial Relationship & Topology Engine — Types
 *
 * Core Principle:
 * Spatial relationships calculated from coordinates or geometry remain DERIVED representations
 * and do not constitute independent observation or discovery of unobserved physical reality.
 *
 * Unidirectional causality: All downstream spatial analysis preserves Delta Reality = 0.
 */

export type SpatialDirectionType =
  | 'ABOVE'
  | 'BELOW'
  | 'LEFT'
  | 'RIGHT'
  | 'FRONT'
  | 'BEHIND'
  | 'SAME_POSITION'
  | 'UNKNOWN';

export type SpatialTopologicalType =
  | 'NEAR'
  | 'FAR'
  | 'ADJACENT'
  | 'DISJOINT'
  | 'OVERLAPS'
  | 'CONTAINS'
  | 'INSIDE'
  | 'INTERSECTS'
  | 'UNKNOWN';

export type SpatialRelationType = SpatialDirectionType | SpatialTopologicalType;

export type SpatialRelationEvidence =
  | 'OBSERVED'
  | 'EXPLICITLY_PROVIDED'
  | 'DERIVED_FROM_GEOMETRY'
  | 'DERIVED_FROM_TOPOLOGY'
  | 'UNKNOWN';

export type SpatialRelationCertainty = 'EXACT' | 'CONSTRAINED' | 'AMBIGUOUS' | 'UNKNOWN';

export type SpatialRelationOrigin = 'OBSERVED' | 'RECONSTRUCTED' | 'DERIVED' | 'AMBIGUOUS';

export interface SpatialDistance {
  readonly euclideanDistance: number;
  readonly axisDeltas: readonly [number, number, number]; // [dx, dy, dz] = target - source
  readonly metricClassification: 'SAME_POSITION' | 'NEAR' | 'FAR' | 'UNKNOWN';
}

export interface SpatialDirection {
  readonly primaryDirection: SpatialDirectionType;
  readonly axisDominance: 'X' | 'Y' | 'Z' | 'NONE';
  readonly directionalVectors: readonly [number, number, number]; // normalized direction vector or [0,0,0]
}

export interface SpatialContainment {
  readonly classification: 'CONTAINS' | 'INSIDE' | 'OVERLAPS' | 'INTERSECTS' | 'DISJOINT' | 'UNKNOWN';
  readonly overlapVolumeRatio?: number;
}

export interface SpatialRelationProvenance {
  readonly evaluatorId: string;
  readonly method: string;
  readonly notes?: string;
}

export interface SpatialRelationLineage {
  readonly lineageId: string;
  readonly rootRelationId: string;
  readonly version: number;
}

export interface SpatialRelation {
  readonly relationId: string;
  readonly sourceObjectId: string;
  readonly targetObjectId: string;
  readonly targetRealityStateId: string;
  readonly relationType: SpatialRelationType;
  readonly evidence: SpatialRelationEvidence;
  readonly certainty: SpatialRelationCertainty;
  readonly origin: SpatialRelationOrigin;
  readonly distance: SpatialDistance;
  readonly direction: SpatialDirection;
  readonly containment: SpatialContainment;
  readonly provenance: SpatialRelationProvenance;
  readonly lineage: SpatialRelationLineage;
  readonly relationChecksum: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface SpatialRelationQuery {
  readonly sourceObjectId: string;
  readonly targetObjectId: string;
  readonly requestedType?: SpatialRelationType;
}

export interface SpatialRelationResult {
  readonly query: SpatialRelationQuery;
  readonly directRelation: SpatialRelation | null;
  readonly derivedRelation: SpatialRelation | null;
  readonly pathFound: boolean;
  readonly isDirect: boolean;
  readonly hopCount: number;
}

export interface SpatialNode {
  readonly objectId: string;
  readonly realityStateId: string;
  readonly coordinates?: readonly [number, number, number];
  readonly dimensions?: readonly [number, number, number];
  readonly objectChecksum: string;
}

export interface SpatialEdge {
  readonly edgeId: string;
  readonly relation: SpatialRelation;
  readonly isDirect: boolean;
}

export interface SpatialTopologyGraph {
  readonly graphId: string;
  readonly realityStateId: string;
  readonly nodes: readonly SpatialNode[];
  readonly edges: readonly SpatialEdge[];
  readonly graphChecksum: string;
}

export type SpatialValidationStatus =
  | 'SPATIAL_VALID'
  | 'INVALID_RELATION_ID'
  | 'NON_FINITE_COORDINATES'
  | 'INVALID_DIMENSIONS'
  | 'MISSING_SOURCE_OBJECT'
  | 'MISSING_TARGET_OBJECT'
  | 'INVALID_SELF_REFERENCE'
  | 'ORPHAN_EDGE'
  | 'DUPLICATE_RELATION_ID'
  | 'CHECKSUM_MISMATCH'
  | 'BROKEN_REALITY_REFERENCE';

export interface SpatialValidationReport {
  readonly status: SpatialValidationStatus;
  readonly isValid: boolean;
  readonly issues: readonly string[];
  readonly relationId?: string;
  readonly reportChecksum: string;
}

export interface SpatialSnapshot {
  readonly snapshotId: string;
  readonly realityStateId: string;
  readonly realityStateChecksum: string;
  readonly relations: readonly SpatialRelation[];
  readonly topology: SpatialTopologyGraph;
  readonly snapshotChecksum: string;
  readonly schemaVersion: string;
  readonly timestamp: number;
}

export interface SpatialExecutionSignature {
  readonly realityStateChecksum: string;
  readonly topologyChecksum: string;
  readonly relationCount: number;
  readonly nodeCount: number;
  readonly executionHash: string;
}

export type SpatialDiffFieldStatus = 'CHANGED' | 'UNCHANGED' | 'UNKNOWN';

export interface SpatialDiffField<T> {
  readonly status: SpatialDiffFieldStatus;
  readonly before?: T;
  readonly after?: T;
}

export interface SpatialDiff {
  readonly relationAId: string;
  readonly relationBId: string;
  readonly relationType: SpatialDiffField<SpatialRelationType>;
  readonly evidence: SpatialDiffField<SpatialRelationEvidence>;
  readonly certainty: SpatialDiffField<SpatialRelationCertainty>;
  readonly distance: SpatialDiffField<number>;
  readonly direction: SpatialDiffField<SpatialDirectionType>;
  readonly isIdentical: boolean;
}
