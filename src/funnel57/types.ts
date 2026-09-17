/**
 * 3D Memory Studio — Funnel 57
 * Actual 3D Geometry & Material Engine Types
 *
 * Strongly typed definitions for Geometry Registry, Material Registry,
 * Mesh Objects, LOD Policies, Quality Levels, and Research Tests.
 */

import * as THREE from 'three';
import { ISceneObject } from '../funnel56/types';
import { DimensionalInformationState } from '../funnel49/types';
import { SimulationDimension } from '../funnel52/types';

export type GeometryQualityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'AUTO';

export type GeometryType =
  | 'CORE_SPHERE'
  | 'CORE_TORUS_INNER'
  | 'CORE_TORUS_OUTER'
  | 'STATE_SPHERE_HIGH'
  | 'STATE_SPHERE_MED'
  | 'STATE_SPHERE_LOW'
  | 'RELATIONSHIP_LINE'
  | 'CLUSTER_RING'
  | 'DIMENSION_GRID'
  | 'DIMENSION_AXES'
  | 'SELECTION_HALO'
  | 'PARTICLE_POINTS'
  | 'CUSTOM';

export type MaterialVocabType =
  | 'MEMORY_CORE'
  | 'STATE_DEFAULT'
  | 'STATE_SELECTED'
  | 'STATE_HIGHLIGHTED'
  | 'RELATIONSHIP_DEFAULT'
  | 'CLUSTER_BOUNDARY'
  | 'DIMENSION_GUIDE'
  | 'PARTICLE_FIELD'
  | 'RESTRICTED_INDICATOR'
  | 'OVERLAY_HUD';

export interface RegisteredGeometry {
  readonly id: string;
  readonly type: GeometryType;
  readonly geometry: THREE.BufferGeometry;
  readonly vertexCount: number;
  readonly indexCount: number;
  referenceCount: number;
  readonly memoryEstimateBytes: number;
  isDisposed: boolean;
}

export interface RegisteredMaterial {
  readonly id: string;
  readonly type: MaterialVocabType;
  readonly material: THREE.Material;
  referenceCount: number;
  readonly transparent: boolean;
  readonly opacity: number;
  isDisposed: boolean;
}

export interface GeometryEngineStats {
  readonly totalRegisteredGeometries: number;
  readonly activeGeometries: number;
  readonly totalRegisteredMaterials: number;
  readonly activeMaterials: number;
  readonly totalMeshes: number;
  readonly totalVertexCount: number;
  readonly estimatedGpuMemoryBytes: number;
  readonly qualityLevel: GeometryQualityLevel;
  readonly activeDimension: SimulationDimension;
}

export interface IMeshObject {
  readonly id: string;
  readonly threeObject: THREE.Object3D;
  readonly sourceSceneObject?: ISceneObject;
  visible: boolean;
  update(deltaMs: number, timeMs: number): void;
  syncFromSceneObject(sceneObj: ISceneObject): void;
  dispose(): void;
}

export interface F57TestResult {
  readonly testId: string;
  readonly name: string;
  readonly passed: boolean;
  readonly details: string;
  readonly durationMs: number;
  readonly totalEvaluations?: number;
  readonly variance?: number;
}

export interface F57SuiteReport {
  readonly suiteName: string;
  readonly totalTests: number;
  readonly passedTests: number;
  readonly failedTests: number;
  readonly allPassed: boolean;
  readonly totalDurationMs: number;
  readonly results: readonly F57TestResult[];
}
