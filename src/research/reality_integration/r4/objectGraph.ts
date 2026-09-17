/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R4: Reality Object Graph Engine
 *
 * Implements deterministic graph representation, path reconstruction,
 * cycle detection, and direct vs multi-hop relationship distinction.
 */

import {
  RealityObject,
  RealityRelationship,
} from './types';
import { deterministicHash } from './determinism';

export interface GraphPathResult {
  readonly pathFound: boolean;
  readonly isDirect: boolean;
  readonly hopCount: number;
  readonly nodeSequence: readonly string[];
  readonly edgeSequence: readonly string[];
}

export class RealityObjectGraph {
  private nodes: Map<string, RealityObject> = new Map();
  private edges: Map<string, RealityRelationship> = new Map();

  public addNode(obj: RealityObject): void {
    this.nodes.set(obj.identity.objectId, obj);
  }

  public removeNode(objectId: string): void {
    this.nodes.delete(objectId);
    // Remove attached edges
    for (const [id, rel] of Array.from(this.edges.entries())) {
      if (rel.sourceObjectId === objectId || rel.targetObjectId === objectId) {
        this.edges.delete(id);
      }
    }
  }

  public addRelationship(rel: RealityRelationship): void {
    this.edges.set(rel.relationshipId, rel);
  }

  public removeRelationship(relationshipId: string): void {
    this.edges.delete(relationshipId);
  }

  public getNode(objectId: string): RealityObject | null {
    return this.nodes.get(objectId) ?? null;
  }

  public listNodes(): readonly RealityObject[] {
    return Object.freeze(Array.from(this.nodes.values()));
  }

  public listEdges(): readonly RealityRelationship[] {
    return Object.freeze(Array.from(this.edges.values()));
  }

  public findDirectRelationships(objectId: string): readonly RealityRelationship[] {
    const direct: RealityRelationship[] = [];
    for (const rel of this.edges.values()) {
      if (rel.sourceObjectId === objectId || rel.targetObjectId === objectId) {
        direct.push(rel);
      }
    }
    return Object.freeze(direct);
  }

  public reconstructRelationshipPath(sourceObjectId: string, targetObjectId: string): GraphPathResult {
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
    for (const rel of this.edges.values()) {
      if (
        (rel.sourceObjectId === sourceObjectId && rel.targetObjectId === targetObjectId) ||
        (rel.sourceObjectId === targetObjectId && rel.targetObjectId === sourceObjectId)
      ) {
        return Object.freeze({
          pathFound: true,
          isDirect: true,
          hopCount: 1,
          nodeSequence: Object.freeze([sourceObjectId, targetObjectId]),
          edgeSequence: Object.freeze([rel.relationshipId]),
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
        .filter((e) => e.sourceObjectId === current || e.targetObjectId === current)
        .sort((a, b) => a.relationshipId.localeCompare(b.relationshipId));

      for (const edge of adjEdges) {
        const nextNode = edge.sourceObjectId === current ? edge.targetObjectId : edge.sourceObjectId;
        if (!visited.has(nextNode)) {
          visited.add(nextNode);
          queue.push({
            current: nextNode,
            path: [...path, nextNode],
            edges: [...edges, edge.relationshipId],
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
        .filter((e) => e.sourceObjectId === nodeId || e.targetObjectId === nodeId)
        .map((e) => (e.sourceObjectId === nodeId ? e.targetObjectId : e.sourceObjectId));

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

  public detectOrphanReferences(): readonly string[] {
    const orphans: string[] = [];
    for (const rel of this.edges.values()) {
      if (!this.nodes.has(rel.sourceObjectId)) {
        orphans.push(`Orphan source: ${rel.sourceObjectId} in relationship ${rel.relationshipId}`);
      }
      if (!this.nodes.has(rel.targetObjectId)) {
        orphans.push(`Orphan target: ${rel.targetObjectId} in relationship ${rel.relationshipId}`);
      }
    }
    return Object.freeze(orphans);
  }

  public computeGraphChecksum(): string {
    const nodeIds = Array.from(this.nodes.keys()).sort();
    const edgeIds = Array.from(this.edges.keys()).sort();
    const raw = JSON.stringify([nodeIds, edgeIds]);
    return `CS_GRAPH_${deterministicHash(raw)}`;
  }
}
