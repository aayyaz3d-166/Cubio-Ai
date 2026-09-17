/**
 * 3D Memory Studio — Funnel 60
 * Actual 3D Dimension & Projection Engine Types
 *
 * Strongly typed definitions for multi-dimensional spaces, projection modes,
 * coordinate transforms, cross-dimension identity, and research tests.
 */

import * as THREE from 'three';
import { SimulationDimension } from '../funnel52/types';
import { DataClassification } from '../funnel47/types';

export type DimensionId =
  | 'Z1'
  | 'Z2'
  | 'Z3'
  | 'Z4'
  | 'Z8'
  | 'Z12'
  | 'Z16';

export type ProjectionType =
  | 'DIRECT'
  | 'ORTHOGRAPHIC'
  | 'RADIAL'
  | 'LAYER'
  | 'AXIS_SLICING'
  | 'PAIRWISE'
  | 'CLAMPED';

export interface DimensionDescriptor {
  readonly dimensionId: DimensionId;
  readonly dimensionNumber: SimulationDimension;
  readonly label: string;
  readonly axisCount: number;
  readonly coordinateModel: string;
  readonly defaultProjection: ProjectionType;
  readonly isPhysicalSpatial: boolean;
  readonly isComputationalProjection: boolean;
  readonly description: string;
  enabled: boolean;
  visible: boolean;
  order: number;
}

export interface DimensionAxis {
  readonly axisId: string;
  readonly dimensionId: DimensionId;
  readonly label: string;
  readonly index: number;
  readonly isComputational: boolean;
  visible: boolean;
  scale: number;
  origin: [number, number, number];
}

export interface DimensionCoordinate {
  readonly stateId: string;
  readonly dimension: SimulationDimension;
  readonly rawValues: readonly number[]; // N-dimensional raw values
  readonly projectedPosition: [number, number, number]; // 3D world position
  readonly projectionType: ProjectionType;
  readonly isValid: boolean;
  readonly checksum: string;
}

export interface DimensionEngineStats {
  readonly activeDimension: SimulationDimension;
  readonly activeDimensionId: DimensionId;
  readonly projectionType: ProjectionType;
  readonly isPhysicalSpatial: boolean;
  readonly isComputationalProjection: boolean;
  readonly totalSupportedDimensions: number;
  readonly projectedStatesCount: number;
  readonly projectedRelationshipsCount: number;
  readonly projectedClustersCount: number;
  readonly comparisonActive: boolean;
  readonly comparedDimensions: readonly SimulationDimension[];
}

export interface F60TestResult {
  readonly testId: string;
  readonly name: string;
  readonly passed: boolean;
  readonly details: string;
  readonly durationMs: number;
  readonly totalEvaluations?: number;
  readonly variance?: number;
}

export interface F60SuiteReport {
  readonly suiteName: string;
  readonly totalTests: number;
  readonly passedTests: number;
  readonly failedTests: number;
  readonly allPassed: boolean;
  readonly totalDurationMs: number;
  readonly results: readonly F60TestResult[];
}
