/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R9: Observable Reality 3D Editing / Geometry Construction Boundary — Types
 *
 * Causal Model:
 * Reality → State → Observation → Reality Object → Spatial → Workspace → Visual → Interaction → Constructed Geometry → Editing → Derived Representation
 *
 * Invariants:
 * 1. Reality coordinates remain authoritative ([5,3,6]).
 * 2. USER_CONSTRUCTED geometry is NOT automatically Reality.
 * 3. ΔReality = 0 for all geometry operations.
 * 4. Every geometry retains provenance, lineage, origin, certainty.
 */

import { RealityObjectCertainty, RealityObjectOrigin } from '../r4/types';

export type GeometryOrigin = 'OBSERVED' | 'RECONSTRUCTED' | 'DERIVED' | 'USER_CONSTRUCTED' | 'IMPORTED' | 'AMBIGUOUS' | 'UNKNOWN';
export type GeometryCertainty = 'EXACT' | 'CONSTRAINED' | 'ESTIMATED' | 'HYPOTHETICAL' | 'UNKNOWN';
export type GeometryPrimitiveType = 'BOX' | 'SPHERE' | 'CYLINDER' | 'CONE' | 'TORUS' | 'PLANE';
export type GeometryDerivedFrom = 'DERIVED_FROM_GEOMETRY' | 'DERIVED_FROM_TOPOLOGY';
export type BooleanOperationType = 'UNION' | 'SUBTRACT' | 'INTERSECT';
export type MeasurementType = 'DISTANCE' | 'LENGTH' | 'ANGLE' | 'AREA' | 'VOLUME' | 'BOUNDING_BOX' | 'CENTROID';
export type GeometryStaleState = 'SYNCED' | 'STALE' | 'RESYNCED' | 'INVALID';

export type GeometryOperationType =
  | 'CREATE' | 'EDIT' | 'DELETE' | 'DUPLICATE'
  | 'BOOLEAN_UNION' | 'BOOLEAN_SUBTRACT' | 'BOOLEAN_INTERSECT'
  | 'EXTRUDE' | 'INSET' | 'BEVEL' | 'CHAMFER' | 'FILLET' | 'SUBDIVIDE' | 'MERGE' | 'SPLIT'
  | 'MIRROR' | 'ARRAY'
  | 'VERTEX_EDIT' | 'EDGE_EDIT' | 'FACE_EDIT'
  | 'MOVE' | 'ROTATE' | 'SCALE' | 'TRANSFORM'
  | 'PREVIEW' | 'COMMIT' | 'CANCEL' | 'UNDO' | 'REDO'
  | 'MEASURE' | 'ATTACH' | 'DETACH' | 'IMPORT' | 'EXPORT';

export type GeometryEditType =
  | 'VERTEX_EDIT' | 'EDGE_EDIT' | 'FACE_EDIT'
  | 'MOVE' | 'ROTATE' | 'SCALE'
  | 'EXTRUDE' | 'INSET' | 'BEVEL' | 'CHAMFER' | 'FILLET' | 'SUBDIVIDE' | 'MERGE' | 'SPLIT'
  | 'MIRROR' | 'ARRAY';

// ─── Vertex / Edge / Face ───
export interface GeometryVertex {
  readonly vertexId: string;
  readonly position: readonly [number, number, number];
  readonly normal?: readonly [number, number, number];
  readonly vertexChecksum: string;
}

export interface GeometryEdge {
  readonly edgeId: string;
  readonly vertexA: string;
  readonly vertexB: string;
  readonly edgeChecksum: string;
}

export interface GeometryFace {
  readonly faceId: string;
  readonly vertexIds: readonly string[];
  readonly edgeIds: readonly string[];
  readonly normal: readonly [number, number, number];
  readonly faceChecksum: string;
}

// ─── Topology ───
export interface GeometryTopology {
  readonly vertexCount: number;
  readonly edgeCount: number;
  readonly faceCount: number;
  readonly isManifold: boolean;
  readonly hasBoundary: boolean;
  readonly connectedComponents: number;
  readonly topologyChecksum: string;
}

// ─── Transform / Dimensions / BBox ───
export interface GeometryTransform {
  readonly translation: readonly [number, number, number];
  readonly rotation: readonly [number, number, number];
  readonly scale: readonly [number, number, number];
  readonly transformChecksum: string;
}

export interface GeometryDimensions {
  readonly width: number;
  readonly height: number;
  readonly depth: number;
  readonly radius?: number;
  readonly innerRadius?: number;
  readonly segments?: number;
}

export interface BoundingBox {
  readonly min: readonly [number, number, number];
  readonly max: readonly [number, number, number];
  readonly center: readonly [number, number, number];
  readonly size: readonly [number, number, number];
}

// ─── Reality Geometry Reference ───
export interface RealityGeometryReference {
  readonly realityObjectId: string;
  readonly realityStateId: string;
  readonly realityCoordinates: readonly [number, number, number];
  readonly realityCertainty: RealityObjectCertainty;
  readonly realityOrigin: RealityObjectOrigin;
  readonly realityChecksum: string;
}

// ─── Identity / Provenance / Lineage ───
export interface GeometryIdentity {
  readonly geometryId: string;
  readonly name: string;
  readonly geometryType: GeometryPrimitiveType | 'MESH' | 'BOOLEAN_RESULT' | 'DERIVED';
  readonly origin: GeometryOrigin;
  readonly certainty: GeometryCertainty;
  readonly createdSequence: number;
}

export interface GeometryProvenance {
  readonly actorId: string;
  readonly reason: string;
  readonly sourceDomain: 'WORKSPACE' | 'GEOMETRY' | 'BOOLEAN' | 'MEASUREMENT' | 'IMPORT';
  readonly timestamp: number;
}

export interface GeometryLineage {
  readonly lineageId: string;
  readonly realityStateId: string;
  readonly workspaceObjectId: string;
  readonly visualObjectId: string;
  readonly interactionSessionId: string;
  readonly geometryId: string;
  readonly parentGeometryId: string | null;
  readonly operationId: string | null;
  readonly derivedFrom: GeometryDerivedFrom | null;
  readonly version: number;
}

// ─── Mesh ───
export interface GeometryMesh {
  readonly meshId: string;
  readonly vertices: readonly GeometryVertex[];
  readonly edges: readonly GeometryEdge[];
  readonly faces: readonly GeometryFace[];
  readonly topology: GeometryTopology;
  readonly boundingBox: BoundingBox;
  readonly meshChecksum: string;
}

// ─── Workspace Geometry ───
export interface WorkspaceGeometry {
  readonly geometryId: string;
  readonly identity: GeometryIdentity;
  readonly mesh: GeometryMesh;
  readonly transform: GeometryTransform;
  readonly dimensions: GeometryDimensions;
  readonly realityReference: RealityGeometryReference | null;
  readonly workspaceObjectId: string;
  readonly provenance: GeometryProvenance;
  readonly lineage: GeometryLineage;
  readonly geometryChecksum: string;
}

// ─── Operations / Edits / Constructions ───
export interface GeometryOperation {
  readonly operationId: string;
  readonly operationType: GeometryOperationType;
  readonly targetGeometryIds: readonly string[];
  readonly resultGeometryId: string | null;
  readonly provenance: GeometryProvenance;
  readonly timestamp: number;
  readonly operationChecksum: string;
}

export interface GeometryEdit {
  readonly editId: string;
  readonly editType: GeometryEditType;
  readonly targetGeometryId: string;
  readonly previousMesh: GeometryMesh;
  readonly newMesh: GeometryMesh;
  readonly provenance: GeometryProvenance;
  readonly editChecksum: string;
}

export interface GeometryConstruction {
  readonly constructionId: string;
  readonly geometryType: GeometryPrimitiveType | 'MESH';
  readonly dimensions: GeometryDimensions;
  readonly transform: GeometryTransform;
  readonly origin: GeometryOrigin;
  readonly certainty: GeometryCertainty;
  readonly realityReference: RealityGeometryReference | null;
  readonly workspaceObjectId: string;
  readonly provenance: GeometryProvenance;
  readonly constructionChecksum: string;
}

// ─── Preview / Commit ───
export interface GeometryPreview {
  readonly previewId: string;
  readonly targetGeometryId: string;
  readonly operationType: GeometryOperationType;
  readonly originalMesh: GeometryMesh;
  readonly previewMesh: GeometryMesh;
  readonly isActive: boolean;
  readonly previewChecksum: string;
}

export interface GeometryCommit {
  readonly commitId: string;
  readonly targetGeometryId: string;
  readonly operationType: GeometryOperationType;
  readonly previousGeometryChecksum: string;
  readonly newGeometryChecksum: string;
  readonly provenance: GeometryProvenance;
  readonly realityReference: RealityGeometryReference | null;
  readonly sequenceIndex: number;
  readonly commitChecksum: string;
}

// ─── History ───
export interface GeometryHistoryEntry {
  readonly entryId: string;
  readonly operation: GeometryOperation;
  readonly parentEntryId: string | null;
  readonly geometryStateBefore: readonly string[];
  readonly geometryStateAfter: readonly string[];
  readonly provenance: GeometryProvenance;
  readonly entryChecksum: string;
}

// ─── Snapshot ───
export interface GeometrySnapshot {
  readonly snapshotId: string;
  readonly geometries: Readonly<Record<string, WorkspaceGeometry>>;
  readonly realityChecksum: string;
  readonly workspaceChecksum: string;
  readonly geometryChecksum: string;
  readonly topologyChecksum: string;
  readonly schemaVersion: string;
  readonly timestamp: number;
}

// ─── Diff ───
export interface GeometryDiff {
  readonly beforeGeometryId: string;
  readonly afterGeometryId: string;
  readonly vertexChanges: 'CHANGED' | 'UNCHANGED' | 'UNKNOWN';
  readonly edgeChanges: 'CHANGED' | 'UNCHANGED' | 'UNKNOWN';
  readonly faceChanges: 'CHANGED' | 'UNCHANGED' | 'UNKNOWN';
  readonly dimensionChanges: 'CHANGED' | 'UNCHANGED' | 'UNKNOWN';
  readonly transformChanges: 'CHANGED' | 'UNCHANGED' | 'UNKNOWN';
  readonly topologyChanges: 'CHANGED' | 'UNCHANGED' | 'UNKNOWN';
  readonly provenanceChanges: 'CHANGED' | 'UNCHANGED' | 'UNKNOWN';
  readonly certaintyChanges: 'CHANGED' | 'UNCHANGED' | 'UNKNOWN';
  readonly originChanges: 'CHANGED' | 'UNCHANGED' | 'UNKNOWN';
  readonly isIdentical: boolean;
}

// ─── Validation ───
export type GeometryValidationStatus =
  | 'GEOMETRY_VALID'
  | 'NAN_VALUE' | 'INFINITY_VALUE'
  | 'INVALID_VERTEX' | 'INVALID_EDGE' | 'INVALID_FACE'
  | 'BROKEN_EDGE_REFERENCE' | 'BROKEN_FACE_REFERENCE'
  | 'DUPLICATE_GEOMETRY_ID' | 'DUPLICATE_TOPOLOGY_ID'
  | 'ORPHAN_VERTEX' | 'ORPHAN_EDGE' | 'ORPHAN_FACE'
  | 'INVALID_DIMENSIONS' | 'INVALID_SCALE'
  | 'MALFORMED_TRANSFORM' | 'BROKEN_LINEAGE'
  | 'MISSING_REALITY_REFERENCE' | 'MISSING_WORKSPACE_REFERENCE'
  | 'CHECKSUM_MISMATCH' | 'CORRUPT_GEOMETRY'
  | 'INVALID_BOOLEAN_REFERENCE' | 'INVALID_HISTORY_CHAIN'
  | 'UNAUTHORIZED_REALITY_MUTATION'
  | 'FABRICATED_TIMESTAMP' | 'FABRICATED_OBSERVATION'
  | 'AUTOMATIC_OBSERVED_PROMOTION';

export interface GeometryValidationReport {
  readonly status: GeometryValidationStatus;
  readonly isValid: boolean;
  readonly issues: readonly string[];
  readonly reportChecksum: string;
}

// ─── Causality / Binding / Execution ───
export interface GeometryCausalityEvent {
  readonly eventId: string;
  readonly operation: string;
  readonly domain: string;
  readonly realityChecksumBefore: string;
  readonly realityChecksumAfter: string;
  readonly isRealityInvariant: boolean;
  readonly sequence: number;
}

export interface GeometryBindingState {
  readonly isBound: boolean;
  readonly realityStateChecksum: string;
  readonly workspaceChecksum: string;
  readonly geometryChecksum: string;
  readonly staleState: GeometryStaleState;
}

export interface GeometryExecutionSignature {
  readonly realityChecksum: string;
  readonly workspaceChecksum: string;
  readonly geometryChecksum: string;
  readonly topologyChecksum: string;
  readonly geometryCount: number;
  readonly vertexCount: number;
  readonly edgeCount: number;
  readonly faceCount: number;
  readonly historyCount: number;
  readonly syncStatus: GeometryStaleState;
  readonly executionHash: string;
}

// ─── Measurement ───
export interface Measurement {
  readonly measurementId: string;
  readonly measurementType: MeasurementType;
  readonly value: number;
  readonly unit: string;
  readonly sourceGeometryIds: readonly string[];
  readonly origin: 'DERIVED_FROM_GEOMETRY';
  readonly provenance: GeometryProvenance;
  readonly measurementChecksum: string;
}

// ─── Session ───
export interface GeometrySession {
  readonly sessionId: string;
  readonly realityStateId: string;
  readonly workspaceId: string;
  readonly interactionSessionId: string;
  readonly state: 'IDLE' | 'CREATING' | 'EDITING' | 'PREVIEWING' | 'COMMITTED' | 'MEASURING';
  readonly geometries: Readonly<Record<string, WorkspaceGeometry>>;
  readonly selectedGeometryIds: readonly string[];
  readonly activePreview: GeometryPreview | null;
  readonly history: readonly GeometryHistoryEntry[];
  readonly undoStack: readonly GeometryHistoryEntry[];
  readonly redoStack: readonly GeometryHistoryEntry[];
  readonly measurements: readonly Measurement[];
  readonly sessionChecksum: string;
}
