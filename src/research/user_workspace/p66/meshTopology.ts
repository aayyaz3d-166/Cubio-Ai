/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.6: Mesh & Topology Engine
 *
 * Implements explicit B-Rep topology structures (V-E-F-S) and deterministic tessellation.
 */

import {
  Curve3D,
  Surface3D,
  Solid3D,
  AdvancedMesh3D,
  TopologyTopologyStructure,
  TopologyVertex,
  TopologyEdge,
  TopologyFace,
  TopologyShell,
} from './types';
import { deterministicHash, generateDeterministicGeometryId, generateDeterministicTopologyId } from './determinism';

export class MeshTopologyEngine {
  public static tessellateCurveToMesh(curve: Curve3D, tolerance = 0.1): AdvancedMesh3D {
    const vertices: [number, number, number][] = curve.controlPoints.map((p) => [p[0], p[1], p[2]]);
    const edges: [number, number][] = [];
    for (let i = 0; i < vertices.length - 1; i++) {
      edges.push([i, i + 1]);
    }
    if (curve.closed && vertices.length > 2) {
      edges.push([vertices.length - 1, 0]);
    }

    const faces: [number, number, number][] = []; // Curves have no 2D faces
    const normals: [number, number, number][] = vertices.map(() => [0, 1, 0]);

    const bounds = this.calculateMeshBounds(vertices);
    const checksum = deterministicHash(JSON.stringify(['MESH_CRV', curve.checksum, tolerance, vertices.length]));

    return Object.freeze({
      id: generateDeterministicGeometryId('MSH', 'CRV', 0),
      vertices: Object.freeze(vertices.map((v) => Object.freeze(v))),
      edges: Object.freeze(edges.map((e) => Object.freeze(e))),
      faces: Object.freeze([]),
      normals: Object.freeze(normals.map((n) => Object.freeze(n))),
      bounds,
      isManifold: true,
      isClosed: curve.closed,
      tolerance,
      checksum,
    });
  }

  public static tessellateSurfaceToMesh(surface: Surface3D, tolerance = 0.1): AdvancedMesh3D {
    const vertices: [number, number, number][] = surface.controlPoints.map((p) => [p[0], p[1], p[2]]);
    const edges: [number, number][] = [];
    const faces: [number, number, number][] = [];
    const normals: [number, number, number][] = [];

    // Simple triangulation over control points grid
    const cols = 2;
    const rows = Math.floor(vertices.length / cols);

    for (let r = 0; r < rows - 1; r++) {
      for (let c = 0; c < cols - 1; c++) {
        const i0 = r * cols + c;
        const i1 = r * cols + (c + 1);
        const i2 = (r + 1) * cols + c;
        const i3 = (r + 1) * cols + (c + 1);

        faces.push([i0, i1, i2]);
        faces.push([i1, i3, i2]);

        edges.push([i0, i1], [i1, i3], [i3, i2], [i2, i0], [i1, i2]);
      }
    }

    for (let i = 0; i < vertices.length; i++) {
      normals.push([0, 1, 0]);
    }

    const bounds = this.calculateMeshBounds(vertices);
    const checksum = deterministicHash(JSON.stringify(['MESH_SRF', surface.checksum, tolerance, faces.length]));

    return Object.freeze({
      id: generateDeterministicGeometryId('MSH', 'SRF', 0),
      vertices: Object.freeze(vertices.map((v) => Object.freeze(v))),
      edges: Object.freeze(edges.map((e) => Object.freeze(e))),
      faces: Object.freeze(faces.map((f) => Object.freeze(f))),
      normals: Object.freeze(normals.map((n) => Object.freeze(n))),
      bounds,
      isManifold: true,
      isClosed: false,
      tolerance,
      checksum,
    });
  }

  public static buildTopologyStructure(mesh: AdvancedMesh3D): TopologyTopologyStructure {
    const topVertices: TopologyVertex[] = mesh.vertices.map((v, idx) => ({
      id: generateDeterministicTopologyId('V', idx),
      position: v,
      incidentEdgeIds: [],
    }));

    const topEdges: TopologyEdge[] = [];
    const edgeMap = new Map<string, number>();

    const getEdgeKey = (iA: number, iB: number) => (iA < iB ? `${iA}_${iB}` : `${iB}_${iA}`);

    for (let i = 0; i < mesh.faces.length; i++) {
      const [f0, f1, f2] = mesh.faces[i];
      const faceId = generateDeterministicTopologyId('F', i);
      const faceEdges = [
        [f0, f1],
        [f1, f2],
        [f2, f0],
      ];

      for (const [va, vb] of faceEdges) {
        const key = getEdgeKey(va, vb);
        if (!edgeMap.has(key)) {
          const edgeId = generateDeterministicTopologyId('E', topEdges.length);
          edgeMap.set(key, topEdges.length);
          topEdges.push({
            id: edgeId,
            startVertexId: topVertices[va].id,
            endVertexId: topVertices[vb].id,
            incidentFaceIds: [faceId],
          });
        } else {
          const edgeIdx = edgeMap.get(key)!;
          topEdges[edgeIdx] = {
            ...topEdges[edgeIdx],
            incidentFaceIds: [...topEdges[edgeIdx].incidentFaceIds, faceId],
          };
        }
      }
    }

    const topFaces: TopologyFace[] = mesh.faces.map((f, idx) => ({
      id: generateDeterministicTopologyId('F', idx),
      boundaryEdgeIds: [
        topEdges[edgeMap.get(getEdgeKey(f[0], f[1])) || 0]?.id || '',
        topEdges[edgeMap.get(getEdgeKey(f[1], f[2])) || 0]?.id || '',
        topEdges[edgeMap.get(getEdgeKey(f[2], f[0])) || 0]?.id || '',
      ],
      normal: mesh.normals[idx] || [0, 1, 0],
    }));

    const boundaryEdgeCount = topEdges.filter((e) => e.incidentFaceIds.length === 1).length;
    const nonManifoldEdgeCount = topEdges.filter((e) => e.incidentFaceIds.length > 2).length;
    const isManifold = nonManifoldEdgeCount === 0;
    const isClosed = boundaryEdgeCount === 0 && topFaces.length > 0;

    const shell: TopologyShell = {
      id: generateDeterministicTopologyId('S', 0),
      faceIds: topFaces.map((f) => f.id),
      closed: isClosed,
    };

    const checksum = deterministicHash(
      JSON.stringify([topVertices.length, topEdges.length, topFaces.length, isManifold, isClosed])
    );

    return Object.freeze({
      vertices: Object.freeze(topVertices),
      edges: Object.freeze(topEdges),
      faces: Object.freeze(topFaces),
      shells: Object.freeze([shell]),
      vertexCount: topVertices.length,
      edgeCount: topEdges.length,
      faceCount: topFaces.length,
      shellCount: 1,
      connectedComponents: 1,
      boundaryEdgeCount,
      nonManifoldEdgeCount,
      isManifold,
      isClosed,
      checksum,
    });
  }

  private static calculateMeshBounds(vertices: ReadonlyArray<readonly [number, number, number]>) {
    if (vertices.length === 0) {
      return {
        min: Object.freeze([0, 0, 0] as [number, number, number]),
        max: Object.freeze([0, 0, 0] as [number, number, number]),
        dimensions: Object.freeze([0, 0, 0] as [number, number, number]),
      };
    }

    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

    for (const [x, y, z] of vertices) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (z < minZ) minZ = z;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
      if (z > maxZ) maxZ = z;
    }

    const min: [number, number, number] = [Number(minX.toFixed(4)), Number(minY.toFixed(4)), Number(minZ.toFixed(4))];
    const max: [number, number, number] = [Number(maxX.toFixed(4)), Number(maxY.toFixed(4)), Number(maxZ.toFixed(4))];
    const dimensions: [number, number, number] = [
      Number((maxX - minX).toFixed(4)),
      Number((maxY - minY).toFixed(4)),
      Number((maxZ - minZ).toFixed(4)),
    ];

    return Object.freeze({
      min: Object.freeze(min),
      max: Object.freeze(max),
      dimensions: Object.freeze(dimensions),
    });
  }
}
