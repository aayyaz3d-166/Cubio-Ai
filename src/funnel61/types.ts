/**
 * 3D Memory Studio — Funnel 61
 * Actual 3D Camera & Navigation Engine Types
 *
 * Strongly typed definitions for camera state, navigation modes, presets,
 * focus framing, smooth transitions, telemetry, and research tests.
 */

import * as THREE from 'three';
import { SimulationDimension } from '../funnel52/types';
import { DataClassification } from '../funnel47/types';

export type CameraMode =
  | 'ORBIT'
  | 'FREE'
  | 'FOCUS'
  | 'PAN'
  | 'ZOOM'
  | 'RESET'
  | 'DIMENSION';

export type CameraPresetType =
  | 'DEFAULT'
  | 'TOP'
  | 'FRONT'
  | 'SIDE'
  | 'CORE'
  | 'CLUSTER'
  | 'GRAPH'
  | 'DIMENSION';

export type CameraTargetType =
  | 'MEMORY_CORE'
  | 'STATE'
  | 'RELATIONSHIP'
  | 'CLUSTER'
  | 'DIMENSION'
  | 'CUSTOM_POINT';

export interface CameraState {
  position: [number, number, number];
  target: [number, number, number];
  up: [number, number, number];
  zoom: number;
  distance: number;
  yaw: number; // in degrees
  pitch: number; // in degrees
  roll: number; // in degrees
  fov: number;
  near: number;
  far: number;
  mode: CameraMode;
  dimension: SimulationDimension;
  focusedObjectId: string | null;
  isTransitioning: boolean;
  enabled: boolean;
}

export interface CameraPreset {
  readonly presetType: CameraPresetType;
  readonly label: string;
  readonly position: [number, number, number];
  readonly target: [number, number, number];
  readonly up: [number, number, number];
  readonly distance: number;
  readonly yaw: number;
  readonly pitch: number;
  readonly fov: number;
}

export interface CameraTargetInfo {
  readonly targetType: CameraTargetType;
  readonly targetId: string;
  readonly position: [number, number, number];
  readonly radius?: number;
  readonly classification: DataClassification;
}

export interface CameraEngineStats {
  readonly mode: CameraMode;
  readonly position: readonly [number, number, number];
  readonly target: readonly [number, number, number];
  readonly distance: number;
  readonly yaw: number;
  readonly pitch: number;
  readonly fov: number;
  readonly activeDimension: SimulationDimension;
  readonly isComputationalProjection: boolean;
  readonly focusedObjectId: string | null;
  readonly isTransitioning: boolean;
  readonly currentPreset: CameraPresetType | 'CUSTOM';
  readonly historyCount: number;
}

export interface F61TestResult {
  readonly testId: string;
  readonly name: string;
  readonly passed: boolean;
  readonly details: string;
  readonly durationMs: number;
  readonly totalEvaluations?: number;
  readonly variance?: number;
}

export interface F61SuiteReport {
  readonly suiteName: string;
  readonly totalTests: number;
  readonly passedTests: number;
  readonly failedTests: number;
  readonly allPassed: boolean;
  readonly totalDurationMs: number;
  readonly results: readonly F61TestResult[];
}
