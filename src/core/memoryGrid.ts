/**
 * 3D Memory Grid Engine (7x7x7 = Exactly 343 Spatial Cells)
 * 
 * Provides pristine memory grid instantiation, state management, and cloning.
 */

import {
  MemoryCell,
  MemoryGrid3D,
  MemoryLevel,
} from '../types/memory';
import {
  DIMENSION,
  TOTAL_SPATIAL_CELLS,
  TOTAL_SYMBOLIC_IDS,
  TOTAL_ADDRESS_SPACE,
  cellIdToCoordinate,
  cellIdToAddress369,
} from './address369';
import { calculateCellNeighbors } from './neighbors';

/**
 * Creates an empty, pristine 7x7x7 3D Memory Grid containing exactly 343 initialized cells
 */
export function createEmptyMemoryGrid(title: string = "Pristine Memory Grid"): MemoryGrid3D {
  const cells: MemoryCell[] = new Array(TOTAL_SPATIAL_CELLS);

  for (let id = 0; id < TOTAL_SPATIAL_CELLS; id++) {
    const { x, y, z } = cellIdToCoordinate(id);
    const address = cellIdToAddress369(id);
    const neighbors = calculateCellNeighbors(x, y, z);

    cells[id] = {
      id,
      blockId: 0,
      address,
      address369: address,
      x,
      y,
      z,
      globalCoordinate: [x, y, z],
      state: 0,
      symbol: null,
      symbolId: null,
      level: 1 as MemoryLevel,
      stepIndices: [],
      occurrenceCount: 0,
      payloadBinary: '00000000',
      neighbors,
      relationships: {
        xPos: neighbors.xPos,
        xNeg: neighbors.xNeg,
        yPos: neighbors.yPos,
        yNeg: neighbors.yNeg,
        zPos: neighbors.zPos,
        zNeg: neighbors.zNeg,
        allAdjacentIds: [...neighbors.allAdjacentIds],
        sameBlockId: 0,
        parentBlockId: null,
        childBlockIds: [],
        prevTokenRef: null,
        nextTokenRef: null,
      },
      connections: [],
      nextCellIds: [],
      prevCellIds: [],
    };
  }

  return {
    version: '1.0.0',
    dimension: DIMENSION,
    totalCells: TOTAL_SPATIAL_CELLS,
    totalAddressSpace: TOTAL_ADDRESS_SPACE,
    symbolCount: TOTAL_SYMBOLIC_IDS,
    activeCellCount: 0,
    cells,
    entryCellId: null,
    sequenceSteps: [],
    metadata: {
      title,
      createdAt: new Date().toISOString(),
      description: '7x7x7 3D Spatial Memory Grid (343 Cells)',
    },
  };
}

/**
 * Deep clones a MemoryGrid3D to prevent accidental state mutations
 */
export function cloneMemoryGrid(grid: MemoryGrid3D): MemoryGrid3D {
  return JSON.parse(JSON.stringify(grid));
}

/**
 * Resets an existing grid to state=0 across all 343 cells while retaining neighbors & addresses
 */
export function resetMemoryGrid(grid: MemoryGrid3D): MemoryGrid3D {
  const newGrid = createEmptyMemoryGrid("Reset Memory Grid");
  return newGrid;
}
