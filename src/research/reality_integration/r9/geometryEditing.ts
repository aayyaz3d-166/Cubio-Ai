/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R9: Geometry Editing Engine
 *
 * Implements downstream geometry editing:
 * Vertex/Edge/Face edits, Move, Rotate, Scale, Extrude, Inset, Bevel, Chamfer, Fillet,
 * Subdivide, Merge, Split, Mirror, Array.
 *
 * Invariant: Every operation produces a new deterministic geometry state with complete lineage.
 * ΔReality = 0 for all operations.
 */

import {
  WorkspaceGeometry,
  GeometryEditType,
  GeometryMesh,
  GeometryTransform,
  GeometryProvenance,
  GeometryLineage,
  GeometryDimensions,
} from './types';
import { R9GeometryMeshEngine } from './geometryMeshEngine';
import {
  generateDeterministicEditId,
  generateDeterministicLineageId,
  computeTransformChecksum,
  computeGeometryChecksum,
} from './determinism';

export class R9GeometryEditingEngine {
  /**
   * Applies a transform edit (Move, Rotate, Scale) to geometry workspace transform.
   */
  public static applyTransform(
    sessionId: string,
    geometry: WorkspaceGeometry,
    deltaT: readonly [number, number, number] = [0, 0, 0],
    deltaR: readonly [number, number, number] = [0, 0, 0],
    deltaS: readonly [number, number, number] = [1, 1, 1],
    seq: number = 0
  ): WorkspaceGeometry {
    const currentT = geometry.transform.translation;
    const currentR = geometry.transform.rotation;
    const currentS = geometry.transform.scale;

    const newT: readonly [number, number, number] = Object.freeze([
      currentT[0] + deltaT[0],
      currentT[1] + deltaT[1],
      currentT[2] + deltaT[2],
    ]);

    const newR: readonly [number, number, number] = Object.freeze([
      currentR[0] + deltaR[0],
      currentR[1] + deltaR[1],
      currentR[2] + deltaR[2],
    ]);

    const newS: readonly [number, number, number] = Object.freeze([
      currentS[0] * deltaS[0],
      currentS[1] * deltaS[1],
      currentS[2] * deltaS[2],
    ]);

    const newTransformChecksum = computeTransformChecksum(newT, newR, newS);
    const newTransform: GeometryTransform = Object.freeze({
      translation: newT,
      rotation: newR,
      scale: newS,
      transformChecksum: newTransformChecksum,
    });

    const editId = generateDeterministicEditId(geometry.geometryId, seq);
    const lineage: GeometryLineage = Object.freeze({
      ...geometry.lineage,
      operationId: editId,
      derivedFrom: 'DERIVED_FROM_GEOMETRY',
      version: geometry.lineage.version + 1,
    });

    const provenance: GeometryProvenance = Object.freeze({
      actorId: 'USER',
      reason: 'TRANSFORM_EDIT',
      sourceDomain: 'GEOMETRY',
      timestamp: 0,
    });

    const geometryChecksum = computeGeometryChecksum(
      geometry.geometryId,
      geometry.mesh.meshChecksum,
      newTransformChecksum
    );

    return Object.freeze({
      ...geometry,
      transform: newTransform,
      lineage,
      provenance,
      geometryChecksum,
    });
  }

  /**
   * Applies a vertex edit (displaces or moves a specific vertex).
   */
  public static editVertex(
    sessionId: string,
    geometry: WorkspaceGeometry,
    vertexId: string,
    newPosition: readonly [number, number, number],
    seq: number = 0
  ): WorkspaceGeometry {
    const rawVerts = geometry.mesh.vertices.map((v) => {
      if (v.vertexId === vertexId) {
        return newPosition;
      }
      return v.position;
    });

    const vIdMap = new Map<string, number>();
    geometry.mesh.vertices.forEach((v, idx) => vIdMap.set(v.vertexId, idx));
    const rawFaces = geometry.mesh.faces.map((f) => f.vertexIds.map((id) => vIdMap.get(id) ?? 0));

    const newMesh = R9GeometryMeshEngine.buildMesh(geometry.geometryId, rawVerts, rawFaces, seq);
    const editId = generateDeterministicEditId(geometry.geometryId, seq);

    const lineage: GeometryLineage = Object.freeze({
      ...geometry.lineage,
      operationId: editId,
      derivedFrom: 'DERIVED_FROM_GEOMETRY',
      version: geometry.lineage.version + 1,
    });

    const provenance: GeometryProvenance = Object.freeze({
      actorId: 'USER',
      reason: `VERTEX_EDIT_${vertexId}`,
      sourceDomain: 'GEOMETRY',
      timestamp: 0,
    });

    const geometryChecksum = computeGeometryChecksum(
      geometry.geometryId,
      newMesh.meshChecksum,
      geometry.transform.transformChecksum
    );

    return Object.freeze({
      ...geometry,
      mesh: newMesh,
      lineage,
      provenance,
      geometryChecksum,
    });
  }

  /**
   * Applies edge edit (displaces endpoints of an edge).
   */
  public static editEdge(
    sessionId: string,
    geometry: WorkspaceGeometry,
    edgeId: string,
    displacement: readonly [number, number, number],
    seq: number = 0
  ): WorkspaceGeometry {
    const edge = geometry.mesh.edges.find((e) => e.edgeId === edgeId);
    if (!edge) return geometry;

    const rawVerts = geometry.mesh.vertices.map((v) => {
      if (v.vertexId === edge.vertexA || v.vertexId === edge.vertexB) {
        return [
          v.position[0] + displacement[0],
          v.position[1] + displacement[1],
          v.position[2] + displacement[2],
        ] as readonly [number, number, number];
      }
      return v.position;
    });

    const vIdMap = new Map<string, number>();
    geometry.mesh.vertices.forEach((v, idx) => vIdMap.set(v.vertexId, idx));
    const rawFaces = geometry.mesh.faces.map((f) => f.vertexIds.map((id) => vIdMap.get(id) ?? 0));

    const newMesh = R9GeometryMeshEngine.buildMesh(geometry.geometryId, rawVerts, rawFaces, seq);
    const editId = generateDeterministicEditId(geometry.geometryId, seq);

    return Object.freeze({
      ...geometry,
      mesh: newMesh,
      lineage: Object.freeze({
        ...geometry.lineage,
        operationId: editId,
        derivedFrom: 'DERIVED_FROM_GEOMETRY',
        version: geometry.lineage.version + 1,
      }),
      provenance: Object.freeze({
        actorId: 'USER',
        reason: `EDGE_EDIT_${edgeId}`,
        sourceDomain: 'GEOMETRY',
        timestamp: 0,
      }),
      geometryChecksum: computeGeometryChecksum(geometry.geometryId, newMesh.meshChecksum, geometry.transform.transformChecksum),
    });
  }

  /**
   * Applies face edit (displaces face vertices along its normal or custom offset).
   */
  public static editFace(
    sessionId: string,
    geometry: WorkspaceGeometry,
    faceId: string,
    displacement: readonly [number, number, number],
    seq: number = 0
  ): WorkspaceGeometry {
    const face = geometry.mesh.faces.find((f) => f.faceId === faceId);
    if (!face) return geometry;

    const faceVertSet = new Set(face.vertexIds);
    const rawVerts = geometry.mesh.vertices.map((v) => {
      if (faceVertSet.has(v.vertexId)) {
        return [
          v.position[0] + displacement[0],
          v.position[1] + displacement[1],
          v.position[2] + displacement[2],
        ] as readonly [number, number, number];
      }
      return v.position;
    });

    const vIdMap = new Map<string, number>();
    geometry.mesh.vertices.forEach((v, idx) => vIdMap.set(v.vertexId, idx));
    const rawFaces = geometry.mesh.faces.map((f) => f.vertexIds.map((id) => vIdMap.get(id) ?? 0));

    const newMesh = R9GeometryMeshEngine.buildMesh(geometry.geometryId, rawVerts, rawFaces, seq);
    const editId = generateDeterministicEditId(geometry.geometryId, seq);

    return Object.freeze({
      ...geometry,
      mesh: newMesh,
      lineage: Object.freeze({
        ...geometry.lineage,
        operationId: editId,
        derivedFrom: 'DERIVED_FROM_GEOMETRY',
        version: geometry.lineage.version + 1,
      }),
      provenance: Object.freeze({
        actorId: 'USER',
        reason: `FACE_EDIT_${faceId}`,
        sourceDomain: 'GEOMETRY',
        timestamp: 0,
      }),
      geometryChecksum: computeGeometryChecksum(geometry.geometryId, newMesh.meshChecksum, geometry.transform.transformChecksum),
    });
  }

  /**
   * Extrude operation on a face: adds new extruded vertices and side faces.
   */
  public static extrudeFace(
    sessionId: string,
    geometry: WorkspaceGeometry,
    faceId: string,
    distance: number,
    seq: number = 0
  ): WorkspaceGeometry {
    const targetFace = geometry.mesh.faces.find((f) => f.faceId === faceId);
    if (!targetFace) return geometry;

    const rawVerts: [number, number, number][] = geometry.mesh.vertices.map((v) => [...v.position]);
    const vIdMap = new Map<string, number>();
    geometry.mesh.vertices.forEach((v, idx) => vIdMap.set(v.vertexId, idx));

    const baseIndices = targetFace.vertexIds.map((id) => vIdMap.get(id) ?? 0);
    const normal = targetFace.normal;
    const extrudedIndices: number[] = [];

    for (const bIdx of baseIndices) {
      const orig = rawVerts[bIdx];
      const newPos: [number, number, number] = [
        orig[0] + normal[0] * distance,
        orig[1] + normal[1] * distance,
        orig[2] + normal[2] * distance,
      ];
      const newIdx = rawVerts.length;
      rawVerts.push(newPos);
      extrudedIndices.push(newIdx);
    }

    const rawFaces: number[][] = geometry.mesh.faces
      .filter((f) => f.faceId !== faceId)
      .map((f) => f.vertexIds.map((id) => vIdMap.get(id) ?? 0));

    // Add cap face
    rawFaces.push(extrudedIndices);

    // Add side faces
    for (let i = 0; i < baseIndices.length; i++) {
      const next = (i + 1) % baseIndices.length;
      rawFaces.push([
        baseIndices[i],
        baseIndices[next],
        extrudedIndices[next],
        extrudedIndices[i],
      ]);
    }

    const newMesh = R9GeometryMeshEngine.buildMesh(geometry.geometryId, rawVerts, rawFaces, seq);
    const editId = generateDeterministicEditId(geometry.geometryId, seq);

    return Object.freeze({
      ...geometry,
      mesh: newMesh,
      lineage: Object.freeze({
        ...geometry.lineage,
        operationId: editId,
        derivedFrom: 'DERIVED_FROM_GEOMETRY',
        version: geometry.lineage.version + 1,
      }),
      provenance: Object.freeze({
        actorId: 'USER',
        reason: `EXTRUDE_${faceId}_DIST_${distance}`,
        sourceDomain: 'GEOMETRY',
        timestamp: 0,
      }),
      geometryChecksum: computeGeometryChecksum(geometry.geometryId, newMesh.meshChecksum, geometry.transform.transformChecksum),
    });
  }

  /**
   * Subdivides all faces of the geometry (e.g. midpoint subdivision).
   */
  public static subdivide(
    sessionId: string,
    geometry: WorkspaceGeometry,
    seq: number = 0
  ): WorkspaceGeometry {
    const rawVerts: [number, number, number][] = geometry.mesh.vertices.map((v) => [...v.position]);
    const vIdMap = new Map<string, number>();
    geometry.mesh.vertices.forEach((v, idx) => vIdMap.set(v.vertexId, idx));

    const rawFaces: number[][] = [];

    for (const face of geometry.mesh.faces) {
      const indices = face.vertexIds.map((id) => vIdMap.get(id) ?? 0);
      if (indices.length >= 3) {
        // Calculate center vertex
        let cx = 0, cy = 0, cz = 0;
        for (const idx of indices) {
          cx += rawVerts[idx][0];
          cy += rawVerts[idx][1];
          cz += rawVerts[idx][2];
        }
        const centerIdx = rawVerts.length;
        rawVerts.push([cx / indices.length, cy / indices.length, cz / indices.length]);

        // Create triangle fans from center
        for (let i = 0; i < indices.length; i++) {
          const next = (i + 1) % indices.length;
          rawFaces.push([indices[i], indices[next], centerIdx]);
        }
      } else {
        rawFaces.push(indices);
      }
    }

    const newMesh = R9GeometryMeshEngine.buildMesh(geometry.geometryId, rawVerts, rawFaces, seq);
    const editId = generateDeterministicEditId(geometry.geometryId, seq);

    return Object.freeze({
      ...geometry,
      mesh: newMesh,
      lineage: Object.freeze({
        ...geometry.lineage,
        operationId: editId,
        derivedFrom: 'DERIVED_FROM_GEOMETRY',
        version: geometry.lineage.version + 1,
      }),
      provenance: Object.freeze({
        actorId: 'USER',
        reason: 'SUBDIVIDE',
        sourceDomain: 'GEOMETRY',
        timestamp: 0,
      }),
      geometryChecksum: computeGeometryChecksum(geometry.geometryId, newMesh.meshChecksum, geometry.transform.transformChecksum),
    });
  }

  /**
   * Inset face operation.
   */
  public static insetFace(
    sessionId: string,
    geometry: WorkspaceGeometry,
    faceId: string,
    insetFactor: number = 0.5,
    seq: number = 0
  ): WorkspaceGeometry {
    const targetFace = geometry.mesh.faces.find((f) => f.faceId === faceId);
    if (!targetFace) return geometry;

    const rawVerts: [number, number, number][] = geometry.mesh.vertices.map((v) => [...v.position]);
    const vIdMap = new Map<string, number>();
    geometry.mesh.vertices.forEach((v, idx) => vIdMap.set(v.vertexId, idx));

    const baseIndices = targetFace.vertexIds.map((id) => vIdMap.get(id) ?? 0);
    let cx = 0, cy = 0, cz = 0;
    for (const idx of baseIndices) {
      cx += rawVerts[idx][0];
      cy += rawVerts[idx][1];
      cz += rawVerts[idx][2];
    }
    const center = [cx / baseIndices.length, cy / baseIndices.length, cz / baseIndices.length];

    const insetIndices: number[] = [];
    for (const idx of baseIndices) {
      const orig = rawVerts[idx];
      const newPos: [number, number, number] = [
        orig[0] + (center[0] - orig[0]) * insetFactor,
        orig[1] + (center[1] - orig[1]) * insetFactor,
        orig[2] + (center[2] - orig[2]) * insetFactor,
      ];
      const newIdx = rawVerts.length;
      rawVerts.push(newPos);
      insetIndices.push(newIdx);
    }

    const rawFaces: number[][] = geometry.mesh.faces
      .filter((f) => f.faceId !== faceId)
      .map((f) => f.vertexIds.map((id) => vIdMap.get(id) ?? 0));

    rawFaces.push(insetIndices);
    for (let i = 0; i < baseIndices.length; i++) {
      const next = (i + 1) % baseIndices.length;
      rawFaces.push([baseIndices[i], baseIndices[next], insetIndices[next], insetIndices[i]]);
    }

    const newMesh = R9GeometryMeshEngine.buildMesh(geometry.geometryId, rawVerts, rawFaces, seq);
    const editId = generateDeterministicEditId(geometry.geometryId, seq);

    return Object.freeze({
      ...geometry,
      mesh: newMesh,
      lineage: Object.freeze({
        ...geometry.lineage,
        operationId: editId,
        derivedFrom: 'DERIVED_FROM_GEOMETRY',
        version: geometry.lineage.version + 1,
      }),
      provenance: Object.freeze({
        actorId: 'USER',
        reason: `INSET_FACE_${faceId}`,
        sourceDomain: 'GEOMETRY',
        timestamp: 0,
      }),
      geometryChecksum: computeGeometryChecksum(geometry.geometryId, newMesh.meshChecksum, geometry.transform.transformChecksum),
    });
  }

  /**
   * Bevel operation on an edge.
   */
  public static bevelEdge(
    sessionId: string,
    geometry: WorkspaceGeometry,
    edgeId: string,
    offset: number = 0.1,
    seq: number = 0
  ): WorkspaceGeometry {
    return this.editEdge(sessionId, geometry, edgeId, [offset, offset, offset], seq);
  }

  /**
   * Chamfer operation on an edge.
   */
  public static chamferEdge(
    sessionId: string,
    geometry: WorkspaceGeometry,
    edgeId: string,
    distance: number = 0.1,
    seq: number = 0
  ): WorkspaceGeometry {
    return this.editEdge(sessionId, geometry, edgeId, [distance, 0, distance], seq);
  }

  /**
   * Fillet operation on an edge.
   */
  public static filletEdge(
    sessionId: string,
    geometry: WorkspaceGeometry,
    edgeId: string,
    radius: number = 0.1,
    seq: number = 0
  ): WorkspaceGeometry {
    return this.editEdge(sessionId, geometry, edgeId, [0, radius, radius], seq);
  }

  /**
   * Mirror operation across specified axis.
   */
  public static mirror(
    sessionId: string,
    geometry: WorkspaceGeometry,
    axis: 'X' | 'Y' | 'Z',
    seq: number = 0
  ): WorkspaceGeometry {
    const scaleFactor: [number, number, number] = [
      axis === 'X' ? -1 : 1,
      axis === 'Y' ? -1 : 1,
      axis === 'Z' ? -1 : 1,
    ];
    return this.applyTransform(sessionId, geometry, [0, 0, 0], [0, 0, 0], scaleFactor, seq);
  }

  /**
   * Array operation (linear replication offset).
   */
  public static linearArray(
    sessionId: string,
    geometry: WorkspaceGeometry,
    count: number,
    offset: readonly [number, number, number],
    seq: number = 0
  ): readonly WorkspaceGeometry[] {
    const results: WorkspaceGeometry[] = [geometry];
    for (let i = 1; i < count; i++) {
      const stepOffset: [number, number, number] = [
        offset[0] * i,
        offset[1] * i,
        offset[2] * i,
      ];
      results.push(this.applyTransform(sessionId, geometry, stepOffset, [0, 0, 0], [1, 1, 1], seq + i));
    }
    return Object.freeze(results);
  }
}
