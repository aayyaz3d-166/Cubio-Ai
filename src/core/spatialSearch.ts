/**
 * 3D Spatial Search & Research Mode Engine
 */

import { Coordinate3D, MemoryCell, MemoryGrid3D, NearestCellInfo } from '../types/memory';
import {
  coordinateToCellId,
  cellIdToCoordinate,
  cellIdToAddress369,
  address369ToCellId,
  isSpatialAddress,
  isSymbolicAddress,
  DIMENSION,
} from './address369';

/**
 * Computes 3D Euclidean distance between two coordinates
 * Formula: d = sqrt((x1-x2)^2 + (y1-y2)^2 + (z1-z2)^2)
 */
export function calculateEuclideanDistance(p1: Coordinate3D, p2: Coordinate3D): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dz = p1.z - p2.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Computes Manhattan distance between two 3D coordinates
 */
export function calculateManhattanDistance(p1: Coordinate3D, p2: Coordinate3D): number {
  return Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y) + Math.abs(p1.z - p2.z);
}

/**
 * Finds all active cells ordered by Euclidean distance from a target coordinate or selected cell
 */
export function findNearestActiveCells(
  targetCoord: Coordinate3D,
  grid: MemoryGrid3D,
  excludeCellId?: number,
  limit: number = 5
): NearestCellInfo[] {
  const activeCells = grid.cells.filter(
    (cell) => cell.state === 1 && (excludeCellId === undefined || cell.id !== excludeCellId)
  );

  const results: NearestCellInfo[] = activeCells.map((cell) => {
    const coord: Coordinate3D = { x: cell.x, y: cell.y, z: cell.z };
    const euclideanDistance = calculateEuclideanDistance(targetCoord, coord);
    const manhattanDistance = calculateManhattanDistance(targetCoord, coord);
    const deltaVector = {
      dx: cell.x - targetCoord.x,
      dy: cell.y - targetCoord.y,
      dz: cell.z - targetCoord.z,
    };

    return {
      cellId: cell.id,
      address: cell.address,
      address369: cell.address369,
      coordinate: coord,
      symbol: cell.symbol,
      state: cell.state,
      euclideanDistance: Math.round(euclideanDistance * 1000) / 1000,
      manhattanDistance,
      deltaVector,
    };
  });

  // Sort ascending by Euclidean distance
  results.sort((a, b) => a.euclideanDistance - b.euclideanDistance);

  return results.slice(0, limit);
}

/**
 * Search for cells by 369 Address (0..368)
 * - If 0..25 (Symbolic): finds cells mapped to this symbol
 * - If 26..368 (Spatial): returns the exact cell
 */
export function searchByAddress(
  address: number,
  grid: MemoryGrid3D
): { found: boolean; cellIds: number[]; message: string } {
  if (address < 0 || address > 368) {
    return { found: false, cellIds: [], message: `Address ${address} out of 0..368 range.` };
  }

  if (isSpatialAddress(address)) {
    const cellId = address369ToCellId(address);
    return {
      found: true,
      cellIds: [cellId],
      message: `Spatial address ${address} corresponds to Cell #${cellId} at (${grid.cells[cellId].x}, ${grid.cells[cellId].y}, ${grid.cells[cellId].z})`,
    };
  }

  // Symbolic address 0..25 (A..Z)
  const targetChar = String.fromCharCode(65 + address);
  const matching = grid.cells
    .filter((c) => c.state === 1 && c.symbol && c.symbol.toUpperCase() === targetChar)
    .map((c) => c.id);

  return {
    found: matching.length > 0,
    cellIds: matching,
    message: `Symbolic address ${address} ('${targetChar}') found in ${matching.length} active cell(s).`,
  };
}

/**
 * Search for all active cells containing a given symbol / character
 */
export function searchBySymbol(
  symbolQuery: string,
  grid: MemoryGrid3D
): { found: boolean; cellIds: number[]; message: string } {
  if (!symbolQuery) {
    return { found: false, cellIds: [], message: 'Enter a symbol to search.' };
  }

  const query = symbolQuery.trim();
  const matching = grid.cells
    .filter((c) => c.state === 1 && c.symbol && (
      c.symbol.toLowerCase() === query.toLowerCase() ||
      (query === '␣' && c.symbol === ' ')
    ))
    .map((c) => c.id);

  return {
    found: matching.length > 0,
    cellIds: matching,
    message: matching.length > 0
      ? `Found ${matching.length} active cell(s) containing symbol '${symbolQuery}'`
      : `No active cells contain symbol '${symbolQuery}'`,
  };
}

/**
 * Generates coordinate path list for visualization of sequential activation
 */
export function getSequencePathCoordinates(grid: MemoryGrid3D): Coordinate3D[] {
  if (!grid.sequenceSteps || grid.sequenceSteps.length === 0) return [];
  return grid.sequenceSteps.map((step) => step.coordinate);
}

// Re-export helpers
export {
  coordinateToCellId,
  cellIdToCoordinate,
  cellIdToAddress369,
  address369ToCellId,
};
