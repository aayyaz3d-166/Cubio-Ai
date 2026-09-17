/**
 * 3D Memory Studio - Funnel 12: Independent Hierarchical Decoder Core Engine
 * 
 * Strict Architectural Invariants:
 * 1. Independent & Self-Contained: NEVER reads original memory arrays,
 *    pattern caches, Funnel 10/11 optimizer state, or encoder runtime objects.
 * 2. Operates ONLY on the compact3d-v4 Uint8Array binary buffer and format spec.
 * 3. Exact Mathematical Reconstruction: Expands composite references ->
 *    composite definitions -> dictionary entries -> translated 3D coordinates.
 * 4. Coverage Validation: Rejects duplicate, missing, or unexpected cells.
 * 5. Checksum Validation: Fails deterministically on corrupted or truncated buffers.
 * 6. Sequence Preservation: Reconstructs exact logical sequence steps and cell state.
 */

import { Coordinate3D } from '../../types/memory';
import {
  COMPACT3D_V4_MAGIC,
  COMPACT3D_V4_FORMAT_VERSION,
  COMPACT3D_V4_MAX_HIERARCHY_DEPTH,
  HEADER_BYTE_LENGTH,
  CHECKSUM_BYTE_LENGTH,
  OPCODE_RAW_CELL,
  OPCODE_COMPOSITE_REF,
  TRANSFORM_TRANSLATION,
  Compact3DV4Header,
} from '../types/artifact';
import {
  DecodedBlock,
  DecodedCell,
  DecodedMemory,
  DecodeResult,
} from '../types/decoder';
import {
  F12CompositeChildDef,
  F12CompositeDefinition,
  F12CompositeReference,
  F12DictionaryEntry,
  F12PrimitiveRecord,
  F12RawCellRecord,
  RelOffset3D,
} from '../types/records';
import { CoverageReport } from '../types/validation';
import { calculateCRC32, formatChecksumHex } from './checksum';

// ============================================================================
// COORDINATE HELPER FUNCTIONS (INDEPENDENT)
// ============================================================================

const DIMENSION = 7;
const TOTAL_SPATIAL_CELLS = 343;

function coordToCellId(x: number, y: number, z: number): number {
  return x + y * DIMENSION + z * DIMENSION * DIMENSION;
}

function cellIdToCoord(cellId: number): Coordinate3D {
  return {
    x: cellId % DIMENSION,
    y: Math.floor(cellId / DIMENSION) % DIMENSION,
    z: Math.floor(cellId / (DIMENSION * DIMENSION)),
  };
}

function isCoordInBounds(x: number, y: number, z: number): boolean {
  return (
    Number.isInteger(x) && x >= 0 && x < DIMENSION &&
    Number.isInteger(y) && y >= 0 && y < DIMENSION &&
    Number.isInteger(z) && z >= 0 && z < DIMENSION
  );
}

// ============================================================================
// INDEPENDENT DECODER ENGINE
// ============================================================================

export function decodeCompact3DV4(buffer: Uint8Array): DecodeResult {
  const startTime = performance.now();
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Minimum buffer length check (Header + Checksum = 36 Bytes)
  if (!buffer || buffer.length < HEADER_BYTE_LENGTH + CHECKSUM_BYTE_LENGTH) {
    return {
      success: false,
      decodedMemory: null,
      checksumValid: false,
      calculatedChecksumHex: '0x00000000',
      expectedChecksumHex: '0x00000000',
      coverageReport: {
        isValid: false,
        expectedTotalCells: 0,
        coveredCellsCount: 0,
        missingCellsCount: 0,
        duplicateCellsCount: 0,
        unexpectedCellsCount: 0,
        duplicateCellDetails: [],
        missingCellDetails: [],
        issues: ['BUFFER_UNDERFLOW: Buffer length smaller than minimum header + checksum (36 B)'],
      },
      errors: ['BUFFER_UNDERFLOW: Buffer smaller than 36 bytes'],
      warnings: [],
      decodeTimeMs: performance.now() - startTime,
      counts: {
        blocks: 0,
        dictEntries: 0,
        compositeDefs: 0,
        compositeRefs: 0,
        primitiveRecords: 0,
        rawCells: 0,
        totalReconstructedCells: 0,
      },
    };
  }

  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);

  // 2. Validate Magic 'C3D4'
  if (
    buffer[0] !== COMPACT3D_V4_MAGIC[0] ||
    buffer[1] !== COMPACT3D_V4_MAGIC[1] ||
    buffer[2] !== COMPACT3D_V4_MAGIC[2] ||
    buffer[3] !== COMPACT3D_V4_MAGIC[3]
  ) {
    errors.push('INVALID_MAGIC: File does not start with magic bytes C3D4');
  }

  // 3. Validate Header Checksum (CRC32 of bytes 0..27)
  const expectedHeaderCrc = view.getUint32(28, false);
  const calculatedHeaderCrc = calculateCRC32(buffer, 0, 28);
  if (calculatedHeaderCrc !== expectedHeaderCrc) {
    errors.push(`CHECKSUM_MISMATCH: Header CRC32 mismatch (${formatChecksumHex(calculatedHeaderCrc)} vs ${formatChecksumHex(expectedHeaderCrc)})`);
  }

  // 4. Validate Whole File Checksum (CRC32 of bytes 0..(length - 4))
  const expectedFileCrc = view.getUint32(buffer.length - CHECKSUM_BYTE_LENGTH, false);
  const calculatedFileCrc = calculateCRC32(buffer, 0, buffer.length - CHECKSUM_BYTE_LENGTH);
  const checksumValid = calculatedFileCrc === expectedFileCrc;
  if (!checksumValid) {
    errors.push(`CHECKSUM_MISMATCH: Payload CRC32 mismatch (Calculated: ${formatChecksumHex(calculatedFileCrc)}, Expected: ${formatChecksumHex(expectedFileCrc)})`);
  }

  // 5. Parse Header Fields
  const formatVersion = buffer[4];
  const hierarchyMaxDepth = buffer[5];
  const flags = view.getUint16(6, false);
  const blockCount = view.getUint16(8, false);
  const dictEntryCount = view.getUint16(10, false);
  const compositeDefCount = view.getUint16(12, false);
  const compositeRefCount = view.getUint16(14, false);
  const primitiveCount = view.getUint16(16, false);
  const rawCellCount = view.getUint16(18, false);
  const totalActiveCells = view.getUint16(20, false);
  const totalSequenceSteps = view.getUint16(22, false);
  const bodyByteLength = view.getUint32(24, false);

  if (formatVersion !== COMPACT3D_V4_FORMAT_VERSION) {
    errors.push(`UNSUPPORTED_VERSION: Expected format version 4, found ${formatVersion}`);
  }

  if (hierarchyMaxDepth > COMPACT3D_V4_MAX_HIERARCHY_DEPTH) {
    errors.push(`EXCEEDS_MAX_DEPTH: Hierarchy max depth ${hierarchyMaxDepth} exceeds ceiling 3`);
  }

  if (HEADER_BYTE_LENGTH + bodyByteLength + CHECKSUM_BYTE_LENGTH !== buffer.length) {
    errors.push(`BUFFER_UNDERFLOW: Expected total length ${HEADER_BYTE_LENGTH + bodyByteLength + CHECKSUM_BYTE_LENGTH}, buffer length is ${buffer.length}`);
  }

  // If fatal header errors exist, abort safely
  if (errors.length > 0) {
    return {
      success: false,
      decodedMemory: null,
      checksumValid,
      calculatedChecksumHex: formatChecksumHex(calculatedFileCrc),
      expectedChecksumHex: formatChecksumHex(expectedFileCrc),
      coverageReport: {
        isValid: false,
        expectedTotalCells: totalActiveCells,
        coveredCellsCount: 0,
        missingCellsCount: totalActiveCells,
        duplicateCellsCount: 0,
        unexpectedCellsCount: 0,
        duplicateCellDetails: [],
        missingCellDetails: [],
        issues: errors,
      },
      errors,
      warnings,
      decodeTimeMs: performance.now() - startTime,
      counts: {
        blocks: blockCount,
        dictEntries: dictEntryCount,
        compositeDefs: compositeDefCount,
        compositeRefs: compositeRefCount,
        primitiveRecords: primitiveCount,
        rawCells: rawCellCount,
        totalReconstructedCells: 0,
      },
    };
  }

  let offset = HEADER_BYTE_LENGTH;

  // 6. Parse Dictionary Table (Level 2)
  const dictMap = new Map<number, F12DictionaryEntry>();
  for (let i = 0; i < dictEntryCount; i++) {
    if (offset + 6 > buffer.length - CHECKSUM_BYTE_LENGTH) {
      errors.push(`BUFFER_UNDERFLOW: Unexpected EOF while parsing dictionary entry ${i}`);
      break;
    }
    const dictId = view.getUint16(offset, false);
    offset += 2;

    const ruleType = buffer[offset++];
    const paramCount = buffer[offset++];
    const symbolLength = buffer[offset++];
    const dictFlags = buffer[offset++];

    const offsets: RelOffset3D[] = [];
    for (let p = 0; p < paramCount; p++) {
      if (offset + 3 > buffer.length - CHECKSUM_BYTE_LENGTH) {
        errors.push(`BUFFER_UNDERFLOW: Unexpected EOF while parsing offsets for dict ${dictId}`);
        break;
      }
      const dx = view.getInt8(offset++);
      const dy = view.getInt8(offset++);
      const dz = view.getInt8(offset++);
      offsets.push({ dx, dy, dz });
    }

    let symbol = '';
    for (let s = 0; s < symbolLength; s++) {
      if (offset >= buffer.length - CHECKSUM_BYTE_LENGTH) {
        errors.push(`BUFFER_UNDERFLOW: Unexpected EOF while parsing symbol for dict ${dictId}`);
        break;
      }
      symbol += String.fromCharCode(buffer[offset++]);
    }

    dictMap.set(dictId, {
      dictId,
      ruleType,
      relativeOffsets: offsets,
      symbol,
      flags: dictFlags,
    });
  }

  // 7. Parse Composite Definitions (Level 3)
  const compDefMap = new Map<number, F12CompositeDefinition>();
  for (let i = 0; i < compositeDefCount; i++) {
    if (offset + 6 > buffer.length - CHECKSUM_BYTE_LENGTH) {
      errors.push(`BUFFER_UNDERFLOW: Unexpected EOF while parsing composite definition ${i}`);
      break;
    }
    const compositeId = view.getUint16(offset, false);
    offset += 2;

    const childCount = view.getUint16(offset, false);
    offset += 2;

    const transformType = buffer[offset++];
    const compFlags = buffer[offset++];

    if (transformType !== TRANSFORM_TRANSLATION) {
      errors.push(`UNSUPPORTED_TRANSFORM: Composite ${compositeId} uses unsupported transform code ${transformType}`);
    }

    const children: F12CompositeChildDef[] = [];
    for (let c = 0; c < childCount; c++) {
      if (offset + 8 > buffer.length - CHECKSUM_BYTE_LENGTH) {
        errors.push(`BUFFER_UNDERFLOW: Unexpected EOF while parsing child ${c} of composite ${compositeId}`);
        break;
      }
      const childDictId = view.getUint16(offset, false);
      offset += 2;

      const dx = view.getInt8(offset++);
      const dy = view.getInt8(offset++);
      const dz = view.getInt8(offset++);

      const order = view.getUint16(offset, false);
      offset += 2;

      const childTransform = buffer[offset++];
      if (childTransform !== TRANSFORM_TRANSLATION) {
        errors.push(`UNSUPPORTED_TRANSFORM: Child ${c} of composite ${compositeId} uses transform ${childTransform}`);
      }

      children.push({
        childDictId,
        offset: { dx, dy, dz },
        order,
        transform: childTransform,
      });
    }

    compDefMap.set(compositeId, {
      compositeId,
      childCount,
      transformType,
      flags: compFlags,
      children,
    });
  }

  // 8. Reconstruct Cells Storage
  const reconstructedCells: DecodedCell[] = [];
  const claimedCells = new Map<string, { blockId: number; cellId: number; count: number }>();

  function recordCell(cell: DecodedCell): void {
    reconstructedCells.push(cell);
    const key = `${cell.blockId}:${cell.cellId}`;
    const existing = claimedCells.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      claimedCells.set(key, { blockId: cell.blockId, cellId: cell.cellId, count: 1 });
    }
  }

  // 9. Parse and Expand Composite References (Level 3)
  for (let i = 0; i < compositeRefCount; i++) {
    if (offset + 12 > buffer.length - CHECKSUM_BYTE_LENGTH) {
      errors.push(`BUFFER_UNDERFLOW: Unexpected EOF while parsing composite reference ${i}`);
      break;
    }
    const opcode = buffer[offset++];
    if (opcode !== OPCODE_COMPOSITE_REF) {
      errors.push(`MALFORMED_RECORD: Expected opcode 0x0C for composite reference ${i}, found 0x${opcode.toString(16)}`);
    }

    const blockId = view.getUint16(offset, false);
    offset += 2;

    const compositeId = view.getUint16(offset, false);
    offset += 2;

    const originCellId = view.getUint16(offset, false);
    offset += 2;

    const coveredCount = view.getUint16(offset, false);
    offset += 2;

    const startSeqIndex = view.getUint16(offset, false);
    offset += 2;

    const refFlags = buffer[offset++];

    const compDef = compDefMap.get(compositeId);
    if (!compDef) {
      errors.push(`MISSING_COMPOSITE_DEF: Composite reference references non-existent compositeId ${compositeId}`);
      continue;
    }

    const compOriginCoord = cellIdToCoord(originCellId);
    let currentSeq = startSeqIndex;

    // Sort children by declared logical order
    const sortedChildren = [...compDef.children].sort((a, b) => a.order - b.order);

    for (const child of sortedChildren) {
      const dictEntry = dictMap.get(child.childDictId);
      if (!dictEntry) {
        errors.push(`MISSING_DICT_ENTRY: Composite ${compositeId} child references missing dictId ${child.childDictId}`);
        continue;
      }

      // Compute child spatial anchor via Translation
      const childAnchorX = compOriginCoord.x + child.offset.dx;
      const childAnchorY = compOriginCoord.y + child.offset.dy;
      const childAnchorZ = compOriginCoord.z + child.offset.dz;

      if (!isCoordInBounds(childAnchorX, childAnchorY, childAnchorZ)) {
        errors.push(`COORDINATE_OUT_OF_BOUNDS: Child anchor (${childAnchorX}, ${childAnchorY}, ${childAnchorZ}) out of bounds in block ${blockId}`);
        continue;
      }

      for (const relOffset of dictEntry.relativeOffsets) {
        const finalX = childAnchorX + relOffset.dx;
        const finalY = childAnchorY + relOffset.dy;
        const finalZ = childAnchorZ + relOffset.dz;

        if (!isCoordInBounds(finalX, finalY, finalZ)) {
          errors.push(`COORDINATE_OUT_OF_BOUNDS: Cell coordinate (${finalX}, ${finalY}, ${finalZ}) out of bounds in block ${blockId}`);
          continue;
        }

        const cellId = coordToCellId(finalX, finalY, finalZ);
        recordCell({
          blockId,
          cellId,
          x: finalX,
          y: finalY,
          z: finalZ,
          coordinate: { x: finalX, y: finalY, z: finalZ },
          symbol: dictEntry.symbol,
          sequenceIndex: currentSeq++,
          state: 1,
          level: 3,
          sourceOriginId: originCellId,
          compositeId,
          dictId: dictEntry.dictId,
        });
      }
    }
  }

  // 10. Parse and Expand Primitive Records (Level 1)
  for (let i = 0; i < primitiveCount; i++) {
    if (offset + 10 > buffer.length - CHECKSUM_BYTE_LENGTH) {
      errors.push(`BUFFER_UNDERFLOW: Unexpected EOF while reading primitive record ${i}`);
      break;
    }
    const opcode = buffer[offset++];
    const blockId = view.getUint16(offset, false);
    offset += 2;

    const originCellId = view.getUint16(offset, false);
    offset += 2;

    const cellCount = view.getUint16(offset, false);
    offset += 2;

    const startSeqIndex = view.getUint16(offset, false);
    offset += 2;

    const symbolLength = buffer[offset++];
    let symbol = '';
    for (let s = 0; s < symbolLength; s++) {
      symbol += String.fromCharCode(buffer[offset++]);
    }

    const originCoord = cellIdToCoord(originCellId);
    let currentSeq = startSeqIndex;

    for (let c = 0; c < cellCount; c++) {
      if (offset + 3 > buffer.length - CHECKSUM_BYTE_LENGTH) {
        errors.push(`BUFFER_UNDERFLOW: Unexpected EOF while reading cell offset ${c} in primitive record ${i}`);
        break;
      }
      const dx = view.getInt8(offset++);
      const dy = view.getInt8(offset++);
      const dz = view.getInt8(offset++);

      const finalX = originCoord.x + dx;
      const finalY = originCoord.y + dy;
      const finalZ = originCoord.z + dz;

      if (!isCoordInBounds(finalX, finalY, finalZ)) {
        errors.push(`COORDINATE_OUT_OF_BOUNDS: Primitive cell (${finalX}, ${finalY}, ${finalZ}) out of bounds in block ${blockId}`);
        continue;
      }

      const cellId = coordToCellId(finalX, finalY, finalZ);
      recordCell({
        blockId,
        cellId,
        x: finalX,
        y: finalY,
        z: finalZ,
        coordinate: { x: finalX, y: finalY, z: finalZ },
        symbol,
        sequenceIndex: currentSeq++,
        state: 1,
        level: 1,
        sourceOriginId: originCellId,
      });
    }
  }

  // 11. Parse and Expand RAW Cell Records (Level 0)
  for (let i = 0; i < rawCellCount; i++) {
    if (offset + 9 > buffer.length - CHECKSUM_BYTE_LENGTH) {
      errors.push(`BUFFER_UNDERFLOW: Unexpected EOF while reading RAW cell record ${i}`);
      break;
    }
    const opcode = buffer[offset++];
    if (opcode !== OPCODE_RAW_CELL) {
      errors.push(`MALFORMED_RECORD: Expected opcode 0x00 for RAW cell ${i}, found 0x${opcode.toString(16)}`);
    }

    const blockId = view.getUint16(offset, false);
    offset += 2;

    const cellId = view.getUint16(offset, false);
    offset += 2;

    const sequenceIndex = view.getUint16(offset, false);
    offset += 2;

    const state = buffer[offset++];
    const symbolCode = buffer[offset++];
    const symbol = String.fromCharCode(symbolCode);

    const coord = cellIdToCoord(cellId);
    recordCell({
      blockId,
      cellId,
      x: coord.x,
      y: coord.y,
      z: coord.z,
      coordinate: coord,
      symbol,
      sequenceIndex,
      state,
      level: 0,
    });
  }

  // 12. Coverage & Integrity Verification
  const duplicates: { blockId: number; cellId: number; occurrencesCount: number }[] = [];
  for (const item of claimedCells.values()) {
    if (item.count > 1) {
      duplicates.push({
        blockId: item.blockId,
        cellId: item.cellId,
        occurrencesCount: item.count,
      });
      errors.push(`COVERAGE_DUPLICATE_CELL: Cell #${item.cellId} in block ${item.blockId} claimed ${item.count} times`);
    }
  }

  const coveredCellsCount = claimedCells.size;
  const missingCellsCount = Math.max(0, totalActiveCells - coveredCellsCount);
  const unexpectedCellsCount = Math.max(0, coveredCellsCount - totalActiveCells);

  if (coveredCellsCount !== totalActiveCells) {
    errors.push(`COVERAGE_MISMATCH: Reconstructed unique cells count (${coveredCellsCount}) !== expected (${totalActiveCells})`);
  }

  const coverageReport: CoverageReport = {
    isValid: errors.length === 0 && duplicates.length === 0 && coveredCellsCount === totalActiveCells,
    expectedTotalCells: totalActiveCells,
    coveredCellsCount,
    missingCellsCount,
    duplicateCellsCount: duplicates.length,
    unexpectedCellsCount,
    duplicateCellDetails: duplicates,
    missingCellDetails: [],
    issues: [...errors],
  };

  if (errors.length > 0) {
    return {
      success: false,
      decodedMemory: null,
      checksumValid,
      calculatedChecksumHex: formatChecksumHex(calculatedFileCrc),
      expectedChecksumHex: formatChecksumHex(expectedFileCrc),
      coverageReport,
      errors,
      warnings,
      decodeTimeMs: performance.now() - startTime,
      counts: {
        blocks: blockCount,
        dictEntries: dictEntryCount,
        compositeDefs: compositeDefCount,
        compositeRefs: compositeRefCount,
        primitiveRecords: primitiveCount,
        rawCells: rawCellCount,
        totalReconstructedCells: reconstructedCells.length,
      },
    };
  }

  // 13. Assemble Blocks and Logical Sequence
  // Group by blockId
  const blockMap = new Map<number, DecodedCell[]>();
  for (const cell of reconstructedCells) {
    let blockCells = blockMap.get(cell.blockId);
    if (!blockCells) {
      blockCells = [];
      blockMap.set(cell.blockId, blockCells);
    }
    blockCells.push(cell);
  }

  const blocks: DecodedBlock[] = [];
  const sortedBlockIds = Array.from(blockMap.keys()).sort((a, b) => a - b);
  for (const bId of sortedBlockIds) {
    const cells = blockMap.get(bId)!;
    // Sort cells within block deterministically by cellId
    cells.sort((a, b) => a.cellId - b.cellId);
    blocks.push({
      blockId: bId,
      activeCells: cells,
      cellCount: cells.length,
    });
  }

  // Sort overall logical sequence steps by sequenceIndex
  const sequenceSteps = [...reconstructedCells]
    .sort((a, b) => a.sequenceIndex - b.sequenceIndex)
    .map((c) => ({
      step: c.sequenceIndex,
      blockId: c.blockId,
      cellId: c.cellId,
      symbol: c.symbol,
      coordinate: c.coordinate,
    }));

  const decodedMemory: DecodedMemory = {
    blocks,
    allCells: reconstructedCells,
    sequence: sequenceSteps,
    totalCellsCount: reconstructedCells.length,
    totalSequenceSteps: sequenceSteps.length,
  };

  return {
    success: true,
    decodedMemory,
    checksumValid: true,
    calculatedChecksumHex: formatChecksumHex(calculatedFileCrc),
    expectedChecksumHex: formatChecksumHex(expectedFileCrc),
    coverageReport,
    errors: [],
    warnings,
    decodeTimeMs: performance.now() - startTime,
    counts: {
      blocks: blocks.length,
      dictEntries: dictEntryCount,
      compositeDefs: compositeDefCount,
      compositeRefs: compositeRefCount,
      primitiveRecords: primitiveCount,
      rawCells: rawCellCount,
      totalReconstructedCells: reconstructedCells.length,
    },
  };
}
