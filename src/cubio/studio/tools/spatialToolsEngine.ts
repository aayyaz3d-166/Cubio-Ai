/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 7: Spatial Tools Engine
 *
 * Core mathematical engine for:
 * 1. Precision Measurement & Unit Conversions (mm, cm, inch)
 * 2. Geometry Inspection & Warning Diagnostics
 * 3. Interactive Slice Plane Generation with Three.js Clipping
 * 4. Spatial Matrix Transformations (Move, Rotate, Scale, Mirror)
 * 5. Deterministic Activity & Progress Rail Tracking
 */

import * as THREE from 'three';
import {
  SpatialToolMode,
  MeasurementUnit,
  SpatialMeasurement,
  GeometryInspectReport,
  SlicePlaneConfig,
  SpatialTransformConfig,
  ActivityStep,
  SpatialToolsState,
} from './types';
import { Spatial3DModelMetadata } from '../services/spatialModelParser';

export class CubiOSpatialToolsEngine {
  public static readonly UNIT_CONVERSIONS: Record<MeasurementUnit, number> = {
    mm: 1.0,
    cm: 0.1,
    inch: 1.0 / 25.4,
  };

  /**
   * Generates initial state for spatial tools.
   */
  public static getInitialState(): SpatialToolsState {
    return Object.freeze({
      activeTool: 'SELECT',
      unit: 'mm',
      measurement: Object.freeze({
        unit: 'mm',
        width: 32.0,
        height: 32.0,
        depth: 32.0,
        diagonal: Math.sqrt(32 * 32 * 3),
        boundingVolume: 32 * 32 * 32,
      }),
      inspectReport: null,
      slice: Object.freeze({
        enabled: false,
        axis: 'Y',
        position: 0.0,
        inverted: false,
        showSectionOutline: true,
      }),
      transform: Object.freeze({
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        uniformScale: true,
        mirror: { x: false, y: false, z: false },
      }),
      activityRail: Object.freeze([
        { id: 'ACT_READY', label: 'Spatial Engine Ready', status: 'completed' as const, timestamp: Date.now() },
      ]),
      isProcessing: false,
    });
  }


  /**
   * Converts a millimeter value into the specified measurement unit.
   */
  public static convertMm(valueMm: number, targetUnit: MeasurementUnit): number {
    const factor = this.UNIT_CONVERSIONS[targetUnit] || 1.0;
    return parseFloat((valueMm * factor).toFixed(targetUnit === 'inch' ? 3 : 2));
  }

  /**
   * Computes comprehensive measurements from an imported model or 3D object.
   */
  public static computeMeasurement(
    dimsMm: { width: number; height: number; depth: number },
    unit: MeasurementUnit = 'mm',
    pointA?: [number, number, number],
    pointB?: [number, number, number]
  ): SpatialMeasurement {
    const w = this.convertMm(dimsMm.width, unit);
    const h = this.convertMm(dimsMm.height, unit);
    const d = this.convertMm(dimsMm.depth, unit);
    const diag = parseFloat(Math.sqrt(w * w + h * h + d * d).toFixed(unit === 'inch' ? 3 : 2));
    const vol = parseFloat((w * h * d).toFixed(unit === 'inch' ? 3 : 2));

    let directDistance: number | undefined;
    if (pointA && pointB) {
      const dx = (pointB[0] - pointA[0]);
      const dy = (pointB[1] - pointA[1]);
      const dz = (pointB[2] - pointA[2]);
      const distMm = Math.sqrt(dx * dx + dy * dy + dz * dz);
      directDistance = this.convertMm(distMm, unit);
    }

    return Object.freeze({
      unit,
      width: w,
      height: h,
      depth: d,
      diagonal: diag,
      boundingVolume: vol,
      pointA,
      pointB,
      directDistance,
    });
  }

  /**
   * Inspects geometry and generates diagnostic warnings and health score.
   */
  public static inspectGeometry(metadata: Spatial3DModelMetadata): GeometryInspectReport {
    const warnings: string[] = [];

    if (!metadata.isWatertight) {
      warnings.push('Open boundary edges detected: Mesh is non-watertight.');
    }

    const { width, height, depth } = metadata.dimensions;
    const maxDim = Math.max(width, height, depth);
    const minDim = Math.min(width, height, depth);

    if (minDim > 0 && maxDim / minDim > 100) {
      warnings.push('High geometric aspect ratio (>100:1): thin structural elements present.');
    }

    if (metadata.faceCount > 200000) {
      warnings.push('Dense polygon payload (>200k faces): high GPU memory footprint.');
    } else if (metadata.faceCount < 12) {
      warnings.push('Low-poly simplified geometry (<12 faces).');
    }

    // Calculate approximate surface area
    const surfaceArea = 2 * (width * height + width * depth + height * depth);
    const qualityScore = Math.max(50, 100 - warnings.length * 15);

    return Object.freeze({
      vertexCount: metadata.vertexCount,
      faceCount: metadata.faceCount,
      dimensions: metadata.dimensions,
      boundingBox: metadata.boundingBox,
      centerOfMass: metadata.centerOfMass,
      volumeMm3: metadata.estimatedVolumeMm3,
      surfaceAreaMm2: parseFloat(surfaceArea.toFixed(2)),
      isWatertight: metadata.isWatertight,
      warnings: Object.freeze(warnings),
      qualityScorePercent: qualityScore,
    });
  }

  /**
   * Generates a Three.js clipping plane for Slicing.
   */
  public static createClippingPlane(slice: SlicePlaneConfig, boxSize: number = 6.0): THREE.Plane | null {
    if (!slice.enabled) return null;

    let normal: THREE.Vector3;
    if (slice.axis === 'X') {
      normal = new THREE.Vector3(slice.inverted ? 1 : -1, 0, 0);
    } else if (slice.axis === 'Y') {
      normal = new THREE.Vector3(0, slice.inverted ? 1 : -1, 0);
    } else {
      normal = new THREE.Vector3(0, 0, slice.inverted ? 1 : -1);
    }

    const constant = slice.position * (boxSize / 2);
    return new THREE.Plane(normal, constant);
  }

  /**
   * Creates an execution activity step sequence for progress reporting.
   */
  public static generateActivityPipeline(toolName: string): ActivityStep[] {
    const now = Date.now();
    return [
      { id: '1', label: `Initializing ${toolName}`, status: 'completed', detail: 'Tool context loaded', timestamp: now },
      { id: '2', label: 'Processing Geometry', status: 'in_progress', detail: 'Evaluating vertex manifold', timestamp: now + 5 },
      { id: '3', label: 'Computing Invariants', status: 'pending', detail: 'Executing spatial math' },
      { id: '4', label: 'Synthesizing Result', status: 'pending', detail: 'Updating interactive viewport' },
    ];
  }
}
