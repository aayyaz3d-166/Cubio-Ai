/**
 * 3D Memory Studio - Funnel 2: Spatial Encoder Types
 * 
 * Defines the immutable Encoding Plan, Coverage Map, Rule Conflict structures,
 * Compact Spatial Data Artifact (.compact3d / binary), and Byte-Level Measurements.
 * 
 * Non-destructive experimental encoding layer:
 * - Does NOT modify or destroy existing .3dmemory format
 * - Does NOT replace lossless pipeline
 * - Measures real serialized binary footprint vs original memory
 */

import { Coordinate3D, MemoryBlock, RootMemory } from './memory';
import { PatternType, RuleType, SpatialPatternCandidate } from './patterns';
import { RepresentationType } from './optimizer';

export type SpatialSegmentType =
  | 'RAW'
  | 'SPATIAL_RUN'
  | 'REPETITION'
  | 'CLUSTER'
  | 'SEQUENCE_PATH'
  | 'REPEATED_SHAPE';

export type ViewportMode = 'ORIGINAL' | 'ENCODING_PLAN' | 'COMPACT';

export interface PlanSegment {
  segmentId: string;
  type: SpatialSegmentType;
  blockId: number;
  
  // Cells & Symbols covered by this segment (in exact sequence order)
  cells: number[];
  symbols: string[];
  states?: (0 | 1)[];
  sequenceIndices?: number[];

  // Mathematical / Rule Parameters
  parameters: {
    startCellId?: number;
    endCellId?: number;
    startCoord?: Coordinate3D;
    endCoord?: Coordinate3D;
    directionName?: string;
    directionVector?: [number, number, number];
    directionCode?: number;
    runLength?: number;
    period?: number;
    patternTokens?: string[];
    repeatCount?: number;
    stride?: number;
    boundingBox?: { min: Coordinate3D; max: Coordinate3D };
    density?: number;
    shapeType?: string;
    shapePoints?: Coordinate3D[];
    occurrenceOrigins?: number[];
    deltaSteps?: [number, number, number][];
    [key: string]: unknown;
  };

  // Human-readable rule syntax
  ruleSyntax: string;

  // Real Serialized Cost of this segment record
  serializedBytes: number;
  rawEquivalentBytes: number;
  netSavingsBytes: number;
  netSavingsPercent: number;

  // Link to source pattern / optimizer result
  sourcePatternId?: string;
  sourceWinnerType?: RepresentationType;
  isRule: boolean;
}

export interface RuleConflict {
  conflictId: string;
  blockId: number;
  conflictingCellIds: number[];
  ruleAId: string;
  ruleAType: SpatialSegmentType;
  ruleASavings: number;
  ruleBId: string;
  ruleBType: SpatialSegmentType;
  ruleBSavings: number;
  resolution: 'RESOLVED_BY_NET_SAVINGS' | 'RESOLVED_RAW' | 'UNRESOLVED';
  winningRuleId?: string;
  reason: string;
}

export interface BlockEncodingPlan {
  blockId: number;
  totalBlockCells: number; // Standard 343
  totalActiveCells: number; // Active cells in original block
  segments: PlanSegment[];
  
  // Strict Coverage Verification
  coveredCellIds: number[];
  coveredCount: number;
  uncoveredCellIds: number[];
  uncoveredCount: number;
  duplicateCellIds: number[];
  duplicateCount: number;
  
  // Conflicts
  hasConflicts: boolean;
  conflicts: RuleConflict[];
  
  // Status
  isFullyCovered: boolean;
  isValid: boolean;
  representationBreakdown: Record<SpatialSegmentType, number>;
  serializedBytes: number;
  rawEquivalentBytes: number;
  netSavingsBytes: number;
}

export interface EncodingPlan {
  planId: string;
  createdAt: string;
  sourceFormat: '3dmemory';
  targetFormat: 'compact3d';
  
  // Multi-block support
  blocks: BlockEncodingPlan[];
  totalBlocks: number;
  
  // Global Cell Coverage Totals
  totalActiveCells: number;
  totalCoveredCells: number;
  totalUncoveredCells: number;
  totalDuplicateCells: number;
  
  // Global Validation
  hasConflicts: boolean;
  allConflicts: RuleConflict[];
  isValid: boolean;
  status: 'ENCODED' | 'ENCODING_FAIL' | 'RULE_CONFLICT';
  statusMessage: string;

  // Summary Metrics
  totalSegmentsCount: number;
  representationCounts: Record<SpatialSegmentType, number>;
  rulesCount: number;
  rawSegmentsCount: number;
}

export interface CompactBlockHeaderEntry {
  blockId: number;
  parentBlockId: number | null;
  origin: [number, number, number];
  dimensions: [number, number, number];
  activeCellCount: number;
  recordsCount: number;
  byteOffset?: number;
  byteLength?: number;
}

export interface CompactRecordEntry {
  recordId: string;
  type: SpatialSegmentType;
  blockId: number;
  startCellId?: number;
  coveredCells: number[];
  symbols?: string[];
  parameters: Record<string, unknown>;
  ruleSyntax?: string;
  serializedBytes: number;
}

export interface Compact3DArtifact {
  format: 'compact3d';
  version: number; // 1
  sourceFormat: '3dmemory';
  timestamp: string;
  
  // Header Metadata
  blocksCount: number;
  totalActiveCells: number;
  totalRecordsCount: number;

  // Checksums
  checksums: {
    logicalMemoryChecksum: string;
    compactArtifactChecksum: string;
    algorithm: 'CRC32_AND_FNV1A';
  };

  // Block Directory Table
  blocks: CompactBlockHeaderEntry[];

  // Compact Encoded Records
  records: CompactRecordEntry[];

  // Encoding Plan Metrics
  metrics: {
    totalEncodedBytes: number;
    original3dBytes: number;
    metadataBytes: number;
    ruleBytes: number;
    rawFallbackBytes: number;
    sizeDifference: number;
    sizeRatio: number;
    actualSavingsBytes: number;
    actualSavingsPercent: number;
    isActualCompressionAchieved: boolean;
  };

  // Safety Disclaimers
  disclaimer: 'EXPERIMENTAL COMPACT REPRESENTATION — FINAL COMPRESSION NOT YET CERTIFIED';
}

export interface SpatialEncodingMeasurement {
  // Serialized byte sizes
  original3dBytes: number; // Size of canonical .3dmemory serialization
  compact3dBytes: number; // Size of binary compact3d artifact
  compactJsonBytes: number; // Size of JSON compact representation
  
  // Sub-component breakdown
  headerBytes: number;
  blockTableBytes: number;
  metadataBytes: number; // Header + Block Table + Record Headers
  ruleBytes: number; // Payload bytes belonging to winning rules
  rawFallbackBytes: number; // Payload bytes belonging to RAW fallback segments
  totalEncodedBytes: number; // metadataBytes + ruleBytes + rawFallbackBytes

  // Comparison Metrics
  sizeDifference: number; // original3dBytes - totalEncodedBytes
  sizeRatio: number; // totalEncodedBytes / original3dBytes
  estimatedSavingsBytes: number;
  actualSavingsBytes: number; // 0 if compact3dBytes >= original3dBytes
  actualSavingsPercent: number;
  isActualCompressionAchieved: boolean;

  // Integrity Checksums
  logicalChecksum: string;
  compactChecksum: string;
  isChecksumVerified: boolean;

  // Timings
  encodingDurationMs: number;
}

export interface SpatialEncoderResult {
  plan: EncodingPlan;
  artifact: Compact3DArtifact | null;
  measurement: SpatialEncodingMeasurement;
  binaryBuffer: Uint8Array;
  hexDump: string;
  isValid: boolean;
  status: 'ENCODED' | 'ENCODING_FAIL' | 'RULE_CONFLICT';
  statusMessage: string;
}

export interface SpatialEncoderTestCase {
  testId: string;
  testName: string;
  description: string;
  inputDescription: string;
  expectedStatus: 'ENCODED' | 'ENCODING_FAIL' | 'RULE_CONFLICT';
  expectedPrimaryRepresentation?: SpatialSegmentType;
  actualStatus?: 'ENCODED' | 'ENCODING_FAIL' | 'RULE_CONFLICT';
  actualPrimaryRepresentation?: SpatialSegmentType;
  originalBytes: number;
  compactBytes: number;
  savingsBytes: number;
  savingsPercent: number;
  isValid: boolean;
  passed: boolean;
  details: string;
  durationMs: number;
}

export interface SpatialEncoderTestSuiteResult {
  suiteName: 'Spatial Encoder Test Suite (1..10 + Determinism)';
  totalTests: number;
  passedCount: number;
  failedCount: number;
  determinismPassed: boolean;
  totalOriginalBytes: number;
  totalCompactBytes: number;
  overallSavingsBytes: number;
  overallSavingsPercent: number;
  results: SpatialEncoderTestCase[];
  timestamp: string;
}
