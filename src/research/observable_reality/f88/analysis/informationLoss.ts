/**
 * 3D Memory Studio — Funnel 88
 * Analysis: Information Loss & Preservation Metrics
 */

import { F88DisplayState, F88SpatialState } from '../types';

export function evaluateInformationLoss(
  state: F88SpatialState,
  display: F88DisplayState
): {
  informationPresentInX: string;
  informationPresentInD: string;
  hiddenObjectCount: number;
  reconstructionAmbiguity: string;
  isLossless: boolean;
} {
  const hiddenCount = display.informationMetrics.hiddenObjectsCount;
  const isOrthographic = display.projectionType.includes('ORTHOGRAPHIC');

  let infoLossReason = '';
  if (hiddenCount > 0) {
    infoLossReason += `${hiddenCount} objects completely occluded or outside FOV; `;
  }
  if (isOrthographic) {
    infoLossReason += 'Depth dimension Z discarded by parallel projection; ';
  }

  const isLossless = hiddenCount === 0 && !isOrthographic && display.informationMetrics.isInverseUnique;

  return {
    informationPresentInX: `${state.objects.length} objects × ${state.objects[0].experimentalWorldPosition.length}D coordinates + Canonical Identity`,
    informationPresentInD: `${display.informationMetrics.visibleObjectsInDisplay} visible objects × 2D screen positions [sx, sy]`,
    hiddenObjectCount: hiddenCount,
    reconstructionAmbiguity: isLossless ? 'NONE (Unique Inverse)' : `ACTIVE AMBIGUITY: ${infoLossReason || 'Non-invertible projection'}`,
    isLossless,
  };
}
