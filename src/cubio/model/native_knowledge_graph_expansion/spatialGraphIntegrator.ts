/**
 * CUBiO AI — Task 187: Native Knowledge Graph Expansion Layer
 * src/cubio/model/native_knowledge_graph_expansion/spatialGraphIntegrator.ts
 *
 * Spatial Graph Integrator:
 * Grounds graph nodes in the 343-cell lattice and 369 Euler address space,
 * and calculates hybrid spatial-semantic neighborhood rankings.
 */

import {
  GraphNodeRef,
  SpatialGraphNeighborhood,
} from './types';
import { GraphIndex } from './graphIndex';
import { KnowledgeSpatialBridge } from '../native_knowledge_architecture/knowledgeSpatialBridge';

export class SpatialGraphIntegrator {
  private readonly index: GraphIndex;

  constructor(index: GraphIndex) {
    this.index = index;
  }

  /**
   * Computes hybrid spatial-semantic neighborhood around a center node.
   */
  public expandNeighborhood(
    centerNodeId: string,
    callerTenantId: string,
    spatialRadius: number = 2
  ): SpatialGraphNeighborhood {
    const centerNode = this.index.getNode(centerNodeId, callerTenantId);
    if (!centerNode) {
      throw new Error(`[SpatialGraphIntegrator] Center node "${centerNodeId}" not found.`);
    }

    // 1. Semantic neighbors via graph edges
    const outgoing = this.index.getOutgoingEdges(centerNodeId, callerTenantId);
    const incoming = this.index.getIncomingEdges(centerNodeId, callerTenantId);

    const semanticNeighborIds = new Set<string>();
    const edgeWeights = new Map<string, number>();

    for (const edge of outgoing) {
      semanticNeighborIds.add(edge.targetId);
      edgeWeights.set(edge.targetId, Math.max(edgeWeights.get(edge.targetId) ?? 0, edge.weight));
    }
    for (const edge of incoming) {
      semanticNeighborIds.add(edge.sourceId);
      edgeWeights.set(edge.sourceId, Math.max(edgeWeights.get(edge.sourceId) ?? 0, edge.weight));
    }

    const semanticNeighbors: GraphNodeRef[] = [];
    for (const nid of semanticNeighborIds) {
      const node = this.index.getNode(nid, callerTenantId);
      if (node) semanticNeighbors.push(node);
    }

    // 2. Spatial co-located / proximate nodes in 3D lattice
    const allNodes = this.index.getAllNodes(callerTenantId);
    const spatialCoLocatedNodes: GraphNodeRef[] = [];

    for (const node of allNodes) {
      if (node.nodeId === centerNodeId) continue;
      const dist = KnowledgeSpatialBridge.manhattanDistance(
        centerNode.address369,
        node.address369
      );
      if (dist <= spatialRadius) {
        spatialCoLocatedNodes.push(node);
      }
    }

    // 3. Compute hybrid scores across candidate nodes
    const candidateNodeMap = new Map<string, GraphNodeRef>();
    for (const n of semanticNeighbors) candidateNodeMap.set(n.nodeId, n);
    for (const n of spatialCoLocatedNodes) candidateNodeMap.set(n.nodeId, n);

    const hybridRankedNodes: Array<{
      node: GraphNodeRef;
      semanticScore: number;
      spatialAffinity: number;
      hybridScore: number;
    }> = [];

    for (const node of candidateNodeMap.values()) {
      const semanticScore = edgeWeights.get(node.nodeId) ?? 0.0;
      const spatialAffinity = KnowledgeSpatialBridge.computeSpatialAffinity(
        centerNode.address369,
        node.address369
      );

      // Hybrid formula: 60% semantic connectivity + 40% spatial lattice proximity
      const hybridScore = 0.60 * semanticScore + 0.40 * spatialAffinity;

      hybridRankedNodes.push({
        node,
        semanticScore,
        spatialAffinity,
        hybridScore,
      });
    }

    // Sort by hybridScore descending, tie-break by nodeId ascending
    hybridRankedNodes.sort((a, b) => {
      if (Math.abs(b.hybridScore - a.hybridScore) > 1e-6) {
        return b.hybridScore - a.hybridScore;
      }
      return a.node.nodeId.localeCompare(b.node.nodeId);
    });

    return Object.freeze({
      centerNodeId,
      centerAddress369: centerNode.address369,
      spatialRadius,
      semanticNeighbors: Object.freeze(semanticNeighbors),
      spatialCoLocatedNodes: Object.freeze(spatialCoLocatedNodes),
      hybridRankedNodes: Object.freeze(hybridRankedNodes),
    });
  }
}
