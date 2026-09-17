/**
 * 3D Memory Studio — Funnel 83
 * Multi-Observer Simultaneous Representation Comparator
 */

import { MultiObserverComparisonReport, MultiObserverView, ObserverFrameConfig } from '../types';
import { FullState } from '../../f82/types';
import { FrameProjectionEngine } from '../projection/frameProjection';

export function compareSimultaneousObservers(
  state: FullState,
  observerConfigs: readonly ObserverFrameConfig[]
): MultiObserverComparisonReport {
  const engine = new FrameProjectionEngine();
  const views: MultiObserverView[] = [];
  const repHashes = new Set<string>();
  let collisions = 0;

  for (const cfg of observerConfigs) {
    const { representation, frame } = engine.projectFrame(state, cfg);

    const visualFingerprint = representation.observableObjects
      .map(
        (o) =>
          `${o.objectId}:${o.projectedPosition.join(',')}:${JSON.stringify(o.visibleProperties)}:${o.visibleGeometry.apparentScale}`
      )
      .join('|');

    if (repHashes.has(visualFingerprint)) {
      collisions++;
    } else {
      repHashes.add(visualFingerprint);
    }

    views.push(
      Object.freeze({
        observerId: cfg.observerId,
        frameId: cfg.frameId,
        projectionType: cfg.projectionType,
        representationHash: representation.frameHash,
        frameHash: frame.frameHash,
        visibleCount: frame.visibleObjects.length,
      })
    );
  }

  return Object.freeze({
    stateId: state.stateId,
    stateHash: state.stateHash,
    views: Object.freeze(views),
    totalObservers: observerConfigs.length,
    allRepresentationsDistinct: collisions === 0,
    pairwiseHashCollisions: collisions,
  });
}
