/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.6: Advanced Geometry Construction & Topology — Type Definitions
 *
 * Types for deterministic curves, surfaces, solids, mesh topology,
 * B-Rep connectivity, boolean operations, validation, and export.
 *
 * Scientific boundary: Computational geometric model only.
 * No claims of physical reality, higher dimensions, or unobserved recovery.
 */

import { CertaintyLevel } from '../../observation_reconstruction/p52/types';
import { WorkspaceReality } from '../p61/types';
import { ModelScene3D } from '../p65/types';

export type CurveType = 'LINE' | 'POLYLINE' | 'BEZIER' | 'BSPLINE' | 'ARC' | 'CIRCLE';
export type SurfaceType = 'PLANAR' | 'EXTRUDED' | 'REVOLVED' | 'LOFTED' | 'BEZIER_SURFACE' | 'BSPLINE_SURFACE';
export type SolidType = 'EXTRUSION' | 'REVOLUTION' | 'CLOSED_SURFACE' | 'BOOLEAN_RESULT';
export type BooleanOpType = 'UNION' | 'INTERSECTION' | 'DIFFERENCE';

export type GeometryValidationStatus =
  | 'GEOMETRY_VALID'
  | 'GEOMETRY_INVALID'
  | 'TOPOLOGY_VALID'
  | 'TOPOLOGY_INVALID'
  | 'NON_MANIFOLD'
  | 'OPEN_BOUNDARY'
  | 'DEGENERATE_GEOMETRY'
  | 'NON_FINITE_GEOMETRY'
  | 'UNSUPPORTED_OPERATION';

export interface Point3D {
  readonly id: string;
  readonly coordinate: readonly [number, number, number];
  readonly checksum: string;
}

export interface Curve3D {
  readonly id: string;
  readonly type: CurveType;
  readonly controlPoints: ReadonlyArray<readonly [number, number, number]>;
  readonly degree: number;
  readonly closed: boolean;
  readonly bounds: {
    readonly min: readonly [number, number, number];
    readonly max: readonly [number, number, number];
  };
  readonly length: number;
  readonly checksum: string;
}

export interface Surface3D {
  readonly id: string;
  readonly type: SurfaceType;
  readonly boundaryCurves: readonly string[]; // Curve IDs
  readonly controlPoints: ReadonlyArray<readonly [number, number, number]>;
  readonly uDegree: number;
  readonly vDegree: number;
  readonly areaEstimate: number;
  readonly bounds: {
    readonly min: readonly [number, number, number];
    readonly max: readonly [number, number, number];
  };
  readonly checksum: string;
}

export interface Solid3D {
  readonly id: string;
  readonly type: SolidType;
  readonly shellIds: readonly string[]; // Shell IDs
  readonly volume: number;
  readonly bounds: {
    readonly min: readonly [number, number, number];
    readonly max: readonly [number, number, number];
  };
  readonly checksum: string;
}

// B-Rep Topology Data Structures
export interface TopologyVertex {
  readonly id: string;
  readonly position: readonly [number, number, number];
  readonly incidentEdgeIds: readonly string[];
}

export interface TopologyEdge {
  readonly id: string;
  readonly startVertexId: string;
  readonly endVertexId: string;
  readonly curveId?: string;
  readonly incidentFaceIds: readonly string[];
}

export interface TopologyFace {
  readonly id: string;
  readonly boundaryEdgeIds: readonly string[];
  readonly surfaceId?: string;
  readonly normal: readonly [number, number, number];
}

export interface TopologyShell {
  readonly id: string;
  readonly faceIds: readonly string[];
  readonly closed: boolean;
}

export interface TopologyTopologyStructure {
  readonly vertices: readonly TopologyVertex[];
  readonly edges: readonly TopologyEdge[];
  readonly faces: readonly TopologyFace[];
  readonly shells: readonly TopologyShell[];
  readonly vertexCount: number;
  readonly edgeCount: number;
  readonly faceCount: number;
  readonly shellCount: number;
  readonly connectedComponents: number;
  readonly boundaryEdgeCount: number;
  readonly nonManifoldEdgeCount: number;
  readonly isManifold: boolean;
  readonly isClosed: boolean;
  readonly checksum: string;
}

export interface AdvancedMesh3D {
  readonly id: string;
  readonly vertices: ReadonlyArray<readonly [number, number, number]>;
  readonly edges: ReadonlyArray<readonly [number, number]>; // Vertex indices
  readonly faces: ReadonlyArray<readonly [number, number, number]>; // Triangle indices
  readonly normals: ReadonlyArray<readonly [number, number, number]>;
  readonly bounds: {
    readonly min: readonly [number, number, number];
    readonly max: readonly [number, number, number];
    readonly dimensions: readonly [number, number, number];
  };
  readonly isManifold: boolean;
  readonly isClosed: boolean;
  readonly tolerance: number;
  readonly checksum: string;
}

export interface BooleanOperationResult {
  readonly operation: BooleanOpType;
  readonly inputIdA: string;
  readonly inputIdB: string;
  readonly inputChecksumA: string;
  readonly inputChecksumB: string;
  readonly outputMesh: AdvancedMesh3D | null;
  readonly outputChecksum: string;
  readonly status: 'SUCCESS' | 'UNSUPPORTED_BOOLEAN_CASE' | 'FAILED';
}

export interface AdvancedGeometryObject {
  readonly id: string;
  readonly name: string;
  readonly sourceModelObjectId?: string;
  readonly point?: Point3D;
  readonly curve?: Curve3D;
  readonly surface?: Surface3D;
  readonly solid?: Solid3D;
  readonly topology?: TopologyTopologyStructure;
  readonly mesh: AdvancedMesh3D;
  readonly certainty: CertaintyLevel;
  readonly color: string;
  readonly visible: boolean;
  readonly geometryChecksum: string;
}

export interface AdvancedGeometryScene {
  readonly sceneId: string;
  readonly sourceRealityChecksum: string;
  readonly sourceModelChecksum: string;
  readonly objects: readonly AdvancedGeometryObject[];
  readonly sceneChecksum: string;
  readonly timestamp: number;
}

export interface GeometryValidationReport {
  readonly status: GeometryValidationStatus;
  readonly isValid: boolean;
  readonly issues: readonly string[];
  readonly nonManifoldCount: number;
  readonly boundaryCount: number;
  readonly reportChecksum: string;
}

export interface GeometryMutationRecord {
  readonly mutationId: string;
  readonly operation: string;
  readonly targetId: string | null;
  readonly checksumBefore: string;
  readonly checksumAfter: string;
  readonly stepIndex: number;
}

export interface GeometrySnapshot3D {
  readonly snapshotId: string;
  readonly label: string;
  readonly reality: WorkspaceReality;
  readonly modelScene: ModelScene3D;
  readonly geometryScene: AdvancedGeometryScene;
  readonly snapshotChecksum: string;
  readonly timestamp: number;
}
