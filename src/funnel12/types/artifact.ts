/**
 * 3D Memory Studio - Funnel 12: Binary Artifact & Format Specification (compact3d-v4)
 * 
 * Defines the immutable data structures and format constants for the compact3d-v4
 * hierarchical binary artifact.
 * 
 * Binary Layout:
 * +--------------------------------------------------------------------------+
 * | HEADER (32 Bytes Fixed-Width)                                            |
 * +--------------------------------------------------------------------------+
 * | LEVEL 2 DICTIONARY TABLE (Definitions for Funnel 5 spatial patterns)     |
 * +--------------------------------------------------------------------------+
 * | LEVEL 3 COMPOSITE DEFINITIONS (Stored ONCE per accepted composite)       |
 * +--------------------------------------------------------------------------+
 * | LEVEL 3 COMPOSITE REFERENCES (Occurrence records with origin & sequence) |
 * +--------------------------------------------------------------------------+
 * | LEVEL 1 PRIMITIVE RULES TABLE (Spatial runs, repetitions, clusters)     |
 * +--------------------------------------------------------------------------+
 * | LEVEL 0 RAW CELLS TABLE (Uncovered / isolated cells)                     |
 * +--------------------------------------------------------------------------+
 * | CHECKSUM (4 Bytes Fixed-Width: CRC32 of entire preceding buffer)        |
 * +--------------------------------------------------------------------------+
 */

export const COMPACT3D_V4_MAGIC = [0x43, 0x33, 0x44, 0x34]; // 'C3D4'
export const COMPACT3D_V4_FORMAT_VERSION = 0x04;
export const COMPACT3D_V4_MAX_HIERARCHY_DEPTH = 0x03; // Level 0..3

export const HEADER_BYTE_LENGTH = 32;
export const CHECKSUM_BYTE_LENGTH = 4;

export const OPCODE_RAW_CELL = 0x00;
export const OPCODE_SPATIAL_RUN = 0x01;
export const OPCODE_REPETITION = 0x02;
export const OPCODE_CLUSTER = 0x03;
export const OPCODE_SEQUENCE_PATH = 0x04;
export const OPCODE_REPEATED_SHAPE = 0x05;
export const OPCODE_DICTIONARY_DEF = 0x0A;
export const OPCODE_COMPOSITE_DEF = 0x0B;
export const OPCODE_COMPOSITE_REF = 0x0C;

export const TRANSFORM_TRANSLATION = 0x01;

/**
 * 32-byte Fixed Header representation
 */
export interface Compact3DV4Header {
  readonly magic: string; // 'C3D4'
  readonly formatVersion: number; // 4
  readonly hierarchyMaxDepth: number; // 3
  readonly flags: number; // 0
  readonly blockCount: number;
  readonly dictEntryCount: number;
  readonly compositeDefCount: number;
  readonly compositeRefCount: number;
  readonly primitiveCount: number;
  readonly rawCellCount: number;
  readonly totalActiveCells: number;
  readonly totalSequenceSteps: number;
  readonly bodyByteLength: number;
  readonly headerChecksum: number;
}

/**
 * Complete serialized artifact details & byte accounting
 */
export interface Compact3DArtifactV4 {
  readonly format: 'compact3d-v4';
  readonly header: Compact3DV4Header;
  readonly binaryBuffer: Uint8Array;
  readonly byteLength: number;
  readonly checksum: number;
  readonly checksumHex: string;
  readonly sizeBreakdown: {
    readonly headerBytes: number;
    readonly dictionaryBytes: number;
    readonly compositeDefinitionBytes: number;
    readonly compositeReferenceBytes: number;
    readonly primitiveBytes: number;
    readonly rawBytes: number;
    readonly checksumBytes: number;
    readonly totalArtifactBytes: number;
  };
  readonly comparativeMetrics: {
    readonly originalBytes: number;
    readonly funnel4Bytes: number;
    readonly funnel5Bytes: number;
    readonly funnel11SelectedBytes: number;
    readonly funnel12ArtifactBytes: number;
    readonly totalSavingsVsOriginal: number;
    readonly additionalSavingsVsFunnel5: number;
    readonly additionalSavingsVsFunnel11: number;
    readonly reductionPercent: number;
    readonly compressionRatio: number;
  };
}
