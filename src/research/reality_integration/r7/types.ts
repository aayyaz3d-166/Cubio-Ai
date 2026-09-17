/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R7: Observable Reality 3D Workspace Visualization & Live Binding — Types
 *
 * Core Principle:
 * Reality -> State -> Observations -> Objects -> Spatial -> Workspace -> R7 Visualization -> Viewport
 *
 * R7 is DOWNSTREAM representation only.
 * The Viewport is a representation; it is NOT physical Reality.
 * Canonical coordinate contract [5, 3, 6] is preserved exactly.
 */

import {
  RealityObjectCertainty,
  RealityObjectOrigin,
  RealityRelationshipType,
  RealityRelationshipEvidence,
} from '../r4/types';

import {
  SpatialRelationType,
  SpatialRelationEvidence,
  SpatialRelationCertainty,
  SpatialDirectionType,
} from '../r5/types';

import {
  WorkspaceSyncStatus,
} from '../r6/types';

export type R7VisualPrimitiveType =
  | 'POINT'
  | 'BOX'
  | 'SPHERE'
  | 'MARKER'
  | 'BOUNDING_BOX'
  | 'DERIVED_FROM_GEOMETRY';

export type R7LiveSyncStatus = 'SYNCED' | 'STALE' | 'SYNCING' | 'ERROR';

export type R7ViewPreset = 'PERSPECTIVE' | 'TOP' | 'FRONT' | 'SIDE' | 'ISOMETRIC';

export interface R7VisualObjectIdentity {
  readonly visualObjectId: string;
  readonly workspaceObjectId: string;
  readonly realityObjectId: string;
  readonly realityStateId: string;
  readonly observationId?: string;
  readonly lineageId: string;
  readonly version: number;
}

export interface R7VisualObjectTransform {
  readonly coordinates: readonly [number, number, number]; // Authoritative [5, 3, 6]
  readonly dimensions?: readonly [number, number, number];
}

export interface R7VisualObjectStyle {
  readonly color: string;
  readonly opacity: number;
  readonly wireframe: boolean;
  readonly highlighted: boolean;
  readonly selected: boolean;
  readonly labelVisible: boolean;
}

export interface R7VisualObject {
  readonly identity: R7VisualObjectIdentity;
  readonly name: string;
  readonly transform: R7VisualObjectTransform;
  readonly style: R7VisualObjectStyle;
  readonly primitiveType: R7VisualPrimitiveType;
  readonly certainty: RealityObjectCertainty;
  readonly origin: RealityObjectOrigin;
  readonly evidence: RealityRelationshipEvidence | SpatialRelationEvidence;
  readonly sourceChecksum: string;
  readonly visualChecksum: string;
}

export interface R7VisualRelationship {
  readonly visualRelationshipId: string;
  readonly workspaceRelationshipId: string;
  readonly realityRelationshipId: string;
  readonly sourceVisualObjectId: string;
  readonly targetVisualObjectId: string;
  readonly relationshipType: RealityRelationshipType;
  readonly evidence: RealityRelationshipEvidence;
  readonly certainty: RealityObjectCertainty;
  readonly color: string;
  readonly visualChecksum: string;
}

export interface R7VisualSpatialRelation {
  readonly visualSpatialId: string;
  readonly workspaceSpatialId: string;
  readonly realitySpatialId: string;
  readonly sourceVisualObjectId: string;
  readonly targetVisualObjectId: string;
  readonly relationType: SpatialRelationType;
  readonly evidence: SpatialRelationEvidence;
  readonly certainty: SpatialRelationCertainty;
  readonly distance: number;
  readonly direction: SpatialDirectionType;
  readonly containment: string;
  readonly visualChecksum: string;
}

export interface R7VisualTopologyEdge {
  readonly visualEdgeId: string;
  readonly sourceNodeId: string;
  readonly targetNodeId: string;
  readonly isDirect: boolean;
  readonly hopCount: number;
  readonly visualChecksum: string;
}

export interface R7SceneNode {
  readonly nodeId: string;
  readonly visualObject: R7VisualObject;
  readonly children: readonly string[];
}

export interface R7SceneGraph {
  readonly sceneId: string;
  readonly realityStateId: string;
  readonly workspaceId: string;
  readonly nodes: readonly R7SceneNode[];
  readonly relationships: readonly R7VisualRelationship[];
  readonly spatialRelations: readonly R7VisualSpatialRelation[];
  readonly topologyEdges: readonly R7VisualTopologyEdge[];
  readonly sceneChecksum: string;
}

export interface R7SelectionVisualState {
  readonly selectedVisualObjectId: string | null;
  readonly selectedRelationshipId: string | null;
  readonly selectedSpatialId: string | null;
  readonly hoveredVisualObjectId: string | null;
}

export interface R7CameraState {
  readonly position: readonly [number, number, number];
  readonly target: readonly [number, number, number];
  readonly zoom: number;
  readonly orbitAngle: number;
  readonly viewPreset: R7ViewPreset;
}

export interface R7LayerToggles {
  readonly showRealityObjects: boolean;
  readonly showRelationships: boolean;
  readonly showSpatial: boolean;
  readonly showTopology: boolean;
  readonly showLabels: boolean;
  readonly showAxes: boolean;
  readonly showGrid: boolean;
}

export interface R7RealityInspectorState {
  readonly isOpen: boolean;
  readonly selectedVisualObject: R7VisualObject | null;
  readonly syncStatus: R7LiveSyncStatus;
}

export interface R7VisualizationSnapshot {
  readonly snapshotId: string;
  readonly sceneGraph: R7SceneGraph;
  readonly realityStateChecksum: string;
  readonly workspaceChecksum: string;
  readonly sceneChecksum: string;
  readonly snapshotChecksum: string;
  readonly schemaVersion: string;
  readonly timestamp: number;
}

export type R7VisualizationValidationStatus =
  | 'VISUALIZATION_VALID'
  | 'MISSING_WORKSPACE_BINDING'
  | 'MISSING_REALITY_REFERENCE'
  | 'DUPLICATE_VISUAL_ID'
  | 'NON_FINITE_COORDINATES'
  | 'INVALID_DIMENSIONS'
  | 'CHECKSUM_MISMATCH'
  | 'ORPHAN_VISUAL_RELATION'
  | 'FABRICATED_GEOMETRY';

export interface R7VisualizationValidationReport {
  readonly status: R7VisualizationValidationStatus;
  readonly isValid: boolean;
  readonly issues: readonly string[];
  readonly reportChecksum: string;
}

export interface R7VisualizationExecutionSignature {
  readonly realityChecksum: string;
  readonly workspaceChecksum: string;
  readonly sceneChecksum: string;
  readonly visualObjectCount: number;
  readonly syncStatus: R7LiveSyncStatus;
  readonly executionHash: string;
}
