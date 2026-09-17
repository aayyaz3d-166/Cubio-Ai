/**
 * 3D Memory — 3 Funnel Architecture Engine
 * 
 * Flow:
 *               INPUT DATA
 *                   │
 *                   ▼
 *         ┌─────────────────┐
 *         │   FUNNEL 1      │
 *         │   ENCODE        │
 *         │                 │
 *         │ Data → Tokens   │
 *         │ → Addresses     │
 *         └────────┬────────┘
 *                  │
 *                  ▼
 *         ┌─────────────────┐
 *         │   FUNNEL 2      │
 *         │   3D MEMORY     │
 *         │                 │
 *         │ 7×7×7 Blocks    │
 *         │ → Cells         │
 *         │ → Relationships │
 *         │ → Expandable    │
 *         └────────┬────────┘
 *                  │
 *                  ▼
 *         ┌─────────────────┐
 *         │   FUNNEL 3      │
 *         │   RECONSTRUCT   │
 *         │                 │
 *         │ Locate Block    │
 *         │ → Locate Cell   │
 *         │ → Resolve Addr  │
 *         │ → Resolve Token │
 *         │ → Sequence Order│
 *         │ → Original Data │
 *         └─────────────────┘
 */

import {
  CanonicalStoredCellRecord,
  Coordinate3D,
  Funnel1EncodeData,
  Funnel2MemoryData,
  Funnel3ReconstructData,
  MemoryGrid3D,
  MemoryLevel,
  MemorySequenceStep,
  RootMemory,
  SpatialInstruction,
  SpatialTokenRecord,
  ThreeFunnelPipeline,
} from '../types/memory';
import { getTokenAddress, mapTokenToSpatialCell } from './address369';
import {
  computeDeduplicationMetrics,
  deriveSpatialAttributes,
} from './derivation';
import { buildFunnel3Reconstruction } from './decoder';
import {
  encodeToHierarchicalMemory,
  RESEARCH_QUESTION,
} from './hierarchicalMemory';

/**
 * Funnel 1: Generate Spatial Instructions & Canonical Stored Records
 * Implements "DERIVE, DON'T STORE":
 * Stores: blockId, cellId, state, token/reference, sequence
 * Derives at runtime: XYZ, Address 369, Neighbors, Global Coordinate, Binary Payload
 */
export function generateSpatialInstructions(
  text: string,
  level: MemoryLevel = 1
): {
  instructions: SpatialInstruction[];
  tokenRecords: SpatialTokenRecord[];
  canonicalRecords: CanonicalStoredCellRecord[];
  steps: MemorySequenceStep[];
  tokens: string[];
  addresses: number[];
} {
  const instructions: SpatialInstruction[] = [];
  const tokenRecords: SpatialTokenRecord[] = [];
  const canonicalRecords: CanonicalStoredCellRecord[] = [];
  const steps: MemorySequenceStep[] = [];
  const tokens: string[] = [];
  const addresses: number[] = [];

  let prevCellId: number | null = null;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    tokens.push(char);
    const mapping = mapTokenToSpatialCell(char, i);
    const address = getTokenAddress(char);
    addresses.push(address);

    const blockId = Math.floor(i / 343);
    const cellId = mapping.cellId;
    const coord = mapping.coord;
    const binary = mapping.binary;
    const symbolId = mapping.symbolId;

    // Minimum Canonical Stored Record (Only 5 fields)
    const canonicalRecord: CanonicalStoredCellRecord = {
      blockId,
      cellId,
      state: 1,
      token: char,
      sequence: [i],
    };
    canonicalRecords.push(canonicalRecord);

    // Derived on the fly at runtime (zero duplicate storage)
    const derived = deriveSpatialAttributes(blockId, cellId, [0, 0, 0], char);

    const record: SpatialTokenRecord = {
      // Stored canonical data
      blockId,
      cellId,
      state: 1,
      token: char,
      sequence: i,
      // Runtime derived properties
      address,
      coordinate: [coord.x, coord.y, coord.z],
      neighbors: derived.neighbors,
      derived,
    };
    tokenRecords.push(record);

    const instructionCode = `SPATIAL_OP::ALLOC_ACTIVATE[step:${i}, block:${blockId}, cell:${cellId}, addr:${mapping.address}, derived_pos:(${coord.x},${coord.y},${coord.z}), sym:'${char === ' ' ? '␣' : char}']`;
    const humanReadable = `[DERIVE, DON'T STORE] Store Cell #${cellId} (Block #${blockId}) with '${char === ' ' ? '␣' : char}' → Runtime Derived: Pos(${coord.x},${coord.y},${coord.z}), Addr:${address}, Neighbors:[${derived.neighbors.allAdjacentIds.join(',')}]`;

    const instruction: SpatialInstruction = {
      step: i,
      op: 'ALLOC_ACTIVATE',
      token: char,
      symbolId,
      address369: mapping.address,
      cellId,
      coordinate: coord,
      binary,
      prevCellId,
      instructionCode,
      humanReadable,
      record,
      canonicalRecord,
    };

    instructions.push(instruction);

    steps.push({
      step: i,
      char,
      symbolId,
      address: mapping.address,
      address369: mapping.address,
      blockId,
      cellId,
      coordinate: coord,
      binary,
      level,
    });

    prevCellId = cellId;
  }

  return { instructions, tokenRecords, canonicalRecords, steps, tokens, addresses };
}

/**
 * Builds the complete 3-Funnel Architecture inspection model
 */
export function buildFunnelPipeline(
  inputText: string,
  grid: MemoryGrid3D,
  decodedText: string,
  latencyMs: number = 0
): ThreeFunnelPipeline {
  const { instructions, tokenRecords, canonicalRecords, tokens, addresses } = generateSpatialInstructions(inputText, 1);
  const deduplicationMetrics = computeDeduplicationMetrics();

  // Funnel 1 State (Derive, Don't Store)
  const funnel1: Funnel1EncodeData = {
    inputText,
    tokens,
    tokenCount: tokens.length,
    addresses,
    spatialInstructions: instructions,
    tokenRecords,
    canonicalRecords,
    sequenceOrder: tokens.map((_, i) => i),
    deduplicationMetrics,
  };

  // Funnel 2 State (7x7x7 Blocks, Cells, Relationships, Expandable)
  const hierResult = encodeToHierarchicalMemory(inputText, 1);
  const rootMemory = hierResult.root;

  let totalEdges = 0;
  grid.cells.forEach((c) => {
    totalEdges += c.connections.length;
  });

  const denseCellsTotal = rootMemory.blocks.length * 343;
  const sparseActive = hierResult.uniqueCellsActivated;
  const implicitDefault = Math.max(0, denseCellsTotal - sparseActive);
  const overheadReduction = Math.round((implicitDefault / Math.max(1, denseCellsTotal)) * 1000) / 10;

  const funnel2: Funnel2MemoryData = {
    dimension: '7×7×7',
    blockSize: 343,
    totalCells: rootMemory.totalCapacity,
    activeCells: hierResult.uniqueCellsActivated,
    idleCells: Math.max(0, rootMemory.totalCapacity - hierResult.uniqueCellsActivated),
    activeCellRatio: Math.round((hierResult.uniqueCellsActivated / Math.max(1, rootMemory.totalCapacity)) * 1000) / 10,
    orthogonalNeighborsCalculated: rootMemory.blocks.length * 343 * 6,
    sequenceEdgesCount: totalEdges,
    currentLevel: 1,
    entryCellId: grid.entryCellId,
    rootMemory,
    allocatedBlocksCount: rootMemory.blocks.length,
    activeBlockId: rootMemory.activeBlockId,
    isExpandable: true,
    preservesSpatialRelationships: true,
    researchQuestion: RESEARCH_QUESTION,
    sparseActiveCellsCount: sparseActive,
    implicitDefaultCellsCount: implicitDefault,
    overheadReductionRatioPercent: overheadReduction,
    denseCellObjectsCount: denseCellsTotal,
  };

  // Funnel 3 State (3D Memory -> Locate Block -> Locate Cell -> Resolve Address -> Resolve Token -> Sequence Order -> Original Data)
  const funnel3: Funnel3ReconstructData = buildFunnel3Reconstruction(rootMemory, inputText);
  if (latencyMs > 0) {
    funnel3.totalLatencyMs = latencyMs;
  }

  return { funnel1, funnel2, funnel3 };
}

