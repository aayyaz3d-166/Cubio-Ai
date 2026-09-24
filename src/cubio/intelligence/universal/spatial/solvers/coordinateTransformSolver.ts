/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F57: 3D Coordinate Transform Solver
 *
 * Computes 3D affine matrix transformations, quaternion rotations, and scaling.
 */

import { Matrix4x4, Quaternion, SpatialReasoningRequest, Vector3D } from '../types';

export class CoordinateTransformSolver {
  public solveTransforms(request: SpatialReasoningRequest): {
    transformedPoints: readonly Vector3D[];
    matrix: Matrix4x4;
  } {
    const points = request.coordinates3D || [
      [0, 0, 0],
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ];

    const [tx, ty, tz] = request.translation || [0, 0, 0];
    const [sx, sy, sz] = request.scale || [1, 1, 1];

    let [rx, ry, rz] = request.rotationAngles || [0, 0, 0];

    // If quaternion provided, convert to Euler angles
    if (request.quaternion) {
      const [qx, qy, qz, qw] = request.quaternion;
      rx = Math.atan2(2 * (qw * qx + qy * qz), 1 - 2 * (qx * qx + qy * qy));
      ry = Math.asin(Math.max(-1, Math.min(1, 2 * (qw * qy - qz * qx))));
      rz = Math.atan2(2 * (qw * qz + qx * qy), 1 - 2 * (qy * qy + qz * qz));
    }

    const cosX = Math.cos(rx);
    const sinX = Math.sin(rx);
    const cosY = Math.cos(ry);
    const sinY = Math.sin(ry);
    const cosZ = Math.cos(rz);
    const sinZ = Math.sin(rz);

    // Apply affine transform to points deterministically
    const transformedPoints: Vector3D[] = points.map(([x, y, z]) => {
      // 1. Scale
      let px = x * sx;
      let py = y * sy;
      let pz = z * sz;

      // 2. Rotate X
      let y1 = py * cosX - pz * sinX;
      let z1 = py * sinX + pz * cosX;

      // 3. Rotate Y
      let x2 = px * cosY + z1 * sinY;
      let z2 = -px * sinY + z1 * cosY;

      // 4. Rotate Z
      let x3 = x2 * cosZ - y1 * sinZ;
      let y3 = x2 * sinZ + y1 * cosZ;

      // 5. Translate
      return [
        Number((x3 + tx).toFixed(6)),
        Number((y3 + ty).toFixed(6)),
        Number((z2 + tz).toFixed(6)),
      ];
    });

    const matrix: Matrix4x4 = Object.freeze([
      Object.freeze([cosY * cosZ, cosZ * sinX * sinY - cosX * sinZ, cosX * cosZ * sinY + sinX * sinZ, tx]),
      Object.freeze([cosY * sinZ, cosX * cosZ + sinX * sinY * sinZ, -cosZ * sinX + cosX * sinY * sinZ, ty]),
      Object.freeze([-sinY, cosY * sinX, cosX * cosY, tz]),
      Object.freeze([0, 0, 0, 1]),
    ]);

    return {
      transformedPoints: Object.freeze(transformedPoints),
      matrix,
    };
  }
}
