/**
 * 3D Memory Studio — Funnel 68
 * Actual Coordinates & 3D Control Engine Types
 */

import { DataClassification } from '../funnel47/types';
import { SimulationDimension } from '../funnel52/types';
import { CameraPresetType } from '../funnel61/types';

export interface CoordinateViewState {
  readonly stateId: string;
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly dimensionId: SimulationDimension;
  readonly dimensionModeLabel: string;
  readonly isPhysicalSpatial: boolean;
  readonly isComputationalProjection: boolean;
  readonly classification: DataClassification;
  readonly lockedAxes: {
    readonly x: boolean;
    readonly y: boolean;
    readonly z: boolean;
  };
  readonly timestamp: number;
}

export interface ViewportControlState {
  readonly activePreset: CameraPresetType;
  readonly showAxes: boolean;
  readonly showGrid: boolean;
  readonly gridSize: number;
  readonly isMarkerActive: boolean;
  readonly selectedStateId: string | null;
  readonly timestamp: number;
}

export interface F68TestResult {
  readonly testId: string;
  readonly name: string;
  readonly passed: boolean;
  readonly details: string;
  readonly durationMs: number;
  readonly totalEvaluations?: number;
  readonly variance?: number;
}

export interface F68SuiteReport {
  readonly suiteName: string;
  readonly totalTests: number;
  readonly passedTests: number;
  readonly failedTests: number;
  readonly allPassed: boolean;
  readonly totalDurationMs: number;
  readonly results: readonly F68TestResult[];
}
