/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R9: Geometry Construction Engine
 *
 * Implements geometry creation, duplication, instantiation, attachment, detachment, and deletion.
 * All constructed geometry has explicit origin (default USER_CONSTRUCTED), certainty, and lineage.
 * INVARIANT: ΔReality = 0 for all constructions.
 */

import {
  WorkspaceGeometry,
  GeometryPrimitiveType,
  GeometryDimensions,
  GeometryTransform,
  RealityGeometryReference,
  GeometryProvenance,
  GeometryLineage,
  GeometryIdentity,
  GeometryOrigin,
  GeometryCertainty,
  GeometryMesh,
} from './types';
import { R9GeometryPrimitiveEngine } from './geometryPrimitiveEngine';
import { R9GeometryMeshEngine } from './geometryMeshEngine';
import {
  generateDeterministicGeometryId,
  generateDeterministicConstructionId,
  generateDeterministicLineageId,
  computeGeometryChecksum,
  computeTransformChecksum,
} from './determinism';

export class R9GeometryConstructionEngine {
  /**
   * Creates a standard primitive geometry.
   */
  public static createPrimitive(
    sessionId: string,
    type: GeometryPrimitiveType,
    dimensions: GeometryDimensions,
    transform: GeometryTransform | undefined,
    workspaceObjectId: string,
    realityRef: RealityGeometryReference | null,
    origin: GeometryOrigin = 'USER_CONSTRUCTED',
    certainty: GeometryCertainty = 'EXACT',
    name: string = `${type}_Constructed`,
    seq: number = 0
  ): WorkspaceGeometry {
    return R9GeometryPrimitiveEngine.createPrimitive(
      sessionId,
      type,
      dimensions,
      transform,
      workspaceObjectId,
      realityRef,
      origin,
      certainty,
      name,
      seq
    );
  }

  /**
   * Creates a custom mesh geometry.
   */
  public static createCustomMesh(
    sessionId: string,
    name: string,
    rawVertices: readonly (readonly [number, number, number])[],
    rawFaces: readonly (readonly number[])[],
    workspaceObjectId: string,
    realityRef: RealityGeometryReference | null = null,
    origin: GeometryOrigin = 'USER_CONSTRUCTED',
    certainty: GeometryCertainty = 'EXACT',
    seq: number = 0
  ): WorkspaceGeometry {
    const geometryId = generateDeterministicGeometryId(sessionId, 'CUSTOM_MESH', seq);
    const mesh = R9GeometryMeshEngine.buildMesh(geometryId, rawVertices, rawFaces, seq);

    const xform: GeometryTransform = Object.freeze({
      translation: Object.freeze([0, 0, 0]) as readonly [number, number, number],
      rotation: Object.freeze([0, 0, 0]) as readonly [number, number, number],
      scale: Object.freeze([1, 1, 1]) as readonly [number, number, number],
      transformChecksum: computeTransformChecksum([0, 0, 0], [0, 0, 0], [1, 1, 1]),
    });

    const dimensions: GeometryDimensions = Object.freeze({
      width: mesh.boundingBox.size[0],
      height: mesh.boundingBox.size[1],
      depth: mesh.boundingBox.size[2],
    });

    const identity: GeometryIdentity = Object.freeze({
      geometryId,
      name,
      geometryType: 'MESH',
      origin,
      certainty,
      createdSequence: seq,
    });

    const provenance: GeometryProvenance = Object.freeze({
      actorId: 'USER',
      reason: 'CREATE_CUSTOM_MESH',
      sourceDomain: 'GEOMETRY',
      timestamp: 0,
    });

    const lineage: GeometryLineage = Object.freeze({
      lineageId: generateDeterministicLineageId(sessionId, geometryId),
      realityStateId: realityRef?.realityStateId ?? '',
      workspaceObjectId,
      visualObjectId: '',
      interactionSessionId: sessionId,
      geometryId,
      parentGeometryId: null,
      operationId: null,
      derivedFrom: null,
      version: 0,
    });

    const geometryChecksum = computeGeometryChecksum(geometryId, mesh.meshChecksum, xform.transformChecksum);

    return Object.freeze({
      geometryId,
      identity,
      mesh,
      transform: xform,
      dimensions,
      realityReference: realityRef,
      workspaceObjectId,
      provenance,
      lineage,
      geometryChecksum,
    });
  }

  /**
   * Duplicates an existing geometry.
   */
  public static duplicateGeometry(
    sessionId: string,
    sourceGeometry: WorkspaceGeometry,
    seq: number = 0
  ): WorkspaceGeometry {
    const newGeometryId = generateDeterministicGeometryId(sessionId, `DUP_${sourceGeometry.identity.geometryType}`, seq);
    
    // Clone mesh with new geometry ID
    const rawVerts = sourceGeometry.mesh.vertices.map((v) => v.position);
    const vIdMap = new Map<string, number>();
    sourceGeometry.mesh.vertices.forEach((v, idx) => vIdMap.set(v.vertexId, idx));
    const rawFaces = sourceGeometry.mesh.faces.map((f) => f.vertexIds.map((vId) => vIdMap.get(vId) ?? 0));

    const newMesh = R9GeometryMeshEngine.buildMesh(newGeometryId, rawVerts, rawFaces, seq);

    const identity: GeometryIdentity = Object.freeze({
      geometryId: newGeometryId,
      name: `${sourceGeometry.identity.name}_Copy`,
      geometryType: sourceGeometry.identity.geometryType,
      origin: 'DERIVED',
      certainty: sourceGeometry.identity.certainty,
      createdSequence: seq,
    });

    const provenance: GeometryProvenance = Object.freeze({
      actorId: 'USER',
      reason: `DUPLICATE_OF_${sourceGeometry.geometryId}`,
      sourceDomain: 'GEOMETRY',
      timestamp: 0,
    });

    const lineage: GeometryLineage = Object.freeze({
      lineageId: generateDeterministicLineageId(sessionId, newGeometryId),
      realityStateId: sourceGeometry.lineage.realityStateId,
      workspaceObjectId: sourceGeometry.workspaceObjectId,
      visualObjectId: sourceGeometry.lineage.visualObjectId,
      interactionSessionId: sessionId,
      geometryId: newGeometryId,
      parentGeometryId: sourceGeometry.geometryId,
      operationId: generateDeterministicConstructionId(sessionId, seq),
      derivedFrom: 'DERIVED_FROM_GEOMETRY',
      version: sourceGeometry.lineage.version + 1,
    });

    const geometryChecksum = computeGeometryChecksum(newGeometryId, newMesh.meshChecksum, sourceGeometry.transform.transformChecksum);

    return Object.freeze({
      geometryId: newGeometryId,
      identity,
      mesh: newMesh,
      transform: sourceGeometry.transform,
      dimensions: sourceGeometry.dimensions,
      realityReference: sourceGeometry.realityReference,
      workspaceObjectId: sourceGeometry.workspaceObjectId,
      provenance,
      lineage,
      geometryChecksum,
    });
  }

  /**
   * Attaches geometry to a target workspace object.
   */
  public static attachToWorkspaceObject(
    geometry: WorkspaceGeometry,
    targetWorkspaceObjectId: string
  ): WorkspaceGeometry {
    const updatedLineage: GeometryLineage = Object.freeze({
      ...geometry.lineage,
      workspaceObjectId: targetWorkspaceObjectId,
      version: geometry.lineage.version + 1,
    });

    return Object.freeze({
      ...geometry,
      workspaceObjectId: targetWorkspaceObjectId,
      lineage: updatedLineage,
    });
  }

  /**
   * Detaches geometry from its current workspace object.
   */
  public static detachFromWorkspaceObject(geometry: WorkspaceGeometry): WorkspaceGeometry {
    const updatedLineage: GeometryLineage = Object.freeze({
      ...geometry.lineage,
      workspaceObjectId: '',
      version: geometry.lineage.version + 1,
    });

    return Object.freeze({
      ...geometry,
      workspaceObjectId: '',
      lineage: updatedLineage,
    });
  }
}
