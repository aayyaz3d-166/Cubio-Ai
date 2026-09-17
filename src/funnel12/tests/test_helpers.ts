/**
 * 3D Memory Studio - Funnel 12 Test Helpers
 * Generates valid MemoryCell and MemoryBlock fixtures for unit and integration testing.
 */

import { MemoryBlock, MemoryCell, MemoryLevel } from '../../types/memory';
import { cellIdToCoordinate, cellIdToAddress369 } from '../../core/address369';
import { calculateCellNeighbors } from '../../core/neighbors';

export function createTestCell(
  id: number,
  blockId: number = 0,
  symbol: string | null = null,
  stepIndices: number[] = []
): MemoryCell {
  const { x, y, z } = cellIdToCoordinate(id);
  const address = cellIdToAddress369(id);
  const neighbors = calculateCellNeighbors(x, y, z);

  return {
    id,
    blockId,
    address,
    address369: address,
    x,
    y,
    z,
    globalCoordinate: [x, y, z],
    state: symbol ? 1 : 0,
    symbol,
    symbolId: symbol ? symbol.charCodeAt(0) : null,
    level: 1 as MemoryLevel,
    stepIndices: stepIndices.length > 0 ? stepIndices : (symbol ? [id] : []),
    occurrenceCount: symbol ? 1 : 0,
    payloadBinary: symbol ? symbol.charCodeAt(0).toString(2).padStart(8, '0') : '00000000',
    neighbors,
    relationships: {
      xPos: neighbors.xPos,
      xNeg: neighbors.xNeg,
      yPos: neighbors.yPos,
      yNeg: neighbors.yNeg,
      zPos: neighbors.zPos,
      zNeg: neighbors.zNeg,
      allAdjacentIds: [...neighbors.allAdjacentIds],
      sameBlockId: blockId,
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

export function createTestBlock(
  blockId: number,
  activeCells: MemoryCell[],
  origin: [number, number, number] = [0, 0, 0]
): MemoryBlock {
  const cells: MemoryCell[] = new Array(343);
  const activeMap = new Map<number, MemoryCell>();
  for (const c of activeCells) {
    activeMap.set(c.id, c);
  }

  for (let id = 0; id < 343; id++) {
    if (activeMap.has(id)) {
      cells[id] = activeMap.get(id)!;
    } else {
      cells[id] = createTestCell(id, blockId, null, []);
    }
  }

  return {
    blockId,
    parentBlockId: null,
    level: 1 as MemoryLevel,
    origin,
    dimensions: [7, 7, 7],
    cells,
    children: [],
    metadata: {
      title: `Test Block ${blockId}`,
      createdAt: new Date().toISOString(),
      activeCellCount: activeCells.length,
      tokenCount: activeCells.length,
      capacity: 343,
    },
  };
}
