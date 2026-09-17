/**
 * 3D Memory Studio - Funnel 12: Binary Serializer for compact3d-v4
 * 
 * Generates exact, deterministic binary buffers according to the compact3d-v4 format.
 * 
 * Invariants:
 * - Deterministic ordering: sorted by blockId -> sequenceIndex -> recordType -> ID.
 * - Big-endian integers, explicit signed int8 offsets.
 * - No JSON metadata, no variable-length padding, no runtime-dependent artifacts.
 */

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
  Compact3DArtifactV4,
} from '../types/artifact';
import {
  F12CompositeDefinition,
  F12CompositeReference,
  F12DictionaryEntry,
  F12PrimitiveRecord,
  F12RawCellRecord,
  RelOffset3D,
} from '../types/records';
import { calculateCRC32, formatChecksumHex } from './checksum';

// ============================================================================
// BYTE LENGTH CALCULATIONS
// ============================================================================

export function getDictionaryEntryByteLength(entry: F12DictionaryEntry): number {
  // 2B (dictId) + 1B (ruleType) + 1B (paramCount) + 1B (symbolLen) + 1B (flags) + N*3 (offsets) + M (symbol)
  return 6 + entry.relativeOffsets.length * 3 + entry.symbol.length;
}

export function getCompositeDefinitionByteLength(def: F12CompositeDefinition): number {
  // 2B (compId) + 2B (childCount) + 1B (transform) + 1B (flags) + childCount * 8B
  return 6 + def.childCount * 8;
}

export function getCompositeReferenceByteLength(): number {
  // 1B (opcode 0x0C) + 2B (blockId) + 2B (compId) + 2B (originCellId) + 2B (coveredCount) + 2B (seqStart) + 1B (flags) = 12B
  return 12;
}

export function getPrimitiveRecordByteLength(rec: F12PrimitiveRecord): number {
  // 1B (opcode) + 2B (blockId) + 2B (originCellId) + 2B (cellCount) + 2B (startSeqIndex) + 1B (symbolLen) + M (symbol) + N*3 (offsets)
  return 10 + rec.symbol.length + rec.relativeOffsets.length * 3;
}

export function getRawCellRecordByteLength(): number {
  // 1B (opcode 0x00) + 2B (blockId) + 2B (cellId) + 2B (seqIndex) + 1B (state) + 1B (symbol) = 9B
  return 9;
}

// ============================================================================
// SERIALIZATION ENGINE
// ============================================================================

export interface SerializerInput {
  readonly blockCount: number;
  readonly totalActiveCells: number;
  readonly totalSequenceSteps: number;
  readonly dictionaryEntries: readonly F12DictionaryEntry[];
  readonly compositeDefinitions: readonly F12CompositeDefinition[];
  readonly compositeReferences: readonly F12CompositeReference[];
  readonly primitiveRecords: readonly F12PrimitiveRecord[];
  readonly rawCellRecords: readonly F12RawCellRecord[];
  readonly comparativeMetrics?: {
    readonly originalBytes: number;
    readonly funnel4Bytes: number;
    readonly funnel5Bytes: number;
    readonly funnel11SelectedBytes: number;
  };
}

export function serializeCompact3DV4(input: SerializerInput): Compact3DArtifactV4 {
  // 1. Sort tables deterministically
  const sortedDictEntries = [...input.dictionaryEntries].sort((a, b) => a.dictId - b.dictId);
  const sortedCompDefs = [...input.compositeDefinitions].sort((a, b) => a.compositeId - b.compositeId);
  const sortedCompRefs = [...input.compositeReferences].sort((a, b) => {
    if (a.blockId !== b.blockId) return a.blockId - b.blockId;
    if (a.startSeqIndex !== b.startSeqIndex) return a.startSeqIndex - b.startSeqIndex;
    return a.originCellId - b.originCellId;
  });
  const sortedPrimitives = [...input.primitiveRecords].sort((a, b) => {
    if (a.blockId !== b.blockId) return a.blockId - b.blockId;
    if (a.startSeqIndex !== b.startSeqIndex) return a.startSeqIndex - b.startSeqIndex;
    return a.originCellId - b.originCellId;
  });
  const sortedRawCells = [...input.rawCellRecords].sort((a, b) => {
    if (a.blockId !== b.blockId) return a.blockId - b.blockId;
    if (a.sequenceIndex !== b.sequenceIndex) return a.sequenceIndex - b.sequenceIndex;
    return a.cellId - b.cellId;
  });

  // 2. Calculate exact table byte lengths
  let dictionaryBytes = 0;
  for (const entry of sortedDictEntries) {
    dictionaryBytes += getDictionaryEntryByteLength(entry);
  }

  let compositeDefinitionBytes = 0;
  for (const def of sortedCompDefs) {
    compositeDefinitionBytes += getCompositeDefinitionByteLength(def);
  }

  const compositeReferenceBytes = sortedCompRefs.length * getCompositeReferenceByteLength();

  let primitiveBytes = 0;
  for (const prim of sortedPrimitives) {
    primitiveBytes += getPrimitiveRecordByteLength(prim);
  }

  const rawBytes = sortedRawCells.length * getRawCellRecordByteLength();

  const bodyByteLength = dictionaryBytes + compositeDefinitionBytes + compositeReferenceBytes + primitiveBytes + rawBytes;
  const totalArtifactBytes = HEADER_BYTE_LENGTH + bodyByteLength + CHECKSUM_BYTE_LENGTH;

  // 3. Allocate binary buffer
  const buffer = new Uint8Array(totalArtifactBytes);
  const view = new DataView(buffer.buffer);

  // 4. Write Header (Bytes 0..31)
  let offset = 0;

  // Magic 'C3D4' [4B]
  buffer[0] = COMPACT3D_V4_MAGIC[0];
  buffer[1] = COMPACT3D_V4_MAGIC[1];
  buffer[2] = COMPACT3D_V4_MAGIC[2];
  buffer[3] = COMPACT3D_V4_MAGIC[3];
  offset = 4;

  // Format Version [1B]
  buffer[offset++] = COMPACT3D_V4_FORMAT_VERSION;

  // Hierarchy Max Depth [1B]
  buffer[offset++] = COMPACT3D_V4_MAX_HIERARCHY_DEPTH;

  // Flags [2B]
  view.setUint16(offset, 0x0000, false);
  offset += 2;

  // Block Count [2B]
  view.setUint16(offset, input.blockCount, false);
  offset += 2;

  // Dict Entry Count [2B]
  view.setUint16(offset, sortedDictEntries.length, false);
  offset += 2;

  // Composite Def Count [2B]
  view.setUint16(offset, sortedCompDefs.length, false);
  offset += 2;

  // Composite Ref Count [2B]
  view.setUint16(offset, sortedCompRefs.length, false);
  offset += 2;

  // Primitive Count [2B]
  view.setUint16(offset, sortedPrimitives.length, false);
  offset += 2;

  // Raw Cell Count [2B]
  view.setUint16(offset, sortedRawCells.length, false);
  offset += 2;

  // Total Active Cells [2B]
  view.setUint16(offset, input.totalActiveCells, false);
  offset += 2;

  // Total Sequence Steps [2B]
  view.setUint16(offset, input.totalSequenceSteps, false);
  offset += 2;

  // Body Byte Length [4B]
  view.setUint32(offset, bodyByteLength, false);
  offset += 4;

  // Header Checksum [4B] (CRC32 over bytes 0..27)
  const headerChecksum = calculateCRC32(buffer, 0, 28);
  view.setUint32(offset, headerChecksum, false);
  offset += 4;

  // Verify header offset
  if (offset !== HEADER_BYTE_LENGTH) {
    throw new Error(`Internal Header offset mismatch: ${offset} !== ${HEADER_BYTE_LENGTH}`);
  }

  // 5. Write Dictionary Table
  for (const entry of sortedDictEntries) {
    view.setUint16(offset, entry.dictId, false);
    offset += 2;

    buffer[offset++] = entry.ruleType & 0xff;
    buffer[offset++] = entry.relativeOffsets.length & 0xff;
    buffer[offset++] = entry.symbol.length & 0xff;
    buffer[offset++] = entry.flags & 0xff;

    for (const off of entry.relativeOffsets) {
      view.setInt8(offset++, Math.max(-128, Math.min(127, off.dx)));
      view.setInt8(offset++, Math.max(-128, Math.min(127, off.dy)));
      view.setInt8(offset++, Math.max(-128, Math.min(127, off.dz)));
    }

    for (let i = 0; i < entry.symbol.length; i++) {
      buffer[offset++] = entry.symbol.charCodeAt(i) & 0xff;
    }
  }

  // 6. Write Composite Definitions Table
  for (const def of sortedCompDefs) {
    view.setUint16(offset, def.compositeId, false);
    offset += 2;

    view.setUint16(offset, def.childCount, false);
    offset += 2;

    buffer[offset++] = def.transformType & 0xff;
    buffer[offset++] = def.flags & 0xff;

    for (const child of def.children) {
      view.setUint16(offset, child.childDictId, false);
      offset += 2;

      view.setInt8(offset++, Math.max(-128, Math.min(127, child.offset.dx)));
      view.setInt8(offset++, Math.max(-128, Math.min(127, child.offset.dy)));
      view.setInt8(offset++, Math.max(-128, Math.min(127, child.offset.dz)));

      view.setUint16(offset, child.order, false);
      offset += 2;

      buffer[offset++] = child.transform & 0xff;
    }
  }

  // 7. Write Composite References Table
  for (const ref of sortedCompRefs) {
    buffer[offset++] = OPCODE_COMPOSITE_REF;

    view.setUint16(offset, ref.blockId, false);
    offset += 2;

    view.setUint16(offset, ref.compositeId, false);
    offset += 2;

    view.setUint16(offset, ref.originCellId, false);
    offset += 2;

    view.setUint16(offset, ref.coveredCount, false);
    offset += 2;

    view.setUint16(offset, ref.startSeqIndex, false);
    offset += 2;

    buffer[offset++] = ref.flags & 0xff;
  }

  // 8. Write Primitive Records Table
  for (const prim of sortedPrimitives) {
    buffer[offset++] = prim.opcode & 0xff;

    view.setUint16(offset, prim.blockId, false);
    offset += 2;

    view.setUint16(offset, prim.originCellId, false);
    offset += 2;

    view.setUint16(offset, prim.cellCount, false);
    offset += 2;

    view.setUint16(offset, prim.startSeqIndex, false);
    offset += 2;

    buffer[offset++] = prim.symbol.length & 0xff;

    for (let i = 0; i < prim.symbol.length; i++) {
      buffer[offset++] = prim.symbol.charCodeAt(i) & 0xff;
    }

    for (const off of prim.relativeOffsets) {
      view.setInt8(offset++, Math.max(-128, Math.min(127, off.dx)));
      view.setInt8(offset++, Math.max(-128, Math.min(127, off.dy)));
      view.setInt8(offset++, Math.max(-128, Math.min(127, off.dz)));
    }
  }

  // 9. Write RAW Cell Records Table
  for (const raw of sortedRawCells) {
    buffer[offset++] = OPCODE_RAW_CELL;

    view.setUint16(offset, raw.blockId, false);
    offset += 2;

    view.setUint16(offset, raw.cellId, false);
    offset += 2;

    view.setUint16(offset, raw.sequenceIndex, false);
    offset += 2;

    buffer[offset++] = raw.state & 0xff;
    buffer[offset++] = (raw.symbol.charCodeAt(0) || 65) & 0xff;
  }

  // 10. Write File CRC32 Checksum (over bytes 0..(totalArtifactBytes - 4))
  const fileChecksum = calculateCRC32(buffer, 0, totalArtifactBytes - CHECKSUM_BYTE_LENGTH);
  view.setUint32(offset, fileChecksum, false);
  offset += 4;

  if (offset !== totalArtifactBytes) {
    throw new Error(`Internal total offset mismatch: ${offset} !== ${totalArtifactBytes}`);
  }

  // Build header object
  const header: Compact3DV4Header = {
    magic: 'C3D4',
    formatVersion: COMPACT3D_V4_FORMAT_VERSION,
    hierarchyMaxDepth: COMPACT3D_V4_MAX_HIERARCHY_DEPTH,
    flags: 0,
    blockCount: input.blockCount,
    dictEntryCount: sortedDictEntries.length,
    compositeDefCount: sortedCompDefs.length,
    compositeRefCount: sortedCompRefs.length,
    primitiveCount: sortedPrimitives.length,
    rawCellCount: sortedRawCells.length,
    totalActiveCells: input.totalActiveCells,
    totalSequenceSteps: input.totalSequenceSteps,
    bodyByteLength,
    headerChecksum,
  };

  const comp = input.comparativeMetrics || {
    originalBytes: input.totalActiveCells * 7,
    funnel4Bytes: input.totalActiveCells * 4,
    funnel5Bytes: input.totalActiveCells * 3,
    funnel11SelectedBytes: input.totalActiveCells * 3,
  };

  const totalSavingsVsOriginal = Math.max(0, comp.originalBytes - totalArtifactBytes);
  const additionalSavingsVsFunnel5 = comp.funnel5Bytes - totalArtifactBytes;
  const additionalSavingsVsFunnel11 = comp.funnel11SelectedBytes - totalArtifactBytes;
  const reductionPercent = comp.originalBytes > 0
    ? ((comp.originalBytes - totalArtifactBytes) / comp.originalBytes) * 100
    : 0;
  const compressionRatio = totalArtifactBytes > 0
    ? comp.originalBytes / totalArtifactBytes
    : 1;

  return {
    format: 'compact3d-v4',
    header,
    binaryBuffer: buffer,
    byteLength: totalArtifactBytes,
    checksum: fileChecksum,
    checksumHex: formatChecksumHex(fileChecksum),
    sizeBreakdown: {
      headerBytes: HEADER_BYTE_LENGTH,
      dictionaryBytes,
      compositeDefinitionBytes,
      compositeReferenceBytes,
      primitiveBytes,
      rawBytes,
      checksumBytes: CHECKSUM_BYTE_LENGTH,
      totalArtifactBytes,
    },
    comparativeMetrics: {
      originalBytes: comp.originalBytes,
      funnel4Bytes: comp.funnel4Bytes,
      funnel5Bytes: comp.funnel5Bytes,
      funnel11SelectedBytes: comp.funnel11SelectedBytes,
      funnel12ArtifactBytes: totalArtifactBytes,
      totalSavingsVsOriginal,
      additionalSavingsVsFunnel5,
      additionalSavingsVsFunnel11,
      reductionPercent,
      compressionRatio,
    },
  };
}
