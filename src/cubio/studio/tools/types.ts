/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 7: Spatial Tools Types & State Definitions
 *
 * Types for Measure, Inspect, Slice, Transform, and Activity Progress Rail.
 */

export type SpatialToolMode = 'SELECT' | 'MEASURE' | 'INSPECT' | 'SLICE' | 'TRANSFORM';

export type MeasurementUnit = 'mm' | 'cm' | 'inch';

export interface SpatialMeasurement {
  readonly unit: MeasurementUnit;
  readonly width: number;
  readonly height: number;
  readonly depth: number;
  readonly diagonal: number;
  readonly boundingVolume: number;
  readonly pointA?: [number, number, number];
  readonly pointB?: [number, number, number];
  readonly directDistance?: number;
}

export interface GeometryInspectReport {
  readonly vertexCount: number;
  readonly faceCount: number;
  readonly dimensions: { width: number; height: number; depth: number };
  readonly boundingBox: { min: [number, number, number]; max: [number, number, number] };
  readonly centerOfMass: [number, number, number];
  readonly volumeMm3: number;
  readonly surfaceAreaMm2: number;
  readonly isWatertight: boolean;
  readonly warnings: readonly string[];
  readonly qualityScorePercent: number;
}

export interface SlicePlaneConfig {
  readonly enabled: boolean;
  readonly axis: 'X' | 'Y' | 'Z';
  readonly position: number; // Normalized -1.0 to 1.0 or mm offset
  readonly inverted: boolean;
  readonly showSectionOutline: boolean;
}

export interface SpatialTransformConfig {
  readonly position: { x: number; y: number; z: number };
  readonly rotation: { x: number; y: number; z: number }; // Degrees
  readonly scale: { x: number; y: number; z: number };
  readonly uniformScale: boolean;
  readonly mirror: { x: boolean; y: boolean; z: boolean };
}

export interface ActivityStep {
  readonly id: string;
  readonly label: string;
  readonly status: 'pending' | 'in_progress' | 'completed' | 'failed';
  readonly detail?: string;
  readonly timestamp?: number;
}

export interface SpatialToolsState {
  readonly activeTool: SpatialToolMode;
  readonly unit: MeasurementUnit;
  readonly measurement: SpatialMeasurement;
  readonly inspectReport: GeometryInspectReport | null;
  readonly slice: SlicePlaneConfig;
  readonly transform: SpatialTransformConfig;
  readonly activityRail: readonly ActivityStep[];
  readonly isProcessing: boolean;
}
