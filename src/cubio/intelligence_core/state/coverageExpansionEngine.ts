/**
 * CUBiO AI — Phase 25: Dynamic Coverage & Expansion Metrics Engine
 * Protocol: CUBIO-P25-INTELLIGENCE-CORE-GENESIS-001
 * 
 * Strict Constraint: Real calculation from runtime state; zero fake/hardcoded telemetry.
 */

import { DynamicCoverageMetrics, LatticeCell343 } from '../types';
import { TOTAL_LATTICE_CELLS, TOTAL_369_ADDRESSES } from './spatialLattice343';

export interface CoverageInputState {
  readonly cells: readonly LatticeCell343[];
  readonly totalMemoryEntities: number;
  readonly maxMemoryCapacity: number;
  readonly knowledgeNodesCount: number;
  readonly knowledgeDomainCeiling: number;
  readonly activeReasoningNodesCount: number;
}

/**
 * Computes live mathematical coverage percentages from active system state
 */
export function computeLiveCoverageMetrics(
  input: CoverageInputState
): DynamicCoverageMetrics {
  const {
    cells,
    totalMemoryEntities,
    maxMemoryCapacity,
    knowledgeNodesCount,
    knowledgeDomainCeiling,
    activeReasoningNodesCount,
  } = input;

  // 1. 343 Lattice Cell Coverage
  const activeCells = cells.filter(
    (c) => c.state === 'ACTIVE' || c.state === 'HOT' || c.density > 0.4
  ).length;
  const cellCoveragePct = parseFloat(
    ((activeCells / TOTAL_LATTICE_CELLS) * 100).toFixed(1)
  );

  // 2. 369 Address Space Coverage
  const mappedAddresses = new Set<number>();
  for (const cell of cells) {
    if (cell.address369 >= 1 && cell.address369 <= TOTAL_369_ADDRESSES) {
      mappedAddresses.add(cell.address369);
    }
  }
  const addressCoveragePct = parseFloat(
    ((mappedAddresses.size / TOTAL_369_ADDRESSES) * 100).toFixed(1)
  );

  // 3. Memory Coverage (Dynamic ratio)
  const safeMaxMem = Math.max(1, maxMemoryCapacity);
  const memoryCoveragePct = parseFloat(
    Math.min(100, Math.max(0, (totalMemoryEntities / safeMaxMem) * 100)).toFixed(1)
  );

  // 4. Knowledge Coverage (Dynamic ratio)
  const safeMaxKnow = Math.max(1, knowledgeDomainCeiling);
  const knowledgeCoveragePct = parseFloat(
    Math.min(100, Math.max(0, (knowledgeNodesCount / safeMaxKnow) * 100)).toFixed(1)
  );

  // 5. Active Reasoning Coverage (Dynamic ratio relative to active cells)
  const safeActiveCells = Math.max(1, activeCells);
  const activeReasoningPct = parseFloat(
    Math.min(100, Math.max(0, (activeReasoningNodesCount / safeActiveCells) * 100)).toFixed(1)
  );

  return {
    cellCount: TOTAL_LATTICE_CELLS,
    activeCellCount: activeCells,
    cellCoveragePct,
    addressSpaceTotal: TOTAL_369_ADDRESSES,
    mappedAddressCount: mappedAddresses.size,
    addressCoveragePct,
    memoryCoveragePct,
    knowledgeCoveragePct,
    activeReasoningPct,
    calculatedAt: Date.now(),
  };
}
