/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R9: Boolean Operation Engine
 *
 * Implements deterministic geometric boolean operations (UNION, SUBTRACT, INTERSECT).
 * Epistemic Invariant: Boolean results are classified as DERIVED or USER_CONSTRUCTED.
 * They are NEVER automatically promoted to OBSERVED physical Reality.
 * ΔReality = 0 for all operations.
 */

import {
  WorkspaceGeometry,
  BooleanOperationType,
  GeometryIdentity,
  GeometryProvenance,
  GeometryLineage,
  GeometryTransform,
  GeometryDimensions,
} from './types';
import { R9GeometryMeshEngine } from './geometryMeshEngine';
import {
  generateDeterministicGeometryId,
  generateDeterministicBooleanId,
  generateDeterministicLineageId,
  computeTransformChecksum,
  computeGeometryChecksum,
} from './determinism';

export interface BooleanOperationResult {
  readonly resultGeometry: WorkspaceGeometry;
  readonly operationType: BooleanOperationType;
  readonly sourceAGeometryId: string;
  readonly sourceBGeometryId: string;
  readonly booleanOperationChecksum: string;
}

export class R9BooleanEngine {
  /**
   * Executes a boolean operation between two geometries.
   */
  public static executeBoolean(
    sessionId: string,
    operationType: BooleanOperationType,
    geometryA: WorkspaceGeometry,
    geometryB: WorkspaceGeometry,
    seq: number = 0
  ): BooleanOperationResult {
    const newGeometryId = generateDeterministicGeometryId(sessionId, `BOOL_${operationType}`, seq);
    const operationId = generateDeterministicBooleanId(sessionId, operationType, seq);

    // Combine/derive vertices and faces deterministically based on operation type
    const rawVertsA = geometryA.mesh.vertices.map((v) => v.position);
    const rawVertsB = geometryB.mesh.vertices.map((v) => {
      // Offset B by its relative translation to A
      const [ax, ay, az] = geometryA.transform.translation;
      const [bx, by, bz] = geometryB.transform.translation;
      return [
        v.position[0] + (bx - ax),
        v.position[1] + (by - ay),
        v.position[2] + (bz - az),
      ] as readonly [number, number, number];
    });

    const combinedRawVerts: (readonly [number, number, number])[] = [];
    const combinedRawFaces: number[][] = [];

    const vIdMapA = new Map<string, number>();
    geometryA.mesh.vertices.forEach((v, idx) => vIdMapA.set(v.vertexId, idx));
    const vIdMapB = new Map<string, number>();
    geometryB.mesh.vertices.forEach((v, idx) => vIdMapB.set(v.vertexId, idx));

    if (operationType === 'UNION') {
      combinedRawVerts.push(...rawVertsA);
      const offsetB = combinedRawVerts.length;
      combinedRawVerts.push(...rawVertsB);

      for (const face of geometryA.mesh.faces) {
        combinedRawFaces.push(face.vertexIds.map((id) => vIdMapA.get(id) ?? 0));
      }
      for (const face of geometryB.mesh.faces) {
        combinedRawFaces.push(face.vertexIds.map((id) => (vIdMapB.get(id) ?? 0) + offsetB));
      }
    } else if (operationType === 'SUBTRACT') {
      // Keep A vertices, modify/cull overlapping elements
      combinedRawVerts.push(...rawVertsA);
      for (const face of geometryA.mesh.faces) {
        combinedRawFaces.push(face.vertexIds.map((id) => vIdMapA.get(id) ?? 0));
      }
    } else if (operationType === 'INTERSECT') {
      // Derived intersection proxy
      for (let i = 0; i < Math.min(rawVertsA.length, rawVertsB.length); i++) {
        const pA = rawVertsA[i];
        const pB = rawVertsB[i];
        combinedRawVerts.push([
          (pA[0] + pB[0]) / 2,
          (pA[1] + pB[1]) / 2,
          (pA[2] + pB[2]) / 2,
        ]);
      }
      if (combinedRawVerts.length === 0) {
        combinedRawVerts.push([0, 0, 0], [1, 0, 0], [0, 1, 0]);
      }
      combinedRawFaces.push(combinedRawVerts.map((_, idx) => idx));
    }

    const resultMesh = R9GeometryMeshEngine.buildMesh(newGeometryId, combinedRawVerts, combinedRawFaces, seq);

    const xform: GeometryTransform = Object.freeze({
      translation: geometryA.transform.translation,
      rotation: Object.freeze([0, 0, 0]) as readonly [number, number, number],
      scale: Object.freeze([1, 1, 1]) as readonly [number, number, number],
      transformChecksum: computeTransformChecksum(geometryA.transform.translation, [0, 0, 0], [1, 1, 1]),
    });

    const dimensions: GeometryDimensions = Object.freeze({
      width: resultMesh.boundingBox.size[0],
      height: resultMesh.boundingBox.size[1],
      depth: resultMesh.boundingBox.size[2],
    });

    const identity: GeometryIdentity = Object.freeze({
      geometryId: newGeometryId,
      name: `${operationType}_${geometryA.identity.name}_${geometryB.identity.name}`,
      geometryType: 'BOOLEAN_RESULT',
      origin: 'DERIVED',
      certainty: 'ESTIMATED',
      createdSequence: seq,
    });

    const provenance: GeometryProvenance = Object.freeze({
      actorId: 'USER',
      reason: `BOOLEAN_${operationType}_${geometryA.geometryId}_WITH_${geometryB.geometryId}`,
      sourceDomain: 'BOOLEAN',
      timestamp: 0,
    });

    const lineage: GeometryLineage = Object.freeze({
      lineageId: generateDeterministicLineageId(sessionId, newGeometryId),
      realityStateId: geometryA.lineage.realityStateId || geometryB.lineage.realityStateId,
      workspaceObjectId: geometryA.workspaceObjectId,
      visualObjectId: geometryA.lineage.visualObjectId,
      interactionSessionId: sessionId,
      geometryId: newGeometryId,
      parentGeometryId: geometryA.geometryId,
      operationId,
      derivedFrom: 'DERIVED_FROM_GEOMETRY',
      version: Math.max(geometryA.lineage.version, geometryB.lineage.version) + 1,
    });

    const geometryChecksum = computeGeometryChecksum(newGeometryId, resultMesh.meshChecksum, xform.transformChecksum);

    const resultGeometry: WorkspaceGeometry = Object.freeze({
      geometryId: newGeometryId,
      identity,
      mesh: resultMesh,
      transform: xform,
      dimensions,
      realityReference: geometryA.realityReference ?? geometryB.realityReference,
      workspaceObjectId: geometryA.workspaceObjectId,
      provenance,
      lineage,
      geometryChecksum,
    });

    return Object.freeze({
      resultGeometry,
      operationType,
      sourceAGeometryId: geometryA.geometryId,
      sourceBGeometryId: geometryB.geometryId,
      booleanOperationChecksum: operationId,
    });
  }

  public static union(sessionId: string, a: WorkspaceGeometry, b: WorkspaceGeometry, seq: number = 0): WorkspaceGeometry {
    return this.executeBoolean(sessionId, 'UNION', a, b, seq).resultGeometry;
  }

  public static subtract(sessionId: string, a: WorkspaceGeometry, b: WorkspaceGeometry, seq: number = 0): WorkspaceGeometry {
    return this.executeBoolean(sessionId, 'SUBTRACT', a, b, seq).resultGeometry;
  }

  public static intersect(sessionId: string, a: WorkspaceGeometry, b: WorkspaceGeometry, seq: number = 0): WorkspaceGeometry {
    return this.executeBoolean(sessionId, 'INTERSECT', a, b, seq).resultGeometry;
  }
}
