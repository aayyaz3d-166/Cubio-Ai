/**
 * 3D Memory Studio - Funnel 11: Exact Binary Cost Model
 * 
 * Computes exact deterministic serialized byte costs and savings for Level 3 Composite Candidates.
 * 
 * Invariants:
 * - 100% based on exact serialized binary lengths.
 * - Zero theoretical assumptions or approximations.
 * - Handles zero-cost / edge cases safely.
 */

import { CompositeCandidateFamily } from '../../funnel10/types/candidate';
import { CanonicalComposite } from '../../funnel9/types/canonical';
import { CompositeCostBreakdown } from '../types/profitability';
import {
  getCompositeDefinitionByteLength,
  getCompositeReferenceByteLength,
  getExpandedCostPerOccurrence,
} from './serializer';

/**
 * Computes the exact deterministic byte cost breakdown for a canonical composite and occurrence count.
 */
export function computeCompositeCostBreakdown(
  canonical: CanonicalComposite,
  occurrenceCount: number
): CompositeCostBreakdown {
  const childCount = canonical.childCount;

  // 1. Definition cost in bytes
  const compositeDefinitionCost = getCompositeDefinitionByteLength(childCount);

  // 2. Reference cost per occurrence in bytes
  const referenceCostPerOccurrence = getCompositeReferenceByteLength();
  const totalReferenceCost = occurrenceCount * referenceCostPerOccurrence;

  // 3. Total composite representation cost in bytes
  const totalCompositeCost = compositeDefinitionCost + totalReferenceCost;

  // 4. Expanded child cost without composite (Level 2 dictionary references)
  const expandedCostPerOccurrence = getExpandedCostPerOccurrence(childCount);
  const expandedChildCost = occurrenceCount * expandedCostPerOccurrence;

  // 5. Net actual savings in bytes
  const actualSavings = expandedChildCost - totalCompositeCost;

  // 6. Percentage reduction in bytes
  const reductionPercent =
    expandedChildCost > 0
      ? Math.round(((actualSavings / expandedChildCost) * 100) * 10000) / 10000
      : 0;

  // 7. Exact compression ratio
  const compressionRatio =
    totalCompositeCost > 0
      ? Math.round((expandedChildCost / totalCompositeCost) * 10000) / 10000
      : 1.0;

  // 8. Break-even threshold
  const savingsPerOccurrence = expandedCostPerOccurrence - referenceCostPerOccurrence;
  const breakEvenOccurrences =
    savingsPerOccurrence > 0
      ? Math.ceil(compositeDefinitionCost / savingsPerOccurrence)
      : Infinity;

  return {
    compositeDefinitionCost,
    referenceCostPerOccurrence,
    totalReferenceCost,
    totalCompositeCost,
    expandedChildCost,
    expandedCostPerOccurrence,
    actualSavings,
    reductionPercent,
    compressionRatio,
    breakEvenOccurrences,
  };
}

/**
 * Computes the exact cost breakdown for a Funnel 10 candidate family.
 */
export function computeFamilyCostBreakdown(
  family: CompositeCandidateFamily,
  overrideOccurrenceCount?: number
): CompositeCostBreakdown {
  const occCount = overrideOccurrenceCount ?? family.occurrenceCount;
  return computeCompositeCostBreakdown(family.canonical, occCount);
}
