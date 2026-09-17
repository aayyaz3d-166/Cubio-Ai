/**
 * 3D Memory Studio — Funnel 60
 * Security Dimension Adapter & F47 Gate
 *
 * Ensures only authorized GREEN states participate in dimension projection.
 */

import { DimensionalInformationState } from '../../funnel49/types';
import { SimulatedStateNode } from '../../funnel52/types';
import { GraphNode } from '../../funnel58/types';

export function filterSecureProjectionStates(
  states: readonly (DimensionalInformationState | SimulatedStateNode | GraphNode)[]
): (DimensionalInformationState | SimulatedStateNode | GraphNode)[] {
  return states.filter(
    (s) => s.classification === 'GREEN' && ('processingAllowed' in s ? s.processingAllowed : true)
  );
}
