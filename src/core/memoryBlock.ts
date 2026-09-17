/**
 * 3D Memory Studio - Memory Block Module
 * 
 * Defines the fundamental 7x7x7 (343 cells) reusable spatial memory block.
 * Each block maintains its own local coordinate system (0..6 X, 0..6 Y, 0..6 Z)
 * and global origin offset.
 */

import {
  CellNeighbors,
  CellSpatialRelationships,
  Coordinate3D,
  MemoryBlock,
  MemoryCell,
  MemoryLevel,
} from '../types/memory';
import {
  DIMENSION,
  TOTAL_SPATIAL_CELLS,
  cellIdToCoordinate,
  cellIdToAddress369,
} from './address369';
import { calculateCellNeighbors } from './neighbors';

export const BLOCK_DIMENSION = 7;
export const BLOCK_CELL_CAPACITY = 343;

/**
 * Calculates global 3D world coordinates from block origin and local cell coordinate:
 * Global Position = Block Origin + Local Coordinate
 */
export function calculateGlobalPosition(
  blockOrigin: [number, number, number],
  localCoord: Coordinate3D
): [number, number, number] {
  return [
    blockOrigin[0] + localCoord.x,
    blockOrigin[1] + localCoord.y,
    blockOrigin[2] + localCoord.z,
  ];
}

/**
 * Procedurally computes standard origin for a block ID in a spatial grid formation
 * Blocks are laid out cleanly with a gap for 3D visualization.
 */
export function getStandardBlockOrigin(blockId: number): [number, number, number] {
  const BLOCK_GAP = 10; // 7 units width + 3 units gap
  const BLOCKS_PER_ROW = 4;
  const BLOCKS_PER_LAYER = 16;

  const layer = Math.floor(blockId / BLOCKS_PER_LAYER);
  const remainder = blockId % BLOCKS_PER_LAYER;
  const row = Math.floor(remainder / BLOCKS_PER_ROW);
  const col = remainder % BLOCKS_PER_ROW;

  return [col * BLOCK_GAP, layer * BLOCK_GAP, row * BLOCK_GAP];
}

/**
 * Instantiates a fresh 7x7x7 (343 cells) MemoryBlock
 */
export function createMemoryBlock(
  blockId: number,
  parentBlockId: number | null = null,
  origin?: [number, number, number],
  level: MemoryLevel = 1,
  title?: string
): MemoryBlock {
  const blockOrigin = origin || getStandardBlockOrigin(blockId);
  const cells: MemoryCell[] = new Array(BLOCK_CELL_CAPACITY);

  for (let id = 0; id < BLOCK_CELL_CAPACITY; id++) {
    const localCoord = cellIdToCoordinate(id);
    const address = cellIdToAddress369(id);
    const neighbors: CellNeighbors = calculateCellNeighbors(
      localCoord.x,
      localCoord.y,
      localCoord.z
    );

    const relationships: CellSpatialRelationships = {
      xPos: neighbors.xPos,
      xNeg: neighbors.xNeg,
      yPos: neighbors.yPos,
      yNeg: neighbors.yNeg,
      zPos: neighbors.zPos,
      zNeg: neighbors.zNeg,
      allAdjacentIds: [...neighbors.allAdjacentIds],
      sameBlockId: blockId,
      parentBlockId,
      childBlockIds: [],
      prevTokenRef: null,
      nextTokenRef: null,
    };

    const globalCoordinate = calculateGlobalPosition(blockOrigin, localCoord);

    cells[id] = {
      id,
      blockId,
      address,
      address369: address,
      x: localCoord.x,
      y: localCoord.y,
      z: localCoord.z,
      globalCoordinate,
      state: 0,
      symbol: null,
      symbolId: null,
      level,
      stepIndices: [],
      occurrenceCount: 0,
      payloadBinary: '00000000',
      neighbors,
      relationships,
      connections: [],
      nextCellIds: [],
      prevCellIds: [],
    };
  }

  return {
    blockId,
    parentBlockId,
    level,
    origin: blockOrigin,
    dimensions: [BLOCK_DIMENSION, BLOCK_DIMENSION, BLOCK_DIMENSION],
    cells,
    children: [],
    metadata: {
      title: title || `Memory Block #${blockId}`,
      createdAt: new Date().toISOString(),
      activeCellCount: 0,
      tokenCount: 0,
      capacity: BLOCK_CELL_CAPACITY,
      description: `Reusable 7x7x7 Spatial Block #${blockId} (${BLOCK_CELL_CAPACITY} Cells)`,
    },
  };
}
