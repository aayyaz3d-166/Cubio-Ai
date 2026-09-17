/**
 * 3D Memory Studio — Funnel 58
 * Graph Topology Model & Node Metrics
 */

import { GraphNode } from '../types';
import { GraphRegistry } from './graphRegistry';

export class GraphModel {
  private nodes: Map<string, GraphNode> = new Map();

  public addNode(node: GraphNode): void {
    this.nodes.set(node.stateId, node);
  }

  public getNode(stateId: string): GraphNode | undefined {
    return this.nodes.get(stateId);
  }

  public hasNode(stateId: string): boolean {
    return this.nodes.has(stateId);
  }

  public removeNode(stateId: string): boolean {
    return this.nodes.delete(stateId);
  }

  public getAllNodes(): readonly GraphNode[] {
    return Array.from(this.nodes.values());
  }

  public get count(): number {
    return this.nodes.size;
  }

  public recalculateDegrees(registry: GraphRegistry): void {
    for (const node of this.nodes.values()) {
      const outRels = registry.getBySource(node.stateId);
      const inRels = registry.getByTarget(node.stateId);

      node.outDegree = outRels.length;
      node.inDegree = inRels.length;
      node.degree = node.outDegree + node.inDegree;
    }
  }

  public getNeighbors(stateId: string, registry: GraphRegistry): readonly string[] {
    const neighbors = new Set<string>();
    for (const r of registry.getBySource(stateId)) {
      neighbors.add(r.targetStateId);
    }
    for (const r of registry.getByTarget(stateId)) {
      neighbors.add(r.sourceStateId);
    }
    return Array.from(neighbors);
  }

  public clear(): void {
    this.nodes.clear();
  }
}
