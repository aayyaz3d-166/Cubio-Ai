/**
 * 3D Memory Studio — Funnel 77
 * 3D Viewport & Scene Activation Types
 */

import { SimulationDimension } from '../funnel52/types';
import { DataClassification } from '../funnel47/types';

export type ViewportState =
  | 'WAITING'
  | 'MOUNTING'
  | 'ATTACHING'
  | 'ACTIVE'
  | 'DEGRADED'
  | 'ERROR'
  | 'DISPOSED';

export type CameraPreset =
  | 'TOP'
  | 'FRONT'
  | 'SIDE'
  | 'ISOMETRIC'
  | 'RESET'
  | 'FIT';

export interface SpatialSelectionContext {
  readonly selectedId: string | null;
  readonly position: [number, number, number] | null;
  readonly classification: DataClassification;
  readonly label?: string;
  readonly dimension: SimulationDimension;
}

export interface ViewportControlsState {
  readonly showAxes: boolean;
  readonly showGrid: boolean;
  readonly activePreset: CameraPreset | null;
  readonly activeDimension: SimulationDimension;
}

export interface ViewportSnapshot {
  readonly state: ViewportState;
  readonly isCanvasAttached: boolean;
  readonly isSceneAttached: boolean;
  readonly objectCount: number;
  readonly selectedObject: SpatialSelectionContext | null;
  readonly controls: ViewportControlsState;
  readonly error?: string;
  readonly timestamp: number;
}

export interface F77TestResult {
  readonly testId: string;
  readonly name: string;
  readonly passed: boolean;
  readonly details: string;
  readonly durationMs: number;
  readonly totalEvaluations?: number;
  readonly variance?: number;
}

export interface F77SuiteReport {
  readonly suiteName: string;
  readonly totalTests: number;
  readonly passedTests: number;
  readonly failedTests: number;
  readonly allPassed: boolean;
  readonly totalDurationMs: number;
  readonly results: readonly F77TestResult[];
}
