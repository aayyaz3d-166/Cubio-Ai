/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R5: Spatial Topology Engine
 *
 * Implements deterministic spatial topology graph management, pathfinding, and cycle detection.
 */

import {
  SpatialNode,
  SpatialEdge,
  SpatialTopologyGraph,
  SpatialRelation,
} from './types';
import {
  generateDeterministicSpatialGraphId,
  computeSpatialTopologyChecksum,
} from './determinism';

export interface SpatialPathResult {
  readonly pathFound: boolean;
  readonly isDirect: boolean;
  readonly hopCount: number;
  readonly nodeSequence: readonly string[];
  readonly edgeSequence: readonly string[];
}

export class SpatialTopologyEngine {
  private nodes: Map<string, SpatialNode> = new Map();
  private edges: Map<string, SpatialEdge> = new Map();
  private realityStateId: string;
  private graphId: string;

  constructor(realityStateId = 'RST_DEFAULT', seq = 0) {
    this.realityStateId = realityStateId;
    this.graphId = generateDeterministicSpatialGraphId(realityStateId, seq);
  }

  public addNode(node: SpatialNode): void {
    this.nodes.set(node.objectId, node);
  }

  public addEdge(relation: SpatialRelation, isDirect = true): SpatialEdge {
    const edgeId = `SEDGE_${relation.relationId}`;
    const edge: SpatialEdge = Object.freeze({
      edgeId,
      relation,
      isDirect,
    });
    this.edges.set(edgeId, edge);
    return edge;
  }

  public getGraph(): SpatialTopologyGraph {
    const nodeIds = Array.from(this.nodes.keys());
    const edgeIds = Array.from(this.edges.keys());
    const graphChecksum = computeSpatialTopologyChecksum(this.graphId, this.realityStateId, nodeIds, edgeIds);

    return Object.freeze({
      graphId: this.graphId,
      realityStateId: this.realityStateId,
      nodes: Object.freeze(Array.from(this.nodes.values())),
      edges: Object.freeze(Array.from(this.edges.values())),
      graphChecksum,
    });
  }

  public findDirectRelations(objectId: string): readonly SpatialRelation[] {
    const direct: SpatialRelation[] = [];
    for (const edge of this.edges.values()) {
      if (edge.isDirect && (edge.relation.sourceObjectId === objectId || edge.relation.targetObjectId === objectId)) {
        direct.push(edge.relation);
      }
    }
    return Object.freeze(direct);
  }

  public findMultiHopPath(sourceObjectId: string, targetObjectId: string): SpatialPathResult {
    if (!this.nodes.has(sourceObjectId) || !this.nodes.has(targetObjectId)) {
      return Object.freeze({
        pathFound: false,
        isDirect: false,
        hopCount: 0,
        nodeSequence: Object.freeze([]),
        edgeSequence: Object.freeze([]),
      });
    }

    // Check direct edge first
    for (const edge of this.edges.values()) {
      const rel = edge.relation;
      if (
        (rel.sourceObjectId === sourceObjectId && rel.targetObjectId === targetObjectId) ||
        (rel.sourceObjectId === targetObjectId && rel.targetObjectId === sourceObjectId)
      ) {
        return Object.freeze({
          pathFound: true,
          isDirect: true,
          hopCount: 1,
          nodeSequence: Object.freeze([sourceObjectId, targetObjectId]),
          edgeSequence: Object.freeze([edge.edgeId]),
        });
      }
    }

    // BFS for multi-hop
    const queue: { current: string; path: string[]; edges: string[] }[] = [
      { current: sourceObjectId, path: [sourceObjectId], edges: [] },
    ];
    const visited = new Set<string>([sourceObjectId]);

    while (queue.length > 0) {
      const { current, path, edges } = queue.shift()!;
      if (current === targetObjectId) {
        return Object.freeze({
          pathFound: true,
          isDirect: edges.length === 1,
          hopCount: edges.length,
          nodeSequence: Object.freeze(path),
          edgeSequence: Object.freeze(edges),
        });
      }

      // Sorted neighbor traversal for determinism
      const adjEdges = Array.from(this.edges.values())
        .filter((e) => e.relation.sourceObjectId === current || e.relation.targetObjectId === current)
        .sort((a, b) => a.edgeId.localeCompare(b.edgeId));

      for (const edge of adjEdges) {
        const nextNode = edge.relation.sourceObjectId === current ? edge.relation.targetObjectId : edge.relation.sourceObjectId;
        if (!visited.has(nextNode)) {
          visited.add(nextNode);
          queue.push({
            current: nextNode,
            path: [...path, nextNode],
            edges: [...edges, edge.edgeId],
          });
        }
      }
    }

    return Object.freeze({
      pathFound: false,
      isDirect: false,
      hopCount: 0,
      nodeSequence: Object.freeze([]),
      edgeSequence: Object.freeze([]),
    });
  }

  public detectCycles(): boolean {
    const visited = new Set<string>();
    const recStack = new Set<string>();

    const dfs = (nodeId: string, parentId: string | null): boolean => {
      visited.add(nodeId);
      recStack.add(nodeId);

      const adj = Array.from(this.edges.values())
        .filter((e) => e.relation.sourceObjectId === nodeId || e.relation.targetObjectId === nodeId)
        .map((e) => (e.relation.sourceObjectId === nodeId ? e.relation.targetObjectId : e.relation.sourceObjectId));

      for (const neighbor of adj) {
        if (!visited.has(neighbor)) {
          if (dfs(neighbor, nodeId)) return true;
        } else if (neighbor !== parentId && recStack.has(neighbor)) {
          return true;
        }
      }

      recStack.delete(nodeId);
      return false;
    };

    const sortedNodeIds = Array.from(this.nodes.keys()).sort();
    for (const nodeId of sortedNodeIds) {
      if (!visited.has(nodeId)) {
        if (dfs(nodeId, null)) return true;
      }
    }
    return false;
  }

  public detectOrphanEdges(): readonly string[] {
    const orphans: string[] = [];
    for (const edge of this.edges.values()) {
      if (!this.nodes.has(edge.relation.sourceObjectId)) {
        orphans.push(`Orphan source: ${edge.relation.sourceObjectId} in edge ${edge.edgeId}`);
      }
      if (!this.nodes.has(edge.relation.targetObjectId)) {
        orphans.push(`Orphan target: ${edge.relation.targetObjectId} in edge ${edge.edgeId}`);
      }
    }
    return Object.freeze(orphans);
  }
}
