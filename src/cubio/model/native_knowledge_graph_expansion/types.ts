/**
 * CUBiO AI — Task 187: Native Knowledge Graph Expansion Layer
 * src/cubio/model/native_knowledge_graph_expansion/types.ts
 *
 * Types and interfaces for native graph expansion:
 * - GraphNodeRef & GraphEdgeRef
 * - Traversal configurations and results
 * - Spatial-Semantic neighborhood representations
 * - Safety error classes and constants
 *
 * STRICT INVARIANTS:
 * 1. Hardware Actuation Lockout: IS_ACTUATION_BLOCKED === true permanently.
 * 2. VDB Primacy: Graph layer uses lightweight references; VDB is primary authority.
 * 3. Spatial Grounding: Integration with 343 cell lattice and 369 Euler address space.
 * 4. Tenant Isolation & Acyclicity: Fail-closed cycle detection and cross-tenant separation.
 */

import {
  KnowledgeEpistemicStatus,
  KnowledgeRelationType,
} from '../native_knowledge_architecture/types';

export const TASK_187_ID = 'CUBIO-TASK-187-KNOWLEDGE-GRAPH-EXPANSION';
export const IS_ACTUATION_BLOCKED = true;

/**
 * Lightweight Canonical Graph Node Reference.
 */
export interface GraphNodeRef {
  readonly nodeId: string;
  readonly canonicalId: string;
  readonly objectType: 'ENTITY' | 'CONCEPT';
  readonly label: string;
  readonly address369: number;
  readonly cellId343?: number;
  readonly tenantId: string;
  readonly stateVersion: number;
  readonly checksum: string;
  readonly epistemicStatus: KnowledgeEpistemicStatus;
}

/**
 * Lightweight Canonical Graph Edge Reference.
 */
export interface GraphEdgeRef {
  readonly edgeId: string;
  readonly sourceId: string;
  readonly targetId: string;
  readonly relationType: KnowledgeRelationType | string;
  readonly weight: number;           // [0.0..1.0]
  readonly tenantId: string;
  readonly stateVersion: number;
  readonly checksum: string;
  readonly isDirected: boolean;
}

/**
 * Traversal configuration.
 */
export interface GraphTraversalConfig {
  readonly maxDepth?: number;        // Default 3, max 8
  readonly maxNodes?: number;        // Default 64, max 256
  readonly direction?: 'OUTGOING' | 'INCOMING' | 'BOTH';
  readonly relationFilter?: readonly string[];
  readonly minWeight?: number;
  readonly enforceAcyclic?: boolean;
}

/**
 * Traversal result.
 */
export interface GraphTraversalResult {
  readonly startNodeId: string;
  readonly visitedNodes: readonly GraphNodeRef[];
  readonly visitedEdges: readonly GraphEdgeRef[];
  readonly depthReached: number;
  readonly cycleDetected: boolean;
  readonly cyclePath?: readonly string[];
  readonly traversalDigest: string;
}

/**
 * Hybrid Spatial-Semantic Neighborhood representation.
 */
export interface SpatialGraphNeighborhood {
  readonly centerNodeId: string;
  readonly centerAddress369: number;
  readonly spatialRadius: number;
  readonly semanticNeighbors: readonly GraphNodeRef[];
  readonly spatialCoLocatedNodes: readonly GraphNodeRef[];
  readonly hybridRankedNodes: readonly {
    node: GraphNodeRef;
    semanticScore: number;
    spatialAffinity: number;
    hybridScore: number;
  }[];
}

/**
 * Graph safety and integrity error classes.
 */
export class GraphCycleDetectedError extends Error {
  constructor(path: readonly string[]) {
    super(`[GraphCycleDetectedError] Forbidden cycle detected in directed graph path: ${path.join(' -> ')}.`);
    this.name = 'GraphCycleDetectedError';
  }
}

export class GraphInvalidReferenceError extends Error {
  constructor(nodeId: string, reason: string) {
    super(`[GraphInvalidReferenceError] Broken or invalid graph reference for node "${nodeId}": ${reason}.`);
    this.name = 'GraphInvalidReferenceError';
  }
}

export class GraphTenantViolationError extends Error {
  constructor(callerTenant: string, targetTenant: string) {
    super(`[GraphTenantViolationError] Cross-tenant graph operation rejected: caller "${callerTenant}" cannot access target "${targetTenant}".`);
    this.name = 'GraphTenantViolationError';
  }
}

export class GraphActuationBlockedError extends Error {
  constructor(directive: string) {
    super(`[GraphActuationBlockedError] Hardware actuation command "${directive}" blocked fail-closed.`);
    this.name = 'GraphActuationBlockedError';
  }
}
