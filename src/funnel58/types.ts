/**
 * 3D Memory Studio — Funnel 58
 * Actual 3D Relationship & Graph Rendering Engine Types
 *
 * Strongly typed definitions for 3D relationships, graph topology,
 * filtering, strength normalization, traversal queries, and research tests.
 */

import * as THREE from 'three';
import { DataClassification } from '../funnel47/types';
import { SimulationDimension } from '../funnel52/types';

export type GraphRelationshipType =
  | 'SEMANTIC'
  | 'DOMAIN'
  | 'CATEGORY'
  | 'SOURCE'
  | 'SEQUENCE'
  | 'COORDINATE';

export type GraphEdgeForm = 'STRAIGHT' | 'CURVED';

export type GraphDirection = 'UNDIRECTED' | 'DIRECTED';

export type GraphStrengthFilter = 'ALL' | 'STRONG' | 'MEDIUM' | 'WEAK';

export interface GraphRelationship {
  readonly relationshipId: string;
  readonly sourceStateId: string;
  readonly targetStateId: string;
  readonly relationshipType: GraphRelationshipType;
  strength: number; // [0.0, 1.0]
  readonly direction: GraphDirection;
  visible: boolean;
  selected: boolean;
  highlighted: boolean;
  readonly classification: DataClassification;
  sourcePos: [number, number, number];
  targetPos: [number, number, number];
}

export interface GraphNode {
  readonly stateId: string;
  readonly entityName: string;
  readonly category: string;
  readonly classification: DataClassification;
  position: [number, number, number];
  visible: boolean;
  selected: boolean;
  highlighted: boolean;
  degree: number;
  inDegree: number;
  outDegree: number;
}

export interface GraphFilterCriteria {
  readonly allowedTypes: ReadonlySet<GraphRelationshipType>;
  readonly strengthFilter: GraphStrengthFilter;
  readonly minStrength: number;
  readonly showDirectedOnly: boolean;
  readonly showSelectedNeighborhoodOnly: boolean;
}

export interface SubgraphQueryReport {
  readonly rootNodeId: string;
  readonly depth: number;
  readonly nodeIds: readonly string[];
  readonly relationshipIds: readonly string[];
  readonly totalNodes: number;
  readonly totalRelationships: number;
}

export interface GraphEngineStats {
  readonly totalNodes: number;
  readonly visibleNodes: number;
  readonly totalRelationships: number;
  readonly visibleEdges: number;
  readonly semanticCount: number;
  readonly domainCount: number;
  readonly categoryCount: number;
  readonly sourceCount: number;
  readonly sequenceCount: number;
  readonly coordinateCount: number;
  readonly selectedNodeId: string | null;
  readonly selectedRelationshipId: string | null;
  readonly activeDimension: SimulationDimension;
  readonly isComputationalProjection: boolean;
}

export interface IGraphEdgeMesh {
  readonly id: string;
  readonly relationship: GraphRelationship;
  readonly lineObject: THREE.Object3D;
  visible: boolean;
  updateEndpoints(src: [number, number, number], tgt: [number, number, number]): void;
  setHighlighted(highlighted: boolean): void;
  setSelected(selected: boolean): void;
  dispose(): void;
}

export interface F58TestResult {
  readonly testId: string;
  readonly name: string;
  readonly passed: boolean;
  readonly details: string;
  readonly durationMs: number;
  readonly totalEvaluations?: number;
  readonly variance?: number;
}

export interface F58SuiteReport {
  readonly suiteName: string;
  readonly totalTests: number;
  readonly passedTests: number;
  readonly failedTests: number;
  readonly allPassed: boolean;
  readonly totalDurationMs: number;
  readonly results: readonly F58TestResult[];
}
