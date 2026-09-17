import { DimensionalInformationState } from '../../funnel49/types';
import { SimulatedStateNode } from '../../funnel52/types';
import { GraphNode } from '../../funnel58/types';

export function filterSecureClusterMembers(
  states: readonly (DimensionalInformationState | SimulatedStateNode | GraphNode)[]
): (DimensionalInformationState | SimulatedStateNode | GraphNode)[] {
  return states.filter(
    (s) => s.classification === 'GREEN' && ('processingAllowed' in s ? s.processingAllowed : true)
  );
}
