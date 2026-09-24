/**
 * CUBiO AI — Task 187: Native Knowledge Graph Expansion Layer
 * src/cubio/model/native_knowledge_graph_expansion/knowledgeGraphCoordinator.ts
 *
 * Knowledge Graph Coordinator:
 * Master orchestration facade for native graph expansion.
 * Coordinates GraphIndex, GraphTraverser, and SpatialGraphIntegrator under
 * strict hardware actuation lockout, tenant isolation, and VDB primacy.
 */

import * as crypto from 'crypto';
import {
  TASK_187_ID,
  IS_ACTUATION_BLOCKED,
  GraphNodeRef,
  GraphEdgeRef,
  GraphTraversalConfig,
  GraphTraversalResult,
  SpatialGraphNeighborhood,
} from './types';
import { GraphIndex } from './graphIndex';
import { GraphTraverser } from './graphTraverser';
import { SpatialGraphIntegrator } from './spatialGraphIntegrator';
import { KnowledgeGovernor } from '../native_knowledge_architecture/knowledgeGovernor';
import {
  KnowledgeEntity,
  Relationship,
  Concept,
} from '../native_knowledge_architecture/types';
import { NormalizedEntity } from '../native_knowledge_normalization/types';

export class KnowledgeGraphCoordinator {
  public static readonly VERSION = '187.1.0';
  public static readonly IS_ACTUATION_BLOCKED = IS_ACTUATION_BLOCKED;

  private readonly index: GraphIndex;
  private readonly traverser: GraphTraverser;
  private readonly spatialIntegrator: SpatialGraphIntegrator;

  constructor() {
    this.index = new GraphIndex();
    this.traverser = new GraphTraverser(this.index);
    this.spatialIntegrator = new SpatialGraphIntegrator(this.index);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Node Registration
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Registers a graph node reference from a KnowledgeEntity or NormalizedEntity.
   */
  public registerNodeFromCanonicalEntity(
    entity: KnowledgeEntity | NormalizedEntity,
    callerTenantId: string
  ): GraphNodeRef {
    KnowledgeGovernor.assertActuationBlocked(
      'name' in entity ? entity.name : entity.primaryName
    );
    KnowledgeGovernor.assertTenantIntegrity(callerTenantId, entity.tenantId);

    const nodeId = 'entityId' in entity ? entity.entityId : entity.canonicalId;
    const label = 'name' in entity ? entity.name : entity.primaryName;
    const checksum = 'checksum' in entity ? entity.checksum : entity.canonicalChecksum;

    const nodeRef: GraphNodeRef = {
      nodeId,
      canonicalId: nodeId,
      objectType: 'ENTITY',
      label,
      address369: entity.address369,
      cellId343: 'cellId343' in entity ? entity.cellId343 : undefined,
      tenantId: entity.tenantId,
      stateVersion: entity.stateVersion,
      checksum,
      epistemicStatus: entity.epistemicStatus,
    };

    return this.index.addNode(nodeRef);
  }

  /**
   * Registers a graph node reference from a Concept.
   */
  public registerNodeFromConcept(
    concept: Concept,
    callerTenantId: string
  ): GraphNodeRef {
    KnowledgeGovernor.assertActuationBlocked(concept.label);
    KnowledgeGovernor.assertTenantIntegrity(callerTenantId, concept.tenantId);

    const nodeRef: GraphNodeRef = {
      nodeId: concept.conceptId,
      canonicalId: concept.conceptId,
      objectType: 'CONCEPT',
      label: concept.label,
      address369: concept.address369,
      cellId343: concept.cellId343,
      tenantId: concept.tenantId,
      stateVersion: concept.stateVersion,
      checksum: concept.checksum,
      epistemicStatus: concept.epistemicStatus,
    };

    return this.index.addNode(nodeRef);
  }

  /**
   * Registers a raw GraphNodeRef directly with validation.
   */
  public registerRawNode(node: GraphNodeRef, callerTenantId: string): GraphNodeRef {
    KnowledgeGovernor.assertActuationBlocked(node.label);
    KnowledgeGovernor.assertTenantIntegrity(callerTenantId, node.tenantId);
    return this.index.addNode(node);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Edge Registration
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Registers a graph edge reference from a canonical Relationship.
   */
  public registerEdgeFromCanonicalRelationship(
    rel: Relationship,
    callerTenantId: string
  ): GraphEdgeRef {
    KnowledgeGovernor.assertActuationBlocked(rel.relationType);
    KnowledgeGovernor.assertTenantIntegrity(callerTenantId, rel.tenantId);

    const edgeRef: GraphEdgeRef = {
      edgeId: rel.relationshipId,
      sourceId: rel.sourceId,
      targetId: rel.targetId,
      relationType: rel.relationType,
      weight: rel.weight,
      tenantId: rel.tenantId,
      stateVersion: rel.stateVersion,
      checksum: rel.checksum,
      isDirected: !rel.bidirectional,
    };

    return this.index.addEdge(edgeRef);
  }

  /**
   * Registers a raw GraphEdgeRef directly with validation.
   */
  public registerRawEdge(edge: GraphEdgeRef, callerTenantId: string): GraphEdgeRef {
    KnowledgeGovernor.assertActuationBlocked(edge.relationType);
    KnowledgeGovernor.assertTenantIntegrity(callerTenantId, edge.tenantId);
    return this.index.addEdge(edge);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Traversal & Neighborhood Operations
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Executes bounded graph traversal from a start node.
   */
  public traverse(
    startNodeId: string,
    callerTenantId: string,
    config?: GraphTraversalConfig
  ): GraphTraversalResult {
    KnowledgeGovernor.assertActuationBlocked(startNodeId);
    return this.traverser.traverse(startNodeId, callerTenantId, config);
  }

  /**
   * Computes hybrid spatial-semantic neighborhood around a center node.
   */
  public expandSpatialSemanticNeighborhood(
    centerNodeId: string,
    callerTenantId: string,
    spatialRadius: number = 2
  ): SpatialGraphNeighborhood {
    KnowledgeGovernor.assertActuationBlocked(centerNodeId);
    return this.spatialIntegrator.expandNeighborhood(
      centerNodeId,
      callerTenantId,
      spatialRadius
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Query & Export
  // ───────────────────────────────────────────────────────────────────────────

  public getNode(nodeId: string, callerTenantId: string): GraphNodeRef | null {
    return this.index.getNode(nodeId, callerTenantId);
  }

  public getEdge(edgeId: string, callerTenantId: string): GraphEdgeRef | null {
    return this.index.getEdge(edgeId, callerTenantId);
  }

  public getIndex(): GraphIndex {
    return this.index;
  }

  /**
   * Exports an immutable, deterministic graph snapshot for a tenant with SHA-256 digest.
   */
  public exportGraphSnapshot(callerTenantId: string): {
    readonly tenantId: string;
    readonly nodeCount: number;
    readonly edgeCount: number;
    readonly nodes: readonly GraphNodeRef[];
    readonly edges: readonly GraphEdgeRef[];
    readonly digest: string;
  } {
    const nodes = this.index.getAllNodes(callerTenantId);
    const edges = this.index.getAllEdges(callerTenantId);

    const payload = JSON.stringify({
      tenantId: callerTenantId,
      nodes: nodes.map((n) => ({
        id: n.nodeId,
        label: n.label,
        addr: n.address369,
        v: n.stateVersion,
        cs: n.checksum,
      })),
      edges: edges.map((e) => ({
        id: e.edgeId,
        src: e.sourceId,
        dst: e.targetId,
        rel: e.relationType,
        w: e.weight,
        cs: e.checksum,
      })),
    });

    const digest = crypto.createHash('sha256').update(payload).digest('hex');

    return Object.freeze({
      tenantId: callerTenantId,
      nodeCount: nodes.length,
      edgeCount: edges.length,
      nodes,
      edges,
      digest,
    });
  }

  /**
   * Emits an advisory in read-only mode, guaranteeing no physical actuation.
   */
  public emitAdvisory(message: string): {
    readonly taskId: string;
    readonly status: 'ADVISORY_EMITTED';
    readonly message: string;
    readonly actuationBlocked: boolean;
  } {
    KnowledgeGovernor.assertActuationBlocked(message);
    return Object.freeze({
      taskId: TASK_187_ID,
      status: 'ADVISORY_EMITTED',
      message,
      actuationBlocked: IS_ACTUATION_BLOCKED,
    });
  }
}
