/**
 * 3D Memory Studio — Funnel 56
 * Actual 3D Scene Engine Types
 *
 * Strongly typed definitions for Scene Graph, Scene Objects, Transform System,
 * Layers, Visibility, Selection, and Research Test Suite.
 */

import { DimensionalInformationState } from '../funnel49/types';
import { SimulationDimension } from '../funnel52/types';
import { MemoryRendererHost } from '../funnel55/renderer/rendererHost';

export type SceneObjectType =
  | 'CORE'
  | 'STATE'
  | 'RELATIONSHIP'
  | 'CLUSTER'
  | 'DIMENSION'
  | 'PARTICLE'
  | 'OVERLAY'
  | 'CONTAINER';

export type SceneLayerId =
  | 'DIMENSION_LAYER'
  | 'RELATIONSHIP_LAYER'
  | 'CLUSTER_LAYER'
  | 'STATE_LAYER'
  | 'CORE_LAYER'
  | 'EFFECTS_LAYER'
  | 'OVERLAY_LAYER';

export type SceneEngineLifecycleState =
  | 'CREATED'
  | 'INITIALIZED'
  | 'ATTACHED'
  | 'READY'
  | 'RUNNING'
  | 'PAUSED'
  | 'DISPOSED';

export type RelationshipType =
  | 'SEMANTIC'
  | 'DOMAIN'
  | 'CATEGORY'
  | 'SOURCE'
  | 'SEQUENCE'
  | 'COORDINATE';

export interface Vector3D {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface Transform3D {
  position: [number, number, number];
  rotation: [number, number, number]; // Euler angles in radians
  scale: [number, number, number];
}

export interface WorldTransform3D {
  readonly position: readonly [number, number, number];
  readonly rotation: readonly [number, number, number];
  readonly scale: readonly [number, number, number];
}

export interface SceneObjectMetadata {
  readonly [key: string]: unknown;
}

export interface ISceneObject {
  readonly id: string;
  readonly type: SceneObjectType;
  parentId: string | null;
  readonly children: readonly ISceneObject[];
  visible: boolean;
  enabled: boolean;
  layerId: SceneLayerId;
  transform: Transform3D;
  worldTransform: WorldTransform3D;
  opacity: number;
  readonly classification?: 'GREEN' | 'RED';
  readonly stateId?: string;
  readonly recordId?: string;
  readonly checksum?: string;
  readonly sourceState?: DimensionalInformationState;
  metadata: SceneObjectMetadata;

  addChild(child: ISceneObject): void;
  removeChild(childId: string): boolean;
  getChild(childId: string): ISceneObject | undefined;
  update(deltaMs: number, timeMs: number, parentWorldTransform?: WorldTransform3D): void;
  render(context: unknown): void;
  dispose(): void;
}

export interface SceneEngineStats {
  readonly totalObjects: number;
  readonly visibleStates: number;
  readonly visibleRelationships: number;
  readonly totalClusters: number;
  readonly totalDimensionObjects: number;
  readonly activeLayerCount: number;
  readonly selectedObjectId: string | null;
  readonly highlightedCount: number;
  readonly activeDimension: SimulationDimension;
  readonly lifecycleState: SceneEngineLifecycleState;
}

export interface F56TestResult {
  readonly testId: string;
  readonly name: string;
  readonly passed: boolean;
  readonly details: string;
  readonly durationMs: number;
  readonly totalEvaluations?: number;
  readonly variance?: number;
}

export interface F56SuiteReport {
  readonly suiteName: string;
  readonly totalTests: number;
  readonly passedTests: number;
  readonly failedTests: number;
  readonly allPassed: boolean;
  readonly totalDurationMs: number;
  readonly results: readonly F56TestResult[];
}
