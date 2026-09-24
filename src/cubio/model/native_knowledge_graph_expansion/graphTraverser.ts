/**
 * CUBiO AI — Task 187: Native Knowledge Graph Expansion Layer
 * src/cubio/model/native_knowledge_graph_expansion/graphTraverser.ts
 *
 * Bounded Graph Traversal Engine:
 * Implements bounded BFS traversal with path cycle detection,
 * acyclic chain enforcement, and deterministic traversal digests.
 */

import * as crypto from 'crypto';
import {
  GraphNodeRef,
  GraphEdgeRef,
  GraphTraversalConfig,
  GraphTraversalResult,
  GraphCycleDetectedError,
} from './types';
import { GraphIndex } from './graphIndex';

export class GraphTraverser {
  public static readonly MAX_DEPTH_CEILING = 8;
  public static readonly MAX_NODES_CEILING = 256;

  private readonly index: GraphIndex;

  constructor(index: GraphIndex) {
    this.index = index;
  }

  /**
   * Executes bounded graph traversal from a start node.
   */
  public traverse(
    startNodeId: string,
    callerTenantId: string,
    config?: GraphTraversalConfig
  ): GraphTraversalResult {
    const maxDepth = Math.min(config?.maxDepth ?? 3, GraphTraverser.MAX_DEPTH_CEILING);
    const maxNodes = Math.min(config?.maxNodes ?? 64, GraphTraverser.MAX_NODES_CEILING);
    const direction = config?.direction ?? 'OUTGOING';
    const minWeight = config?.minWeight ?? 0.0;
    const enforceAcyclic = config?.enforceAcyclic ?? false;
    const relationFilter = config?.relationFilter ? new Set(config.relationFilter) : null;

    const startNode = this.index.getNode(startNodeId, callerTenantId);
    if (!startNode) {
      throw new Error(`[GraphTraverser] Start node "${startNodeId}" not found for tenant "${callerTenantId}".`);
    }

    const visitedNodesMap = new Map<string, GraphNodeRef>();
    const visitedEdgesMap = new Map<string, GraphEdgeRef>();
    visitedNodesMap.set(startNode.nodeId, startNode);

    let cycleDetected = false;
    let detectedCyclePath: string[] | undefined = undefined;

    // BFS Queue: each item holds { nodeId, depth, pathFromRoot }
    const queue: Array<{ nodeId: string; depth: number; path: string[] }> = [
      { nodeId: startNodeId, depth: 0, path: [startNodeId] },
    ];

    let depthReached = 0;

    while (queue.length > 0) {
      if (visitedNodesMap.size >= maxNodes) break;

      const current = queue.shift()!;
      depthReached = Math.max(depthReached, current.depth);

      if (current.depth >= maxDepth) continue;

      // Collect candidate edges according to traversal direction
      const candidateEdges: GraphEdgeRef[] = [];

      if (direction === 'OUTGOING' || direction === 'BOTH') {
        candidateEdges.push(...this.index.getOutgoingEdges(current.nodeId, callerTenantId));
      }
      if (direction === 'INCOMING' || direction === 'BOTH') {
        candidateEdges.push(...this.index.getIncomingEdges(current.nodeId, callerTenantId));
      }

      for (const edge of candidateEdges) {
        if (edge.weight < minWeight) continue;
        if (relationFilter && !relationFilter.has(edge.relationType)) continue;

        visitedEdgesMap.set(edge.edgeId, edge);

        // Determine neighbor node
        const neighborId = edge.sourceId === current.nodeId ? edge.targetId : edge.sourceId;

        // Path cycle detection: check if neighbor is already in the current traversal path
        if (current.path.includes(neighborId)) {
          cycleDetected = true;
          detectedCyclePath = [...current.path, neighborId];

          if (enforceAcyclic) {
            throw new GraphCycleDetectedError(detectedCyclePath);
          }
        }

        if (!visitedNodesMap.has(neighborId)) {
          const neighborNode = this.index.getNode(neighborId, callerTenantId);
          if (neighborNode) {
            visitedNodesMap.set(neighborNode.nodeId, neighborNode);
            queue.push({
              nodeId: neighborId,
              depth: current.depth + 1,
              path: [...current.path, neighborId],
            });
          }
        }
      }
    }

    // Sort visited nodes and edges deterministically by ID
    const sortedNodes = Array.from(visitedNodesMap.values()).sort((a, b) =>
      a.nodeId.localeCompare(b.nodeId)
    );
    const sortedEdges = Array.from(visitedEdgesMap.values()).sort((a, b) =>
      a.edgeId.localeCompare(b.edgeId)
    );

    // Compute deterministic traversal digest
    const digestPayload = JSON.stringify({
      startNodeId,
      nodes: sortedNodes.map((n) => n.nodeId),
      edges: sortedEdges.map((e) => e.edgeId),
      depthReached,
      cycleDetected,
    });
    const traversalDigest = crypto.createHash('sha256').update(digestPayload).digest('hex');

    return Object.freeze({
      startNodeId,
      visitedNodes: Object.freeze(sortedNodes),
      visitedEdges: Object.freeze(sortedEdges),
      depthReached,
      cycleDetected,
      cyclePath: detectedCyclePath ? Object.freeze(detectedCyclePath) : undefined,
      traversalDigest,
    });
  }
}
