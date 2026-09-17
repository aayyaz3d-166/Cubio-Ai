/**
 * 3D Memory Studio — Funnel 50
 * Simulation Selectors & Dimensional Projection Utilities
 */

import { SimulationNode, SimulationClusterType } from './types';
import { DimensionalInformationState } from '../funnel49/types';

/**
 * Filters simulation nodes by active cluster
 */
export function filterNodesByCluster(
  nodes: readonly SimulationNode[],
  cluster?: SimulationClusterType
): readonly SimulationNode[] {
  if (!cluster) return nodes;
  return Object.freeze(nodes.filter((n) => n.cluster === cluster));
}

/**
 * Calculates pairwise projection coordinates (e.g. D1 x D2) for a given dimension
 */
export function extractPairwiseProjection(
  state: DimensionalInformationState,
  dimension: number,
  axisIndex1: number,
  axisIndex2: number
): {
  readonly val1: number;
  readonly val2: number;
  readonly formattedPoint: string;
  readonly isAllowed: boolean;
} {
  const coord = state.coordinatesByDimension[dimension];
  if (!coord || !state.processingAllowed) {
    return Object.freeze({
      val1: 0,
      val2: 0,
      formattedPoint: 'BLOCKED / NO_COORDINATE',
      isAllowed: false,
    });
  }

  const v1 = coord.coordinateValues[axisIndex1] ?? 0;
  const v2 = coord.coordinateValues[axisIndex2] ?? 0;

  return Object.freeze({
    val1: v1,
    val2: v2,
    formattedPoint: `(D${axisIndex1 + 1}: ${v1}, D${axisIndex2 + 1}: ${v2})`,
    isAllowed: true,
  });
}

/**
 * Calculates theoretical dimensionality reduction metrics (e.g. Z8 -> Z3)
 */
export function calculateDimensionReductionMetrics(
  sourceDim: number,
  targetDim: number
): {
  readonly retainedAxesCount: number;
  readonly discardedAxesCount: number;
  readonly informationLossStatus: string;
  readonly checksumInvariance: string;
} {
  const retained = Math.min(sourceDim, targetDim);
  const discarded = Math.max(0, sourceDim - targetDim);

  return Object.freeze({
    retainedAxesCount: retained,
    discardedAxesCount: discarded,
    informationLossStatus: discarded > 0 ? 'INFORMATION LOSS DETECTED' : 'LOSSLESS PROJECTION',
    checksumInvariance: 'PAYLOAD CHECKSUM UNCHANGED',
  });
}
