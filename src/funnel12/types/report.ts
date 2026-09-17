/**
 * 3D Memory Studio - Funnel 12: Reporting & Benchmark Types
 */

import { Compact3DArtifactV4 } from './artifact';

export interface Funnel12TestResult {
  readonly testId: string;
  readonly name: string;
  readonly passed: boolean;
  readonly details: string;
  readonly durationMs?: number;
  readonly artifactBytes?: number;
  readonly savingsBytes?: number;
}

export interface Funnel12SuiteReport {
  readonly suiteName: string;
  readonly totalTests: number;
  readonly passedTests: number;
  readonly failedTests: number;
  readonly allPassed: boolean;
  readonly totalDurationMs: number;
  readonly results: readonly Funnel12TestResult[];
}

export interface Funnel12DatasetBenchmark {
  readonly name: string;
  readonly category: string;
  readonly cellCount: number;
  readonly blockCount: number;
  readonly originalBytes: number;
  readonly funnel4Bytes: number;
  readonly funnel5Bytes: number;
  readonly funnel11SelectedBytes: number;
  readonly funnel12ArtifactBytes: number;
  readonly breakdown: {
    readonly headerBytes: number;
    readonly dictionaryBytes: number;
    readonly compositeDefBytes: number;
    readonly compositeRefBytes: number;
    readonly primitiveBytes: number;
    readonly rawBytes: number;
    readonly checksumBytes: number;
  };
  readonly totalSavingsVsOriginal: number;
  readonly additionalSavingsVsFunnel5: number;
  readonly additionalSavingsVsFunnel11: number;
  readonly reductionPercentVsOriginal: number;
  readonly compressionRatio: number;
}

export interface Funnel12BenchmarkReport {
  readonly datasets: readonly Funnel12DatasetBenchmark[];
  readonly aggregateOriginalBytes: number;
  readonly aggregateFunnel4Bytes: number;
  readonly aggregateFunnel5Bytes: number;
  readonly aggregateFunnel11SelectedBytes: number;
  readonly aggregateFunnel12ArtifactBytes: number;
  readonly totalSavingsVsOriginal: number;
  readonly totalSavingsVsFunnel5: number;
  readonly overallReductionPercent: number;
  readonly overallCompressionRatio: number;
}
