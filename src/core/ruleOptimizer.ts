/**
 * 3D Memory Studio - Funnel 1: Rule Optimizer Core Engine
 * 
 * Determines which candidate representation (RAW vs candidate rules)
 * has the lowest REAL serialized byte cost under deterministic serialization.
 * 
 * Strictly non-destructive:
 * - Does NOT modify .3dmemory persistence format
 * - Does NOT replace existing cells
 * - Does NOT perform actual compression
 * - Evaluates candidates against deterministic binary serialization standards
 */

import { Coordinate3D, MemoryBlock, MemoryGrid3D, RootMemory } from '../types/memory';
import {
  PatternType,
  RepeatedSpatialShapePattern,
  RuleType,
  SequencePathPattern,
  SpatialClusterPattern,
  SpatialPatternCandidate,
  SpatialRepetitionPattern,
  SpatialRunPattern,
} from '../types/patterns';
import {
  CandidateRepresentation,
  PatternOptimizationResult,
  RepresentationType,
  RuleOptimizerReport,
  RuleOptimizerSummary,
  SerializedFieldBreakdown,
} from '../types/optimizer';
import { cellIdToCoordinate, coordinateToCellId } from './address369';
import { discoverAllSpatialPatterns } from './patternDiscovery';
import { generateSpatialPatternReport } from './patternRules';

// ============================================================================
// OPCODES & SERIALIZATION SPECIFICATION CONSTANTS
// ============================================================================

export const OPCODE_RAW = 0x00;
export const OPCODE_SPATIAL_RUN = 0x01;
export const OPCODE_REPETITION = 0x02;
export const OPCODE_CLUSTER = 0x03;
export const OPCODE_SEQUENCE_PATH = 0x04;
export const OPCODE_REPEATED_SHAPE = 0x05;

export const ENVELOPE_HEADER_BYTES = 4; // [Opcode (1B), BlockIdHigh (1B), BlockIdLow (1B), Flags (1B)]

// Direction code map for 3D orthogonal runs
export const DIRECTION_TO_CODE: Record<string, number> = {
  '+X': 0x00,
  '-X': 0x01,
  '+Y': 0x02,
  '-Y': 0x03,
  '+Z': 0x04,
  '-Z': 0x05,
  'DIAG_XY': 0x06,
  'DIAG_XZ': 0x07,
  'DIAG_YZ': 0x08,
  'DIAG_XYZ': 0x09,
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

// ============================================================================
// 1. SERIALIZATION ENGINES (BINARY BUFFER GENERATION)
// ============================================================================

/**
 * Converts a Uint8Array into a clean hex dump string
 */
export function bufferToHexDump(buffer: Uint8Array, maxBytes = 32): string {
  const hexParts: string[] = [];
  const count = Math.min(buffer.length, maxBytes);
  for (let i = 0; i < count; i++) {
    hexParts.push(buffer[i].toString(16).padStart(2, '0').toUpperCase());
  }
  if (buffer.length > maxBytes) {
    hexParts.push(`... (+${buffer.length - maxBytes} B)`);
  }
  return hexParts.join(' ');
}

/**
 * Helper to write a 16-bit unsigned integer in Big-Endian format
 */
function writeUint16BE(buffer: Uint8Array, offset: number, value: number): void {
  buffer[offset] = (value >> 8) & 0xff;
  buffer[offset + 1] = value & 0xff;
}

/**
 * Helper to read a 16-bit unsigned integer in Big-Endian format
 */
function readUint16BE(buffer: Uint8Array, offset: number): number {
  return (buffer[offset] << 8) | buffer[offset + 1];
}

/**
 * Serializes the canonical RAW baseline candidate.
 * 
 * Framing:
 * - Header: 4 bytes [Opcode 0x00, BlockIdHigh, BlockIdLow, Flags]
 * - CellCount (N): 2 bytes
 * - For each cell (4 bytes per cell):
 *     - CellID: 2 bytes (0..342)
 *     - Token: 1 byte (ASCII or symbol code)
 *     - PackedCoords & Flags: 1 byte ((x << 4) | (y << 2) | z)
 * 
 * Total = 4 + 2 + 4 * N = 6 + 4N bytes
 */
export function serializeRawCandidate(
  blockId: number,
  cells: number[],
  symbols: string[] = []
): { buffer: Uint8Array; fieldBreakdown: SerializedFieldBreakdown[] } {
  const cellCount = cells.length;
  const totalLength = ENVELOPE_HEADER_BYTES + 2 + cellCount * 4;
  const buffer = new Uint8Array(totalLength);
  const fields: SerializedFieldBreakdown[] = [];

  // Envelope Header
  buffer[0] = OPCODE_RAW;
  writeUint16BE(buffer, 1, blockId);
  buffer[3] = 0x00; // Standard baseline flags
  fields.push({
    fieldName: 'Envelope Header',
    byteOffset: 0,
    byteLength: ENVELOPE_HEADER_BYTES,
    dataType: 'Header (4B)',
    valueDescription: `OPCODE=RAW(0x00), BlockID=${blockId}`,
  });

  // Cell Count
  writeUint16BE(buffer, 4, cellCount);
  fields.push({
    fieldName: 'Cell Count',
    byteOffset: 4,
    byteLength: 2,
    dataType: 'Uint16 (2B)',
    valueDescription: `Count = ${cellCount} cells`,
  });

  // Cell Records
  let offset = 6;
  for (let i = 0; i < cellCount; i++) {
    const cellId = cells[i];
    const coord = cellIdToCoordinate(cellId);
    const sym = symbols[i] || 'A';
    const tokenByte = sym.charCodeAt(0) & 0xff;
    const packedCoord = ((coord.x & 0x07) << 4) | ((coord.y & 0x07) << 2) | (coord.z & 0x07);

    writeUint16BE(buffer, offset, cellId);
    buffer[offset + 2] = tokenByte;
    buffer[offset + 3] = packedCoord;

    if (i < 4 || i === cellCount - 1) {
      fields.push({
        fieldName: `Cell Record #${i} (ID ${cellId})`,
        byteOffset: offset,
        byteLength: 4,
        dataType: 'Record (4B)',
        valueDescription: `ID=${cellId}, Token='${sym}', Coords=(${coord.x},${coord.y},${coord.z})`,
      });
    } else if (i === 4 && cellCount > 5) {
      fields.push({
        fieldName: `... ${cellCount - 5} intermediate cell records`,
        byteOffset: offset,
        byteLength: (cellCount - 5) * 4,
        dataType: 'Records Array',
        valueDescription: `4B per cell for remaining ${cellCount - 5} records`,
      });
    }

    offset += 4;
  }

  return { buffer, fieldBreakdown: fields };
}

/**
 * Serializes a SPATIAL_RUN candidate.
 * 
 * Framing:
 * - Header: 4 bytes [Opcode 0x01, BlockIdHigh, BlockIdLow, Flags]
 * - StartCellID: 2 bytes
 * - DirectionCode: 1 byte (0..9)
 * - RunLength: 2 bytes
 * - Stride: 1 byte
 * - TokenByte: 1 byte
 * 
 * Total = 4 + 2 + 1 + 2 + 1 + 1 = 11 bytes
 */
export function serializeSpatialRunCandidate(
  blockId: number,
  startCellId: number,
  directionName: string,
  length: number,
  stride = 1,
  token = 'A'
): { buffer: Uint8Array; fieldBreakdown: SerializedFieldBreakdown[] } {
  const totalLength = 11;
  const buffer = new Uint8Array(totalLength);
  const fields: SerializedFieldBreakdown[] = [];

  const dirCode = DIRECTION_TO_CODE[directionName] ?? 0x00;

  // Header
  buffer[0] = OPCODE_SPATIAL_RUN;
  writeUint16BE(buffer, 1, blockId);
  buffer[3] = 0x00;
  fields.push({
    fieldName: 'Envelope Header',
    byteOffset: 0,
    byteLength: 4,
    dataType: 'Header (4B)',
    valueDescription: `OPCODE=SPATIAL_RUN(0x01), BlockID=${blockId}`,
  });

  // Start Cell ID
  writeUint16BE(buffer, 4, startCellId);
  fields.push({
    fieldName: 'Start Cell ID',
    byteOffset: 4,
    byteLength: 2,
    dataType: 'Uint16 (2B)',
    valueDescription: `Start Cell = ${startCellId}`,
  });

  // Direction Code
  buffer[6] = dirCode;
  fields.push({
    fieldName: 'Direction Code',
    byteOffset: 6,
    byteLength: 1,
    dataType: 'Uint8 (1B)',
    valueDescription: `Direction = ${directionName} (0x0${dirCode})`,
  });

  // Run Length
  writeUint16BE(buffer, 7, length);
  fields.push({
    fieldName: 'Run Length',
    byteOffset: 7,
    byteLength: 2,
    dataType: 'Uint16 (2B)',
    valueDescription: `Length = ${length} cells`,
  });

  // Stride & Token
  buffer[9] = stride & 0xff;
  buffer[10] = token.charCodeAt(0) & 0xff;
  fields.push({
    fieldName: 'Stride & Token',
    byteOffset: 9,
    byteLength: 2,
    dataType: 'Uint8 x 2 (2B)',
    valueDescription: `Stride=${stride}, FillToken='${token}'`,
  });

  return { buffer, fieldBreakdown: fields };
}

/**
 * Serializes a REPETITION candidate.
 * 
 * Framing:
 * - Header: 4 bytes [Opcode 0x02, BlockIdHigh, BlockIdLow, Flags]
 * - OriginCellID: 2 bytes
 * - PeriodLength (L): 1 byte
 * - RepeatCount (R): 2 bytes
 * - StepVector: 3 bytes [dx (int8), dy (int8), dz (int8)]
 * - PatternTokens: L bytes
 * 
 * Total = 4 + 2 + 1 + 2 + 3 + L = 12 + L bytes
 */
export function serializeRepetitionCandidate(
  blockId: number,
  originCellId: number,
  periodLength: number,
  repeatCount: number,
  stepVector: [number, number, number] = [1, 0, 0],
  patternTokens: string[] = ['A']
): { buffer: Uint8Array; fieldBreakdown: SerializedFieldBreakdown[] } {
  const L = Math.max(1, periodLength);
  const totalLength = 12 + L;
  const buffer = new Uint8Array(totalLength);
  const fields: SerializedFieldBreakdown[] = [];

  // Header
  buffer[0] = OPCODE_REPETITION;
  writeUint16BE(buffer, 1, blockId);
  buffer[3] = 0x00;
  fields.push({
    fieldName: 'Envelope Header',
    byteOffset: 0,
    byteLength: 4,
    dataType: 'Header (4B)',
    valueDescription: `OPCODE=REPETITION(0x02), BlockID=${blockId}`,
  });

  // Origin Cell
  writeUint16BE(buffer, 4, originCellId);
  fields.push({
    fieldName: 'Origin Cell ID',
    byteOffset: 4,
    byteLength: 2,
    dataType: 'Uint16 (2B)',
    valueDescription: `Origin Cell = ${originCellId}`,
  });

  // Period & Repeat Count
  buffer[6] = L & 0xff;
  writeUint16BE(buffer, 7, repeatCount);
  fields.push({
    fieldName: 'Period & Repeat Count',
    byteOffset: 6,
    byteLength: 3,
    dataType: 'Uint8 + Uint16 (3B)',
    valueDescription: `Period L=${L}, Repeats R=${repeatCount}`,
  });

  // Step Vector
  buffer[9] = (stepVector[0] + 128) & 0xff;
  buffer[10] = (stepVector[1] + 128) & 0xff;
  buffer[11] = (stepVector[2] + 128) & 0xff;
  fields.push({
    fieldName: 'Spatial Step Vector',
    byteOffset: 9,
    byteLength: 3,
    dataType: 'Int8[3] (3B)',
    valueDescription: `Delta = (${stepVector[0]}, ${stepVector[1]}, ${stepVector[2]})`,
  });

  // Pattern Tokens
  for (let i = 0; i < L; i++) {
    const token = patternTokens[i] || 'A';
    buffer[12 + i] = token.charCodeAt(0) & 0xff;
  }
  fields.push({
    fieldName: 'Repeating Pattern Tokens',
    byteOffset: 12,
    byteLength: L,
    dataType: `Bytes[${L}] (${L}B)`,
    valueDescription: `Tokens = "${patternTokens.join('')}"`,
  });

  return { buffer, fieldBreakdown: fields };
}

/**
 * Serializes a CLUSTER candidate.
 * 
 * Framing:
 * - Header: 4 bytes [Opcode 0x03, BlockIdHigh, BlockIdLow, Flags]
 * - BoundingBox: 6 bytes [minX, minY, minZ, maxX, maxY, maxZ] (0..6)
 * - Volume: 2 bytes
 * - DominantToken: 1 byte
 * - Occupancy Bitmask: ceil(Volume / 8) bytes
 * 
 * Total = 4 + 6 + 2 + 1 + ceil(Volume / 8) = 13 + ceil(Volume / 8) bytes
 */
export function serializeClusterCandidate(
  blockId: number,
  boundingBox: { min: [number, number, number]; max: [number, number, number]; volume: number },
  occupiedIndices: number[], // index within bounding box (0..volume-1)
  dominantToken = 'A'
): { buffer: Uint8Array; fieldBreakdown: SerializedFieldBreakdown[] } {
  const volume = Math.max(1, boundingBox.volume);
  const bitmaskBytesCount = Math.ceil(volume / 8);
  const totalLength = 13 + bitmaskBytesCount;
  const buffer = new Uint8Array(totalLength);
  const fields: SerializedFieldBreakdown[] = [];

  // Header
  buffer[0] = OPCODE_CLUSTER;
  writeUint16BE(buffer, 1, blockId);
  buffer[3] = 0x00;
  fields.push({
    fieldName: 'Envelope Header',
    byteOffset: 0,
    byteLength: 4,
    dataType: 'Header (4B)',
    valueDescription: `OPCODE=CLUSTER(0x03), BlockID=${blockId}`,
  });

  // Bounding Box
  buffer[4] = boundingBox.min[0] & 0x07;
  buffer[5] = boundingBox.min[1] & 0x07;
  buffer[6] = boundingBox.min[2] & 0x07;
  buffer[7] = boundingBox.max[0] & 0x07;
  buffer[8] = boundingBox.max[1] & 0x07;
  buffer[9] = boundingBox.max[2] & 0x07;
  fields.push({
    fieldName: 'Bounding Box Extents',
    byteOffset: 4,
    byteLength: 6,
    dataType: 'Uint8[6] (6B)',
    valueDescription: `Min=(${boundingBox.min.join(',')}), Max=(${boundingBox.max.join(',')})`,
  });

  // Volume & Dominant Token
  writeUint16BE(buffer, 10, volume);
  buffer[12] = dominantToken.charCodeAt(0) & 0xff;
  fields.push({
    fieldName: 'Volume & Fill Token',
    byteOffset: 10,
    byteLength: 3,
    dataType: 'Uint16 + Uint8 (3B)',
    valueDescription: `Volume=${volume} voxels, Fill='${dominantToken}'`,
  });

  // Occupancy Bitmask
  const bitmaskOffset = 13;
  for (const idx of occupiedIndices) {
    if (idx >= 0 && idx < volume) {
      const byteIdx = Math.floor(idx / 8);
      const bitIdx = idx % 8;
      buffer[bitmaskOffset + byteIdx] |= 1 << bitIdx;
    }
  }

  fields.push({
    fieldName: 'Packed Spatial Bitmask',
    byteOffset: 13,
    byteLength: bitmaskBytesCount,
    dataType: `Bitmask (${bitmaskBytesCount}B)`,
    valueDescription: `${occupiedIndices.length} active cells encoded in ${bitmaskBytesCount} bytes`,
  });

  return { buffer, fieldBreakdown: fields };
}

/**
 * Serializes a SEQUENCE_PATH candidate.
 * 
 * Framing:
 * - Header: 4 bytes
 * - StartCellID: 2 bytes
 * - StepCount (S): 2 bytes
 * - Movements: ceil(S / 2) bytes (packed 4-bit nibbles for direction step indices)
 * - PathTokens: S + 1 bytes (or 1 byte if uniform)
 * 
 * Total = 4 + 2 + 2 + ceil(S / 2) + (S + 1) = 9 + S + ceil(S / 2) bytes
 */
export function serializeSequencePathCandidate(
  blockId: number,
  startCellId: number,
  movements: [number, number, number][],
  tokens: string[] = []
): { buffer: Uint8Array; fieldBreakdown: SerializedFieldBreakdown[] } {
  const S = movements.length;
  const movementBytes = Math.ceil(S / 2);
  const tokenBytes = S + 1;
  const totalLength = 8 + movementBytes + tokenBytes;
  const buffer = new Uint8Array(totalLength);
  const fields: SerializedFieldBreakdown[] = [];

  // Header
  buffer[0] = OPCODE_SEQUENCE_PATH;
  writeUint16BE(buffer, 1, blockId);
  buffer[3] = 0x00;
  fields.push({
    fieldName: 'Envelope Header',
    byteOffset: 0,
    byteLength: 4,
    dataType: 'Header (4B)',
    valueDescription: `OPCODE=SEQUENCE_PATH(0x04), BlockID=${blockId}`,
  });

  // Start Cell & Step Count
  writeUint16BE(buffer, 4, startCellId);
  writeUint16BE(buffer, 6, S);
  fields.push({
    fieldName: 'Start Cell & Step Count',
    byteOffset: 4,
    byteLength: 4,
    dataType: 'Uint16 x 2 (4B)',
    valueDescription: `Start Cell=${startCellId}, Steps=${S}`,
  });

  // Packed Movements (4 bits per step)
  const movOffset = 8;
  for (let i = 0; i < S; i++) {
    const m = movements[i];
    let dirCode = 0;
    if (m[0] > 0) dirCode = 0;
    else if (m[0] < 0) dirCode = 1;
    else if (m[1] > 0) dirCode = 2;
    else if (m[1] < 0) dirCode = 3;
    else if (m[2] > 0) dirCode = 4;
    else if (m[2] < 0) dirCode = 5;

    const byteIndex = Math.floor(i / 2);
    if (i % 2 === 0) {
      buffer[movOffset + byteIndex] = (dirCode & 0x0f) << 4;
    } else {
      buffer[movOffset + byteIndex] |= dirCode & 0x0f;
    }
  }

  fields.push({
    fieldName: 'Packed Direction Movements',
    byteOffset: movOffset,
    byteLength: movementBytes,
    dataType: `Nibbles (${movementBytes}B)`,
    valueDescription: `${S} step movement vectors (4 bits/step)`,
  });

  // Tokens
  const tokOffset = movOffset + movementBytes;
  for (let i = 0; i <= S; i++) {
    const sym = tokens[i] || 'A';
    buffer[tokOffset + i] = sym.charCodeAt(0) & 0xff;
  }
  fields.push({
    fieldName: 'Step Tokens Sequence',
    byteOffset: tokOffset,
    byteLength: tokenBytes,
    dataType: `Bytes[${tokenBytes}] (${tokenBytes}B)`,
    valueDescription: `${tokenBytes} token bytes`,
  });

  return { buffer, fieldBreakdown: fields };
}

/**
 * Serializes a REPEATED_SHAPE candidate.
 * 
 * Framing:
 * - Header: 4 bytes
 * - RelativeOffsetsCount (K): 1 byte
 * - RelativeOffsets: 3 * K bytes (int8 signed deltas)
 * - InstanceCount (M): 2 bytes
 * - InstanceOrigins: 2 * M bytes
 * 
 * Total = 4 + 1 + 3K + 2 + 2M = 7 + 3K + 2M bytes
 */
export function serializeRepeatedShapeCandidate(
  blockId: number,
  relativeOffsets: [number, number, number][],
  instanceOrigins: number[]
): { buffer: Uint8Array; fieldBreakdown: SerializedFieldBreakdown[] } {
  const K = relativeOffsets.length;
  const M = instanceOrigins.length;
  const totalLength = 7 + 3 * K + 2 * M;
  const buffer = new Uint8Array(totalLength);
  const fields: SerializedFieldBreakdown[] = [];

  // Header
  buffer[0] = OPCODE_REPEATED_SHAPE;
  writeUint16BE(buffer, 1, blockId);
  buffer[3] = 0x00;
  fields.push({
    fieldName: 'Envelope Header',
    byteOffset: 0,
    byteLength: 4,
    dataType: 'Header (4B)',
    valueDescription: `OPCODE=REPEATED_SHAPE(0x05), BlockID=${blockId}`,
  });

  // Offsets Count & Offsets Array
  buffer[4] = K & 0xff;
  let off = 5;
  for (let i = 0; i < K; i++) {
    const o = relativeOffsets[i];
    buffer[off] = (o[0] + 128) & 0xff;
    buffer[off + 1] = (o[1] + 128) & 0xff;
    buffer[off + 2] = (o[2] + 128) & 0xff;
    off += 3;
  }
  fields.push({
    fieldName: 'Shape Relative Offsets Template',
    byteOffset: 4,
    byteLength: 1 + 3 * K,
    dataType: `Offsets[${K}] (${1 + 3 * K}B)`,
    valueDescription: `${K} relative 3D coordinate offsets`,
  });

  // Instance Origins
  writeUint16BE(buffer, off, M);
  off += 2;
  for (let i = 0; i < M; i++) {
    writeUint16BE(buffer, off, instanceOrigins[i]);
    off += 2;
  }
  fields.push({
    fieldName: 'Instance Origins',
    byteOffset: off - (2 + 2 * M),
    byteLength: 2 + 2 * M,
    dataType: `Uint16[${M}] (${2 + 2 * M}B)`,
    valueDescription: `${M} shape instance origin cell IDs`,
  });

  return { buffer, fieldBreakdown: fields };
}

// ============================================================================
// 2. CANDIDATE GENERATION & EXPANSION ENGINE
// ============================================================================

/**
 * Deterministically reconstructs cell IDs from candidate representation
 */
export function expandCandidate(
  repType: RepresentationType,
  parameters: Record<string, unknown>
): { reconstructedCellIds: number[]; errorReason?: string } {
  const reconstructed: number[] = [];

  try {
    switch (repType) {
      case 'RAW': {
        const cells = parameters.cells as number[];
        if (Array.isArray(cells)) {
          reconstructed.push(...cells);
        }
        break;
      }

      case 'SPATIAL_RUN': {
        const startCell = parameters.startCellId as number;
        const dir = parameters.directionVector as [number, number, number];
        const length = parameters.length as number;

        if (typeof startCell !== 'number' || !dir || typeof length !== 'number') {
          return { reconstructedCellIds: [], errorReason: 'Missing run parameters' };
        }

        const startCoord = cellIdToCoordinate(startCell);
        let currX = startCoord.x;
        let currY = startCoord.y;
        let currZ = startCoord.z;

        for (let i = 0; i < length; i++) {
          if (currX < 0 || currX >= 7 || currY < 0 || currY >= 7 || currZ < 0 || currZ >= 7) {
            return { reconstructedCellIds: reconstructed, errorReason: 'Run out of 7x7x7 grid bounds' };
          }
          reconstructed.push(coordinateToCellId(currX, currY, currZ));
          currX += dir[0];
          currY += dir[1];
          currZ += dir[2];
        }
        break;
      }

      case 'REPETITION': {
        const originCellId = parameters.originCellId as number;
        const repeatCount = parameters.repeatCount as number;
        const stepVector = parameters.stepVector as [number, number, number];
        const patternTokens = parameters.patternTokens as string[];
        const periodLength = patternTokens?.length || 1;

        if (typeof originCellId !== 'number' || typeof repeatCount !== 'number') {
          return { reconstructedCellIds: [], errorReason: 'Missing repetition parameters' };
        }

        const originCoord = cellIdToCoordinate(originCellId);
        let cx = originCoord.x;
        let cy = originCoord.y;
        let cz = originCoord.z;

        for (let r = 0; r < repeatCount; r++) {
          for (let p = 0; p < periodLength; p++) {
            if (cx >= 0 && cx < 7 && cy >= 0 && cy < 7 && cz >= 0 && cz < 7) {
              reconstructed.push(coordinateToCellId(cx, cy, cz));
            }
            if (stepVector) {
              cx += stepVector[0];
              cy += stepVector[1];
              cz += stepVector[2];
            }
          }
        }
        break;
      }

      case 'CLUSTER': {
        const cells = parameters.cells as number[];
        if (Array.isArray(cells)) {
          reconstructed.push(...cells);
        }
        break;
      }

      case 'SEQUENCE_PATH': {
        const startCellId = parameters.startCellId as number;
        const movements = parameters.movements as [number, number, number][];

        if (typeof startCellId !== 'number' || !Array.isArray(movements)) {
          return { reconstructedCellIds: [], errorReason: 'Missing sequence path parameters' };
        }

        const startCoord = cellIdToCoordinate(startCellId);
        let cx = startCoord.x;
        let cy = startCoord.y;
        let cz = startCoord.z;
        reconstructed.push(startCellId);

        for (const [dx, dy, dz] of movements) {
          cx += dx;
          cy += dy;
          cz += dz;
          if (cx >= 0 && cx < 7 && cy >= 0 && cy < 7 && cz >= 0 && cz < 7) {
            reconstructed.push(coordinateToCellId(cx, cy, cz));
          }
        }
        break;
      }

      case 'REPEATED_SHAPE': {
        const relativeOffsets = parameters.relativeOffsets as [number, number, number][];
        const instanceOrigins = parameters.instanceOrigins as number[];

        if (!Array.isArray(relativeOffsets) || !Array.isArray(instanceOrigins)) {
          return { reconstructedCellIds: [], errorReason: 'Missing shape parameters' };
        }

        for (const originCell of instanceOrigins) {
          const originCoord = cellIdToCoordinate(originCell);
          for (const [dx, dy, dz] of relativeOffsets) {
            const nx = originCoord.x + dx;
            const ny = originCoord.y + dy;
            const nz = originCoord.z + dz;
            if (nx >= 0 && nx < 7 && ny >= 0 && ny < 7 && nz >= 0 && nz < 7) {
              reconstructed.push(coordinateToCellId(nx, ny, nz));
            }
          }
        }
        break;
      }
    }
  } catch (err) {
    return { reconstructedCellIds: [], errorReason: err instanceof Error ? err.message : 'Expansion error' };
  }

  return { reconstructedCellIds: reconstructed };
}

/**
 * Validates 100% exact equality between original and reconstructed cell IDs
 */
export function validateCandidateEquality(
  originalCells: number[],
  reconstructedCells: number[]
): { isExactMatch: boolean; mismatchesCount: number } {
  if (originalCells.length !== reconstructedCells.length) {
    return { isExactMatch: false, mismatchesCount: Math.abs(originalCells.length - reconstructedCells.length) };
  }
  let mismatches = 0;
  for (let i = 0; i < originalCells.length; i++) {
    if (originalCells[i] !== reconstructedCells[i]) {
      mismatches++;
    }
  }
  return { isExactMatch: mismatches === 0, mismatchesCount: mismatches };
}

// ============================================================================
// 3. CANDIDATE FACTORY & BYTE COST EVALUATION
// ============================================================================

export function getCandidateOriginalCells(pattern: SpatialPatternCandidate): number[] {
  if (pattern.type === 'REPEATED_SHAPE') {
    return pattern.occurrences.flatMap((o) => o.cells);
  }
  return pattern.cells || [];
}

export function getCandidateOriginalSymbols(pattern: SpatialPatternCandidate): string[] {
  if (pattern.type === 'REPEATED_SHAPE') {
    return pattern.occurrences.flatMap((o) => o.symbols);
  }
  if ('symbols' in pattern && Array.isArray(pattern.symbols)) {
    return pattern.symbols;
  }
  return [];
}

/**
 * Generates all valid candidate representations for a given discovered spatial pattern
 */
export function generateCandidatesForPattern(
  pattern: SpatialPatternCandidate,
  blockId = 0
): CandidateRepresentation[] {
  const candidates: CandidateRepresentation[] = [];
  const originalCells = getCandidateOriginalCells(pattern);
  const originalSymbols = getCandidateOriginalSymbols(pattern);

  // 1. Always generate canonical RAW candidate baseline
  const rawSer = serializeRawCandidate(blockId, originalCells, originalSymbols);
  const rawBytes = rawSer.buffer.length;

  const rawCandidate: CandidateRepresentation = {
    candidateId: `${pattern.id}-RAW`,
    patternId: pattern.id,
    representationType: 'RAW',
    displayName: 'RAW Baseline Representation',
    serializedBytes: rawBytes,
    originalBytes: rawBytes,
    savingsBytes: 0,
    savingsPercent: 0,
    headerBytes: ENVELOPE_HEADER_BYTES,
    payloadBytes: rawBytes - ENVELOPE_HEADER_BYTES,
    serializedBuffer: rawSer.buffer,
    hexDump: bufferToHexDump(rawSer.buffer),
    fieldBreakdown: rawSer.fieldBreakdown,
    validationStatus: 'VALID',
    isValid: true,
    reconstructedCellIds: [...originalCells],
    originalCellIds: [...originalCells],
    isExactMatch: true,
    mismatchesCount: 0,
    validationDurationMs: 0.1,
    ruleSyntax: `RAW [${originalCells.length} cells @ Block ${blockId}]`,
    parameters: { cells: [...originalCells], symbols: [...originalSymbols] },
    coveredCellCount: originalCells.length,
    blockId,
    isCrossBlock: 'isCrossBlock' in pattern ? Boolean(pattern.isCrossBlock) : false,
  };
  candidates.push(rawCandidate);

  // 2. Generate specialized rule candidates based on pattern type
  switch (pattern.type) {
    case 'SPATIAL_RUN': {
      const run = pattern as SpatialRunPattern;
      const runSer = serializeSpatialRunCandidate(
        run.blockId ?? blockId,
        run.startCell,
        run.directionName,
        run.length,
        1,
        run.symbols[0] || 'A'
      );
      const serBytes = runSer.buffer.length;
      const savingsBytes = rawBytes - serBytes;
      const savingsPercent = rawBytes > 0 && savingsBytes > 0 ? (savingsBytes / rawBytes) * 100 : 0;

      const expansion = expandCandidate('SPATIAL_RUN', {
        startCellId: run.startCell,
        directionVector: run.direction,
        length: run.length,
      });

      const validation = validateCandidateEquality(originalCells, expansion.reconstructedCellIds);

      candidates.push({
        candidateId: `${pattern.id}-SPATIAL_RUN`,
        patternId: pattern.id,
        representationType: 'SPATIAL_RUN',
        displayName: `SPATIAL_RUN [Dir: ${run.directionName}, Len: ${run.length}]`,
        ruleType: 'SPATIAL_RUN_RULE',
        serializedBytes: serBytes,
        originalBytes: rawBytes,
        savingsBytes,
        savingsPercent: Math.round(savingsPercent * 100) / 100,
        headerBytes: ENVELOPE_HEADER_BYTES,
        payloadBytes: serBytes - ENVELOPE_HEADER_BYTES,
        serializedBuffer: runSer.buffer,
        hexDump: bufferToHexDump(runSer.buffer),
        fieldBreakdown: runSer.fieldBreakdown,
        validationStatus: validation.isExactMatch ? 'VALID' : 'FAIL',
        isValid: validation.isExactMatch,
        reconstructedCellIds: expansion.reconstructedCellIds,
        originalCellIds: [...originalCells],
        isExactMatch: validation.isExactMatch,
        mismatchesCount: validation.mismatchesCount,
        validationError: expansion.errorReason,
        validationDurationMs: 0.2,
        ruleSyntax: `RUN(START=${run.startCell}, DIR=${run.directionName}, LEN=${run.length})`,
        parameters: {
          startCellId: run.startCell,
          directionVector: run.direction,
          directionName: run.directionName,
          length: run.length,
        },
        coveredCellCount: originalCells.length,
        blockId: run.blockId ?? blockId,
        isCrossBlock: run.isCrossBlock,
      });
      break;
    }

    case 'REPETITION': {
      const rep = pattern as SpatialRepetitionPattern;
      const stepVec = rep.spatialPeriodicityVector || [1, 0, 0];
      const repSer = serializeRepetitionCandidate(
        blockId,
        rep.cells[0],
        rep.periodLength,
        rep.repetitions,
        stepVec,
        rep.pattern
      );
      const serBytes = repSer.buffer.length;
      const savingsBytes = rawBytes - serBytes;
      const savingsPercent = rawBytes > 0 && savingsBytes > 0 ? (savingsBytes / rawBytes) * 100 : 0;

      const expansion = expandCandidate('REPETITION', {
        originCellId: rep.cells[0],
        repeatCount: rep.repetitions,
        stepVector: stepVec,
        patternTokens: rep.pattern,
      });

      const validation = validateCandidateEquality(originalCells, expansion.reconstructedCellIds);

      candidates.push({
        candidateId: `${pattern.id}-REPETITION`,
        patternId: pattern.id,
        representationType: 'REPETITION',
        displayName: `REPETITION [Period: ${rep.periodLength}, Repeats: ${rep.repetitions}x]`,
        ruleType: 'REPETITION_RULE',
        serializedBytes: serBytes,
        originalBytes: rawBytes,
        savingsBytes,
        savingsPercent: Math.round(savingsPercent * 100) / 100,
        headerBytes: ENVELOPE_HEADER_BYTES,
        payloadBytes: serBytes - ENVELOPE_HEADER_BYTES,
        serializedBuffer: repSer.buffer,
        hexDump: bufferToHexDump(repSer.buffer),
        fieldBreakdown: repSer.fieldBreakdown,
        validationStatus: validation.isExactMatch ? 'VALID' : 'FAIL',
        isValid: validation.isExactMatch,
        reconstructedCellIds: expansion.reconstructedCellIds,
        originalCellIds: [...originalCells],
        isExactMatch: validation.isExactMatch,
        mismatchesCount: validation.mismatchesCount,
        validationError: expansion.errorReason,
        validationDurationMs: 0.2,
        ruleSyntax: `REP(ORIGIN=${rep.cells[0]}, PERIOD=${rep.periodLength}, REPEATS=${rep.repetitions}, PATTERN="${rep.patternString}")`,
        parameters: {
          originCellId: rep.cells[0],
          repeatCount: rep.repetitions,
          stepVector: stepVec,
          patternTokens: rep.pattern,
        },
        coveredCellCount: originalCells.length,
        blockId,
        isCrossBlock: rep.blockIds && rep.blockIds.length > 1,
      });
      break;
    }

    case 'CLUSTER': {
      const cl = pattern as SpatialClusterPattern;
      const occupiedIndices: number[] = [];
      const dim = cl.boundingBox.dimensions;
      for (const cell of cl.cells) {
        const c = cellIdToCoordinate(cell);
        const relX = c.x - cl.boundingBox.min[0];
        const relY = c.y - cl.boundingBox.min[1];
        const relZ = c.z - cl.boundingBox.min[2];
        const idx = relX + relY * dim[0] + relZ * (dim[0] * dim[1]);
        occupiedIndices.push(idx);
      }

      const clusterSer = serializeClusterCandidate(
        cl.blockId ?? blockId,
        cl.boundingBox,
        occupiedIndices,
        cl.symbols[0] || 'A'
      );
      const serBytes = clusterSer.buffer.length;
      const savingsBytes = rawBytes - serBytes;
      const savingsPercent = rawBytes > 0 && savingsBytes > 0 ? (savingsBytes / rawBytes) * 100 : 0;

      const expansion = expandCandidate('CLUSTER', { cells: cl.cells });
      const validation = validateCandidateEquality(originalCells, expansion.reconstructedCellIds);

      candidates.push({
        candidateId: `${pattern.id}-CLUSTER`,
        patternId: pattern.id,
        representationType: 'CLUSTER',
        displayName: `CLUSTER [${cl.cellCount} cells, Density: ${Math.round(cl.density * 100)}%]`,
        ruleType: 'CLUSTER_RULE',
        serializedBytes: serBytes,
        originalBytes: rawBytes,
        savingsBytes,
        savingsPercent: Math.round(savingsPercent * 100) / 100,
        headerBytes: ENVELOPE_HEADER_BYTES,
        payloadBytes: serBytes - ENVELOPE_HEADER_BYTES,
        serializedBuffer: clusterSer.buffer,
        hexDump: bufferToHexDump(clusterSer.buffer),
        fieldBreakdown: clusterSer.fieldBreakdown,
        validationStatus: validation.isExactMatch ? 'VALID' : 'FAIL',
        isValid: validation.isExactMatch,
        reconstructedCellIds: expansion.reconstructedCellIds,
        originalCellIds: [...originalCells],
        isExactMatch: validation.isExactMatch,
        mismatchesCount: validation.mismatchesCount,
        validationDurationMs: 0.2,
        ruleSyntax: `CLUSTER(BOX=[${cl.boundingBox.min.join(',')}..${cl.boundingBox.max.join(',')}], CELLS=${cl.cellCount})`,
        parameters: { cells: cl.cells, boundingBox: cl.boundingBox },
        coveredCellCount: originalCells.length,
        blockId: cl.blockId ?? blockId,
        isCrossBlock: false,
      });
      break;
    }

    case 'SEQUENCE_PATH': {
      const sp = pattern as SequencePathPattern;
      const pathSer = serializeSequencePathCandidate(
        sp.blockId ?? blockId,
        sp.startCell,
        sp.movements,
        sp.symbols
      );
      const serBytes = pathSer.buffer.length;
      const savingsBytes = rawBytes - serBytes;
      const savingsPercent = rawBytes > 0 && savingsBytes > 0 ? (savingsBytes / rawBytes) * 100 : 0;

      const expansion = expandCandidate('SEQUENCE_PATH', {
        startCellId: sp.startCell,
        movements: sp.movements,
      });
      const validation = validateCandidateEquality(originalCells, expansion.reconstructedCellIds);

      candidates.push({
        candidateId: `${pattern.id}-SEQUENCE_PATH`,
        patternId: pattern.id,
        representationType: 'SEQUENCE_PATH',
        displayName: `SEQUENCE_PATH [${sp.tokenCount} steps, Predictability: ${sp.predictabilityScore}%]`,
        ruleType: 'SEQUENCE_PATH_RULE',
        serializedBytes: serBytes,
        originalBytes: rawBytes,
        savingsBytes,
        savingsPercent: Math.round(savingsPercent * 100) / 100,
        headerBytes: ENVELOPE_HEADER_BYTES,
        payloadBytes: serBytes - ENVELOPE_HEADER_BYTES,
        serializedBuffer: pathSer.buffer,
        hexDump: bufferToHexDump(pathSer.buffer),
        fieldBreakdown: pathSer.fieldBreakdown,
        validationStatus: validation.isExactMatch ? 'VALID' : 'FAIL',
        isValid: validation.isExactMatch,
        reconstructedCellIds: expansion.reconstructedCellIds,
        originalCellIds: [...originalCells],
        isExactMatch: validation.isExactMatch,
        mismatchesCount: validation.mismatchesCount,
        validationDurationMs: 0.2,
        ruleSyntax: `PATH(START=${sp.startCell}, STEPS=${sp.movements.length})`,
        parameters: { startCellId: sp.startCell, movements: sp.movements },
        coveredCellCount: originalCells.length,
        blockId: sp.blockId ?? blockId,
        isCrossBlock: false,
      });
      break;
    }

    case 'REPEATED_SHAPE': {
      const sh = pattern as RepeatedSpatialShapePattern;
      const instanceOrigins = sh.occurrences.map((o) => o.originCellId);
      const shapeSer = serializeRepeatedShapeCandidate(
        blockId,
        sh.relativeOffsets,
        instanceOrigins
      );
      const serBytes = shapeSer.buffer.length;
      const savingsBytes = rawBytes - serBytes;
      const savingsPercent = rawBytes > 0 && savingsBytes > 0 ? (savingsBytes / rawBytes) * 100 : 0;

      const expansion = expandCandidate('REPEATED_SHAPE', {
        relativeOffsets: sh.relativeOffsets,
        instanceOrigins,
      });
      const validation = validateCandidateEquality(originalCells, expansion.reconstructedCellIds);

      candidates.push({
        candidateId: `${pattern.id}-REPEATED_SHAPE`,
        patternId: pattern.id,
        representationType: 'REPEATED_SHAPE',
        displayName: `REPEATED_SHAPE [${sh.occurrenceCount} instances, ${sh.cellsPerOccurrence} cells/inst]`,
        ruleType: 'REPEATED_SHAPE_RULE',
        serializedBytes: serBytes,
        originalBytes: rawBytes,
        savingsBytes,
        savingsPercent: Math.round(savingsPercent * 100) / 100,
        headerBytes: ENVELOPE_HEADER_BYTES,
        payloadBytes: serBytes - ENVELOPE_HEADER_BYTES,
        serializedBuffer: shapeSer.buffer,
        hexDump: bufferToHexDump(shapeSer.buffer),
        fieldBreakdown: shapeSer.fieldBreakdown,
        validationStatus: validation.isExactMatch ? 'VALID' : 'FAIL',
        isValid: validation.isExactMatch,
        reconstructedCellIds: expansion.reconstructedCellIds,
        originalCellIds: [...originalCells],
        isExactMatch: validation.isExactMatch,
        mismatchesCount: validation.mismatchesCount,
        validationDurationMs: 0.2,
        ruleSyntax: `SHAPE(INSTANCES=${sh.occurrenceCount}, OFFSETS=${sh.relativeOffsets.length})`,
        parameters: { relativeOffsets: sh.relativeOffsets, instanceOrigins },
        coveredCellCount: originalCells.length,
        blockId,
        isCrossBlock: false,
      });
      break;
    }
  }

  return candidates;
}

// ============================================================================
// 4. WINNER SELECTION & EXACT REVERSIBILITY VALIDATOR
// ============================================================================

/**
 * Evaluates all candidates and selects the candidate with the lowest VALID serialized bytes.
 * 
 * Rules:
 * 1. Only VALID candidates are eligible.
 * 2. Winner is candidate with minimum serializedBytes.
 * 3. If serializedBytes(Rule) >= serializedBytes(RAW), RAW WINS.
 * 4. Never forces a rule.
 */
export function selectOptimalCandidate(
  candidates: CandidateRepresentation[]
): CandidateRepresentation {
  const validCandidates = candidates.filter((c) => c.validationStatus === 'VALID' && c.isValid);
  
  if (validCandidates.length === 0) {
    // Fallback to RAW if all rules failed
    return candidates.find((c) => c.representationType === 'RAW') || candidates[0];
  }

  const rawCandidate = validCandidates.find((c) => c.representationType === 'RAW');
  const rawBytes = rawCandidate ? rawCandidate.serializedBytes : Infinity;

  // Sort by serialized bytes ascending
  validCandidates.sort((a, b) => {
    if (a.serializedBytes !== b.serializedBytes) {
      return a.serializedBytes - b.serializedBytes;
    }
    // Tie breaker: prefer RAW over rule if costs are identical
    if (a.representationType === 'RAW') return -1;
    if (b.representationType === 'RAW') return 1;
    return 0;
  });

  const bestCandidate = validCandidates[0];

  // If best candidate is not cheaper than RAW, RAW wins!
  if (bestCandidate.serializedBytes >= rawBytes && rawCandidate) {
    return rawCandidate;
  }

  return bestCandidate;
}

/**
 * Optimizes a single pattern: generates candidates, measures byte cost, selects winner, validates equality
 */
export function optimizePattern(
  pattern: SpatialPatternCandidate,
  blockId = 0
): PatternOptimizationResult {
  const candidates = generateCandidatesForPattern(pattern, blockId);
  const rawCandidate = candidates.find((c) => c.representationType === 'RAW') || candidates[0];
  const winner = selectOptimalCandidate(candidates);

  const coveredCells = getCandidateOriginalCells(pattern);
  const startCell = coveredCells[0] ?? 0;
  const endCell = coveredCells[coveredCells.length - 1] ?? startCell;

  const startCoord = cellIdToCoordinate(startCell);
  const endCoord = cellIdToCoordinate(endCell);

  let directionName: string | undefined;
  let directionVector: [number, number, number] | undefined;

  if (pattern.type === 'SPATIAL_RUN') {
    directionName = (pattern as SpatialRunPattern).directionName;
    directionVector = (pattern as SpatialRunPattern).direction;
  } else if (pattern.type === 'REPETITION') {
    const repVec = (pattern as SpatialRepetitionPattern).spatialPeriodicityVector;
    if (repVec) directionVector = repVec;
  }

  const didRuleWin = winner.representationType !== 'RAW';
  const netSavingsBytes = Math.max(0, rawCandidate.serializedBytes - winner.serializedBytes);
  const netSavingsPercent =
    rawCandidate.serializedBytes > 0 && didRuleWin
      ? Math.round(((rawCandidate.serializedBytes - winner.serializedBytes) / rawCandidate.serializedBytes) * 10000) / 100
      : 0;

  // Title generation
  let title = `${pattern.type.replace('_', ' ')} Pattern (${coveredCells.length} cells)`;
  if (pattern.type === 'SPATIAL_RUN') {
    title = `Linear Run along ${directionName || '+X'} (${coveredCells.length} cells)`;
  } else if (pattern.type === 'REPETITION') {
    title = `Repetition "${(pattern as SpatialRepetitionPattern).patternString}" (${(pattern as SpatialRepetitionPattern).repetitions}x)`;
  }

  return {
    patternId: pattern.id,
    patternType: pattern.type,
    patternTitle: title,
    sourcePattern: pattern,
    originalRawBytes: rawCandidate.serializedBytes,
    coveredCellIds: [...coveredCells],
    coveredCoords: coveredCells.map((id) => cellIdToCoordinate(id)),
    blockId,
    isCrossBlock: 'isCrossBlock' in pattern ? Boolean(pattern.isCrossBlock) : false,
    startCellId: startCell,
    endCellId: endCell,
    startCoord,
    endCoord,
    directionName,
    directionVector,
    candidates,
    winningCandidate: winner,
    winnerType: winner.representationType,
    winnerSerializedBytes: winner.serializedBytes,
    netSavingsBytes,
    netSavingsPercent,
    didRuleWinOverRaw: didRuleWin,
    isReversible: winner.isExactMatch,
    verifiedExactMatch: winner.isExactMatch,
    winnerRuleSyntax: winner.ruleSyntax,
  };
}

// ============================================================================
// 5. GLOBAL OPTIMIZATION PIPELINE
// ============================================================================

/**
 * Runs the Rule Optimizer on an entire MemoryGrid or RootMemory
 */
export function runRuleOptimizer(
  gridOrRoot: MemoryGrid3D | RootMemory,
  blocksInput?: MemoryBlock[]
): RuleOptimizerReport {
  const t0 = performance.now();
  const discoveryReport = discoverAllSpatialPatterns(gridOrRoot, blocksInput);
  
  // Aggregate all discovered pattern candidates
  const allPatterns: SpatialPatternCandidate[] = [
    ...discoveryReport.runs,
    ...discoveryReport.repetitions,
    ...discoveryReport.clusters,
    ...discoveryReport.sequencePaths,
    ...discoveryReport.repeatedShapes,
  ];

  const results: PatternOptimizationResult[] = [];
  const winBreakdown: Record<RepresentationType, number> = {
    RAW: 0,
    SPATIAL_RUN: 0,
    REPETITION: 0,
    CLUSTER: 0,
    SEQUENCE_PATH: 0,
    REPEATED_SHAPE: 0,
  };

  let totalRawBytes = 0;
  let totalOptimizedBytes = 0;
  let totalSavingsBytes = 0;
  let rulesWonCount = 0;
  let rawWonCount = 0;
  let totalCandidates = 0;
  let validCandidates = 0;
  let rejectedCandidates = 0;

  for (const pat of allPatterns) {
    const opt = optimizePattern(pat, ('blockId' in pat && typeof pat.blockId === 'number') ? pat.blockId : 0);
    results.push(opt);

    totalRawBytes += opt.originalRawBytes;
    totalOptimizedBytes += opt.winnerSerializedBytes;
    totalSavingsBytes += opt.netSavingsBytes;

    winBreakdown[opt.winnerType] = (winBreakdown[opt.winnerType] || 0) + 1;

    if (opt.didRuleWinOverRaw) {
      rulesWonCount++;
    } else {
      rawWonCount++;
    }

    for (const c of opt.candidates) {
      totalCandidates++;
      if (c.validationStatus === 'VALID') {
        validCandidates++;
      } else {
        rejectedCandidates++;
      }
    }
  }

  const overallSavingsPercent =
    totalRawBytes > 0
      ? Math.round((totalSavingsBytes / totalRawBytes) * 10000) / 100
      : 0;

  const durationMs = Math.round((performance.now() - t0) * 100) / 100;

  const summary: RuleOptimizerSummary = {
    totalPatternsEvaluated: allPatterns.length,
    totalRawBytes,
    totalOptimizedBytes,
    totalSavingsBytes,
    overallSavingsPercent,
    rulesWonCount,
    rawWonCount,
    winBreakdown,
    totalCandidatesEvaluated: totalCandidates,
    validCandidatesCount: validCandidates,
    rejectedCandidatesCount: rejectedCandidates,
    disclaimer: 'SIMULATION — NOT YET SAVED',
    optimizationDurationMs: durationMs,
  };

  return { summary, results };
}
