/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.5: Reality Model Construction & 3D Asset Generation — Type Definitions
 *
 * Types for canonical 3D model representations, scene graphs, geometric primitives,
 * geometry validation, asset generation, and deterministic serialization.
 *
 * Scientific boundary: This is a computational research model only.
 * No claims about physical reality, higher dimensions, or consciousness.
 */

import {
  WorkspaceObject,
  WorkspaceReality,
  WorkspaceObserver,
} from '../p61/types';
import { CertaintyLevel } from '../../observation_reconstruction/p52/types';

export type PrimitiveGeometryType = 'POINT' | 'CUBE' | 'SPHERE' | 'CYLINDER' | 'CUSTOM_MESH';

export type ValidationStatus =
  | 'VALID'
  | 'INVALID_GEOMETRY'
  | 'INVALID_TRANSFORM'
  | 'INVALID_IDENTITY'
  | 'EMPTY_MODEL'
  | 'NON_DETERMINISTIC'
  | 'CONSTRAINT_VIOLATION';

export interface Vector3D {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface BoundingBox3D {
  readonly min: readonly [number, number, number];
  readonly max: readonly [number, number, number];
  readonly center: readonly [number, number, number];
  readonly dimensions: readonly [number, number, number];
}

export interface GeometryMesh3D {
  readonly type: PrimitiveGeometryType;
  readonly vertices: ReadonlyArray<readonly [number, number, number]>;
  readonly faces: ReadonlyArray<readonly [number, number, number]>; // Triangle indices
  readonly normals: ReadonlyArray<readonly [number, number, number]>;
  readonly boundingBox: BoundingBox3D;
  readonly geometryChecksum: string;
}

export interface ModelObjectTransform {
  readonly position: readonly [number, number, number];
  readonly rotation: readonly [number, number, number]; // Euler angles (deg)
  readonly scale: readonly [number, number, number];
}

export interface ModelObject3D {
  readonly modelObjectId: string;
  readonly sourceRealityObjectId: string;
  readonly name: string;
  readonly transform: ModelObjectTransform;
  readonly geometry: GeometryMesh3D;
  readonly category: string;
  readonly color: string;
  readonly visible: boolean;
  readonly parentId: string | null;
  readonly childrenIds: readonly string[];
  readonly creationLineage: string;
  readonly mutationCount: number;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly reconstructionCertainty: CertaintyLevel;
}

export interface ModelScene3D {
  readonly sceneId: string;
  readonly sourceRealityChecksum: string;
  readonly objects: readonly ModelObject3D[];
  readonly rootObjectIds: readonly string[];
  readonly sceneChecksum: string;
  readonly modelChecksum: string;
  readonly timestamp: number;
  readonly totalVertices: number;
  readonly totalFaces: number;
}

export interface ValidationReport {
  readonly status: ValidationStatus;
  readonly isValid: boolean;
  readonly objectCount: number;
  readonly issues: readonly string[];
  readonly checksum: string;
}

export interface ModelMutationRecord {
  readonly mutationId: string;
  readonly operation: 'CREATE' | 'DUPLICATE' | 'MOVE' | 'ROTATE' | 'SCALE' | 'DELETE' | 'RESET';
  readonly targetModelObjectId: string | null;
  readonly sceneChecksumBefore: string;
  readonly sceneChecksumAfter: string;
  readonly modelChecksumBefore: string;
  readonly modelChecksumAfter: string;
  readonly timestamp: number;
  readonly stepIndex: number;
}

export interface ModelSnapshot3D {
  readonly snapshotId: string;
  readonly label: string;
  readonly reality: WorkspaceReality;
  readonly scene: ModelScene3D;
  readonly snapshotChecksum: string;
  readonly timestamp: number;
}

export interface ExportAssetBundle {
  readonly format: 'JSON_SCENE' | 'OBJ_MESH' | 'STL_MESH' | 'RESEARCH_EXPORT_BUNDLE';
  readonly filename: string;
  readonly content: string;
  readonly checksum: string;
  readonly classification: 'RESEARCH_EXPORT_READY';
}
