/**
 * CUBiO AI — Task 187: Native Knowledge Graph Expansion Layer
 * src/cubio/model/native_knowledge_graph_expansion/graphIndex.ts
 *
 * Deterministic Inverted Graph Index:
 * Manages lightweight node and edge references, forward and reverse adjacency,
 * spatial cell indexing, and relation indexing under strict tenant isolation.
 */

import {
  GraphNodeRef,
  GraphEdgeRef,
  GraphTenantViolationError,
  GraphInvalidReferenceError,
} from './types';
import { KnowledgeGovernor } from '../native_knowledge_architecture/knowledgeGovernor';

export class GraphIndex {
  // Master node and edge registries: key = `${tenantId}:${id}`
  private readonly nodes: Map<string, GraphNodeRef> = new Map();
  private readonly edges: Map<string, GraphEdgeRef> = new Map();

  // Inverted adjacency indices
  private readonly forwardAdjacency: Map<string, Set<string>> = new Map();
  private readonly reverseAdjacency: Map<string, Set<string>> = new Map();

  // Spatial address index: key = `${tenantId}:${address369}` -> nodeKeys
  private readonly spatialIndex: Map<string, Set<string>> = new Map();

  // Relation type index: key = `${tenantId}:${relationType}` -> edgeKeys
  private readonly relationIndex: Map<string, Set<string>> = new Map();

  private makeKey(tenantId: string, id: string): string {
    return `${tenantId}:${id}`;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Node Operations
  // ───────────────────────────────────────────────────────────────────────────

  public addNode(node: GraphNodeRef): GraphNodeRef {
    KnowledgeGovernor.assertActuationBlocked(node.label);
    const key = this.makeKey(node.tenantId, node.nodeId);

    this.nodes.set(key, Object.freeze({ ...node }));

    // Spatial indexing
    const spatialKey = `${node.tenantId}:${node.address369}`;
    if (!this.spatialIndex.has(spatialKey)) {
      this.spatialIndex.set(spatialKey, new Set());
    }
    this.spatialIndex.get(spatialKey)!.add(key);

    return node;
  }

  public getNode(nodeId: string, callerTenantId: string): GraphNodeRef | null {
    const key = this.makeKey(callerTenantId, nodeId);
    const node = this.nodes.get(key);
    if (!node) return null;
    if (node.tenantId !== callerTenantId) {
      throw new GraphTenantViolationError(callerTenantId, node.tenantId);
    }
    return node;
  }

  public hasNode(nodeId: string, callerTenantId: string): boolean {
    const key = this.makeKey(callerTenantId, nodeId);
    return this.nodes.has(key);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Edge Operations
  // ───────────────────────────────────────────────────────────────────────────

  public addEdge(edge: GraphEdgeRef): GraphEdgeRef {
    // Verify source and target exist in this tenant
    if (!this.hasNode(edge.sourceId, edge.tenantId)) {
      throw new GraphInvalidReferenceError(
        edge.sourceId,
        `Source node "${edge.sourceId}" does not exist in graph index for tenant "${edge.tenantId}".`
      );
    }
    if (!this.hasNode(edge.targetId, edge.tenantId)) {
      throw new GraphInvalidReferenceError(
        edge.targetId,
        `Target node "${edge.targetId}" does not exist in graph index for tenant "${edge.tenantId}".`
      );
    }

    const key = this.makeKey(edge.tenantId, edge.edgeId);
    this.edges.set(key, Object.freeze({ ...edge }));

    // Forward adjacency: source -> edge
    const fwdKey = `${edge.tenantId}:${edge.sourceId}`;
    if (!this.forwardAdjacency.has(fwdKey)) {
      this.forwardAdjacency.set(fwdKey, new Set());
    }
    this.forwardAdjacency.get(fwdKey)!.add(key);

    // Reverse adjacency: target -> edge
    const revKey = `${edge.tenantId}:${edge.targetId}`;
    if (!this.reverseAdjacency.has(revKey)) {
      this.reverseAdjacency.set(revKey, new Set());
    }
    this.reverseAdjacency.get(revKey)!.add(key);

    // Relation type index
    const relKey = `${edge.tenantId}:${edge.relationType}`;
    if (!this.relationIndex.has(relKey)) {
      this.relationIndex.set(relKey, new Set());
    }
    this.relationIndex.get(relKey)!.add(key);

    return edge;
  }

  public getEdge(edgeId: string, callerTenantId: string): GraphEdgeRef | null {
    const key = this.makeKey(callerTenantId, edgeId);
    const edge = this.edges.get(key);
    if (!edge) return null;
    if (edge.tenantId !== callerTenantId) {
      throw new GraphTenantViolationError(callerTenantId, edge.tenantId);
    }
    return edge;
  }

  public getOutgoingEdges(nodeId: string, callerTenantId: string): readonly GraphEdgeRef[] {
    const fwdKey = `${callerTenantId}:${nodeId}`;
    const edgeKeys = this.forwardAdjacency.get(fwdKey);
    if (!edgeKeys || edgeKeys.size === 0) return [];

    const result: GraphEdgeRef[] = [];
    for (const ek of edgeKeys) {
      const edge = this.edges.get(ek);
      if (edge && edge.tenantId === callerTenantId) {
        result.push(edge);
      }
    }
    return Object.freeze(result.sort((a, b) => a.edgeId.localeCompare(b.edgeId)));
  }

  public getIncomingEdges(nodeId: string, callerTenantId: string): readonly GraphEdgeRef[] {
    const revKey = `${callerTenantId}:${nodeId}`;
    const edgeKeys = this.reverseAdjacency.get(revKey);
    if (!edgeKeys || edgeKeys.size === 0) return [];

    const result: GraphEdgeRef[] = [];
    for (const ek of edgeKeys) {
      const edge = this.edges.get(ek);
      if (edge && edge.tenantId === callerTenantId) {
        result.push(edge);
      }
    }
    return Object.freeze(result.sort((a, b) => a.edgeId.localeCompare(b.edgeId)));
  }

  public getNodesAtAddress(address369: number, callerTenantId: string): readonly GraphNodeRef[] {
    const spatialKey = `${callerTenantId}:${address369}`;
    const nodeKeys = this.spatialIndex.get(spatialKey);
    if (!nodeKeys || nodeKeys.size === 0) return [];

    const result: GraphNodeRef[] = [];
    for (const nk of nodeKeys) {
      const node = this.nodes.get(nk);
      if (node && node.tenantId === callerTenantId) {
        result.push(node);
      }
    }
    return Object.freeze(result.sort((a, b) => a.nodeId.localeCompare(b.nodeId)));
  }

  public getAllNodes(callerTenantId: string): readonly GraphNodeRef[] {
    const result: GraphNodeRef[] = [];
    for (const node of this.nodes.values()) {
      if (node.tenantId === callerTenantId) {
        result.push(node);
      }
    }
    return Object.freeze(result.sort((a, b) => a.nodeId.localeCompare(b.nodeId)));
  }

  public getAllEdges(callerTenantId: string): readonly GraphEdgeRef[] {
    const result: GraphEdgeRef[] = [];
    for (const edge of this.edges.values()) {
      if (edge.tenantId === callerTenantId) {
        result.push(edge);
      }
    }
    return Object.freeze(result.sort((a, b) => a.edgeId.localeCompare(b.edgeId)));
  }

  public getStats(tenantId: string): { nodeCount: number; edgeCount: number } {
    let nodeCount = 0;
    let edgeCount = 0;
    for (const node of this.nodes.values()) if (node.tenantId === tenantId) nodeCount++;
    for (const edge of this.edges.values()) if (edge.tenantId === tenantId) edgeCount++;
    return { nodeCount, edgeCount };
  }
}
