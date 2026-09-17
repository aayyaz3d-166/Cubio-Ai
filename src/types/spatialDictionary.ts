/**
 * 3D Memory Studio - Funnel 5: Spatial Pattern Dictionary Types
 * 
 * Defines data structures for canonical rules, rule signatures, dictionary entries,
 * dictionary references (Opcode 0x06), overhead analysis, and Compact3D V2 binary artifacts.
 * 
 * Non-destructive & Evidence-Based:
 * - Never assumes dictionary compression is beneficial.
 * - Enforces condition: dictionaryEntryCost + referenceCosts < existingRepresentationCost
 */

import { Coordinate3D, MemoryBlock, RootMemory } from './memory';
import { EncodingPlan, PlanSegment, SpatialSegmentType, SpatialEncodingMeasurement } from './spatialEncoder';
import { SpatialDecodeResult } from './spatialDecoder';

export const COMPACT_FORMAT_VERSION_V2 = 0x02;
export const RECORD_OPCODE_DICTIONARY_REF = 0x06;

export const DICTIONARY_SECTION_HEADER_BYTES = 4; // [DictEntryCount (2B), TotalDictPayloadBytes (2B)]
export const DICTIONARY_ENTRY_HEADER_BYTES = 6;  // [DictId (2B), RuleOpcode (1B), ParamLength (2B), Flags (1B)]
export const DICT_REF_RECORD_HEADER_BYTES = 9;   // [Opcode 0x06 (1B), BlockId (2B), DictId (2B), OriginCellId (2B), CoveredCount (2B)]

export interface CanonicalRuleParameter {
  ruleType: SpatialSegmentType;
  directionCode?: number;
  directionName?: string;
  directionVector?: [number, number, number];
  runLength?: number;
  tokens: string[];
  period?: number;
  stride?: number;
  repeatCount?: number;
  relativeOffsets: Coordinate3D[]; // Normalized with (0,0,0) as origin
  symbols: string[];
  shapeType?: string;
  extraParams?: Record<string, unknown>;
}

export interface CanonicalRule {
  signature: string;
  ruleType: SpatialSegmentType;
  parameters: CanonicalRuleParameter;
  inlineSerializedBytesPerOccurrence: number;
  dictEntrySerializedBytes: number;
  dictRefSerializedBytes: number;
  humanReadableSyntax: string;
}

export interface RuleOccurrence {
  segmentId: string;
  blockId: number;
  originCellId: number;
  originCoord: Coordinate3D;
  coveredCells: number[];
  symbols: string[];
}

export interface RepeatedRuleGroup {
  signature: string;
  canonicalRule: CanonicalRule;
  occurrences: RuleOccurrence[];
  occurrenceCount: number;
}

export interface DictionaryEntryScore {
  signature: string;
  ruleType: SpatialSegmentType;
  occurrenceCount: number;
  inlineTotalBytes: number;        // occurrenceCount * inlineSerializedBytes
  dictEntryBytes: number;          // dict entry header + params
  dictRefsTotalBytes: number;      // occurrenceCount * dictRefSerializedBytes
  dictTotalBytes: number;          // dictEntryBytes + dictRefsTotalBytes
  netSavingsBytes: number;         // inlineTotalBytes - dictTotalBytes
  savingsRatio: number;            // inlineTotalBytes / dictTotalBytes
  breakEvenOccurrences: number;    // min occurrences required for net profit
  isProfitable: boolean;           // netSavingsBytes > 0
  recommendation: 'USE_DICTIONARY' | 'KEEP_INLINE' | 'DISQUALIFIED_SINGLE_OCCURRENCE';
}

export interface DictionaryEntry {
  dictId: number;                  // 1-based unique identifier (1, 2, 3...)
  signature: string;
  canonicalRule: CanonicalRule;
  score: DictionaryEntryScore;
  occurrencesCount: number;
  binaryPayload: Uint8Array;
  binaryByteLength: number;
}

export interface DictionaryOverheadMetrics {
  dictionaryHeaderBytes: number;   // 4 bytes for dictionary section header
  totalDictEntriesBytes: number;   // sum of all dict entry definition bytes
  totalDictSectionBytes: number;   // dictionaryHeaderBytes + totalDictEntriesBytes
  totalDictRefRecordsBytes: number;// sum of all 0x06 records
  replacedInlineRecordsBytes: number; // what those records would have cost inline
  grossSavingsBytes: number;       // replacedInlineRecordsBytes - totalDictRefRecordsBytes
  netDictionarySavingsBytes: number; // grossSavingsBytes - totalDictSectionBytes
  isDictionaryBeneficial: boolean; // netDictionarySavingsBytes > 0
  dictionaryEntryCount: number;
  totalReferencesCount: number;
}

export interface SpatialPatternDictionary {
  version: 2;
  entries: DictionaryEntry[];
  entriesMap: Map<number, DictionaryEntry>;
  signatureToDictIdMap: Map<string, number>;
  overheadMetrics: DictionaryOverheadMetrics;
  isApplied: boolean;
  timestamp: string;
}

export interface Compact3DArtifactV2 {
  format: 'compact3d';
  version: 2;
  sourceFormat: '3dmemory';
  timestamp: string;
  hasDictionary: boolean;
  dictionary: {
    entryCount: number;
    totalDictBytes: number;
    entries: {
      dictId: number;
      ruleType: SpatialSegmentType;
      signature: string;
      parameters: Record<string, unknown>;
      byteLength: number;
    }[];
  } | null;
  blocksCount: number;
  totalActiveCells: number;
  totalRecordsCount: number;
  checksums: {
    logicalMemoryChecksum: string;
    compactArtifactChecksum: string;
    algorithm: 'CRC32_AND_FNV1A';
  };
  metrics: {
    original3dBytes: number;
    compactV1Bytes: number;
    compactV2Bytes: number;
    v1SavingsBytes: number;
    v2SavingsBytes: number;
    dictionaryOverheadBytes: number;
    dictionaryNetSavingsBytes: number;
    isDictionaryWinner: boolean;
  };
}

export interface SpatialEncoderV2Result {
  plan: EncodingPlan;
  dictionary: SpatialPatternDictionary;
  artifact: Compact3DArtifactV2 | null;
  binaryBuffer: Uint8Array;
  hexDump: string;
  measurement: {
    original3dBytes: number;
    compactV1Bytes: number;
    compactV2Bytes: number;
    dictionarySectionBytes: number;
    dictRefsBytes: number;
    netDictionaryBenefitBytes: number;
    isDictionaryApplied: boolean;
    logicalChecksum: string;
    compactChecksum: string;
    durationMs: number;
  };
  isValid: boolean;
  status: 'ENCODED' | 'ENCODING_FAIL' | 'RULE_CONFLICT';
  statusMessage: string;
}

export interface DictionaryTestCase {
  testId: string;
  testName: string;
  description: string;
  inputDescription: string;
  expectedDictionaryUsed: boolean;
  actualDictionaryUsed?: boolean;
  originalBytes: number;
  compactV1Bytes: number;
  compactV2Bytes: number;
  netDictSavings: number;
  dictEntryCount: number;
  dictRefCount: number;
  roundtripPassed: boolean;
  passed: boolean;
  details: string;
}

export interface DictionaryTestSuiteResult {
  suiteName: 'Funnel 5: Spatial Pattern Dictionary Test Suite';
  totalTests: number;
  passedCount: number;
  failedCount: number;
  determinismPassed: boolean;
  totalOriginalBytes: number;
  totalCompactV1Bytes: number;
  totalCompactV2Bytes: number;
  overallV2SavingsBytes: number;
  overallV2SavingsPercent: number;
  results: DictionaryTestCase[];
  timestamp: string;
}
