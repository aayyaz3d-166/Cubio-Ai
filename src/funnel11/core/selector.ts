/**
 * 3D Memory Studio - Funnel 11: Candidate Selector & Conflict Resolution Engine
 * 
 * Takes candidate families from Funnel 10, scores their byte profitability,
 * resolves spatial cell overlaps deterministically, and selects winning composite entries.
 * 
 * Invariants:
 * - Deterministic selection independent of input order.
 * - No cell double-counting or multi-composite claiming.
 * - Exact serialized binary buffers created for accepted definitions & references.
 */

import { CompositeCandidateFamily, CompositeCandidateOccurrence } from '../../funnel10/types/candidate';
import { CandidateProfitabilityScore } from '../types/profitability';
import {
  CompositeSelectionResult,
  RejectedSelectionEntry,
  SelectedCompositeEntry,
  SelectedCompositeOccurrence,
  SelectionOptions,
} from '../types/selection';
import { computeCompositeCostBreakdown } from './costModel';
import { scoreCandidateFamily } from './scorer';
import { serializeCompositeDefinition, serializeCompositeReference } from './serializer';
import { validateCoverageIntegrity } from './validator';

/**
 * Deterministically selects profitable composite entries and resolves cell conflicts.
 */
export function selectCompositeEntries(
  families: readonly CompositeCandidateFamily[],
  options?: SelectionOptions
): CompositeSelectionResult {
  const minSavings = options?.minSavingsBytes ?? 1;
  const minReduction = options?.minReductionPercent ?? 0;
  const maxEntries = options?.maxCompositeEntries ?? 256;

  // 1. Initial scoring of all candidate families
  const allScores: CandidateProfitabilityScore[] = [];
  const candidateMap = new Map<string, { family: CompositeCandidateFamily; score: CandidateProfitabilityScore }>();

  // Sort input families deterministically by canonical signature first
  const deterministicInput = [...families].sort((a, b) => a.signature.localeCompare(b.signature));

  for (let i = 0; i < deterministicInput.length; i++) {
    const family = deterministicInput[i];
    const score = scoreCandidateFamily(family, i + 1);
    allScores.push(score);
    candidateMap.set(family.signature, { family, score });
  }

  // 2. Filter initial candidates that are structurally valid and profitable
  const initialProfitable = allScores.filter(
    (s) => s.isProfitable && s.cost.actualSavings >= minSavings && s.cost.reductionPercent >= minReduction
  );

  // 3. Deterministic sorting: Highest actualSavings DESC, highest reductionPercent DESC, signature ASC, candidateId ASC
  initialProfitable.sort((a, b) => {
    if (b.cost.actualSavings !== a.cost.actualSavings) {
      return b.cost.actualSavings - a.cost.actualSavings;
    }
    if (b.cost.reductionPercent !== a.cost.reductionPercent) {
      return b.cost.reductionPercent - a.cost.reductionPercent;
    }
    const sigComp = a.signature.localeCompare(b.signature);
    if (sigComp !== 0) return sigComp;
    return a.candidateId.localeCompare(b.candidateId);
  });

  // 4. Greedy Overlap Resolution
  const claimedCellIds = new Set<number>();
  const selectedEntries: SelectedCompositeEntry[] = [];
  const rejectedEntries: RejectedSelectionEntry[] = [];

  // Track initially rejected families
  for (const s of allScores) {
    if (!s.isProfitable || s.cost.actualSavings < minSavings || s.cost.reductionPercent < minReduction) {
      const family = candidateMap.get(s.signature)!.family;
      rejectedEntries.push({
        candidateId: s.candidateId,
        signature: s.signature,
        occurrenceCount: s.occurrenceCount,
        reason: s.rejectionReason ?? 'NO_ACTUAL_BYTE_SAVINGS',
        diagnosticMessage: s.diagnosticMessage,
        blockIds: s.blockIds,
        initialSavings: s.cost.actualSavings,
      });
    }
  }

  let nextCompositeId = 1;

  for (const candidateScore of initialProfitable) {
    if (selectedEntries.length >= maxEntries) {
      rejectedEntries.push({
        candidateId: candidateScore.candidateId,
        signature: candidateScore.signature,
        occurrenceCount: candidateScore.occurrenceCount,
        reason: 'NO_ACTUAL_BYTE_SAVINGS',
        diagnosticMessage: `Dictionary table limit reached (${maxEntries} max composite entries).`,
        blockIds: candidateScore.blockIds,
        initialSavings: candidateScore.cost.actualSavings,
      });
      continue;
    }

    const { family } = candidateMap.get(candidateScore.signature)!;

    // Filter occurrences that do NOT conflict with already claimed cells
    const validOccurrences: CompositeCandidateOccurrence[] = [];

    for (const occ of family.occurrences) {
      const hasConflict = occ.coveredCells.some((cellId) => claimedCellIds.has(cellId));
      if (!hasConflict) {
        validOccurrences.push(occ);
      }
    }

    if (validOccurrences.length === 0) {
      rejectedEntries.push({
        candidateId: candidateScore.candidateId,
        signature: candidateScore.signature,
        occurrenceCount: family.occurrenceCount,
        reason: 'CELL_OVERLAP_CONFLICT',
        diagnosticMessage: `All ${family.occurrenceCount} occurrences conflict with previously accepted higher-priority composites.`,
        blockIds: family.blockIds,
        initialSavings: candidateScore.cost.actualSavings,
      });
      continue;
    }

    // Re-evaluate cost breakdown with remaining non-overlapping occurrences
    const revisedCost = computeCompositeCostBreakdown(family.canonical, validOccurrences.length);

    if (revisedCost.actualSavings < minSavings || revisedCost.reductionPercent < minReduction) {
      rejectedEntries.push({
        candidateId: candidateScore.candidateId,
        signature: candidateScore.signature,
        occurrenceCount: validOccurrences.length,
        reason: 'NO_ACTUAL_BYTE_SAVINGS',
        diagnosticMessage: `Unprofitable after overlap resolution: surviving occurrences (${validOccurrences.length}/${family.occurrenceCount}) yield ${revisedCost.actualSavings}B savings (requires >= ${revisedCost.breakEvenOccurrences} occurrences to break even).`,
        blockIds: family.blockIds,
        initialSavings: candidateScore.cost.actualSavings,
      });
      continue;
    }

    // Candidate Accepted!
    const compositeId = nextCompositeId++;
    const formattedId = `C11-${String(compositeId).padStart(3, '0')}`;

    // Serialize definition
    const definitionBytes = serializeCompositeDefinition(family.canonical, compositeId);

    // Serialize surviving occurrences
    const selectedOccurrences: SelectedCompositeOccurrence[] = [];
    const entryCoveredCells: number[] = [];

    for (const occ of validOccurrences) {
      const referenceBytes = serializeCompositeReference(occ, compositeId);
      selectedOccurrences.push({
        occurrenceId: occ.occurrenceId,
        compositeId,
        blockId: occ.blockId,
        originCellId: occ.originCellId,
        originCoord: occ.originCoord,
        coveredCells: occ.coveredCells,
        sequenceIndices: occ.sequenceIndices,
        referenceBytes,
        referenceByteLength: referenceBytes.length,
      });

      // Claim cells
      for (const cellId of occ.coveredCells) {
        claimedCellIds.add(cellId);
        entryCoveredCells.push(cellId);
      }
    }

    const updatedScore: CandidateProfitabilityScore = {
      candidateId: candidateScore.candidateId,
      signature: family.signature,
      fingerprint: family.fingerprint,
      occurrenceCount: validOccurrences.length,
      blockIds: Array.from(new Set(validOccurrences.map((o) => o.blockId))),
      cost: revisedCost,
      isProfitable: true,
      status: 'ACCEPTED',
      diagnosticMessage: `Accepted: ${revisedCost.actualSavings}B net savings (${revisedCost.reductionPercent}% reduction) across ${validOccurrences.length} non-overlapping occurrences.`,
    };

    selectedEntries.push({
      compositeId,
      formattedId,
      canonical: family.canonical,
      signature: family.signature,
      fingerprint: family.fingerprint,
      score: updatedScore,
      occurrences: selectedOccurrences,
      occurrenceCount: selectedOccurrences.length,
      blockIds: updatedScore.blockIds,
      coveredCellIds: entryCoveredCells,
      definitionBytes,
      definitionByteLength: definitionBytes.length,
    });
  }

  // 5. Aggregate Metrics
  let totalExpandedCost = 0;
  let totalDefinitionCost = 0;
  let totalReferenceCost = 0;
  let totalAcceptedOccurrences = 0;
  let totalCoveredCells = 0;

  for (const entry of selectedEntries) {
    totalExpandedCost += entry.score.cost.expandedChildCost;
    totalDefinitionCost += entry.score.cost.compositeDefinitionCost;
    totalReferenceCost += entry.score.cost.totalReferenceCost;
    totalAcceptedOccurrences += entry.occurrenceCount;
    totalCoveredCells += entry.coveredCellIds.length;
  }

  const totalSelectedCost = totalDefinitionCost + totalReferenceCost;
  const netSavingsBytes = totalExpandedCost - totalSelectedCost;
  const overallReductionPercent =
    totalExpandedCost > 0
      ? Math.round(((netSavingsBytes / totalExpandedCost) * 100) * 10000) / 10000
      : 0;
  const overallCompressionRatio =
    totalSelectedCost > 0
      ? Math.round((totalExpandedCost / totalSelectedCost) * 10000) / 10000
      : 1.0;

  // 6. Coverage Integrity Validation
  const allActiveCellIds = options?.allActiveCellIds ?? Array.from(claimedCellIds);
  const coverageValidation = validateCoverageIntegrity(selectedEntries, allActiveCellIds);

  const statusMessage =
    selectedEntries.length > 0
      ? `Funnel 11 Selection Complete: ${selectedEntries.length} profitable composites accepted (${totalAcceptedOccurrences} occurrences), saving ${netSavingsBytes} bytes (${overallReductionPercent}% reduction vs Level 2 expansion).`
      : `Funnel 11 Selection Complete: 0 profitable composites accepted out of ${families.length} candidate families analyzed.`;

  return {
    selectedEntries,
    rejectedEntries,
    allScores,
    aggregateMetrics: {
      totalExpandedCost,
      totalDefinitionCost,
      totalReferenceCost,
      totalSelectedCost,
      netSavingsBytes,
      overallReductionPercent,
      overallCompressionRatio,
      totalAcceptedOccurrences,
      totalCoveredCells,
    },
    coverageValidation,
    totalFamiliesAnalyzed: families.length,
    totalFamiliesAccepted: selectedEntries.length,
    totalFamiliesRejected: rejectedEntries.length,
    statusMessage,
  };
}
