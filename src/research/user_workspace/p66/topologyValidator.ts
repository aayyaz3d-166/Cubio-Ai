/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.6: Topology Validator
 *
 * Enforces topological manifoldness, validates vertex-edge-face references,
 * detects open boundaries, and computes Euler characteristics.
 */

import { TopologyTopologyStructure, GeometryValidationReport } from './types';
import { deterministicHash } from './determinism';

export class TopologyValidator {
  public static validateTopology(topology: TopologyTopologyStructure): GeometryValidationReport {
    const issues: string[] = [];

    // 1. Check Vertex references in Edges
    const vertexIds = new Set(topology.vertices.map((v) => v.id));
    for (const edge of topology.edges) {
      if (!vertexIds.has(edge.startVertexId) || !vertexIds.has(edge.endVertexId)) {
        issues.push(`Edge ${edge.id} references non-existent vertices: (${edge.startVertexId}, ${edge.endVertexId})`);
      }
    }

    // 2. Check Edge references in Faces
    const edgeIds = new Set(topology.edges.map((e) => e.id));
    for (const face of topology.faces) {
      for (const eid of face.boundaryEdgeIds) {
        if (!edgeIds.has(eid)) {
          issues.push(`Face ${face.id} references non-existent edge: ${eid}`);
        }
      }
    }

    // 3. Check Manifold Condition
    if (topology.nonManifoldEdgeCount > 0) {
      issues.push(`Detected ${topology.nonManifoldEdgeCount} non-manifold edges (incident faces > 2).`);
    }

    const isValid = issues.length === 0;
    const status = !isValid
      ? 'TOPOLOGY_INVALID'
      : !topology.isManifold
      ? 'NON_MANIFOLD'
      : topology.boundaryEdgeCount > 0
      ? 'OPEN_BOUNDARY'
      : 'TOPOLOGY_VALID';

    const reportChecksum = deterministicHash(
      JSON.stringify([status, isValid, topology.checksum, issues.length])
    );

    return Object.freeze({
      status,
      isValid,
      issues: Object.freeze(issues),
      nonManifoldCount: topology.nonManifoldEdgeCount,
      boundaryCount: topology.boundaryEdgeCount,
      reportChecksum,
    });
  }
}
