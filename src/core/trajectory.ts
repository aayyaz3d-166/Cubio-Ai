/**
 * 3D Memory Spatial Trajectory & Pathfinding Engine
 * 
 * Computes deterministic step-by-step paths between START and END points
 * using actual 6-orthogonal neighboring cells in the 7x7x7 memory cube.
 */

import { Coordinate3D, TrajectoryPath } from '../types/memory';
import {
  coordinateToCellId,
  cellIdToCoordinate,
  calculateEuclideanDistance,
  calculateManhattanDistance,
} from './spatialSearch';
import { calculateCellNeighbors } from './neighbors';

/**
 * Calculates shortest orthogonal path between two cells in 7x7x7 grid using BFS / A*
 */
export function calculateGridTrajectory(
  startCellId: number,
  endCellId: number
): TrajectoryPath {
  const startCoord = cellIdToCoordinate(startCellId);
  const endCoord = cellIdToCoordinate(endCellId);

  if (startCellId === endCellId) {
    return {
      startCellId,
      endCellId,
      startCoord,
      endCoord,
      pathCellIds: [startCellId],
      pathCoords: [startCoord],
      stepCount: 1,
      euclideanLength: 0,
      manhattanLength: 0,
    };
  }

  // BFS Queue for shortest orthogonal step path
  const queue: number[][] = [[startCellId]];
  const visited = new Set<number>([startCellId]);
  let foundPath: number[] = [];

  while (queue.length > 0) {
    const currentPath = queue.shift()!;
    const currentId = currentPath[currentPath.length - 1];

    if (currentId === endCellId) {
      foundPath = currentPath;
      break;
    }

    const { x, y, z } = cellIdToCoordinate(currentId);
    const neighbors = calculateCellNeighbors(x, y, z);

    // Prioritize neighbor closest to endCoord by Manhattan distance
    const validNeighbors = neighbors.allAdjacentIds.filter((nid) => !visited.has(nid));
    validNeighbors.sort((a, b) => {
      const coordA = cellIdToCoordinate(a);
      const coordB = cellIdToCoordinate(b);
      return calculateManhattanDistance(coordA, endCoord) - calculateManhattanDistance(coordB, endCoord);
    });

    for (const neighborId of validNeighbors) {
      visited.add(neighborId);
      queue.push([...currentPath, neighborId]);
    }
  }

  const pathCellIds = foundPath.length > 0 ? foundPath : [startCellId, endCellId];
  const pathCoords = pathCellIds.map((id) => cellIdToCoordinate(id));

  const euclideanLength = calculateEuclideanDistance(startCoord, endCoord);
  const manhattanLength = calculateManhattanDistance(startCoord, endCoord);

  return {
    startCellId,
    endCellId,
    startCoord,
    endCoord,
    pathCellIds,
    pathCoords,
    stepCount: pathCellIds.length,
    euclideanLength: Math.round(euclideanLength * 1000) / 1000,
    manhattanLength,
  };
}
