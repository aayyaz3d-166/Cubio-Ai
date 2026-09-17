/**
 * 3D Memory Studio - Funnel 3: Exact Spatial Decoder Type Definitions
 * 
 * Defines schemas, data structures, and validation models for decoding
 * .compact3d binary artifacts into exact reconstructed logical memory.
 */

import { MemoryBlock, MemoryCell, MemoryGrid3D, MemorySequenceStep, RootMemory } from './memory';

export type DecodeStage =
  | 'HEADER'
  | 'BLOCK_TABLE'
  | 'RECORDS'
  | 'EXPANSION'
  | 'COVERAGE'
  | 'BLOCK_HIERARCHY'
  | 'SEQUENCE'
  | 'RECONSTRUCTION'
  | 'CHECKSUM'
  | 'EXACT_COMPARISON'
  | 'COMPLETE';

export interface CompactFileHeader {
  magic: string; // 'CP3D'
  magicBytes: [number, number, number, number];
  version: number;
  flags: number;
  blockCount: number;
  recordCount: number;
  totalActiveCells: number;
  logicalChecksumNum: number;
  logicalChecksumHex: string;
  isValid: boolean;
  validationErrors: string[];
}

export interface CompactBlockHeader {
  blockId: number;
  parentBlockId: number | null;
  origin: [number, number, number];
  activeCellCount: number;
  recordsCount: number;
  isValid: boolean;
  errors?: string[];
}

export interface DecodedRecord {
  recordIndex: number;
  opcode: number;
  opcodeName: string;
  blockId: number;
  coveredCellCount: number;
  payloadLength: number;
  startByteOffset: number;
  endByteOffset: number;
  parameters: Record<string, unknown>;
  expandedCellIds: number[];
  expandedSymbols: string[];
  expandedStepIndices?: number[];
  isValid: boolean;
  errorMessage?: string;
  ruleDescription: string;
}

export interface CoverageValidationResult {
  totalDecodedCells: number;
  uniqueDecodedCells: number;
  duplicateCells: Array<{ blockId: number; cellId: number; count: number }>;
  missingCells: Array<{ blockId: number; cellId: number }>;
  unexpectedCells: Array<{ blockId: number; cellId: number }>;
  duplicateCount: number;
  missingCount: number;
  unexpectedCount: number;
  isCoverageValid: boolean;
  details: string;
}

export interface BlockValidationResult {
  blockId: number;
  declaredActiveCells: number;
  decodedActiveCells: number;
  declaredRecordCount: number;
  decodedRecordCount: number;
  isBlockValid: boolean;
  error?: string;
}

export interface SequenceRestorationResult {
  stepCount: number;
  restoredSteps: MemorySequenceStep[];
  isSequenceValid: boolean;
  sequenceString: string;
  error?: string;
}

export interface ComparisonMismatch {
  blockId: number;
  cellId: number;
  field: 'STATE' | 'SYMBOL' | 'OCCURRENCE' | 'SEQUENCE_INDEX' | 'COORDINATE' | 'BLOCK_ORIGIN';
  originalValue: string | number | boolean | null;
  decodedValue: string | number | boolean | null;
  description: string;
}

export interface ExactComparisonResult {
  isIdentical: boolean;
  originalActiveCount: number;
  decodedActiveCount: number;
  originalBlockCount: number;
  decodedBlockCount: number;
  mismatchCount: number;
  mismatches: ComparisonMismatch[];
  details: string;
}

export interface SpatialDecodeResult {
  success: boolean;
  stage: DecodeStage;
  header?: CompactFileHeader;
  blockHeaders: CompactBlockHeader[];
  decodedRecords: DecodedRecord[];
  coverage: CoverageValidationResult;
  blockValidations: BlockValidationResult[];
  sequenceResult?: SequenceRestorationResult;
  reconstructedMemory?: RootMemory;
  decodedLogicalChecksum?: string;
  originalLogicalChecksum?: string;
  checksumMatch: boolean;
  exactComparison?: ExactComparisonResult;
  roundtripPassed: boolean;
  error?: string;
  durationMs: number;
  binarySize: number;
}

export interface CorruptionTestCase {
  testId: string;
  corruptionType:
    | 'CORRUPT_MAGIC'
    | 'CORRUPT_VERSION'
    | 'CORRUPT_OPCODE'
    | 'CORRUPT_PAYLOAD_LENGTH'
    | 'CORRUPT_BLOCK_ID'
    | 'CORRUPT_RULE_PARAM'
    | 'CORRUPT_RECORD_COUNT'
    | 'CORRUPT_CHECKSUM'
    | 'TRUNCATED_BUFFER';
  description: string;
  expectedErrorStage: DecodeStage;
  actualErrorStage?: DecodeStage;
  errorDetected: boolean;
  errorMessage?: string;
  passed: boolean;
}

export interface SpatialDecoderTestSuiteResult {
  totalTests: number;
  passedCount: number;
  failedCount: number;
  durationMs: number;
  determinismPassed: boolean;
  doubleRoundtripPassed: boolean;
  corruptionHandlingPassed: boolean;
  results: Array<{
    testId: string;
    testName: string;
    description: string;
    passed: boolean;
    durationMs: number;
    details: string;
    decodeStage: DecodeStage;
    checksumMatch: boolean;
    exactMatch: boolean;
    coverageStatus: string;
  }>;
}

export type ViewportDiffMode = 'ORIGINAL' | 'DECODED' | 'DIFFERENCE';
