/**
 * Six-Direction Orthogonal Neighbor Engine
 * 
 * Computes 6-axis spatial neighbors for any cell in 7x7x7 grid:
 * • X+ (Right)    : (x+1, y, z)
 * • X- (Left)     : (x-1, y, z)
 * • Y+ (Up)       : (x, y+1, z)
 * • Y- (Down)     : (x, y-1, z)
 * • Z+ (Forward)  : (x, y, z+1)
 * • Z- (Backward) : (x, y, z-1)
 * 
 * Boundary cells correctly return null for non-existent orthogonal neighbors.
 */

import { CellNeighbors, Coordinate3D } from '../types/memory';
import { coordinateToCellId, cellIdToCoordinate, DIMENSION } from './address369';

export interface NeighborDirectionDetail {
  direction: 'X+' | 'X-' | 'Y+' | 'Y-' | 'Z+' | 'Z-';
  label: string;
  targetCellId: number | null;
  targetCoord: Coordinate3D | null;
  delta: { dx: number; dy: number; dz: number };
}

/**
 * Calculates 6-orthogonal neighbors for a cell at (x, y, z)
 */
export function calculateCellNeighbors(x: number, y: number, z: number): CellNeighbors {
  const xPos = x < DIMENSION - 1 ? coordinateToCellId(x + 1, y, z) : null;
  const xNeg = x > 0 ? coordinateToCellId(x - 1, y, z) : null;
  const yPos = y < DIMENSION - 1 ? coordinateToCellId(x, y + 1, z) : null;
  const yNeg = y > 0 ? coordinateToCellId(x, y - 1, z) : null;
  const zPos = z < DIMENSION - 1 ? coordinateToCellId(x, y, z + 1) : null;
  const zNeg = z > 0 ? coordinateToCellId(x, y, z - 1) : null;

  const allAdjacentIds = [xPos, xNeg, yPos, yNeg, zPos, zNeg].filter(
    (id): id is number => id !== null
  );

  return {
    xPos,
    xNeg,
    yPos,
    yNeg,
    zPos,
    zNeg,
    allAdjacentIds,
  };
}

/**
 * Calculates 6-orthogonal neighbors for a linear Cell ID [0..342]
 */
export function getNeighborsForCellId(cellId: number): CellNeighbors {
  const { x, y, z } = cellIdToCoordinate(cellId);
  return calculateCellNeighbors(x, y, z);
}

/**
 * Returns structured array of all 6 directional neighbors with delta vectors
 */
export function getDirectionalNeighborDetails(cellId: number): NeighborDirectionDetail[] {
  const coord = cellIdToCoordinate(cellId);
  const n = calculateCellNeighbors(coord.x, coord.y, coord.z);

  return [
    {
      direction: 'X+',
      label: 'X+ (Right)',
      targetCellId: n.xPos,
      targetCoord: n.xPos !== null ? cellIdToCoordinate(n.xPos) : null,
      delta: { dx: 1, dy: 0, dz: 0 },
    },
    {
      direction: 'X-',
      label: 'X- (Left)',
      targetCellId: n.xNeg,
      targetCoord: n.xNeg !== null ? cellIdToCoordinate(n.xNeg) : null,
      delta: { dx: -1, dy: 0, dz: 0 },
    },
    {
      direction: 'Y+',
      label: 'Y+ (Up)',
      targetCellId: n.yPos,
      targetCoord: n.yPos !== null ? cellIdToCoordinate(n.yPos) : null,
      delta: { dx: 0, dy: 1, dz: 0 },
    },
    {
      direction: 'Y-',
      label: 'Y- (Down)',
      targetCellId: n.yNeg,
      targetCoord: n.yNeg !== null ? cellIdToCoordinate(n.yNeg) : null,
      delta: { dx: 0, dy: -1, dz: 0 },
    },
    {
      direction: 'Z+',
      label: 'Z+ (Forward)',
      targetCellId: n.zPos,
      targetCoord: n.zPos !== null ? cellIdToCoordinate(n.zPos) : null,
      delta: { dx: 0, dy: 0, dz: 1 },
    },
    {
      direction: 'Z-',
      label: 'Z- (Backward)',
      targetCellId: n.zNeg,
      targetCoord: n.zNeg !== null ? cellIdToCoordinate(n.zNeg) : null,
      delta: { dx: 0, dy: 0, dz: -1 },
    },
  ];
}
