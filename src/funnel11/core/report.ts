/**
 * 3D Memory Studio - Funnel 11: Comprehensive Research Report Generator
 * 
 * Aggregates candidate evaluations, selection results, coverage diagnostics,
 * and byte metrics into a complete research report.
 */

import { CandidateProfitabilityReportItem, Funnel11Report } from '../types/report';
import { CompositeSelectionResult } from '../types/selection';

/**
 * Generates a full Funnel 11 Research Report from a Selection Result.
 */
export function generateFunnel11Report(
  selectionResult: CompositeSelectionResult,
  determinismVerified: boolean = true
): Funnel11Report {
  const candidates: CandidateProfitabilityReportItem[] = [];
  const rejectionBreakdown: Record<string, number> = {};

  const acceptedSigMap = new Map(selectionResult.selectedEntries.map((e) => [e.signature, e]));

  for (const score of selectionResult.allScores) {
    const acceptedEntry = acceptedSigMap.get(score.signature);
    const isAccepted = acceptedEntry !== undefined;

    const item: CandidateProfitabilityReportItem = {
      candidateId: score.candidateId,
      canonicalSignature: score.signature,
      occurrenceCount: isAccepted ? acceptedEntry.occurrenceCount : score.occurrenceCount,
      blockIds: score.blockIds,
      expandedChildCost: isAccepted ? acceptedEntry.score.cost.expandedChildCost : score.cost.expandedChildCost,
      compositeDefinitionCost: isAccepted ? acceptedEntry.score.cost.compositeDefinitionCost : score.cost.compositeDefinitionCost,
      referenceCost: isAccepted ? acceptedEntry.score.cost.totalReferenceCost : score.cost.totalReferenceCost,
      totalCompositeCost: isAccepted ? acceptedEntry.score.cost.totalCompositeCost : score.cost.totalCompositeCost,
      actualSavings: isAccepted ? acceptedEntry.score.cost.actualSavings : score.cost.actualSavings,
      reductionPercent: isAccepted ? acceptedEntry.score.cost.reductionPercent : score.cost.reductionPercent,
      compressionRatio: isAccepted ? acceptedEntry.score.cost.compressionRatio : score.cost.compressionRatio,
      status: isAccepted ? 'ACCEPTED' : 'REJECTED',
      rejectionReason: isAccepted ? undefined : score.rejectionReason ?? 'NO_ACTUAL_BYTE_SAVINGS',
    };

    candidates.push(item);

    if (!isAccepted) {
      const reason = item.rejectionReason ?? 'UNKNOWN';
      rejectionBreakdown[reason] = (rejectionBreakdown[reason] ?? 0) + 1;
    }
  }

  // Find best accepted composite (highest savings)
  let bestComposite: CandidateProfitabilityReportItem | undefined;
  const acceptedItems = candidates.filter((c) => c.status === 'ACCEPTED');
  if (acceptedItems.length > 0) {
    bestComposite = [...acceptedItems].sort((a, b) => b.actualSavings - a.actualSavings)[0];
  }

  // Find worst rejected composite (most negative savings)
  let worstRejectedComposite: CandidateProfitabilityReportItem | undefined;
  const rejectedItems = candidates.filter((c) => c.status === 'REJECTED');
  if (rejectedItems.length > 0) {
    worstRejectedComposite = [...rejectedItems].sort((a, b) => a.actualSavings - b.actualSavings)[0];
  }

  return {
    summary: {
      totalCandidateFamilies: selectionResult.totalFamiliesAnalyzed,
      profitableCandidateCount: selectionResult.totalFamiliesAccepted,
      rejectedCandidateCount: selectionResult.totalFamiliesRejected,
      totalAcceptedOccurrences: selectionResult.aggregateMetrics.totalAcceptedOccurrences,
      totalExpandedBytes: selectionResult.aggregateMetrics.totalExpandedCost,
      totalSelectedBytes: selectionResult.aggregateMetrics.totalSelectedCost,
      netSavingsBytes: selectionResult.aggregateMetrics.netSavingsBytes,
      overallReductionPercent: selectionResult.aggregateMetrics.overallReductionPercent,
      overallCompressionRatio: selectionResult.aggregateMetrics.overallCompressionRatio,
      bestComposite,
      worstRejectedComposite,
    },
    candidates,
    selectedEntries: selectionResult.selectedEntries,
    rejectionBreakdown,
    coverageIntegrity: {
      missingCells: selectionResult.coverageValidation.missingCellsCount,
      duplicateCells: selectionResult.coverageValidation.duplicateCellsCount,
      unexpectedCells: selectionResult.coverageValidation.unexpectedCellsCount,
      isIntegrityPassed: selectionResult.coverageValidation.isValid,
    },
    determinismVerified,
  };
}
