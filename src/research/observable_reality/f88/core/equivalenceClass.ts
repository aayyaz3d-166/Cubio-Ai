/**
 * 3D Memory Studio — Funnel 88
 * Core: Observation Equivalence Classes Manager
 */

import { F88DisplayState, F88EquivalenceClass, F88SpatialState } from '../types';

export function groupObservationEquivalenceClasses(
  items: readonly { state: F88SpatialState; display: F88DisplayState }[]
): readonly F88EquivalenceClass[] {
  const groups: Record<string, { states: F88SpatialState[]; checksum: string }> = {};

  for (const item of items) {
    const hash = item.display.displayChecksum;
    if (!groups[hash]) {
      groups[hash] = { states: [], checksum: hash };
    }
    groups[hash].states.push(item.state);
  }

  const classes: F88EquivalenceClass[] = Object.entries(groups).map(([hash, group], idx) => ({
    classId: `CLASS_EQ_${idx + 1}`,
    sharedDisplayChecksum: hash,
    memberStateIds: Object.freeze(group.states.map((s) => s.stateId)),
    memberStates: Object.freeze(group.states),
    classSize: group.states.length,
    stateAmbiguity:
      group.states.length > 1
        ? `AMBIGUOUS (${group.states.length} distinct Reality states map to identical Display)`
        : 'UNIQUE (1:1 Bijection)',
  }));

  return Object.freeze(classes);
}
