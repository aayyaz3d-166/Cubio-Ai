/**
 * CUBiO AI — Experimental Euler Phase Rotation Engine
 * 
 * Isolated Mathematical Visualization & Phase Representation Layer
 * Model: 7 × 7 × 7 spatial grid (343 nodes)
 * Phase Equation: e^(iφ) = cos(φ) + i sin(φ)
 * Invariant: cos²(φ) + sin²(φ) ≈ 1
 * Projection: X' = X × cos(φ), Y' = Y × cos(φ), Z' = Z × cos(φ)
 * 
 * Classification: EXP-007 PREPARATION / ENGINEERING PROTOTYPE
 * Status: CUBiO Euler Memory — EXPERIMENTAL
 */

import { MemoryGrid3D } from '../types/memory';

export interface EulerCoordinate3D {
  x: number;
  y: number;
  z: number;
}

export interface EulerNode {
  coords: EulerCoordinate3D;
  phi: number;
  amplitudeReal: number;
  amplitudeImag: number;
  weight: number;
}

export interface EulerProjectedNode {
  x: number;
  y: number;
  z: number;
  phase: number;
  real: number;
  imaginary: number;
  weight: number;
  originalCoords: EulerCoordinate3D;
}

export interface EulerValidationResult {
  isValid: boolean;
  maxDeviation: number;
  failedNodeCount: number;
  nodeCount: number;
  uniqueCoordinates: boolean;
  boundsValid: boolean;
}

export class EulerMemoryEngine {
  public readonly gridSize: number;
  public grid: Record<string, EulerNode>;
  public totalPhaseOffset: number = 0;

  constructor(gridSize: number = 7) {
    this.gridSize = gridSize;
    this.grid = this.initializeGrid();
  }

  /**
   * Initializes a 7x7x7 grid (exactly 343 nodes) with Euler phase coordinates
   */
  public initializeGrid(): Record<string, EulerNode> {
    const space: Record<string, EulerNode> = {};

    for (let x = 0; x < this.gridSize; x++) {
      for (let y = 0; y < this.gridSize; y++) {
        for (let z = 0; z < this.gridSize; z++) {
          const key = `${x},${y},${z}`;

          const phi = (x + y + z) * (Math.PI / (this.gridSize * 1.5));

          space[key] = {
            coords: { x, y, z },
            phi,
            amplitudeReal: Math.cos(phi),
            amplitudeImag: Math.sin(phi),
            weight: 1.0
          };
        }
      }
    }

    return space;
  }

  /**
   * Controlled Phase Rotation: φ → φ + Δφ
   * Updates real and imaginary components via Euler's formula
   */
  public rotateState(deltaPhi: number): void {
    this.totalPhaseOffset += deltaPhi;

    for (const key in this.grid) {
      const node = this.grid[key];

      node.phi += deltaPhi;

      node.amplitudeReal = Math.cos(node.phi);

      node.amplitudeImag = Math.sin(node.phi);
    }
  }

  /**
   * Resets the grid back to its initial phase distribution (Δφ = 0)
   */
  public resetPhase(): void {
    this.totalPhaseOffset = 0;
    this.grid = this.initializeGrid();
  }

  /**
   * Sets an absolute phase rotation offset from the initial state
   */
  public setAbsolutePhase(targetPhiOffset: number): void {
    const delta = targetPhiOffset - this.totalPhaseOffset;
    this.rotateState(delta);
  }

  /**
   * Projects 3D spatial coordinates through the real phase amplitude:
   * X' = X × cos(φ)
   * Y' = Y × cos(φ)
   * Z' = Z × cos(φ)
   * 
   * Note: This is an experimental mathematical visualization of
   * phase-modulated spatial coordinates, preserving both original
   * and projected values.
   */
  public projectTo3D(): EulerProjectedNode[] {
    const projectionList: EulerProjectedNode[] = [];

    for (const key in this.grid) {
      const node = this.grid[key];

      projectionList.push({
        x: node.coords.x * node.amplitudeReal,
        y: node.coords.y * node.amplitudeReal,
        z: node.coords.z * node.amplitudeReal,
        phase: node.phi,
        real: node.amplitudeReal,
        imaginary: node.amplitudeImag,
        weight: node.weight,
        originalCoords: { ...node.coords }
      });
    }

    return projectionList;
  }

  /**
   * Mathematical Invariant Verification:
   * Asserts |cos²(φ) + sin²(φ) - 1| < tolerance across all nodes
   */
  public validateEulerState(tolerance: number = 1e-10): EulerValidationResult {
    let maxDev = 0;
    let failedNodes = 0;
    const seenCoords = new Set<string>();
    let boundsOk = true;

    for (const key in this.grid) {
      const node = this.grid[key];

      // 1. Unit Circle Invariant: cos²(φ) + sin²(φ) = 1
      const normSq = node.amplitudeReal ** 2 + node.amplitudeImag ** 2;
      const dev = Math.abs(normSq - 1);
      if (dev > maxDev) maxDev = dev;
      if (dev >= tolerance) failedNodes++;

      // 2. Coordinate Uniqueness & Bounds
      const coordKey = `${node.coords.x},${node.coords.y},${node.coords.z}`;
      seenCoords.add(coordKey);

      if (
        node.coords.x < 0 || node.coords.x >= this.gridSize ||
        node.coords.y < 0 || node.coords.y >= this.gridSize ||
        node.coords.z < 0 || node.coords.z >= this.gridSize
      ) {
        boundsOk = false;
      }
    }

    const expectedCount = this.gridSize ** 3;
    const totalKeys = Object.keys(this.grid).length;

    return {
      isValid: failedNodes === 0 && totalKeys === expectedCount && boundsOk && seenCoords.size === expectedCount,
      maxDeviation: maxDev,
      failedNodeCount: failedNodes,
      nodeCount: totalKeys,
      uniqueCoordinates: seenCoords.size === totalKeys,
      boundsValid: boundsOk
    };
  }

  /**
   * Non-mutating Adapter: Map weights from an existing 369 MemoryGrid3D
   * Does NOT modify or rewrite the 369 grid.
   */
  public adaptFromMemoryGrid(memoryGrid: MemoryGrid3D): void {
    if (!memoryGrid || !memoryGrid.cells) return;

    for (const cell of memoryGrid.cells) {
      const key = `${cell.x},${cell.y},${cell.z}`;
      if (this.grid[key]) {
        // Set weight proportional to activation state / occurrence count
        this.grid[key].weight = cell.state === 1 ? 1.0 + (cell.occurrenceCount || 1) * 0.2 : 0.5;
      }
    }
  }

  /**
   * Generates structured experimental telemetry log
   */
  public exportLog(deltaPhi: number = 0): object {
    const val = this.validateEulerState();
    return {
      experiment: "EulerMemory",
      version: "v0.1",
      gridSize: this.gridSize,
      nodeCount: Object.keys(this.grid).length,
      deltaPhi: this.totalPhaseOffset,
      projection: "real_component",
      timestamp: new Date().toISOString(),
      validation: {
        unitCircle: val.isValid,
        maxDeviation: val.maxDeviation,
        uniqueCoordinates: val.uniqueCoordinates,
        nodeCount: val.nodeCount === this.gridSize ** 3
      }
    };
  }
}
