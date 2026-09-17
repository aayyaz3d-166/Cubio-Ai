/**
 * CUBiO AI — Phase 25: Self-Optimization Center Engine
 * Protocol: CUBIO-P25-INTELLIGENCE-CORE-GENESIS-001
 * 
 * Implements measurable engineering benchmarking comparing Current vs Candidates A, B, C.
 */

import {
  OptimizationCandidateRow,
  SelfOptimizationMatrix,
  OptimizationCandidateStatus,
} from '../types';

export const CURRENT_PRODUCTION_BASELINE: OptimizationCandidateRow = {
  id: 'CUBIO-STAGE1-BASE',
  label: 'Current (Stage 1 Base)',
  accuracyPct: 91.2,
  latencyMs: 42.0,
  memoryMb: 180.0,
  regressions: 0,
  status: 'BASE',
};

export const INITIAL_OPTIMIZATION_CANDIDATES: readonly OptimizationCandidateRow[] = [
  {
    id: 'CANDIDATE-A',
    label: 'Candidate A (Prefix Trie Indexing)',
    accuracyPct: 93.4,
    latencyMs: 38.0,
    memoryMb: 184.0,
    regressions: 0,
    status: 'CANDIDATE',
  },
  {
    id: 'CANDIDATE-B',
    label: 'Candidate B (Aggressive Beam Search)',
    accuracyPct: 94.1,
    latencyMs: 51.0,
    memoryMb: 220.0,
    regressions: 1, // Has 1 regression -> MUST BE REJECTED
    status: 'REJECT',
  },
  {
    id: 'CANDIDATE-C',
    label: 'Candidate C (Harmonic 369 Cache + Quantized Weights)',
    accuracyPct: 93.8,
    latencyMs: 35.0,
    memoryMb: 181.0,
    regressions: 0,
    status: 'BEST', // Lowest latency with high accuracy and 0 regressions
  },
];

/**
 * Calculates candidate status based on strict engineering rules:
 * - Regressions > 0 => REJECT
 * - Id == baseline.id => BASE
 * - Otherwise evaluated by efficiency score
 */
export function evaluateCandidateStatus(
  candidate: Omit<OptimizationCandidateRow, 'status'>,
  baseline: OptimizationCandidateRow,
  isBest: boolean
): OptimizationCandidateStatus {
  if (candidate.id === baseline.id) return 'BASE';
  if (candidate.regressions > 0) return 'REJECT';
  if (isBest) return 'BEST';
  return 'CANDIDATE';
}

/**
 * Computes the Pareto score for ranking valid candidates:
 * Higher accuracy is good (+), lower latency is good (-), lower memory is good (-).
 * Requires 0 regressions.
 */
export function computeOptimizationScore(row: OptimizationCandidateRow): number {
  if (row.regressions > 0) return -Infinity;
  return row.accuracyPct * 2.0 - row.latencyMs * 1.5 - (row.memoryMb - 180) * 0.2;
}

/**
 * Evaluates candidates and builds the complete Self-Optimization Matrix
 */
export function buildOptimizationMatrix(
  customCandidates?: readonly OptimizationCandidateRow[]
): SelfOptimizationMatrix {
  const candidatesList = customCandidates
    ? [...customCandidates]
    : [...INITIAL_OPTIMIZATION_CANDIDATES];

  // Find best candidate among those with regressions === 0
  let bestCandidateId = CURRENT_PRODUCTION_BASELINE.id;
  let highestScore = computeOptimizationScore(CURRENT_PRODUCTION_BASELINE);

  for (const c of candidatesList) {
    if (c.regressions === 0) {
      const score = computeOptimizationScore(c);
      if (score > highestScore) {
        highestScore = score;
        bestCandidateId = c.id;
      }
    }
  }

  // Update statuses
  const evaluatedCandidates: OptimizationCandidateRow[] = candidatesList.map(
    (c) => ({
      ...c,
      status: evaluateCandidateStatus(
        c,
        CURRENT_PRODUCTION_BASELINE,
        c.id === bestCandidateId
      ),
    })
  );

  return {
    currentBaseline: CURRENT_PRODUCTION_BASELINE,
    candidates: Object.freeze(evaluatedCandidates),
    bestCandidateId,
    timestamp: Date.now(),
  };
}
