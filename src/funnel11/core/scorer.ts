/**
 * 3D Memory Studio - Funnel 11: Candidate Profitability Scorer
 * 
 * Evaluates candidate families discovered by Funnel 10 against the exact binary cost model.
 * 
 * Invariants:
 * - Deterministic scoring.
 * - Rejects candidate if totalCompositeCost >= expandedChildCost.
 * - Rejection reason 'NO_ACTUAL_BYTE_SAVINGS' applied for unprofitable candidates.
 */

import { CompositeCandidateFamily } from '../../funnel10/types/candidate';
import { CandidateProfitabilityScore, Funnel11RejectionReason, ProfitabilityStatus } from '../types/profitability';
import { computeFamilyCostBreakdown } from './costModel';
import { validateCandidateFamily } from './validator';

/**
 * Deterministically generates a consistent candidate ID string from a canonical signature.
 */
export function generateDeterministicCandidateId(signature: string, index?: number): string {
  // FNV-1a 32-bit hash for deterministic stable ID
  let hash = 0x811c9dc5;
  for (let i = 0; i < signature.length; i++) {
    hash ^= signature.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
    hash >>>= 0;
  }
  const hex = hash.toString(16).padStart(8, '0').toUpperCase();
  const idxStr = index !== undefined ? `${String(index).padStart(3, '0')}_` : '';
  return `C11_${idxStr}${hex.slice(0, 6)}`;
}

/**
 * Scores an individual candidate family for byte profitability.
 */
export function scoreCandidateFamily(
  family: CompositeCandidateFamily,
  candidateIndex?: number
): CandidateProfitabilityScore {
  const candidateId = generateDeterministicCandidateId(family.signature, candidateIndex);

  // 1. Run Structural & Funnel 11 Invariant Validation
  const validation = validateCandidateFamily(family);
  if (!validation.isValid) {
    const cost = computeFamilyCostBreakdown(family);
    return {
      candidateId,
      signature: family.signature,
      fingerprint: family.fingerprint,
      occurrenceCount: family.occurrenceCount,
      blockIds: family.blockIds,
      cost,
      isProfitable: false,
      status: 'REJECTED',
      rejectionReason: validation.rejectionReason,
      diagnosticMessage: validation.message,
    };
  }

  // 2. Compute Exact Binary Cost Breakdown
  const cost = computeFamilyCostBreakdown(family);

  // 3. Strict Acceptance Rule: totalCompositeCost < expandedChildCost (actualSavings > 0)
  if (cost.actualSavings <= 0) {
    return {
      candidateId,
      signature: family.signature,
      fingerprint: family.fingerprint,
      occurrenceCount: family.occurrenceCount,
      blockIds: family.blockIds,
      cost,
      isProfitable: false,
      status: 'REJECTED',
      rejectionReason: 'NO_ACTUAL_BYTE_SAVINGS',
      diagnosticMessage: `Unprofitable: total composite cost (${cost.totalCompositeCost}B) >= expanded child cost (${cost.expandedChildCost}B). Net loss: ${-cost.actualSavings}B. Requires >= ${cost.breakEvenOccurrences} occurrences to break even.`,
    };
  }

  // 4. Candidate is Accepted & Profitable
  return {
    candidateId,
    signature: family.signature,
    fingerprint: family.fingerprint,
    occurrenceCount: family.occurrenceCount,
    blockIds: family.blockIds,
    cost,
    isProfitable: true,
    status: 'ACCEPTED',
    diagnosticMessage: `Profitable: saves ${cost.actualSavings} bytes (${cost.reductionPercent}% reduction, ${cost.compressionRatio}x ratio) across ${family.occurrenceCount} occurrences.`,
  };
}

/**
 * Scores all candidate families deterministically.
 */
export function scoreAllCandidateFamilies(
  families: readonly CompositeCandidateFamily[]
): CandidateProfitabilityScore[] {
  // Sort families deterministically by signature before indexing
  const sortedFamilies = [...families].sort((a, b) => a.signature.localeCompare(b.signature));

  return sortedFamilies.map((family, idx) => scoreCandidateFamily(family, idx + 1));
}
