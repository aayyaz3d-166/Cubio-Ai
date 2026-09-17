/**
 * 3D Memory Studio - Funnel 6: Hierarchical Spatial Composition Types
 * 
 * Defines data structures for:
 * - Level 0..3 Spatial Hierarchy (Cells -> Primitives -> Funnel 5 Dict -> Funnel 6 Composites)
 * - Canonical Composite definitions & signatures (invariant under translation)
 * - Composite Candidates, Occurrences, and Directed Dependency Graph (Acyclic, Max Depth = 3)
 * - Strict Evidence-Based Cost Model:
 *   compositeDefinitionCost + compositeReferenceCost < expandedChildRepresentationCost
 * - Binary Compact3D V3 format definitions & Opcode 0x07 (COMPOSITE_REF)
 * - Validation results (Coverage, Cycles, Cross-Block detection, Exact Reversibility)
 */

import { Coordinate3D, RootMemory } from './memory';
import { EncodingPlan, PlanSegment, SpatialSegmentType } from './spatialEncoder';
import { DictionaryEntry, SpatialPatternDictionary } from './spatialDictionary';

export const COMPACT_FORMAT_VERSION_V3 = 0x03;
export const RECORD_OPCODE_COMPOSITE_REF = 0x07;

export const MAX_HIERARCHY_DEPTH = 3;

export const COMPOSITE_SECTION_HEADER_BYTES = 4; // [CompositeEntryCount (2B), TotalCompositePayloadBytes (2B)]
export const COMPOSITE_ENTRY_HEADER_BYTES = 6;    // [CompositeId (2B), ChildCount (2B), TransformType (1B), Reserved/Flags (1B)]
export const COMPOSITE_CHILD_RECORD_BYTES = 8;    // [ChildDictId (2B), RelDX (1B signed), RelDY (1B signed), RelDZ (1B signed), ChildOrder (2B), Transform (1B)]
export const COMPOSITE_REF_RECORD_HEADER_BYTES = 9; // [Opcode 0x07 (1B), BlockId (2B), CompositeId (2B), OriginCellId (2B), CoveredCount (2B)]

export type HierarchyLevel = 0 | 1 | 2 | 3;

export interface HierarchyLevelDescription {
  level: HierarchyLevel;
  name: string;
  description: string;
  entityType: 'CELL' | 'PRIMITIVE_RULE' | 'DICTIONARY_PATTERN' | 'COMPOSITE_PATTERN';
}

export type TransformType = 'TRANSLATION';

export interface CompositeChildReference {
  childDictId: number;              // Reference to Funnel 5 dictionary entry
  relativeOffset: [number, number, number]; // [dx, dy, dz] relative to composite anchor/origin
  order: number;                    // Sequence/execution ordering index
  transform: TransformType;
  childSignature: string;
  childRuleType: SpatialSegmentType;
}

export interface CanonicalComposite {
  signature: string;
  children: CompositeChildReference[];
  relativeBoundingBox: {
    min: [number, number, number];
    max: [number, number, number];
    span: [number, number, number];
  };
  totalCoveredCellsPerOccurrence: number;
  childCount: number;
  inlineExpandedBytesPerOccurrence: number;
  compositeDefinitionBytes: number;
  compositeRefBytesPerOccurrence: number;
  humanReadableSyntax: string;
}

export interface CompositeOccurrence {
  occurrenceId: string;
  blockId: number;
  originCellId: number;
  originCoord: Coordinate3D;
  coveredCells: number[];
  childOccurrences: {
    childDictId: number;
    originCellId: number;
    originCoord: Coordinate3D;
    coveredCells: number[];
    symbols: string[];
  }[];
  tokens: string[];
  sequenceIndices: number[];
}

export interface CompositeScore {
  signature: string;
  occurrenceCount: number;
  expandedChildCost: number;       // What children cost without Funnel 6 composition (either via Funnel 5 dict refs or inline)
  compositeDefinitionCost: number; // Bytes to define the composite in the composite table
  referenceCost: number;           // Bytes to reference the composite (occurrenceCount * refBytes)
  totalCompositeCost: number;      // compositeDefinitionCost + referenceCost
  actualSavings: number;           // expandedChildCost - totalCompositeCost
  savingsRatio: number;            // expandedChildCost / totalCompositeCost
  breakEvenOccurrences: number;    // ceil(compositeDefinitionCost / (expandedCostPerOcc - refCostPerOcc))
  isProfitable: boolean;
  recommendation: 'USE_COMPOSITE' | 'KEEP_CHILDREN' | 'DISQUALIFIED_UNPROFITABLE' | 'DISQUALIFIED_CROSS_BLOCK' | 'DISQUALIFIED_CYCLE' | 'DISQUALIFIED_COVERAGE_ERROR';
}

export interface CompositeCandidate {
  candidateId: string;
  signature: string;
  canonical: CanonicalComposite;
  occurrences: CompositeOccurrence[];
  occurrenceCount: number;
  blockId: number;
  isCrossBlock: boolean;
  score: CompositeScore;
  coverageValidation: CompositeCoverageValidation;
}

export interface CompositeEntry {
  compositeId: number;             // 1-based unique identifier (1, 2, 3...)
  signature: string;
  canonical: CanonicalComposite;
  score: CompositeScore;
  occurrencesCount: number;
  occurrences?: CompositeOccurrence[];
  binaryPayload: Uint8Array;
  binaryByteLength: number;
}

export interface CompositeCoverageValidation {
  coveredCells: number[];
  missingCells: number[];
  duplicateCells: number[];
  unexpectedCells: number[];
  isValid: boolean;
  error?: string;
}

export interface HierarchyCycleValidation {
  hasCycle: boolean;
  cycleNodes: number[];
  status: 'ACYCLIC' | 'CYCLE_DETECTED';
  message: string;
}

export interface SpatialHierarchyDictionary {
  version: 3;
  level2Dictionary: SpatialPatternDictionary; // Funnel 5 pattern dictionary
  composites: CompositeEntry[];               // Funnel 6 composite entries
  compositesMap: Map<number, CompositeEntry>;
  signatureToCompositeIdMap: Map<string, number>;
  overheadMetrics: HierarchyOverheadMetrics;
  isApplied: boolean;
  maxDepthEnforced: 3;
  timestamp: string;
}

export interface HierarchyOverheadMetrics {
  // Funnel 5 Dictionary
  dictionarySectionBytes: number;
  totalDictEntriesBytes: number;
  totalDictRefRecordsBytes: number;
  
  // Funnel 6 Composites
  compositeHeaderBytes: number;
  totalCompositeDefinitionsBytes: number;
  totalCompositeSectionBytes: number;
  totalCompositeRefRecordsBytes: number;
  
  // Raw & Inline Records
  totalInlineRuleRecordsBytes: number;
  totalRawRecordsBytes: number;
  
  // Overall Costs
  funnel4Bytes: number;
  funnel5Bytes: number;
  funnel6Bytes: number;
  
  grossSavingsVsFunnel5Bytes: number;
  netHierarchySavingsVsFunnel5Bytes: number;
  totalSavingsVsOriginalBytes: number;
  
  isFunnel6Beneficial: boolean;
  acceptedCompositeCount: number;
  rejectedCompositeCount: number;
  totalCompositeReferencesCount: number;
}

export interface Compact3DArtifactV3 {
  format: 'compact3d';
  version: 3;
  sourceFormat: '3dmemory';
  timestamp: string;
  hasDictionary: boolean;
  hasComposites: boolean;
  dictionary: {
    entryCount: number;
    totalDictBytes: number;
    entries: {
      dictId: number;
      ruleType: SpatialSegmentType;
      signature: string;
      byteLength: number;
    }[];
  } | null;
  composites: {
    compositeCount: number;
    totalCompositeBytes: number;
    entries: {
      compositeId: number;
      childCount: number;
      signature: string;
      byteLength: number;
      children: {
        childDictId: number;
        relativeOffset: [number, number, number];
        order: number;
      }[];
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
    funnel4Bytes: number;
    funnel5Bytes: number;
    funnel6Bytes: number;
    additionalSavingsVsFunnel5Bytes: number;
    totalSavingsVsOriginalBytes: number;
    reductionPercent: number;
    compressionRatio: number;
    isHierarchyWinner: boolean;
  };
}

export interface SpatialHierarchyEncoderResult {
  plan: EncodingPlan;
  funnel5Dictionary: SpatialPatternDictionary;
  hierarchyDictionary: SpatialHierarchyDictionary;
  candidates: CompositeCandidate[];
  acceptedComposites: CompositeEntry[];
  rejectedComposites: CompositeCandidate[];
  artifact: Compact3DArtifactV3 | null;
  binaryBuffer: Uint8Array;
  hexDump: string;
  measurement: {
    original3dBytes: number;
    funnel4Bytes: number;
    funnel5Bytes: number;
    funnel6Bytes: number;
    funnel6DictionaryBytes: number;
    funnel6CompositeBytes: number;
    funnel6ReferenceBytes: number;
    funnel6RawBytes: number;
    additionalSavingsVsFunnel5: number;
    totalSavingsVsOriginal: number;
    reductionPercent: number;
    compressionRatio: number;
    isHierarchyApplied: boolean;
    logicalChecksum: string;
    compactChecksum: string;
    durationMs: number;
  };
  cycleValidation: HierarchyCycleValidation;
  coverageValid: boolean;
  isValid: boolean;
  status: 'ENCODED' | 'ENCODING_FAIL' | 'COMPOSITE_REJECTED' | 'CYCLE_DETECTED';
  statusMessage: string;
}

export interface HierarchyDecodeResult {
  rootMemory: RootMemory;
  totalBlocksDecoded: number;
  totalActiveCellsDecoded: number;
  totalRecordsProcessed: number;
  totalCompositesExpanded: number;
  totalDictEntriesReferenced: number;
  totalRawCellsDecoded: number;
  checksums: {
    logicalMemoryChecksum: string;
    reconstructedChecksum: string;
    matches: boolean;
  };
  durationMs: number;
  isLossless: boolean;
}

export interface HierarchyTestCase {
  testId: string;
  testName: string;
  description: string;
  inputDescription: string;
  expectedCompositesAccepted: boolean;
  actualCompositesAccepted?: boolean;
  originalBytes: number;
  funnel4Bytes: number;
  funnel5Bytes: number;
  funnel6Bytes: number;
  funnel6DictionaryBytes: number;
  funnel6CompositeBytes: number;
  funnel6ReferenceBytes: number;
  funnel6RawBytes: number;
  additionalSavingsVsFunnel5: number;
  totalSavingsVsOriginal: number;
  acceptedCompositeCount: number;
  cycleDetected: boolean;
  coverageValid: boolean;
  roundtripPassed: boolean;
  passed: boolean;
  details: string;
}

export interface HierarchyTestSuiteResult {
  suiteName: 'Funnel 6: Hierarchical Spatial Composition Test Suite';
  totalTests: number;
  passedCount: number;
  failedCount: number;
  determinismPassed: boolean;
  totalOriginalBytes: number;
  totalFunnel4Bytes: number;
  totalFunnel5Bytes: number;
  totalFunnel6Bytes: number;
  overallFunnel6SavingsVsFunnel5Bytes: number;
  overallFunnel6SavingsVsFunnel5Percent: number;
  overallTotalSavingsVsOriginalPercent: number;
  results: HierarchyTestCase[];
  timestamp: string;
}

export interface HierarchyDatasetBenchmark {
  datasetId: string;
  datasetName: string;
  category: string;
  cellCount: number;
  activeCellCount: number;
  originalBytes: number;
  funnel4Bytes: number;
  funnel5Bytes: number;
  funnel6Bytes: number;
  funnel6DictionaryBytes: number;
  funnel6CompositeBytes: number;
  funnel6ReferenceBytes: number;
  funnel6RawBytes: number;
  additionalSavingsVsFunnel5Bytes: number;
  additionalSavingsVsFunnel5Percent: number;
  totalSavingsVsOriginalBytes: number;
  reductionPercent: number;
  compressionRatio: number;
  acceptedCompositesCount: number;
  isFunnel6Winner: boolean;
  status: 'COMPOSITE_BENEFICIAL' | 'FUNNEL5_PRESERVED' | 'RAW_BYPASS';
}

export interface HierarchyBenchmarkReport {
  title: string;
  timestamp: string;
  datasets: HierarchyDatasetBenchmark[];
  summary: {
    totalDatasets: number;
    totalOriginalBytes: number;
    totalFunnel4Bytes: number;
    totalFunnel5Bytes: number;
    totalFunnel6Bytes: number;
    totalFunnel6DictionaryBytes: number;
    totalFunnel6CompositeBytes: number;
    totalFunnel6ReferenceBytes: number;
    totalFunnel6RawBytes: number;
    overallSavingsVsFunnel5Bytes: number;
    overallSavingsVsFunnel5Percent: number;
    overallSavingsVsOriginalBytes: number;
    overallSavingsVsOriginalPercent: number;
    overallCompressionRatio: number;
    bestCompositeDataset: string;
    bestCompositeSavingsPercent: number;
    worstCompositeDataset: string;
    funnel6WinsCount: number;
  };
}

export interface HierarchicalSpatialDecodeResult {
  reconstructedMemory: RootMemory;
  formatVersion: number;
  magicHeader: string;
  checksumMatched: boolean;
  expectedChecksum: string;
  actualChecksum: string;
  decompressionTimeMs: number;
  totalBlocksDecoded: number;
  totalCellsDecoded: number;
  totalActiveCellsDecoded: number;
  dictionaryEntriesDecoded: number;
  compositeEntriesDecoded: number;
  recordsDecodedCount: number;
  isLossless: boolean;
  checksums: {
    matches: boolean;
    logicalMemoryChecksum: string;
    reconstructedChecksum: string;
  };
  exactComparison?: {
    isExactMatch: boolean;
    missingCells: number;
    duplicateCells: number;
    unexpectedCells: number;
    matchPercent: number;
  };
}

