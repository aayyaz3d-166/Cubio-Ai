/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F57: 4D Hypercube (Tesseract) Projection Solver
 *
 * Computes 4D rotations (XW, YW, ZW hyperplanes) and 4D -> 3D stereographic projections.
 */

import { SpatialReasoningRequest, Vector3D, Vector4D } from '../types';

export class HypercubeProjectionSolver {
  public solveTesseract(request: SpatialReasoningRequest): {
    vertices4D: readonly Vector4D[];
    projectedVertices3D: readonly Vector3D[];
  } {
    const angleW = request.hypercubeAngleW || 0;

    // 1. Generate 16 standard vertices of a 4D Hypercube if not provided
    const vertices4D: Vector4D[] = [];
    if (request.coordinates4D && request.coordinates4D.length > 0) {
      vertices4D.push(...request.coordinates4D);
    } else {
      for (const x of [-1, 1]) {
        for (const y of [-1, 1]) {
          for (const z of [-1, 1]) {
            for (const w of [-1, 1]) {
              vertices4D.push([x, y, z, w]);
            }
          }
        }
      }
    }

    const cosW = Math.cos(angleW);
    const sinW = Math.sin(angleW);

    // 2. Rotate in 4D space (XW and ZW planes) & Project to 3D via Stereographic Perspective
    const distance4D = 2.5;
    const projectedVertices3D: Vector3D[] = vertices4D.map(([x, y, z, w]) => {
      // 4D Rotation on XW plane
      const rotX = x * cosW - w * sinW;
      const rotW = x * sinW + w * cosW;

      // 4D Rotation on ZW plane
      const rotZ = z * cosW - rotW * sinW;
      const finalW = z * sinW + rotW * cosW;

      // Stereographic Perspective Projection 4D -> 3D
      const scale4D = 1 / (distance4D - finalW);

      return [
        Number((rotX * scale4D).toFixed(6)),
        Number((y * scale4D).toFixed(6)),
        Number((rotZ * scale4D).toFixed(6)),
      ];
    });

    return {
      vertices4D: Object.freeze(vertices4D),
      projectedVertices3D: Object.freeze(projectedVertices3D),
    };
  }
}
