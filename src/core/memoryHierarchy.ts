/**
 * 3D Memory Studio - Memory Hierarchy Module
 * 
 * Manages the hierarchical memory architecture:
 * ROOT
 *  ├── BLOCK 0
 *  ├── BLOCK 1
 *  ├── BLOCK 2
 *  └── BLOCK ...
 * 
 * Each block has its own local 0..6 coordinate space and connects into a graph.
 */

import {
  MemoryBlock,
  MemoryCell,
  MemoryGrid3D,
  MemorySequenceStep,
  RootMemory,
} from '../types/memory';
import {
  BLOCK_CELL_CAPACITY,
  BLOCK_DIMENSION,
  createMemoryBlock,
} from './memoryBlock';
import { TOTAL_ADDRESS_SPACE, TOTAL_SYMBOLIC_IDS } from './address369';

export const RESEARCH_QUESTION =
  'Can a large dataset be represented as a hierarchy of reusable 3D memory blocks while preserving spatial relationships?';

/**
 * Initializes the Root Hierarchical Memory
 * ROOT ├── BLOCK 0
 */
export function createRootMemory(title: string = 'Hierarchical Spatial Memory'): RootMemory {
  const block0 = createMemoryBlock(0, null, [0, 0, 0], 1, 'Memory Block #0 (Entry Block)');

  return {
    rootId: 'ROOT',
    level: 1,
    blocks: [block0],
    activeBlockId: 0,
    totalCapacity: BLOCK_CELL_CAPACITY,
    totalActiveCells: 0,
    entryRef: null,
    sequenceSteps: [],
    metadata: {
      title,
      createdAt: new Date().toISOString(),
      totalAllocatedBlocks: 1,
      researchQuestion: RESEARCH_QUESTION,
      isExpandable: true,
      preservesSpatialRelationships: true,
    },
  };
}

/**
 * Finds a specific block by ID in Root Memory
 */
export function getBlockById(root: RootMemory, blockId: number): MemoryBlock | undefined {
  return root.blocks.find((b) => b.blockId === blockId);
}

/**
 * Finds a specific cell by Block ID and Cell ID
 */
export function getCellInRoot(
  root: RootMemory,
  blockId: number,
  cellId: number
): MemoryCell | undefined {
  const block = getBlockById(root, blockId);
  return block ? block.cells[cellId] : undefined;
}

/**
 * Converts a specific MemoryBlock to a single-block MemoryGrid3D structure
 */
export function memoryBlockToGrid3D(block: MemoryBlock, rootTitle?: string): MemoryGrid3D {
  return {
    version: '2.0.0',
    dimension: BLOCK_DIMENSION,
    totalCells: BLOCK_CELL_CAPACITY,
    totalAddressSpace: TOTAL_ADDRESS_SPACE,
    symbolCount: TOTAL_SYMBOLIC_IDS,
    activeCellCount: block.metadata.activeCellCount,
    cells: block.cells,
    entryCellId: block.cells.find((c) => c.state === 1)?.id ?? null,
    sequenceSteps: [],
    metadata: {
      title: block.metadata.title || `Block #${block.blockId}`,
      createdAt: block.metadata.createdAt,
      description: `Block #${block.blockId} (Origin: [${block.origin.join(', ')}]) in Root ${rootTitle || ''}`,
    },
  };
}

/**
 * Creates a merged virtual MemoryGrid3D across all blocks in Root Memory
 */
export function rootMemoryToMergedGrid(root: RootMemory): MemoryGrid3D {
  const activeBlock = root.blocks[root.activeBlockId] || root.blocks[0];
  const allActiveCellsCount = root.blocks.reduce(
    (sum, b) => sum + b.metadata.activeCellCount,
    0
  );

  return {
    version: '2.0.0',
    dimension: BLOCK_DIMENSION,
    totalCells: root.totalCapacity,
    totalAddressSpace: TOTAL_ADDRESS_SPACE,
    symbolCount: TOTAL_SYMBOLIC_IDS,
    activeCellCount: allActiveCellsCount,
    cells: activeBlock ? activeBlock.cells : [],
    entryCellId: root.entryRef?.cellId ?? null,
    sequenceSteps: root.sequenceSteps,
    metadata: {
      title: root.metadata.title,
      createdAt: root.metadata.createdAt,
      description: `Hierarchical Memory (${root.blocks.length} Blocks, ${root.totalCapacity} Cells)`,
    },
  };
}

export interface HierarchyTreeNode {
  id: string;
  type: 'ROOT' | 'BLOCK' | 'CELL';
  name: string;
  blockId?: number;
  cellId?: number;
  active: boolean;
  token?: string;
  activeCount?: number;
  totalCapacity?: number;
  origin?: [number, number, number];
  children?: HierarchyTreeNode[];
}

/**
 * Generates an expandable tree representation for the Memory Tree hierarchy panel
 */
export function generateMemoryTreeData(root: RootMemory): HierarchyTreeNode {
  const rootNode: HierarchyTreeNode = {
    id: 'root',
    type: 'ROOT',
    name: 'ROOT',
    active: true,
    activeCount: root.totalActiveCells,
    totalCapacity: root.totalCapacity,
    children: root.blocks.map((block) => {
      const activeCellsInBlock = block.cells.filter((c) => c.state === 1);
      return {
        id: `block-${block.blockId}`,
        type: 'BLOCK',
        name: `Block ${block.blockId}`,
        blockId: block.blockId,
        active: block.metadata.activeCellCount > 0,
        activeCount: block.metadata.activeCellCount,
        totalCapacity: BLOCK_CELL_CAPACITY,
        origin: block.origin,
        children: activeCellsInBlock.map((cell) => ({
          id: `cell-${block.blockId}-${cell.id}`,
          type: 'CELL',
          name: `Cell #${cell.id} ('${cell.symbol === ' ' ? '␣' : cell.symbol}') [Addr ${cell.address}]`,
          blockId: block.blockId,
          cellId: cell.id,
          active: true,
          token: cell.symbol || undefined,
        })),
      };
    }),
  };

  return rootNode;
}
