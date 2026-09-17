/**
 * 3D Memory Studio — Funnel 59
 * Actual 3D Cluster & Spatial Organization Engine Types
 *
 * Strongly typed definitions for 3D clusters, deterministic spatial layouts,
 * graph-aware metrics, boundary envelopes, and research tests.
 */

import * as THREE from 'three';
import { DataClassification } from '../funnel47/types';
import { SimulationDimension } from '../funnel52/types';
import { GraphRelationshipType } from '../funnel58/types';

export type ClusterType =
  | 'DOMAIN'
  | 'CATEGORY'
  | 'SEMANTIC'
  | 'SOURCE'
  | 'SEQUENCE'
  | 'COORDINATE';

export type ClusterLayoutMode =
  | 'RADIAL'
  | 'GRID'
  | 'ORBITAL'
  | 'HIERARCHICAL'
  | 'DOMAIN_RADIAL';

export interface ClusterBounds {
  readonly min: readonly [number, number, number];
  readonly max: readonly [number, number, number];
}

export interface ClusterMetrics {
  readonly internalEdgeCount: number;
  readonly externalEdgeCount: number;
  readonly density: number; // [0.0, 1.0]
  readonly totalDegree: number;
}

export interface Cluster {
  readonly clusterId: string;
  readonly clusterType: ClusterType;
  readonly name: string;
  memberStateIds: string[];
  memberRelationshipIds: string[];
  center: [number, number, number];
  radius: number;
  minBounds: [number, number, number];
  maxBounds: [number, number, number];
  dimension: SimulationDimension;
  visible: boolean;
  enabled: boolean;
  selected: boolean;
  highlighted: boolean;
  parentClusterId: string | null;
  childClusterIds: string[];
  readonly classification: DataClassification;
  metadata: Record<string, unknown>;
  checksum: string;
  metrics: ClusterMetrics;
  colorHex: string;
}

export interface IClusterMesh {
  readonly id: string;
  readonly cluster: Cluster;
  readonly groupObject: THREE.Group;
  visible: boolean;
  updateGeometry(center: [number, number, number], radius: number): void;
  setHighlighted(highlighted: boolean): void;
  setSelected(selected: boolean): void;
  dispose(): void;
}

export interface ClusterEngineStats {
  readonly totalClusters: number;
  readonly visibleClusters: number;
  readonly totalMembers: number;
  readonly internalEdges: number;
  readonly externalEdges: number;
  readonly selectedClusterId: string | null;
  readonly layoutMode: ClusterLayoutMode;
  readonly activeDimension: SimulationDimension;
  readonly isComputationalProjection: boolean;
}

export interface F59TestResult {
  readonly testId: string;
  readonly name: string;
  readonly passed: boolean;
  readonly details: string;
  readonly durationMs: number;
  readonly totalEvaluations?: number;
  readonly variance?: number;
}

export interface F59SuiteReport {
  readonly suiteName: string;
  readonly totalTests: number;
  readonly passedTests: number;
  readonly failedTests: number;
  readonly allPassed: boolean;
  readonly totalDurationMs: number;
  readonly results: readonly F59TestResult[];
}
