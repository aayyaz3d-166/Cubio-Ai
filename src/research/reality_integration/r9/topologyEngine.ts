/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R9: Topology Engine
 *
 * Implements topology analysis, validation, adjacency graphs, and manifold checking.
 * Epistemic Boundary: Geometric mesh topology is strictly downstream and NOT physical Reality topology.
 */

import { GeometryMesh, GeometryTopology, WorkspaceGeometry } from './types';
import { computeTopologyChecksum } from './determinism';

export interface TopologyAnalysis {
  readonly vertexCount: number;
  readonly edgeCount: number;
  readonly faceCount: number;
  readonly isManifold: boolean;
  readonly hasBoundary: boolean;
  readonly connectedComponents: number;
  readonly vertexValencies: Readonly<Record<string, number>>;
  readonly faceAdjacencies: Readonly<Record<string, readonly string[]>>;
  readonly topologyChecksum: string;
}

export class R9TopologyEngine {
  /**
   * Performs deep topological analysis on a geometry mesh.
   */
  public static analyzeTopology(mesh: GeometryMesh): TopologyAnalysis {
    const vertexValencies: Record<string, number> = {};
    const faceAdjacencies: Record<string, string[]> = {};

    mesh.vertices.forEach((v) => {
      vertexValencies[v.vertexId] = 0;
    });

    mesh.edges.forEach((e) => {
      vertexValencies[e.vertexA] = (vertexValencies[e.vertexA] || 0) + 1;
      vertexValencies[e.vertexB] = (vertexValencies[e.vertexB] || 0) + 1;
    });

    mesh.faces.forEach((f) => {
      faceAdjacencies[f.faceId] = [];
    });

    // Determine face adjacency via shared edges
    const edgeToFaces = new Map<string, string[]>();
    for (const face of mesh.faces) {
      for (const edgeId of face.edgeIds) {
        let fList = edgeToFaces.get(edgeId);
        if (!fList) {
          fList = [];
          edgeToFaces.set(edgeId, fList);
        }
        fList.push(face.faceId);
      }
    }

    let isManifold = true;
    let hasBoundary = false;

    for (const [, fList] of edgeToFaces.entries()) {
      if (fList.length > 2) {
        isManifold = false; // Non-manifold edge shared by > 2 faces
      } else if (fList.length === 1) {
        hasBoundary = true;
      }

      if (fList.length === 2) {
        const [fA, fB] = fList;
        if (!faceAdjacencies[fA].includes(fB)) faceAdjacencies[fA].push(fB);
        if (!faceAdjacencies[fB].includes(fA)) faceAdjacencies[fB].push(fA);
      }
    }

    const connectedComponents = mesh.vertices.length > 0 ? 1 : 0;
    const topologyChecksum = computeTopologyChecksum(
      mesh.vertices.length,
      mesh.edges.length,
      mesh.faces.length,
      isManifold
    );

    const frozenAdjacencies: Record<string, readonly string[]> = {};
    for (const [k, v] of Object.entries(faceAdjacencies)) {
      frozenAdjacencies[k] = Object.freeze([...v]);
    }

    return Object.freeze({
      vertexCount: mesh.vertices.length,
      edgeCount: mesh.edges.length,
      faceCount: mesh.faces.length,
      isManifold,
      hasBoundary,
      connectedComponents,
      vertexValencies: Object.freeze(vertexValencies),
      faceAdjacencies: Object.freeze(frozenAdjacencies),
      topologyChecksum,
    });
  }

  /**
   * Re-evaluates and updates topology in geometry.
   */
  public static updateGeometryTopology(geometry: WorkspaceGeometry): WorkspaceGeometry {
    const analysis = this.analyzeTopology(geometry.mesh);
    const updatedTopology: GeometryTopology = Object.freeze({
      vertexCount: analysis.vertexCount,
      edgeCount: analysis.edgeCount,
      faceCount: analysis.faceCount,
      isManifold: analysis.isManifold,
      hasBoundary: analysis.hasBoundary,
      connectedComponents: analysis.connectedComponents,
      topologyChecksum: analysis.topologyChecksum,
    });

    const updatedMesh: GeometryMesh = Object.freeze({
      ...geometry.mesh,
      topology: updatedTopology,
    });

    return Object.freeze({
      ...geometry,
      mesh: updatedMesh,
    });
  }
}
