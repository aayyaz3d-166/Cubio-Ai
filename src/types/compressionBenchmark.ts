/**
 * 3D Memory Studio - Funnel 4: Compression Proof & Benchmark Types
 * 
 * Defines all schemas, metrics, rule evaluations, break-even measurements,
 * scale datasets, and report structures for deterministic byte-level benchmarks.
 */

import { RootMemory } from './memory';
import { SpatialSegmentType } from './spatialEncoder';

export type CompressionStatus = 'COMPRESSED' | 'NO_COMPRESSION' | 'INVALID';

export interface BenchmarkDatasetResult {
  datasetId: string;
  datasetName: string;
  category: 'SYNTHETIC_PATTERN' | 'NATURAL_TEXT' | 'ENTROPY' | 'MULTI_BLOCK' | 'ADVERSARIAL';
  description: string;

  // Real Measured Serialized Bytes
  originalBytes: number;
  compactBytes: number;
  savingsBytes: number;
  reductionPercent: number;
  compressionRatio: number;
  compressionStatus: CompressionStatus;

  // Cell Coverage & Partitioning
  totalActiveCells: number;
  ruleCoveredCells: number;
  rawCoveredCells: number;
  ruleCoveragePercent: number;
  rawFallbackPercent: number;

  // Record Counts
  recordCount: number;
  rawRecordCount: number;
  ruleRecordCount: number;
  spatialRunCount: number;
  repetitionCount: number;
  clusterCount: number;
  repeatedShapeCount: number;
  sequencePathCount: number;

  // Verification & Integrity
  roundtripStatus: 'PASS' | 'FAIL';
  checksumStatus: 'MATCH' | 'MISMATCH';
  originalChecksum: string;
  decodedChecksum: string;
  artifactChecksum: string;

  // Timing
  encodingTimeMs: number;
  decodingTimeMs: number;
  totalTimeMs: number;

  // Memory instance reference generator
  blockCount: number;
  samplePreview: string;
}

export interface RuleBenchmarkMetric {
  ruleType: SpatialSegmentType;
  ruleName: string;
  description: string;
  breakEvenLength: number;
  breakEvenDescription: string;
  minimumSizeBytes: number;
  maximumSizeBytes: number;
  averageSizeBytes: number;
  averageSavingsPercent: number;
  usageCount: number;
  failureCount: number;
  bestUseCases: string;
}

export interface BreakEvenPoint {
  patternSize: number; // e.g. 1, 2, 3, 4, 5, 6, 7, 8, 10, 16 cells
  rawBytes: number;
  ruleBytes: number;
  savingsBytes: number;
  isRuleCheaper: boolean;
}

export interface RuleBreakEvenAnalysis {
  ruleType: SpatialSegmentType;
  ruleName: string;
  breakEvenUnits: number;
  unitLabel: string;
  points: BreakEvenPoint[];
}

export interface ScaleBenchmarkResult {
  tokenCount: number;
  label: string;
  originalBytes: number;
  compactBytes: number;
  savingsBytes: number;
  reductionPercent: number;
  compressionRatio: number;
  encodingTimeMs: number;
  decodingTimeMs: number;
  blockCount: number;
  compressionStatus: CompressionStatus;
}

export interface MultiBlockAnalysisResult {
  blockCount: number;
  totalCapacity: number;
  activeCells: number;
  originalBytes: number;
  compactBytes: number;
  blockHeaderOverheadBytes: number;
  blockHeaderOverheadPercent: number;
  reductionPercent: number;
  compressionRatio: number;
}

export interface RegularityCurvePoint {
  regularityPercent: number; // 1%, 5%, 10%, 20%, 40%, 60%, 80%, 100%
  description: string;
  originalBytes: number;
  compactBytes: number;
  reductionPercent: number;
  compressionRatio: number;
  compressionStatus: CompressionStatus;
}

export interface DeterminismVerificationResult {
  passed: boolean;
  runCount: number;
  identicalByteLengths: boolean;
  identicalChecksums: boolean;
  identicalRulePlans: boolean;
  identicalCompressionRatios: boolean;
  details: string;
}

export interface OverallBenchmarkSummary {
  totalDatasets: number;
  passedRoundtripCount: number;
  compressedDatasetsCount: number;
  noCompressionDatasetsCount: number;
  invalidDatasetsCount: number;

  totalOriginalBytes: number;
  totalCompactBytes: number;
  totalSavingsBytes: number;
  overallReductionPercent: number;
  overallCompressionRatio: number;

  bestDataset: {
    datasetId: string;
    datasetName: string;
    reductionPercent: number;
    compressionRatio: number;
  };
  worstDataset: {
    datasetId: string;
    datasetName: string;
    reductionPercent: number;
    compressionRatio: number;
  };

  bestRule: {
    ruleType: SpatialSegmentType;
    ruleName: string;
    averageSavingsPercent: number;
  };
  worstRule: {
    ruleType: SpatialSegmentType;
    ruleName: string;
    averageSavingsPercent: number;
  };

  averageReductionPercent: number;
  medianReductionPercent: number;

  totalExecutionTimeMs: number;
}

export interface CompressionBenchmarkSuiteResult {
  suiteId: string;
  timestamp: string;
  summary: OverallBenchmarkSummary;
  datasetResults: BenchmarkDatasetResult[];
  ruleMetrics: RuleBenchmarkMetric[];
  breakEvenAnalyses: RuleBreakEvenAnalysis[];
  scaleResults: ScaleBenchmarkResult[];
  multiBlockResults: MultiBlockAnalysisResult[];
  regularityCurve: RegularityCurvePoint[];
  determinismVerification: DeterminismVerificationResult;
  scientificCompliance: {
    zeroTheoreticalEstimations: true;
    allMetadataIncluded: true;
    roundtripLosslessEnforced: true;
    deterministicPrngUsed: true;
  };
}
