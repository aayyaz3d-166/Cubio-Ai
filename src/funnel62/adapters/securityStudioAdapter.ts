/**
 * 3D Memory Studio — Funnel 62
 * Security Studio Adapter & F47 Gate
 *
 * Ensures RED records never enter Studio UI, panels, 3D viewport, or AI context.
 */

import { DimensionalInformationState } from '../../funnel49/types';
import { DataClassification } from '../../funnel47/types';

export function filterSecureStudioStates(
  states: readonly DimensionalInformationState[]
): DimensionalInformationState[] {
  return states.filter((s) => s.classification === 'GREEN' && s.processingAllowed);
}

export function isSecureRecord(classification: DataClassification): boolean {
  return classification === 'GREEN';
}
