/**
 * 3D Memory Studio - Funnel 11: Report & Benchmark Types
 * 
 * Defines reporting structures for research diagnostics and multi-dataset benchmarks.
 */

import { CandidateProfitabilityScore } from './profitability';
import { CompositeSelectionResult, SelectedCompositeEntry } from './selection';

/**
 * Diagnostic report item for a candidate family
 */
export interface CandidateProfitabilityReportItem {
  readonly candidateId: string;
  readonly canonicalSignature: string;
  readonly occurrenceCount: number;
  readonly blockIds: readonly number[];
  readonly expandedChildCost: number;
  readonly compositeDefinitionCost: number;
  readonly referenceCost: number;
  readonly totalCompositeCost: number;
  readonly actualSavings: number;
  readonly reductionPercent: number;
  readonly compressionRatio: number;
  readonly status: 'ACCEPTED' | 'REJECTED';
  readonly rejectionReason?: string;
}

/**
 * Comprehensive Funnel 11 Research Report
 */
export interface Funnel11Report {
  readonly summary: {
    readonly totalCandidateFamilies: number;
    readonly profitableCandidateCount: number;
    readonly rejectedCandidateCount: number;
    readonly totalAcceptedOccurrences: number;
    readonly totalExpandedBytes: number;
    readonly totalSelectedBytes: number;
    readonly netSavingsBytes: number;
    readonly overallReductionPercent: number;
    readonly overallCompressionRatio: number;
    readonly bestComposite?: CandidateProfitabilityReportItem;
    readonly worstRejectedComposite?: CandidateProfitabilityReportItem;
  };
  readonly candidates: readonly CandidateProfitabilityReportItem[];
  readonly selectedEntries: readonly SelectedCompositeEntry[];
  readonly rejectionBreakdown: Readonly<Record<string, number>>;
  readonly coverageIntegrity: {
    readonly missingCells: number;
    readonly duplicateCells: number;
    readonly unexpectedCells: number;
    readonly isIntegrityPassed: boolean;
  };
  readonly determinismVerified: boolean;
}

/**
 * Benchmark record for a single dataset evaluated across funnels
 */
export interface Funnel11DatasetBenchmark {
  readonly datasetName: string;
  readonly category: string;
  readonly originalBytes: number;
  readonly funnel4Bytes: number;
  readonly funnel5Bytes: number;
  readonly funnel6CandidateExpandedBytes: number;
  readonly funnel11SelectedBytes: number;
  readonly candidateCount: number;
  readonly profitableCandidateCount: number;
  readonly rejectedCandidateCount: number;
  readonly additionalSavingsVsFunnel5Bytes: number;
  readonly additionalSavingsVsFunnel5Percent: number;
  readonly totalSavingsVsOriginalBytes: number;
  readonly totalSavingsVsOriginalPercent: number;
  readonly compressionRatioVsOriginal: number;
  readonly compressionRatioVsFunnel5: number;
  readonly isProfitableOverall: boolean;
}

/**
 * Multi-dataset benchmark report for Funnel 11
 */
export interface Funnel11BenchmarkReport {
  readonly suiteName: string;
  readonly totalDatasets: number;
  readonly datasets: readonly Funnel11DatasetBenchmark[];
  readonly aggregateOriginalBytes: number;
  readonly aggregateFunnel4Bytes: number;
  readonly aggregateFunnel5Bytes: number;
  readonly aggregateFunnel11Bytes: number;
  readonly aggregateSavingsVsFunnel5Bytes: number;
  readonly aggregateSavingsVsFunnel5Percent: number;
  readonly aggregateSavingsVsOriginalBytes: number;
  readonly aggregateSavingsVsOriginalPercent: number;
  readonly aggregateCompressionRatio: number;
}
