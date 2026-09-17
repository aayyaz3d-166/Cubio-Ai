/**
 * 3D Memory — Funnel 2: Hierarchical 3D Memory Engine
 * 
 * Research Question:
 * "Can a large dataset be represented as a hierarchy of reusable 3D memory blocks while preserving spatial relationships?"
 * 
 * Core Principles:
 * 1. EXPANDABLE SPATIAL MEMORY (Not compression):
 *    The 7x7x7 (343-cell) spatial cube is a REUSABLE MEMORY BLOCK, not the system ceiling.
 * 2. HIERARCHICAL STRUCTURE:
 *    ROOT contains child blocks:
 *    ROOT ├── BLOCK 0 ├── BLOCK 1 ├── BLOCK 2 └── BLOCK 3
 * 3. PROCEDURAL COORDINATE MAPPING:
 *    Global Position = Block Origin + Local Coordinate (0..6 X, 0..6 Y, 0..6 Z)
 * 4. AUTOMATIC BLOCK ALLOCATION:
 *    When Funnel 1 produces more data than available cells in the current block:
 *    Current Block Full → Create New Block → Continue Encoding
 * 5. GRAPH-LIKE SPATIAL RELATIONSHIPS:
 *    Every active cell maintains 6 orthogonal neighbors (X+, X-, Y+, Y-, Z+, Z-),
 *    hierarchical block relations (same block, parent block, child blocks),
 *    and sequence trajectory pointers (previous token, next token).
 */

import {
  CanonicalStoredCellRecord,
  CellNeighbors,
  CellSpatialRelationships,
  Coordinate3D,
  DecodeResult,
  MemoryBlock,
  MemoryCell,
  MemoryGrid3D,
  MemoryLevel,
  MemorySequenceStep,
  RootMemory,
  SpatialInstruction,
  SpatialTokenRecord,
} from '../types/memory';
import {
  DIMENSION,
  TOTAL_SPATIAL_CELLS,
  TOTAL_SYMBOLIC_IDS,
  TOTAL_ADDRESS_SPACE,
  cellIdToCoordinate,
  cellIdToAddress369,
  getTokenAddress,
  charToSymbolId,
  symbolIdTo8BitBinary,
} from './address369';
import {
  deriveSpatialAttributes,
  toCanonicalStoredRecord,
} from './derivation';
import { calculateCellNeighbors } from './neighbors';

export const BLOCK_DIMENSION = 7;
export const BLOCK_CELL_CAPACITY = 343;
export const RESEARCH_QUESTION =
  'Can a large dataset be represented as a hierarchy of reusable 3D memory blocks while preserving spatial relationships?';

/**
 * Calculates global 3D world coordinates from block origin and local cell coordinate
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
 * Blocks are laid out cleanly in 3D block space with spacing
 */
export function getStandardBlockOrigin(blockId: number): [number, number, number] {
  const BLOCK_GAP = 9; // 7 units width + 2 units gap
  const BLOCKS_PER_ROW = 4;
  const BLOCKS_PER_LAYER = 16;

  const layer = Math.floor(blockId / BLOCKS_PER_LAYER);
  const remainder = blockId % BLOCKS_PER_LAYER;
  const row = Math.floor(remainder / BLOCKS_PER_ROW);
  const col = remainder % BLOCKS_PER_ROW;

  return [col * BLOCK_GAP, layer * BLOCK_GAP, row * BLOCK_GAP];
}

/**
 * Instantiates a pristine 7x7x7 (343 cells) MemoryBlock
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

/**
 * Initializes the Root Hierarchical Memory System
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
 * Dynamically allocates and adds a new reusable 7x7x7 Memory Block to Root Memory
 * Preserves hierarchical parent/child links
 */
export function allocateBlock(
  root: RootMemory,
  parentBlockId: number | null = null,
  level: MemoryLevel = 1
): MemoryBlock {
  const newBlockId = root.blocks.length;
  const newBlock = createMemoryBlock(
    newBlockId,
    parentBlockId,
    getStandardBlockOrigin(newBlockId),
    level,
    `Memory Block #${newBlockId}`
  );

  // Link parent's children array
  if (parentBlockId !== null) {
    const parentBlock = root.blocks.find((b) => b.blockId === parentBlockId);
    if (parentBlock && !parentBlock.children.includes(newBlockId)) {
      parentBlock.children.push(newBlockId);
    }
  }

  root.blocks.push(newBlock);
  root.totalCapacity = root.blocks.length * BLOCK_CELL_CAPACITY;
  root.metadata.totalAllocatedBlocks = root.blocks.length;

  return newBlock;
}

/**
 * Converts a specific MemoryBlock to a standard MemoryGrid3D structure for viewport rendering
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

export interface HierarchicalEncodeResult {
  root: RootMemory;
  steps: MemorySequenceStep[];
  spatialInstructions: SpatialInstruction[];
  tokenRecords: SpatialTokenRecord[];
  canonicalRecords: CanonicalStoredCellRecord[];
  totalBlocksAllocated: number;
  uniqueCellsActivated: number;
  textLength: number;
  encodingTimeMs: number;
}

/**
 * Hierarchical Automatic Multi-Block Spatial Encoder
 * 
 * When input data exceeds current block's 343-cell capacity:
 * Current Block Full → Create New Block → Continue Encoding
 * 
 * Builds graph relationships across cells and across blocks:
 * - Orthogonal neighbors (X+, X-, Y+, Y-, Z+, Z-)
 * - sameBlockId, parentBlockId, childBlockIds
 * - prevTokenRef, nextTokenRef
 */
export function encodeToHierarchicalMemory(
  text: string,
  level: MemoryLevel = 1,
  title?: string
): HierarchicalEncodeResult {
  const startTime = performance.now();
  const root = createRootMemory(title || `Encoded: "${text.slice(0, 28)}..."`);

  const steps: MemorySequenceStep[] = [];
  const spatialInstructions: SpatialInstruction[] = [];
  const tokenRecords: SpatialTokenRecord[] = [];
  const canonicalRecords: CanonicalStoredCellRecord[] = [];

  let prevBlockId: number | null = null;
  let prevCellId: number | null = null;
  let prevChar: string | null = null;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const targetBlockIndex = Math.floor(i / BLOCK_CELL_CAPACITY);
    const localCellId = i % BLOCK_CELL_CAPACITY;

    // Automatic Block Allocation when capacity reached
    while (root.blocks.length <= targetBlockIndex) {
      allocateBlock(root, 0, level);
    }

    const currentBlock = root.blocks[targetBlockIndex];
    const cell = currentBlock.cells[localCellId];
    const tokenAddr = getTokenAddress(char);
    const symbolId = charToSymbolId(char);
    const binary = symbolIdTo8BitBinary(symbolId);
    const localCoord = cellIdToCoordinate(localCellId);
    const globalCoord = calculateGlobalPosition(currentBlock.origin, localCoord);

    // Minimal Canonical Stored Record
    const canonicalRecord: CanonicalStoredCellRecord = {
      blockId: targetBlockIndex,
      cellId: localCellId,
      state: 1,
      token: char,
      sequence: [i],
    };
    canonicalRecords.push(canonicalRecord);

    // Derived spatial attributes on the fly
    const derived = deriveSpatialAttributes(targetBlockIndex, localCellId, currentBlock.origin, char);

    // Activate Cell in Target Block
    cell.state = 1;
    cell.symbol = char;
    cell.symbolId = symbolId;
    cell.level = level;
    cell.stepIndices.push(i);
    cell.occurrenceCount += 1;
    cell.payloadBinary = binary;

    // Maintain Graph & Spatial Relationships
    cell.relationships.prevTokenRef =
      prevBlockId !== null && prevCellId !== null
        ? { blockId: prevBlockId, cellId: prevCellId, token: prevChar || undefined }
        : null;

    // Backward connection
    if (prevCellId !== null && prevBlockId === targetBlockIndex) {
      if (!cell.prevCellIds.includes(prevCellId)) cell.prevCellIds.push(prevCellId);
      if (!cell.connections.includes(prevCellId)) cell.connections.push(prevCellId);
    }

    // Link previous cell's next pointer
    if (prevBlockId !== null && prevCellId !== null) {
      const prevBlock = root.blocks[prevBlockId];
      if (prevBlock) {
        const prevCell = prevBlock.cells[prevCellId];
        if (prevCell) {
          prevCell.relationships.nextTokenRef = {
            blockId: targetBlockIndex,
            cellId: localCellId,
            token: char,
          };
          if (prevBlockId === targetBlockIndex) {
            if (!prevCell.nextCellIds.includes(localCellId)) prevCell.nextCellIds.push(localCellId);
            if (!prevCell.connections.includes(localCellId)) prevCell.connections.push(localCellId);
          }
        }
      }
    }

    // Update block metadata
    currentBlock.metadata.tokenCount += 1;
    if (cell.occurrenceCount === 1) {
      currentBlock.metadata.activeCellCount += 1;
      root.totalActiveCells += 1;
    }

    if (root.entryRef === null) {
      root.entryRef = { blockId: targetBlockIndex, cellId: localCellId };
    }

    const stepRecord: MemorySequenceStep = {
      step: i,
      char,
      symbolId,
      address: tokenAddr,
      address369: cell.address,
      blockId: targetBlockIndex,
      cellId: localCellId,
      coordinate: localCoord,
      globalCoordinate: globalCoord,
      binary,
      level,
    };
    steps.push(stepRecord);
    root.sequenceSteps.push(stepRecord);

    // Spatial Token Record (spec: token, address, sequence, blockId, cellId, coordinate, state, derived)
    const tokenRecord: SpatialTokenRecord = {
      token: char,
      address: tokenAddr,
      sequence: i,
      blockId: targetBlockIndex,
      cellId: localCellId,
      coordinate: [localCoord.x, localCoord.y, localCoord.z],
      globalCoordinate: globalCoord,
      neighbors: derived.neighbors,
      derived,
      state: 1,
    };
    tokenRecords.push(tokenRecord);

    const isNewBlockAllocation = localCellId === 0 && targetBlockIndex > 0;
    const instructionCode = `SPATIAL_OP::ALLOC_ACTIVATE[step:${i}, block:${targetBlockIndex}, cell:${localCellId}, addr:${tokenAddr}, local:(${localCoord.x},${localCoord.y},${localCoord.z}), global:(${globalCoord[0]},${globalCoord[1]},${globalCoord[2]}), sym:'${char === ' ' ? '␣' : char}']`;
    const humanReadable = `${isNewBlockAllocation ? `[AUTO ALLOC BLOCK #${targetBlockIndex}] ` : ''}Activate Block #${targetBlockIndex} Cell #${localCellId} at Local (${localCoord.x},${localCoord.y},${localCoord.z}) / Global (${globalCoord[0]},${globalCoord[1]},${globalCoord[2]}) with '${char === ' ' ? '␣' : char}' [Addr ${tokenAddr}]${prevCellId !== null ? ` linked from Block #${prevBlockId} Cell #${prevCellId}` : ' (Entry)'}`;

    spatialInstructions.push({
      step: i,
      op: 'ALLOC_ACTIVATE',
      token: char,
      symbolId,
      address369: cell.address,
      cellId: localCellId,
      coordinate: localCoord,
      binary,
      prevCellId,
      instructionCode,
      humanReadable,
      record: tokenRecord,
      canonicalRecord,
    });

    prevBlockId = targetBlockIndex;
    prevCellId = localCellId;
    prevChar = char;
  }

  const endTime = performance.now();

  return {
    root,
    steps,
    spatialInstructions,
    tokenRecords,
    canonicalRecords,
    totalBlocksAllocated: root.blocks.length,
    uniqueCellsActivated: root.totalActiveCells,
    textLength: text.length,
    encodingTimeMs: Math.round((endTime - startTime) * 100) / 100,
  };
}

/**
 * Hierarchical Decoder: Reconstructs exact sequence from Root Memory across all blocks
 */
export function decodeHierarchicalMemory(
  root: RootMemory,
  originalTextForComparison?: string
): DecodeResult {
  const startTime = performance.now();

  if (!root || !root.blocks || root.blocks.length === 0) {
    return {
      success: false,
      decodedText: '',
      stepsDecoded: 0,
      lossPercentage: 100,
      isExactMatch: false,
      decodingTimeMs: 0,
      error: 'Invalid Root Memory: No memory blocks found.',
    };
  }

  // Traverse sequence steps across blocks
  const decodedChars: string[] = [];
  for (const step of root.sequenceSteps) {
    const blockId = step.blockId ?? 0;
    const block = root.blocks[blockId];
    if (block) {
      const cell = block.cells[step.cellId];
      if (cell && cell.state === 1) {
        decodedChars.push(step.char);
      }
    }
  }

  const decodedText = decodedChars.join('');
  const endTime = performance.now();

  const isExactMatch =
    originalTextForComparison !== undefined
      ? decodedText === originalTextForComparison
      : true;

  const lossPercentage = isExactMatch
    ? 0
    : Math.round(
        (1 - decodedText.length / Math.max(1, originalTextForComparison?.length || 1)) * 10000
      ) / 100;

  return {
    success: true,
    decodedText,
    stepsDecoded: decodedChars.length,
    lossPercentage,
    isExactMatch,
    decodingTimeMs: Math.round((endTime - startTime) * 100) / 100,
  };
}
