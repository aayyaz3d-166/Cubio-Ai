/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel F11: Spatial Relationship Graph
 *
 * Deterministic graph structure supporting traversal, pathfinding,
 * connected components, ancestors/descendants, and neighborhood extraction.
 */

import { WorldEntity, WorldRelation, WorldRelationType } from './types';

export interface GraphPath {
  readonly nodes: readonly string[]; // entity IDs
  readonly edges: readonly WorldRelation[];
  readonly totalLength: number;
}

export class F11RelationshipGraph {
  private readonly entities: Readonly<Record<string, WorldEntity>>;
  private readonly relations: readonly WorldRelation[];
  private readonly outgoing: Map<string, WorldRelation[]> = new Map();
  private readonly incoming: Map<string, WorldRelation[]> = new Map();

  constructor(
    entities: Readonly<Record<string, WorldEntity>>,
    relations: readonly WorldRelation[]
  ) {
    this.entities = entities;
    this.relations = relations;

    // Index edges deterministically
    for (const rel of relations) {
      if (!this.outgoing.has(rel.sourceEntityId)) {
        this.outgoing.set(rel.sourceEntityId, []);
      }
      this.outgoing.get(rel.sourceEntityId)!.push(rel);

      if (!this.incoming.has(rel.targetEntityId)) {
        this.incoming.set(rel.targetEntityId, []);
      }
      this.incoming.get(rel.targetEntityId)!.push(rel);
    }
  }

  public getDirectRelations(entityId: string): readonly WorldRelation[] {
    return Object.freeze([...(this.outgoing.get(entityId) || []), ...(this.incoming.get(entityId) || [])]);
  }

  public getRelationsBetween(sourceId: string, targetId: string): readonly WorldRelation[] {
    const list = this.outgoing.get(sourceId) || [];
    return Object.freeze(list.filter((r) => r.targetEntityId === targetId));
  }

  /**
   * Finds all direct/transitive targets reachable via a specific relation type (e.g. all objects BELOW X).
   */
  public getDescendants(
    entityId: string,
    relationType: WorldRelationType
  ): readonly { entityId: string; depth: number; path: readonly WorldRelation[] }[] {
    const visited = new Set<string>();
    const results: { entityId: string; depth: number; path: readonly WorldRelation[] }[] = [];
    const queue: { currentId: string; depth: number; path: WorldRelation[] }[] = [
      { currentId: entityId, depth: 0, path: [] },
    ];
    visited.add(entityId);

    while (queue.length > 0) {
      const { currentId, depth, path } = queue.shift()!;
      const edges = (this.outgoing.get(currentId) || []).filter((r) => r.relationType === relationType);

      for (const edge of edges) {
        if (!visited.has(edge.targetEntityId)) {
          visited.add(edge.targetEntityId);
          const nextPath = [...path, edge];
          results.push({ entityId: edge.targetEntityId, depth: depth + 1, path: nextPath });
          queue.push({ currentId: edge.targetEntityId, depth: depth + 1, path: nextPath });
        }
      }
    }

    return Object.freeze(results);
  }

  /**
   * Finds all direct/transitive ancestors leading to this entity via a specific relation type (e.g. all objects ABOVE X).
   */
  public getAncestors(
    entityId: string,
    relationType: WorldRelationType
  ): readonly { entityId: string; depth: number; path: readonly WorldRelation[] }[] {
    const visited = new Set<string>();
    const results: { entityId: string; depth: number; path: readonly WorldRelation[] }[] = [];
    const queue: { currentId: string; depth: number; path: WorldRelation[] }[] = [
      { currentId: entityId, depth: 0, path: [] },
    ];
    visited.add(entityId);

    while (queue.length > 0) {
      const { currentId, depth, path } = queue.shift()!;
      const edges = (this.incoming.get(currentId) || []).filter((r) => r.relationType === relationType);

      for (const edge of edges) {
        if (!visited.has(edge.sourceEntityId)) {
          visited.add(edge.sourceEntityId);
          const nextPath = [...path, edge];
          results.push({ entityId: edge.sourceEntityId, depth: depth + 1, path: nextPath });
          queue.push({ currentId: edge.sourceEntityId, depth: depth + 1, path: nextPath });
        }
      }
    }

    return Object.freeze(results);
  }

  /**
   * Finds the shortest directed path between two entities.
   */
  public findShortestPath(sourceId: string, targetId: string): GraphPath | null {
    if (sourceId === targetId) {
      return { nodes: [sourceId], edges: [], totalLength: 0 };
    }

    const visited = new Set<string>();
    const queue: { currentId: string; nodes: string[]; edges: WorldRelation[] }[] = [
      { currentId: sourceId, nodes: [sourceId], edges: [] },
    ];
    visited.add(sourceId);

    while (queue.length > 0) {
      const { currentId, nodes, edges } = queue.shift()!;
      const outgoingEdges = this.outgoing.get(currentId) || [];

      for (const edge of outgoingEdges) {
        if (edge.targetEntityId === targetId) {
          return {
            nodes: Object.freeze([...nodes, targetId]),
            edges: Object.freeze([...edges, edge]),
            totalLength: edges.length + 1,
          };
        }

        if (!visited.has(edge.targetEntityId)) {
          visited.add(edge.targetEntityId);
          queue.push({
            currentId: edge.targetEntityId,
            nodes: [...nodes, edge.targetEntityId],
            edges: [...edges, edge],
          });
        }
      }
    }

    return null;
  }

  /**
   * Computes connected components of the entity graph.
   */
  public getConnectedComponents(): readonly (readonly string[])[] {
    const visited = new Set<string>();
    const components: string[][] = [];
    const entityIds = Object.keys(this.entities).sort();

    for (const entId of entityIds) {
      if (visited.has(entId)) continue;
      const comp: string[] = [];
      const queue: string[] = [entId];
      visited.add(entId);

      while (queue.length > 0) {
        const curr = queue.shift()!;
        comp.push(curr);

        const neighbors = [
          ...(this.outgoing.get(curr) || []).map((r) => r.targetEntityId),
          ...(this.incoming.get(curr) || []).map((r) => r.sourceEntityId),
        ];

        for (const n of neighbors) {
          if (!visited.has(n)) {
            visited.add(n);
            queue.push(n);
          }
        }
      }

      components.push(comp.sort());
    }

    return Object.freeze(components.map((c) => Object.freeze(c)));
  }

  /**
   * Neighborhood query (all entities within k-hops).
   */
  public getNeighborhood(centerId: string, maxHops = 2): readonly string[] {
    const visited = new Set<string>();
    const queue: { id: string; hop: number }[] = [{ id: centerId, hop: 0 }];
    visited.add(centerId);

    while (queue.length > 0) {
      const { id, hop } = queue.shift()!;
      if (hop >= maxHops) continue;

      const neighbors = [
        ...(this.outgoing.get(id) || []).map((r) => r.targetEntityId),
        ...(this.incoming.get(id) || []).map((r) => r.sourceEntityId),
      ];

      for (const n of neighbors) {
        if (!visited.has(n)) {
          visited.add(n);
          queue.push({ id: n, hop: hop + 1 });
        }
      }
    }

    visited.delete(centerId);
    return Object.freeze([...visited].sort());
  }
}
