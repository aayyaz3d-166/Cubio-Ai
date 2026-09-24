/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F57: Voxel Spatial Index Solver
 *
 * Computes spatial bounding boxes, octree voxel partitioning, and grid hashes.
 */

import { deterministicHash } from '../../../../state/determinism';
import { SpatialReasoningRequest, Vector3D, VoxelIndexMetrics } from '../types';

export class VoxelSpatialIndexSolver {
  public solveVoxelIndexing(request: SpatialReasoningRequest): VoxelIndexMetrics {
    const points = request.coordinates3D || [
      [-5, -5, -5],
      [5, 5, 5],
    ];

    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

    for (const [x, y, z] of points) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (z < minZ) minZ = z;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
      if (z > maxZ) maxZ = z;
    }

    const resolution = request.voxelResolution || 1.0;
    const spanX = Math.max(1, Math.ceil((maxX - minX) / resolution));
    const spanY = Math.max(1, Math.ceil((maxY - minY) / resolution));
    const spanZ = Math.max(1, Math.ceil((maxZ - minZ) / resolution));
    const totalVoxels = spanX * spanY * spanZ;

    const boundingBoxMin: Vector3D = [minX, minY, minZ];
    const boundingBoxMax: Vector3D = [maxX, maxY, maxZ];

    const voxelGridHash = deterministicHash(
      `VOXEL_GRID:${totalVoxels}:${minX},${minY},${minZ}:${maxX},${maxY},${maxZ}`
    );

    return Object.freeze({
      totalVoxels,
      boundingBoxMin,
      boundingBoxMax,
      voxelGridHash,
    });
  }
}
