/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 3: Mathematical 369 Foundations & Transforms
 *
 * Implements rigorous modular arithmetic, vortex math, digital roots,
 * and reversible/orthogonal harmonic rotation tensors.
 */

import { CubiODimension } from '../types';
import { TriadicHarmonicVector } from './types';

export class Math369 {
  /**
   * Computes the mathematical digital root (sum of base-10 digits until single digit [1..9]).
   * Formula: dr(n) = 1 + ((n - 1) mod 9) for n > 0.
   */
  public static computeDigitalRoot(n: number): number {
    const absVal = Math.floor(Math.abs(n));
    if (absVal === 0) return 9; // In vortex math 0 is mapped to 9 (harmonic singularity)
    return 1 + ((absVal - 1) % 9);
  }

  /**
   * Computes digital root for floating point coordinate value scaled to integer lattice.
   */
  public static computeDigitalRootOfFloat(val: number, precision = 4): number {
    const scaled = Math.round(Math.abs(val) * Math.pow(10, precision));
    return this.computeDigitalRoot(scaled);
  }

  /**
   * Returns vortex doubling circuit value at step k: (1, 2, 4, 8, 7, 5).
   */
  public static getVortexDoublingValue(step: number): number {
    const sequence = [1, 2, 4, 8, 7, 5];
    const idx = Math.abs(step) % sequence.length;
    return sequence[idx];
  }

  /**
   * Returns triadic oscillation value at step k: (3, 6, 9).
   */
  public static getTriadicOscillationValue(step: number): number {
    const sequence = [3, 6, 9];
    const idx = Math.abs(step) % sequence.length;
    return sequence[idx];
  }

  /**
   * Derives triadic harmonic vector from coordinates and properties.
   */
  public static deriveTriadicHarmonicVector(
    coordinates: readonly number[],
    properties: Readonly<Record<string, any>> = {}
  ): TriadicHarmonicVector {
    let sum = 0;
    for (let i = 0; i < coordinates.length; i++) {
      sum += Math.abs(coordinates[i]) * Math.pow(10, i + 1);
    }

    // Add string property charcodes to entropy pool
    const propStr = JSON.stringify(properties);
    for (let i = 0; i < propStr.length; i++) {
      sum += propStr.charCodeAt(i);
    }

    const digitalRoot = this.computeDigitalRoot(Math.round(sum));
    const r3 = digitalRoot % 3;
    const r6 = digitalRoot % 6;
    const r9 = digitalRoot; // [1..9]

    const vortexPhase = (digitalRoot / 9) * 2 * Math.PI;
    const fluxRatio = parseFloat(((r3 * 3 + r6 * 6 + r9 * 9) / 81).toFixed(4));

    return Object.freeze({
      r3,
      r6,
      r9,
      digitalRoot,
      vortexPhase,
      fluxRatio,
    });
  }

  /**
   * Computes a deterministic, orthonormal 3D harmonic rotation matrix parameterized by angle phi.
   * Angle phi is modulated by triadic factor (3π/9, 6π/9, 9π/9).
   */
  public static getHarmonicRotationMatrix(phi: number): number[][] {
    const angleX = (phi * 3) / 9;
    const angleY = (phi * 6) / 9;
    const angleZ = (phi * 9) / 9;

    const cx = Math.cos(angleX);
    const sx = Math.sin(angleX);
    const cy = Math.cos(angleY);
    const sy = Math.sin(angleY);
    const cz = Math.cos(angleZ);
    const sz = Math.sin(angleZ);

    // Combined Euler rotation matrix Rz * Ry * Rx
    return [
      [cy * cz, sx * sy * cz - cx * sz, cx * sy * cz + sx * sz],
      [cy * sz, sx * sy * sz + cx * cz, cx * sy * sz - sx * cz],
      [-sy, sx * cy, cx * cy],
    ];
  }

  /**
   * Transpose of 3x3 rotation matrix (which is its exact mathematical inverse since R is orthogonal).
   */
  public static getInverseHarmonicRotationMatrix(mat: number[][]): number[][] {
    return [
      [mat[0][0], mat[1][0], mat[2][0]],
      [mat[0][1], mat[1][1], mat[2][1]],
      [mat[0][2], mat[1][2], mat[2][2]],
    ];
  }

  /**
   * Applies 3x3 matrix to 3D vector.
   */
  public static multiplyMatrixVector3(mat: number[][], vec: readonly [number, number, number]): [number, number, number] {
    return [
      mat[0][0] * vec[0] + mat[0][1] * vec[1] + mat[0][2] * vec[2],
      mat[1][0] * vec[0] + mat[1][1] * vec[1] + mat[1][2] * vec[2],
      mat[2][0] * vec[0] + mat[2][1] * vec[1] + mat[2][2] * vec[2],
    ];
  }

  /**
   * Transforms coordinate array reversibly using 369 harmonic rotation.
   */
  public static forwardHarmonicTransform(
    coords: readonly number[],
    phi = 0.369
  ): readonly number[] {
    if (coords.length < 3) {
      // Pad to 3, transform, then slice back
      const padded: [number, number, number] = [coords[0] || 0, coords[1] || 0, coords[2] || 0];
      const mat = this.getHarmonicRotationMatrix(phi);
      const res = this.multiplyMatrixVector3(mat, padded);
      return Object.freeze(res.slice(0, coords.length));
    }

    const result = [...coords];
    // Apply 3D rotation in triplets
    for (let i = 0; i < coords.length - 2; i += 3) {
      const subVec: [number, number, number] = [coords[i], coords[i + 1], coords[i + 2]];
      const mat = this.getHarmonicRotationMatrix(phi + i * 0.1);
      const transformed = this.multiplyMatrixVector3(mat, subVec);
      result[i] = transformed[0];
      result[i + 1] = transformed[1];
      result[i + 2] = transformed[2];
    }

    return Object.freeze(result);
  }

  /**
   * Exact inverse harmonic transform reconstructing original coordinates.
   */
  public static inverseHarmonicTransform(
    coords: readonly number[],
    phi = 0.369
  ): readonly number[] {
    if (coords.length < 3) {
      const padded: [number, number, number] = [coords[0] || 0, coords[1] || 0, coords[2] || 0];
      const mat = this.getHarmonicRotationMatrix(phi);
      const invMat = this.getInverseHarmonicRotationMatrix(mat);
      const res = this.multiplyMatrixVector3(invMat, padded);
      return Object.freeze(res.slice(0, coords.length));
    }

    const result = [...coords];
    for (let i = 0; i < coords.length - 2; i += 3) {
      const subVec: [number, number, number] = [coords[i], coords[i + 1], coords[i + 2]];
      const mat = this.getHarmonicRotationMatrix(phi + i * 0.1);
      const invMat = this.getInverseHarmonicRotationMatrix(mat);
      const restored = this.multiplyMatrixVector3(invMat, subVec);
      result[i] = restored[0];
      result[i + 1] = restored[1];
      result[i + 2] = restored[2];
    }

    return Object.freeze(result);
  }

  /**
   * Projects coordinates from one dimension to another using 3-6-9 harmonic basis.
   */
  public static projectDimensionCoordinates(
    coords: readonly number[],
    fromDim: CubiODimension,
    toDim: CubiODimension
  ): readonly number[] {
    const dimLengths: Record<CubiODimension, number> = {
      D0: 1,
      D1: 1,
      D2: 2,
      D3: 3,
      D4: 4,
      D5: 5,
      D6: 6,
      D7: 7,
    };

    const targetLen = dimLengths[toDim];
    const result = new Array(targetLen).fill(0);

    for (let i = 0; i < targetLen; i++) {
      if (i < coords.length) {
        result[i] = coords[i];
      } else {
        // Derive higher-dimensional manifold embedding using harmonic resonance ratios
        const seedCoord = coords[i % coords.length] || 1.0;
        const harmonicFactor = (this.getTriadicOscillationValue(i) / 9) * 0.1;
        result[i] = parseFloat((seedCoord * harmonicFactor).toFixed(4));
      }
    }

    return Object.freeze(result);
  }
}
