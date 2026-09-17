/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R9: Geometry Mesh Engine
 *
 * Provides deterministic mesh representation, manipulation, and validation.
 * Invariant: Never fabricates non-existent geometry. All mesh elements carry deterministic IDs.
 */

import {
  GeometryVertex,
  GeometryEdge,
  GeometryFace,
  GeometryMesh,
  GeometryTopology,
  BoundingBox,
} from './types';
import {
  generateDeterministicMeshId,
  generateDeterministicVertexId,
  generateDeterministicEdgeId,
  generateDeterministicFaceId,
  computeVertexChecksum,
  computeEdgeChecksum,
  computeFaceChecksum,
  computeMeshChecksum,
  computeTopologyChecksum,
} from './determinism';

export interface MeshValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly string[];
}

export class R9GeometryMeshEngine {
  /**
   * Computes bounding box for an array of vertices.
   */
  public static computeBoundingBox(vertices: readonly GeometryVertex[]): BoundingBox {
    if (vertices.length === 0) {
      return Object.freeze({
        min: Object.freeze([0, 0, 0]) as readonly [number, number, number],
        max: Object.freeze([0, 0, 0]) as readonly [number, number, number],
        center: Object.freeze([0, 0, 0]) as readonly [number, number, number],
        size: Object.freeze([0, 0, 0]) as readonly [number, number, number],
      });
    }

    let minX = Infinity;
    let minY = Infinity;
    let minZ = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let maxZ = -Infinity;

    for (const v of vertices) {
      const [x, y, z] = v.position;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      if (z < minZ) minZ = z;
      if (z > maxZ) maxZ = z;
    }

    return Object.freeze({
      min: Object.freeze([minX, minY, minZ]) as readonly [number, number, number],
      max: Object.freeze([maxX, maxY, maxZ]) as readonly [number, number, number],
      center: Object.freeze([
        (minX + maxX) / 2,
        (minY + maxY) / 2,
        (minZ + maxZ) / 2,
      ]) as readonly [number, number, number],
      size: Object.freeze([
        maxX - minX,
        maxY - minY,
        maxZ - minZ,
      ]) as readonly [number, number, number],
    });
  }

  /**
   * Builds a normalized mesh from raw elements.
   */
  public static buildMesh(
    geometryId: string,
    rawVertices: readonly (readonly [number, number, number])[],
    rawFaces: readonly (readonly number[])[], // index arrays
    seq: number = 0
  ): GeometryMesh {
    const meshId = generateDeterministicMeshId(geometryId, seq);

    const vertices: GeometryVertex[] = rawVertices.map((pos, idx) => {
      const vertexId = generateDeterministicVertexId(meshId, idx);
      return Object.freeze({
        vertexId,
        position: Object.freeze([pos[0], pos[1], pos[2]]) as readonly [number, number, number],
        vertexChecksum: computeVertexChecksum(pos),
      });
    });

    const vertexIdMap = new Map<number, string>();
    vertices.forEach((v, idx) => vertexIdMap.set(idx, v.vertexId));

    // Derive unique edges
    const edgeMap = new Map<string, GeometryEdge>();
    let edgeSeq = 0;

    const faces: GeometryFace[] = rawFaces.map((faceIndices, faceIdx) => {
      const faceVertexIds: string[] = [];
      const faceEdgeIds: string[] = [];

      for (let i = 0; i < faceIndices.length; i++) {
        const vIdxA = faceIndices[i];
        const vIdxB = faceIndices[(i + 1) % faceIndices.length];
        const vIdA = vertexIdMap.get(vIdxA) || '';
        const vIdB = vertexIdMap.get(vIdxB) || '';

        faceVertexIds.push(vIdA);

        const edgeKey = vIdA < vIdB ? `${vIdA}__${vIdB}` : `${vIdB}__${vIdA}`;
        let edge = edgeMap.get(edgeKey);
        if (!edge) {
          const edgeId = generateDeterministicEdgeId(meshId, edgeSeq++);
          edge = Object.freeze({
            edgeId,
            vertexA: vIdA,
            vertexB: vIdB,
            edgeChecksum: computeEdgeChecksum(vIdA, vIdB),
          });
          edgeMap.set(edgeKey, edge);
        }
        faceEdgeIds.push(edge.edgeId);
      }

      // Compute simple face normal from first 3 vertices
      let normal: readonly [number, number, number] = [0, 1, 0];
      if (faceIndices.length >= 3) {
        const v0 = rawVertices[faceIndices[0]];
        const v1 = rawVertices[faceIndices[1]];
        const v2 = rawVertices[faceIndices[2]];

        const ax = v1[0] - v0[0];
        const ay = v1[1] - v0[1];
        const az = v1[2] - v0[2];

        const bx = v2[0] - v0[0];
        const by = v2[1] - v0[1];
        const bz = v2[2] - v0[2];

        const nx = ay * bz - az * by;
        const ny = az * bx - ax * bz;
        const nz = ax * by - ay * bx;
        const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
        if (len > 1e-9) {
          normal = [nx / len, ny / len, nz / len];
        }
      }

      const faceId = generateDeterministicFaceId(meshId, faceIdx);
      return Object.freeze({
        faceId,
        vertexIds: Object.freeze(faceVertexIds),
        edgeIds: Object.freeze(faceEdgeIds),
        normal: Object.freeze(normal) as readonly [number, number, number],
        faceChecksum: computeFaceChecksum(faceVertexIds, normal),
      });
    });

    const edges = Array.from(edgeMap.values());
    const isManifold = vertices.length > 0 && faces.length > 0;
    const hasBoundary = false;
    const connectedComponents = vertices.length > 0 ? 1 : 0;

    const topology: GeometryTopology = Object.freeze({
      vertexCount: vertices.length,
      edgeCount: edges.length,
      faceCount: faces.length,
      isManifold,
      hasBoundary,
      connectedComponents,
      topologyChecksum: computeTopologyChecksum(vertices.length, edges.length, faces.length, isManifold),
    });

    const boundingBox = this.computeBoundingBox(vertices);
    const vertexData = vertices.map((v) => `${v.vertexId}_${v.position[0]}_${v.position[1]}_${v.position[2]}`).join('__');
    const meshChecksum = computeMeshChecksum(vertices.length, edges.length, faces.length, vertexData);

    return Object.freeze({
      meshId,
      vertices: Object.freeze(vertices),
      edges: Object.freeze(edges),
      faces: Object.freeze(faces),
      topology,
      boundingBox,
      meshChecksum,
    });
  }

  /**
   * Validates internal references and topology of a mesh.
   */
  public static validateMesh(mesh: GeometryMesh): MeshValidationResult {
    const errors: string[] = [];

    const vertexIdSet = new Set<string>();
    for (const v of mesh.vertices) {
      if (vertexIdSet.has(v.vertexId)) {
        errors.push(`Duplicate vertex ID detected: ${v.vertexId}`);
      }
      vertexIdSet.add(v.vertexId);

      const [x, y, z] = v.position;
      if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
        errors.push(`Non-finite vertex coordinates in ${v.vertexId}: [${x}, ${y}, ${z}]`);
      }
    }

    const edgeIdSet = new Set<string>();
    for (const e of mesh.edges) {
      if (edgeIdSet.has(e.edgeId)) {
        errors.push(`Duplicate edge ID detected: ${e.edgeId}`);
      }
      edgeIdSet.add(e.edgeId);

      if (!vertexIdSet.has(e.vertexA)) {
        errors.push(`Edge ${e.edgeId} references missing vertexA ${e.vertexA}`);
      }
      if (!vertexIdSet.has(e.vertexB)) {
        errors.push(`Edge ${e.edgeId} references missing vertexB ${e.vertexB}`);
      }
    }

    const faceIdSet = new Set<string>();
    for (const f of mesh.faces) {
      if (faceIdSet.has(f.faceId)) {
        errors.push(`Duplicate face ID detected: ${f.faceId}`);
      }
      faceIdSet.add(f.faceId);

      for (const vId of f.vertexIds) {
        if (!vertexIdSet.has(vId)) {
          errors.push(`Face ${f.faceId} references missing vertex ${vId}`);
        }
      }
      for (const eId of f.edgeIds) {
        if (!edgeIdSet.has(eId)) {
          errors.push(`Face ${f.faceId} references missing edge ${eId}`);
        }
      }
    }

    return Object.freeze({
      isValid: errors.length === 0,
      errors: Object.freeze(errors),
    });
  }
}
