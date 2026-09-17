/**
 * 3D Memory Studio - Funnel 6: Hierarchical Spatial Decoder
 * 
 * Implements INDEPENDENT reconstruction of 3D Memory from the Compact3D V3 binary format.
 * 
 * Critical Architecture Requirement:
 * The decoder MUST independently reconstruct the exact 3D memory without accessing:
 * - The original input text or original MemoryBlock/RootMemory objects
 * - The pattern discovery cache
 * - The encoder runtime state or composite selection maps
 * 
 * Reconstructs:
 * - Level 0: Active cell coordinates (x,y,z), symbols, and states
 * - Level 1: Inline Primitive spatial rules (SPATIAL_RUN, REPETITION, REPEATED_SHAPE)
 * - Level 2: Funnel 5 Dictionary References (0x06) expanded via Level 2 Pattern Table
 * - Level 3: Funnel 6 Composite References (0x07) expanded via Level 3 Composite Table + Translation transforms
 */

import {
  Coordinate3D,
  MemoryBlock,
  MemoryCell,
  RootMemory,
} from '../types/memory';
import {
  HierarchicalSpatialDecodeResult,
} from '../types/spatialHierarchy';
import { createMemoryBlock } from './memoryBlock';
import { calculateDeterministicChecksum } from './spatialEncoder';
import {
  coordinateToCellId,
  cellIdToCoordinate,
  DIMENSION,
} from './address369';

// Opcode constants
export const RECORD_OPCODE_RAW = 0x00;
export const RECORD_OPCODE_SPATIAL_RUN = 0x01;
export const RECORD_OPCODE_REPETITION = 0x02;
export const RECORD_OPCODE_REPEATED_SHAPE = 0x03;
export const RECORD_OPCODE_DICTIONARY_REF = 0x06;
export const RECORD_OPCODE_COMPOSITE_REF = 0x07;

export type SpatialDirection =
  | '+X'
  | '-X'
  | '+Y'
  | '-Y'
  | '+Z'
  | '-Z'
  | '+X+Y'
  | '-X-Y'
  | '+X+Z'
  | '-X-Z'
  | '+Y+Z'
  | '-Y-Z'
  | '+X-Y'
  | '-X+Y'
  | '+X-Z'
  | '-X+Z'
  | '+Y-Z'
  | '-Y+Z';

export const DIRECTION_STEPS: Record<string, [number, number, number]> = {
  '+X': [1, 0, 0],
  '-X': [-1, 0, 0],
  '+Y': [0, 1, 0],
  '-Y': [0, -1, 0],
  '+Z': [0, 0, 1],
  '-Z': [0, 0, -1],
  '+X+Y': [1, 1, 0],
  '-X-Y': [-1, -1, 0],
  '+X+Z': [1, 0, 1],
  '-X-Z': [-1, 0, -1],
  '+Y+Z': [0, 1, 1],
  '-Y-Z': [0, -1, -1],
  '+X-Y': [1, -1, 0],
  '-X+Y': [-1, 1, 0],
  '+X-Z': [1, 0, -1],
  '-X+Z': [-1, 0, 1],
  '+Y-Z': [0, 1, -1],
  '-Y+Z': [0, -1, 1],
  'DIAG_XY': [1, 1, 0],
  'DIAG_XZ': [1, 0, 1],
  'DIAG_YZ': [0, 1, 1],
  'DIAG_XYZ': [1, 1, 1],
};

export const CODE_TO_DIRECTION: Record<number, string> = {
  0x00: '+X',
  0x01: '-X',
  0x02: '+Y',
  0x03: '-Y',
  0x04: '+Z',
  0x05: '-Z',
  0x06: 'DIAG_XY',
  0x07: 'DIAG_XZ',
  0x08: 'DIAG_YZ',
  0x09: 'DIAG_XYZ',
};

// 7x7x7 grid helpers - Canonical Authority Delegation
export function cellIdToCoord(id: number): Coordinate3D {
  return cellIdToCoordinate(id);
}

export function coordToCellId(x: number, y: number, z: number): number {
  if (x < 0 || x >= DIMENSION || y < 0 || y >= DIMENSION || z < 0 || z >= DIMENSION) return -1;
  return coordinateToCellId(x, y, z);
}

// Compute neighbor connectivity for a 7x7x7 block
function computeCellNeighbors(id: number): {
  orthogonal: number[];
  diagonal: number[];
  allAdjacentIds: number[];
} {
  const { x, y, z } = cellIdToCoord(id);
  const orthogonal: number[] = [];
  const diagonal: number[] = [];

  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dz = -1; dz <= 1; dz++) {
        if (dx === 0 && dy === 0 && dz === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        const nz = z + dz;
        if (nx >= 0 && nx < 7 && ny >= 0 && ny < 7 && nz >= 0 && nz < 7) {
          const nid = coordToCellId(nx, ny, nz);
          const isOrtho = Math.abs(dx) + Math.abs(dy) + Math.abs(dz) === 1;
          if (isOrtho) {
            orthogonal.push(nid);
          } else {
            diagonal.push(nid);
          }
        }
      }
    }
  }

  return {
    orthogonal,
    diagonal,
    allAdjacentIds: [...orthogonal, ...diagonal],
  };
}

interface DecodedDictRule {
  dictId: number;
  ruleType: number;
  runDirection?: string;
  runLength?: number;
  runSymbol?: string;
  repPeriod?: number;
  repStride?: number;
  repCount?: number;
  repToken?: string;
  shapePoints?: Coordinate3D[];
  shapeSymbol?: string;
}

interface DecodedCompositeChild {
  childDictId: number;
  relOffset: [number, number, number];
  order: number;
  transform: number;
}

interface DecodedComposite {
  compositeId: number;
  childCount: number;
  transformType: number;
  children: DecodedCompositeChild[];
}

interface DecodedBlockDir {
  blockId: number;
  parentBlockId: number;
  origin: [number, number, number];
  totalActiveCells: number;
  recordCount: number;
}

/**
 * Independently decode Compact3D V3 binary format into full RootMemory
 */
export function decodeHierarchicalCompactBinary(
  binaryBuffer: Uint8Array,
  originalMemoryForComparison?: RootMemory | null
): HierarchicalSpatialDecodeResult {
  const startTime = performance.now();

  if (!binaryBuffer || binaryBuffer.length < 16) {
    throw new Error('Invalid binary buffer: insufficient length for Compact3D format');
  }

  let offset = 0;

  // 1. FILE HEADER (16 Bytes)
  // Magic: 4 Bytes
  let magicHeader = '';
  for (let i = 0; i < 4; i++) {
    magicHeader += String.fromCharCode(binaryBuffer[offset++]);
  }

  const formatVersion = binaryBuffer[offset++]; // 0x03
  const flags = binaryBuffer[offset++]; // 1B

  const totalBlocks = (binaryBuffer[offset++] << 8) | binaryBuffer[offset++]; // 2B
  const totalActiveCellsHeader = (binaryBuffer[offset++] << 8) | binaryBuffer[offset++]; // 2B

  // Skip 6 reserved bytes
  offset += 6;

  // 2. FUNNEL 5 DICTIONARY SECTION
  const dictEntryCount = (binaryBuffer[offset++] << 8) | binaryBuffer[offset++];
  const totalDictPayloadBytes = (binaryBuffer[offset++] << 8) | binaryBuffer[offset++];

  const dictionaryMap = new Map<number, DecodedDictRule>();

  for (let i = 0; i < dictEntryCount; i++) {
    const dictId = (binaryBuffer[offset++] << 8) | binaryBuffer[offset++];
    const ruleType = binaryBuffer[offset++];
    const byteLength = (binaryBuffer[offset++] << 8) | binaryBuffer[offset++];

    const payloadStart = offset;
    const rule: DecodedDictRule = {
      dictId,
      ruleType,
    };

    if (ruleType === RECORD_OPCODE_SPATIAL_RUN) {
      const dirCode = binaryBuffer[offset++];
      rule.runDirection = CODE_TO_DIRECTION[dirCode] || '+X';
      rule.runLength = (binaryBuffer[offset++] << 8) | binaryBuffer[offset++];
      rule.runSymbol = String.fromCharCode(binaryBuffer[offset++]);
    } else if (ruleType === RECORD_OPCODE_REPETITION) {
      rule.repPeriod = binaryBuffer[offset++];
      rule.repStride = binaryBuffer[offset++];
      rule.repCount = (binaryBuffer[offset++] << 8) | binaryBuffer[offset++];
      rule.repToken = String.fromCharCode(binaryBuffer[offset++]);
    } else if (ruleType === RECORD_OPCODE_REPEATED_SHAPE) {
      const pointCount = (binaryBuffer[offset++] << 8) | binaryBuffer[offset++];
      const points: Coordinate3D[] = [];
      for (let p = 0; p < pointCount; p++) {
        let dx = binaryBuffer[offset++];
        let dy = binaryBuffer[offset++];
        let dz = binaryBuffer[offset++];
        if (dx > 127) dx -= 256;
        if (dy > 127) dy -= 256;
        if (dz > 127) dz -= 256;
        points.push({ x: dx, y: dy, z: dz });
      }
      rule.shapePoints = points;
      rule.shapeSymbol = String.fromCharCode(binaryBuffer[offset++]);
    } else {
      offset = payloadStart + byteLength;
    }

    dictionaryMap.set(dictId, rule);
  }

  // 3. FUNNEL 6 COMPOSITE SECTION
  const compEntryCount = (binaryBuffer[offset++] << 8) | binaryBuffer[offset++];
  const totalCompPayloadBytes = (binaryBuffer[offset++] << 8) | binaryBuffer[offset++];

  const compositeMap = new Map<number, DecodedComposite>();

  for (let i = 0; i < compEntryCount; i++) {
    const compositeId = (binaryBuffer[offset++] << 8) | binaryBuffer[offset++];
    const childCount = (binaryBuffer[offset++] << 8) | binaryBuffer[offset++];
    const transformType = binaryBuffer[offset++];
    const reserved = binaryBuffer[offset++];

    const children: DecodedCompositeChild[] = [];
    for (let c = 0; c < childCount; c++) {
      const childDictId = (binaryBuffer[offset++] << 8) | binaryBuffer[offset++];
      let dx = binaryBuffer[offset++];
      let dy = binaryBuffer[offset++];
      let dz = binaryBuffer[offset++];
      if (dx > 127) dx -= 256;
      if (dy > 127) dy -= 256;
      if (dz > 127) dz -= 256;

      const order = (binaryBuffer[offset++] << 8) | binaryBuffer[offset++];
      const transform = binaryBuffer[offset++];

      children.push({
        childDictId,
        relOffset: [dx, dy, dz],
        order,
        transform,
      });
    }

    compositeMap.set(compositeId, {
      compositeId,
      childCount,
      transformType,
      children,
    });
  }

  // 4. BLOCK DIRECTORY TABLE
  const blockDirs: DecodedBlockDir[] = [];
  for (let b = 0; b < totalBlocks; b++) {
    const blockId = (binaryBuffer[offset++] << 8) | binaryBuffer[offset++];
    const parentBlockId = (binaryBuffer[offset++] << 8) | binaryBuffer[offset++];
    const ox = binaryBuffer[offset++];
    const oy = binaryBuffer[offset++];
    const oz = binaryBuffer[offset++];
    const activeCount = (binaryBuffer[offset++] << 8) | binaryBuffer[offset++];
    const recordCount = (binaryBuffer[offset++] << 8) | binaryBuffer[offset++];

    blockDirs.push({
      blockId,
      parentBlockId,
      origin: [ox, oy, oz],
      totalActiveCells: activeCount,
      recordCount,
    });
  }

  // 5. RECORDS DATA PAYLOAD & CELL POPULATION
  function expandDictRuleIntoBlock(
    dictRule: DecodedDictRule,
    anchorCoord: Coordinate3D,
    activeCellsMap: Map<number, { symbol: string; state: number }>
  ) {
    if (dictRule.ruleType === RECORD_OPCODE_SPATIAL_RUN) {
      const dir = dictRule.runDirection || '+X';
      const step = DIRECTION_STEPS[dir] || [1, 0, 0];
      const length = dictRule.runLength || 1;
      const symbol = dictRule.runSymbol || 'A';

      for (let i = 0; i < length; i++) {
        const cx = anchorCoord.x + i * step[0];
        const cy = anchorCoord.y + i * step[1];
        const cz = anchorCoord.z + i * step[2];
        const cid = coordToCellId(cx, cy, cz);
        if (cid >= 0 && cid < 343) {
          activeCellsMap.set(cid, { symbol, state: 1 });
        }
      }
    } else if (dictRule.ruleType === RECORD_OPCODE_REPETITION) {
      const stride = dictRule.repStride || 1;
      const count = dictRule.repCount || 1;
      const token = dictRule.repToken || 'A';
      const baseId = coordToCellId(anchorCoord.x, anchorCoord.y, anchorCoord.z);

      for (let i = 0; i < count; i++) {
        const cid = baseId + i * stride;
        if (cid >= 0 && cid < 343) {
          activeCellsMap.set(cid, { symbol: token, state: 1 });
        }
      }
    } else if (dictRule.ruleType === RECORD_OPCODE_REPEATED_SHAPE) {
      const points = dictRule.shapePoints || [{ x: 0, y: 0, z: 0 }];
      const symbol = dictRule.shapeSymbol || 'A';

      for (const pt of points) {
        const cx = anchorCoord.x + pt.x;
        const cy = anchorCoord.y + pt.y;
        const cz = anchorCoord.z + pt.z;
        const cid = coordToCellId(cx, cy, cz);
        if (cid >= 0 && cid < 343) {
          activeCellsMap.set(cid, { symbol, state: 1 });
        }
      }
    }
  }

  let totalRecordsDecoded = 0;
  const reconstructedBlocks: MemoryBlock[] = [];

  for (const bDir of blockDirs) {
    const activeCellsMap = new Map<number, { symbol: string; state: number }>();

    for (let r = 0; r < bDir.recordCount; r++) {
      if (offset >= binaryBuffer.length - 8) break; // Before checksum
      const opcode = binaryBuffer[offset++];
      totalRecordsDecoded++;

      const recordBlockId = (binaryBuffer[offset++] << 8) | binaryBuffer[offset++];

      if (opcode === RECORD_OPCODE_RAW) {
        const cellId = (binaryBuffer[offset++] << 8) | binaryBuffer[offset++];
        const symChar = String.fromCharCode(binaryBuffer[offset++]);
        const state = binaryBuffer[offset++];
        if (cellId >= 0 && cellId < 343) {
          activeCellsMap.set(cellId, { symbol: symChar, state: state || 1 });
        }
      } else if (opcode === RECORD_OPCODE_SPATIAL_RUN) {
        const originCellId = (binaryBuffer[offset++] << 8) | binaryBuffer[offset++];
        const dirCode = binaryBuffer[offset++];
        const dir = CODE_TO_DIRECTION[dirCode] || '+X';
        const step = DIRECTION_STEPS[dir] || [1, 0, 0];
        const length = (binaryBuffer[offset++] << 8) | binaryBuffer[offset++];
        const symbol = String.fromCharCode(binaryBuffer[offset++]);

        const startCoord = cellIdToCoord(originCellId);
        for (let i = 0; i < length; i++) {
          const cx = startCoord.x + i * step[0];
          const cy = startCoord.y + i * step[1];
          const cz = startCoord.z + i * step[2];
          const cid = coordToCellId(cx, cy, cz);
          if (cid >= 0 && cid < 343) {
            activeCellsMap.set(cid, { symbol, state: 1 });
          }
        }
      } else if (opcode === RECORD_OPCODE_REPETITION) {
        const originCellId = (binaryBuffer[offset++] << 8) | binaryBuffer[offset++];
        const period = binaryBuffer[offset++];
        const stride = binaryBuffer[offset++];
        const repeatCount = (binaryBuffer[offset++] << 8) | binaryBuffer[offset++];
        const symbol = String.fromCharCode(binaryBuffer[offset++]);

        for (let i = 0; i < repeatCount; i++) {
          const cid = originCellId + i * stride;
          if (cid >= 0 && cid < 343) {
            activeCellsMap.set(cid, { symbol, state: 1 });
          }
        }
      } else if (opcode === RECORD_OPCODE_REPEATED_SHAPE) {
        const originCellId = (binaryBuffer[offset++] << 8) | binaryBuffer[offset++];
        const pointCount = (binaryBuffer[offset++] << 8) | binaryBuffer[offset++];
        const originCoord = cellIdToCoord(originCellId);

        const offsets: Coordinate3D[] = [];
        for (let p = 0; p < pointCount; p++) {
          let dx = binaryBuffer[offset++];
          let dy = binaryBuffer[offset++];
          let dz = binaryBuffer[offset++];
          if (dx > 127) dx -= 256;
          if (dy > 127) dy -= 256;
          if (dz > 127) dz -= 256;
          offsets.push({ x: dx, y: dy, z: dz });
        }
        const symbol = String.fromCharCode(binaryBuffer[offset++]);

        for (const pt of offsets) {
          const cx = originCoord.x + pt.x;
          const cy = originCoord.y + pt.y;
          const cz = originCoord.z + pt.z;
          const cid = coordToCellId(cx, cy, cz);
          if (cid >= 0 && cid < 343) {
            activeCellsMap.set(cid, { symbol, state: 1 });
          }
        }
      } else if (opcode === RECORD_OPCODE_DICTIONARY_REF) {
        const dictId = (binaryBuffer[offset++] << 8) | binaryBuffer[offset++];
        const originCellId = (binaryBuffer[offset++] << 8) | binaryBuffer[offset++];
        const coveredCount = (binaryBuffer[offset++] << 8) | binaryBuffer[offset++];

        const dictRule = dictionaryMap.get(dictId);
        if (dictRule) {
          const originCoord = cellIdToCoord(originCellId);
          expandDictRuleIntoBlock(dictRule, originCoord, activeCellsMap);
        }
      } else if (opcode === RECORD_OPCODE_COMPOSITE_REF) {
        const compositeId = (binaryBuffer[offset++] << 8) | binaryBuffer[offset++];
        const originCellId = (binaryBuffer[offset++] << 8) | binaryBuffer[offset++];
        const coveredCount = (binaryBuffer[offset++] << 8) | binaryBuffer[offset++];

        const composite = compositeMap.get(compositeId);
        if (composite) {
          const compositeOrigin = cellIdToCoord(originCellId);
          for (const child of composite.children) {
            const dictRule = dictionaryMap.get(child.childDictId);
            if (dictRule) {
              const childAnchor: Coordinate3D = {
                x: compositeOrigin.x + child.relOffset[0],
                y: compositeOrigin.y + child.relOffset[1],
                z: compositeOrigin.z + child.relOffset[2],
              };
              expandDictRuleIntoBlock(dictRule, childAnchor, activeCellsMap);
            }
          }
        }
      }
    }

    // Build all 343 cells for this block using createMemoryBlock
    const memoryBlock = createMemoryBlock(
      bDir.blockId,
      bDir.parentBlockId === 0 ? null : bDir.parentBlockId,
      bDir.origin,
      1,
      `Reconstructed Block #${bDir.blockId}`
    );

    for (let id = 0; id < 343; id++) {
      const activeInfo = activeCellsMap.get(id);
      if (activeInfo && activeInfo.state === 1) {
        memoryBlock.cells[id].state = 1;
        memoryBlock.cells[id].symbol = activeInfo.symbol;
      } else {
        memoryBlock.cells[id].state = 0;
        memoryBlock.cells[id].symbol = null;
      }
    }

    const totalActiveInBlock = Array.from(activeCellsMap.values()).filter((c) => c.state === 1).length;
    memoryBlock.metadata.activeCellCount = totalActiveInBlock;

    reconstructedBlocks.push(memoryBlock);
  }

  // 6. CHECKSUM VERIFICATION
  const payloadForChecksum = binaryBuffer.slice(0, binaryBuffer.length - 8);
  const rawActual = calculateDeterministicChecksum(payloadForChecksum);
  const actualChecksum = rawActual.startsWith('0x') ? rawActual : `0x${rawActual}`;

  let expectedTrailer = '';
  for (let i = binaryBuffer.length - 8; i < binaryBuffer.length; i++) {
    expectedTrailer += String.fromCharCode(binaryBuffer[i]);
  }
  const expectedChecksum = expectedTrailer.startsWith('0x') ? expectedTrailer : `0x${expectedTrailer}`;

  const checksumMatched = actualChecksum.toUpperCase() === expectedChecksum.toUpperCase();

  // Build RootMemory
  const totalDecodedActive = reconstructedBlocks.reduce(
    (sum, b) => sum + (b.metadata.activeCellCount || 0),
    0
  );

  const reconstructedRoot: RootMemory = {
    rootId: 'ROOT',
    level: 1,
    blocks: reconstructedBlocks,
    activeBlockId: 0,
    totalCapacity: reconstructedBlocks.length * 343,
    totalActiveCells: totalDecodedActive,
    entryRef: { blockId: 0, cellId: 0 },
    sequenceSteps: [],
    metadata: {
      title: 'Hierarchical Decoded Memory',
      createdAt: new Date().toISOString(),
      totalAllocatedBlocks: reconstructedBlocks.length,
      researchQuestion: 'Hierarchical Spatial Composition Decoding',
      isExpandable: true,
      preservesSpatialRelationships: true,
    },
  };

  const endTime = performance.now();

  // Exact Comparison if reference memory is provided
  let exactComparison: HierarchicalSpatialDecodeResult['exactComparison'] | undefined;
  if (originalMemoryForComparison) {
    let missingCells = 0;
    let duplicateCells = 0;
    let unexpectedCells = 0;
    let totalTargetActive = 0;

    for (const origBlock of originalMemoryForComparison.blocks) {
      const reconBlock = reconstructedBlocks.find((b) => b.blockId === origBlock.blockId);
      for (const origCell of origBlock.cells) {
        if (origCell.state === 1) totalTargetActive++;
        const reconCell = reconBlock?.cells.find((c) => c.id === origCell.id);
        const origActive = origCell.state === 1;
        const reconActive = reconCell?.state === 1;

        if (origActive && !reconActive) missingCells++;
        if (!origActive && reconActive) unexpectedCells++;
      }
    }

    const isExactMatch = missingCells === 0 && unexpectedCells === 0;
    const matchPercent =
      totalTargetActive > 0
        ? Math.max(0, 100 - ((missingCells + unexpectedCells) / totalTargetActive) * 100)
        : 100;

    exactComparison = {
      isExactMatch,
      missingCells,
      duplicateCells,
      unexpectedCells,
      matchPercent,
    };
  }

  const isLossless = exactComparison ? exactComparison.isExactMatch : checksumMatched;

  return {
    reconstructedMemory: reconstructedRoot,
    formatVersion,
    magicHeader,
    checksumMatched,
    expectedChecksum,
    actualChecksum,
    decompressionTimeMs: Math.round((endTime - startTime) * 100) / 100,
    totalBlocksDecoded: reconstructedBlocks.length,
    totalCellsDecoded: reconstructedBlocks.length * 343,
    totalActiveCellsDecoded: totalDecodedActive,
    dictionaryEntriesDecoded: dictEntryCount,
    compositeEntriesDecoded: compEntryCount,
    recordsDecodedCount: totalRecordsDecoded,
    isLossless,
    checksums: {
      matches: checksumMatched,
      logicalMemoryChecksum: actualChecksum,
      reconstructedChecksum: expectedChecksum,
    },
    exactComparison,
  };
}

export const decodeHierarchicalCompactV3 = decodeHierarchicalCompactBinary;
